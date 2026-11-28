package com.mellow.backend;

import com.mellow.backend.security.MellowPrincipal;
import jakarta.servlet.ServletContext;
import jakarta.servlet.SessionTrackingMode;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;
import tools.jackson.databind.json.JsonMapper;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.UUID;

import static com.mellow.backend.TestSecuritySessions.CSRF_PATH;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@Testcontainers
@Import(TestSecuritySessions.Configuration.class)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class SecurityIT {

    private static final String PREFERENCES = "/api/v1/preferences";
    private static final String PROBLEM = "urn:mellow:problem:";

    @Container
    static final PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:17.12-bookworm");

    @DynamicPropertySource
    static void databaseProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired private TestSecuritySessions sessions;
    @Autowired private PasswordEncoder encoder;
    @Autowired private ServletContext servlet;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private JsonMapper json;
    @LocalServerPort private int port;

    @AfterEach
    void clearFixtures() {
        sessions.clear();
    }

    @Test
    void bootstrapsAnAnonymousCsrfSessionWithSecureDefaults() throws Exception {
        var status = exchange(request("/api/v1/status").GET());
        assertThat(status.statusCode()).isEqualTo(200);
        assertThat(status.headers().firstValue("Set-Cookie")).isEmpty();

        var response = exchange(request(CSRF_PATH).GET());
        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.headers().firstValue("Cache-Control")).contains("no-store");
        assertThat(response.headers().firstValue("X-Content-Type-Options")).contains("nosniff");
        assertThat(response.headers().firstValue("X-Frame-Options")).contains("DENY");
        assertThat(response.headers().firstValue("Referrer-Policy")).contains("no-referrer");
        assertThat(response.headers().firstValue("Strict-Transport-Security")).isEmpty();
        var setCookie = response.headers().firstValue("Set-Cookie").orElseThrow();
        assertThat(setCookie).startsWith("MELLOW_SESSION=").contains("Path=/", "Secure", "HttpOnly", "SameSite=Lax")
                .doesNotContain("Domain=", "Max-Age=", "Expires=");
        assertThat(servlet.getSessionTimeout()).isEqualTo(30);
        assertThat(servlet.getEffectiveSessionTrackingModes()).containsExactly(SessionTrackingMode.COOKIE);
        var payload = json.readTree(response.body());
        assertThat(payload.get("headerName").asString()).isEqualTo("X-CSRF-TOKEN");
        assertThat(payload.get("token").asString()).isNotBlank();
        var anonymousWrite = patch(setCookie.split(";", 2)[0], payload.get("token").asString(), "\"unsafe\"");
        assertProblem(anonymousWrite, 401, "authentication-required");
    }

    @Test
    void requiresTheSessionCsrfTokenForMutationsAndAllowsMaskedTokensFromTheSameSession() throws Exception {
        var token = registerLearner();
        var session = sessions.open(port, token);
        var before = exchange(request(PREFERENCES).header("Cookie", session.cookie()).GET());
        assertThat(before.statusCode()).isEqualTo(200);
        var etag = before.headers().firstValue("ETag").orElseThrow();

        assertProblem(patch(session.cookie(), null, etag), 403, "csrf-validation-failed");
        assertProblem(patch(session.cookie(), "invalid-token", etag), 403, "csrf-validation-failed");
        var queryToken = URLEncoder.encode(session.csrfToken(), StandardCharsets.UTF_8);
        assertProblem(exchange(request(PREFERENCES + "?_csrf=" + queryToken).header("Cookie", session.cookie())
                .method("PATCH", HttpRequest.BodyPublishers.noBody())), 403, "csrf-validation-failed");

        var another = sessions.open(port, registerLearner());
        assertProblem(patch(session.cookie(), another.csrfToken(), etag), 403, "csrf-validation-failed");

        var refreshed = exchange(request(CSRF_PATH).header("Cookie", session.cookie()).GET());
        var secondMask = json.readTree(refreshed.body()).get("token").asString();
        assertThat(secondMask).isNotEqualTo(session.csrfToken());
        var updated = patch(session.cookie(), session.csrfToken(), etag);
        assertThat(updated.statusCode()).isEqualTo(200);
        assertThat(updated.headers().firstValue("ETag")).isNotEqualTo(before.headers().firstValue("ETag"));
        assertThat(patch(session.cookie(), secondMask, etag).statusCode()).isEqualTo(412);
    }

    @Test
    void refusesUnexpectedRoutesAndDoesNotExposeGeneratedLoginOrLogout() throws Exception {
        var session = sessions.open(port, registerLearner());
        for (var path : new String[]{"/login", "/logout", "/actuator/env", "/actuator/health/readiness",
                "/api/v1/not-published", "/api/v1/preferences/unexpected", "/error"}) {
            assertProblem(exchange(request(path).GET()), 401, "authentication-required");
            assertProblem(exchange(request(path).header("Cookie", session.cookie()).GET()), 403, "access-denied");
        }
        var preflight = exchange(request(PREFERENCES).header("Origin", "https://other.example")
                .header("Access-Control-Request-Method", "PATCH").method("OPTIONS", HttpRequest.BodyPublishers.noBody()));
        assertThat(preflight.statusCode()).isIn(401, 403);
        assertThat(preflight.headers().firstValue("Access-Control-Allow-Origin")).isEmpty();
    }

    @Test
    void rejectsInvalidPrincipalMissingLearnerAndInsufficientAuthority() throws Exception {
        String unsupported = UUID.randomUUID().toString();
        sessions.register(unsupported, TestSecuritySessions.authenticated("untrusted", "ROLE_LEARNER"));
        assertProblem(preferences(unsupported), 401, "authentication-required");

        var principal = sessions.verifiedPrincipal(createLearner());
        var unverified = UUID.randomUUID().toString();
        sessions.register(unverified, UsernamePasswordAuthenticationToken.unauthenticated(principal, null));
        assertProblem(preferences(unverified), 401, "authentication-required");

        var anonymous = UUID.randomUUID().toString();
        sessions.register(anonymous, new AnonymousAuthenticationToken("test", principal,
                AuthorityUtils.createAuthorityList("ROLE_LEARNER")));
        assertProblem(preferences(anonymous), 401, "authentication-required");

        var missing = UUID.randomUUID().toString();
        sessions.register(missing, UUID.randomUUID());
        assertProblem(preferences(missing), 403, "access-denied");

        var insufficient = UUID.randomUUID().toString();
        sessions.register(insufficient, TestSecuritySessions.authenticated(principal));
        assertProblem(preferences(insufficient), 403, "access-denied");

        assertThatThrownBy(() -> new MellowPrincipal(UUID.randomUUID(), null, 0))
                .isInstanceOf(NullPointerException.class);
    }

    @Test
    void staleCookieAndCsrfTokenCannotRestoreAnExpiredSession() throws Exception {
        var token = registerLearner();
        var session = sessions.open(port, token);
        assertThat(preferences(token).statusCode()).isEqualTo(200);
        sessions.expire(token);
        assertProblem(preferences(token), 401, "authentication-required");
        assertProblem(patch(session.cookie(), session.csrfToken(), "\"stale\""), 401, "authentication-required");
        var replacement = exchange(request(CSRF_PATH).header("Cookie", session.cookie()).GET());
        assertThat(replacement.statusCode()).isEqualTo(200);
        assertThat(replacement.headers().firstValue("Set-Cookie").orElseThrow()).doesNotStartWith(session.cookie());
    }

    @Test
    void hashesAndVerifiesSyntheticPasswordsWithVersionedArgon2id() {
        var password = "Synthetic passphrase café 2026 🪴";
        var encoded = encoder.encode(password);
        assertThat(encoded).startsWith("{argon2id-v1}$argon2id$v=19$m=19456,t=2,p=1$");
        assertThat(encoder.encode(password)).isNotEqualTo(encoded);
        assertThat(encoder.matches(password, encoded)).isTrue();
        assertThat(encoder.matches(password + "!", encoded)).isFalse();
        assertThat(encoder.upgradeEncoding(encoded)).isFalse();
        assertThat(encoder.upgradeEncoding("{legacy}unrecognized")).isTrue();
    }

    private UUID createLearner() {
        return jdbc.queryForObject("INSERT INTO mellow.learner DEFAULT VALUES RETURNING id", UUID.class);
    }

    private String registerLearner() {
        String token = UUID.randomUUID().toString();
        sessions.register(token, createLearner());
        return token;
    }

    private HttpResponse<String> preferences(String token) throws Exception {
        var session = sessions.open(port, token);
        return exchange(request(PREFERENCES).header("Cookie", session.cookie()).GET());
    }

    private HttpResponse<String> patch(String cookie, String csrf, String etag) throws Exception {
        var request = request(PREFERENCES).header("Cookie", cookie).header("If-Match", etag)
                .header("Content-Type", "application/json");
        if (csrf != null) request.header("X-CSRF-TOKEN", csrf);
        return exchange(request.method("PATCH", HttpRequest.BodyPublishers.ofString("{\"translations\":true}")));
    }

    private HttpRequest.Builder request(String path) {
        return HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + path)).timeout(Duration.ofSeconds(15));
    }

    private static HttpResponse<String> exchange(HttpRequest.Builder request) throws Exception {
        try (var client = HttpClient.newHttpClient()) {
            return client.send(request.build(), HttpResponse.BodyHandlers.ofString());
        }
    }

    private void assertProblem(HttpResponse<String> response, int status, String type) {
        assertThat(response.statusCode()).as(response.body()).isEqualTo(status);
        assertThat(response.headers().firstValue("Content-Type")).contains("application/problem+json");
        assertThat(response.headers().firstValue("Cache-Control")).contains("no-store");
        assertThat(response.headers().firstValue("Location")).isEmpty();
        assertThat(response.headers().firstValue("WWW-Authenticate")).isEmpty();
        var problem = json.readTree(response.body());
        assertThat(problem.get("status").asInt()).isEqualTo(status);
        assertThat(problem.get("type").asString()).isEqualTo(PROBLEM + type);
    }
}
