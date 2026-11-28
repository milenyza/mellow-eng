package com.mellow.backend;

import jakarta.servlet.http.HttpSession;
import jakarta.servlet.http.HttpSessionEvent;
import jakarta.servlet.http.HttpSessionListener;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.web.servlet.ServletListenerRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import static com.mellow.backend.account.api.AccountController.CONFIRM;
import static com.mellow.backend.account.api.AccountController.REGISTER;
import static com.mellow.backend.account.api.AccountSessionController.LOGIN;
import static com.mellow.backend.account.api.AccountSessionController.LOGOUT;
import static com.mellow.backend.account.api.AccountSessionController.ME;
import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
@ExtendWith(OutputCaptureExtension.class)
@Import({AccountRegistrationIT.MailConfiguration.class, AccountAuthenticationIT.SessionTestConfiguration.class})
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = {"mellow.account.verification-origin=http://127.0.0.1:5173", "logging.level.root=DEBUG"})
class AccountAuthenticationIT {

    private static final String PASSWORD = "  café synthetic login password 🌿  ";
    private static final String CSRF = "/api/v1/security/csrf";
    private static final String FAVORITE = "/api/v1/favorites/item?ref="
            + "english-for-pt-br/en-a1-introductions-hello/greetings/good-morning";
    private static final String PREFERENCES = "/api/v1/preferences";

    @Container
    static final PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:17.12-bookworm");

    @DynamicPropertySource
    static void databaseProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired private JdbcTemplate jdbc;
    @Autowired private JsonMapper json;
    @Autowired private AccountRegistrationIT.VerificationMailCapture mailbox;
    @Autowired private AccountRegistrationIT.AdjustableClock clock;
    @Autowired private BlockingTestEncoder encoder;
    @Autowired private SessionExpiry expiry;
    @LocalServerPort private int port;

    @BeforeEach
    void resetFixtureState() {
        mailbox.messages.clear();
        mailbox.fail.set(false);
        clock.advance(Duration.ofHours(2));
    }

    @Test
    void logsInWithCanonicalEmailRotatesSessionAndRenewsCsrf(CapturedOutput output) throws Exception {
        var email = "Canonical.Login+Trial@Example.test";
        registerVerified(email);
        assertProblem(get(ME, null), 401, "authentication-required");
        var anonymous = bootstrap(null);
        assertProblem(get(ME, anonymous.cookie()), 401, "authentication-required");

        var loggedIn = post(LOGIN, anonymous, credentials("  CANONICAL.LOGIN+TRIAL@EXAMPLE.TEST  ", PASSWORD));
        var summary = summary(loggedIn);
        var cookieHeader = loggedIn.headers().firstValue("Set-Cookie").orElseThrow();
        String authenticated = cookie(cookieHeader);
        assertThat(authenticated).isNotEqualTo(anonymous.cookie());
        assertScope(cookieHeader);
        assertThat(summary.get("email").asString()).isEqualTo(email);
        assertThat(summary.get("displayName").asString()).isEqualTo("Synthetic learner");
        assertThat(summary.get("emailVerified").asBoolean()).isTrue();
        assertThat(summary.get("accountId").asString()).isNotEqualTo(summary.get("learnerId").asString());
        assertThat(loggedIn.body()).doesNotContain(PASSWORD, authenticated, anonymous.cookie(), "tokenDigest", "passwordHash");

        assertProblem(get(ME, anonymous.cookie()), 401, "authentication-required");
        assertProblem(get(PREFERENCES, anonymous.cookie()), 401, "authentication-required");
        assertThat(summary(get(ME + "?accountId=" + UUID.randomUUID(), authenticated))).isEqualTo(summary);
        var preferences = get(PREFERENCES, authenticated);
        assertThat(preferences.statusCode()).isEqualTo(200);

        var obsolete = new BrowserSession(authenticated, anonymous.csrf());
        String etag = preferences.headers().firstValue("ETag").orElseThrow();
        assertProblem(patchPreferences(obsolete, etag, true), 403, "csrf-validation-failed");
        var fresh = bootstrap(authenticated);
        assertThat(fresh.cookie()).isEqualTo(authenticated);
        assertThat(patchPreferences(fresh, etag, true).statusCode()).isEqualTo(200);
        assertThat(body(get(PREFERENCES, authenticated)).get("translations").asBoolean()).isTrue();

        var digest = jdbc.queryForObject("SELECT password_hash FROM mellow.account WHERE email_canonical = ?",
                String.class, email.toLowerCase(java.util.Locale.ROOT));
        var sensitiveValues = List.of(PASSWORD, digest, email, sessionId(authenticated), sessionId(anonymous.cookie()));
        assertThat(sensitiveValues.stream().anyMatch(output.getAll()::contains))
                .as("authentication logs omit secrets and the account email").isFalse();
    }

    @Test
    void rejectsInvalidCredentialsWithoutDistinguishingAccountStates() throws Exception {
        registerVerified("verified-login@example.test");
        register("pending-login@example.test");
        var session = bootstrap(null);
        var wrong = post(LOGIN, session, credentials("verified-login@example.test", PASSWORD.strip()));
        assertProblem(wrong, 401, "invalid-credentials");
        for (var email : List.of("nobody@example.test", "pending-login@example.test")) {
            var response = post(LOGIN, session, credentials(email, PASSWORD));
            assertProblem(response, 401, "invalid-credentials");
            assertThat(response.body()).isEqualTo(wrong.body());
            assertThat(response.headers().firstValue("Set-Cookie")).isEmpty();
        }
        assertProblem(get(ME, session.cookie()), 401, "authentication-required");
    }

    @Test
    void enforcesLoginCsrfValidationAndPayloadBounds() throws Exception {
        var session = bootstrap(null);
        var valid = credentials("bounded@example.test", PASSWORD);
        assertProblem(post(LOGIN, new BrowserSession(session.cookie(), null), valid), 403, "csrf-validation-failed");
        assertProblem(post(LOGIN, new BrowserSession(session.cookie(), "invalid"), valid), 403, "csrf-validation-failed");
        assertProblem(post(LOGIN, session, credentials("not-an-email", PASSWORD)), 400, "invalid-account-input");
        assertProblem(post(LOGIN, session, credentials("bounded@example.test", "short")), 400, "invalid-account-input");
        assertProblem(post(LOGIN, session, credentials("bounded@example.test", "🌿".repeat(129))), 400, "invalid-account-input");
        for (var field : List.of("accountId", "learnerId", "roles", "status")) {
            var forged = ((tools.jackson.databind.node.ObjectNode) json.readTree(valid)).put(field, "fake");
            assertProblem(post(LOGIN, session, forged.toString()), 400, "invalid-account-input");
        }
        assertThat(post(LOGIN, session, " ".repeat(4097)).statusCode()).isEqualTo(413);
    }

    @Test
    void expiresAuthenticatedCookieClearsCsrfAndSupportsAnonymousLogout() throws Exception {
        var verified = "logout@example.test";
        registerVerified(verified);
        var session = signIn(verified);
        for (String token : new String[]{null, "invalid"}) {
            assertProblem(post(LOGOUT, new BrowserSession(session.cookie(), token), null), 403, "csrf-validation-failed");
        }
        assertThat(get(ME, session.cookie()).statusCode()).isEqualTo(200);
        var logout = post(LOGOUT, session, null);
        assertThat(logout.statusCode()).isEqualTo(204);
        assertThat(logout.body()).isEmpty();
        assertThat(logout.headers().firstValue("Cache-Control")).contains("no-store");
        var deletedCookie = logout.headers().firstValue("Set-Cookie").orElseThrow();
        assertThat(deletedCookie).startsWith("MELLOW_SESSION=;").contains("Max-Age=0");
        assertScope(deletedCookie);
        assertProblem(get(ME, session.cookie()), 401, "authentication-required");
        assertProblem(get(PREFERENCES, session.cookie()), 401, "authentication-required");
        assertProblem(post(LOGOUT, session, null), 403, "csrf-validation-failed");

        var anonymous = bootstrap(session.cookie());
        assertThat(anonymous.cookie()).isNotEqualTo(session.cookie());
        assertProblem(post(LOGIN, new BrowserSession(anonymous.cookie(), session.csrf()), credentials(verified, PASSWORD)),
                403, "csrf-validation-failed");
        assertThat(post(LOGOUT, anonymous, null).statusCode()).isEqualTo(204);
    }

    @Test
    void scopesIdenticalResourcesToEachAccountAndRequiresLogoutToSwitch() throws Exception {
        String firstEmail = "isolation-one@example.test";
        String secondEmail = "isolation-two@example.test";
        registerVerified(firstEmail);
        registerVerified(secondEmail);
        var first = signIn(firstEmail);
        var second = signIn(secondEmail);
        var firstIdentity = summary(get(ME, first.cookie()));
        var secondIdentity = summary(get(ME, second.cookie()));
        assertThat(secondIdentity.get("learnerId")).isNotEqualTo(firstIdentity.get("learnerId"));

        var firstView = get(PREFERENCES, first.cookie());
        var secondView = get(PREFERENCES, second.cookie());
        assertThat(patchPreferences(first, firstView.headers().firstValue("ETag").orElseThrow(), true).statusCode())
                .isEqualTo(200);
        var forged = request(PREFERENCES + "?learnerId=" + firstIdentity.get("learnerId").asString())
                .header("Cookie", second.cookie()).header("X-Learner-Id", firstIdentity.get("learnerId").asString()).GET();
        assertThat(body(exchange(forged)).get("translations").asBoolean()).isFalse();
        assertThat(patchPreferences(second, secondView.headers().firstValue("ETag").orElseThrow(), false).statusCode())
                .isEqualTo(200);
        assertThat(body(get(PREFERENCES, first.cookie())).get("translations").asBoolean()).isTrue();

        var emptyFavorite = get(FAVORITE, first.cookie());
        var saveFavorite = request(FAVORITE).header("Cookie", first.cookie()).header("X-CSRF-TOKEN", first.csrf())
                .header("If-Match", emptyFavorite.headers().firstValue("ETag").orElseThrow())
                .PUT(HttpRequest.BodyPublishers.noBody());
        var saved = exchange(saveFavorite);
        assertThat(saved.statusCode()).isEqualTo(200);
        assertThat(body(saved).get("saved").asBoolean()).isTrue();
        assertThat(body(get(FAVORITE, second.cookie())).get("saved").asBoolean()).isFalse();

        assertProblem(post(LOGIN, first, credentials(secondEmail, PASSWORD)), 409, "session-already-authenticated");
        assertThat(summary(get(ME, first.cookie()))).isEqualTo(firstIdentity);
        assertThat(post(LOGOUT, first, null).statusCode()).isEqualTo(204);
        assertProblem(get(ME, first.cookie()), 401, "authentication-required");
        assertThat(summary(get(ME, second.cookie()))).isEqualTo(secondIdentity);
        var switched = signIn(secondEmail);
        assertThat(summary(get(ME, switched.cookie()))).isEqualTo(secondIdentity);
        assertThat(body(get(PREFERENCES, switched.cookie())).get("translations").asBoolean()).isFalse();
    }

    @Test
    void rejectsParallelLoginsThatUseOnePreAuthenticationSession() throws Exception {
        String firstEmail = "parallel-one@example.test";
        String secondEmail = "parallel-two@example.test";
        registerVerified(firstEmail);
        registerVerified(secondEmail);
        var anonymous = bootstrap(null);
        try (var client = HttpClient.newHttpClient()) {
            var a = client.sendAsync(mutation(LOGIN, anonymous, credentials(firstEmail, PASSWORD)).build(),
                    HttpResponse.BodyHandlers.ofString());
            var b = client.sendAsync(mutation(LOGIN, anonymous, credentials(secondEmail, PASSWORD)).build(),
                    HttpResponse.BodyHandlers.ofString());
            var responses = List.of(a.get(), b.get());
            assertThat(responses.stream().filter(response -> response.statusCode() == 200)).hasSize(1);
            var winner = responses.stream().filter(response -> response.statusCode() == 200).findFirst().orElseThrow();
            var rejected = responses.stream().filter(response -> response.statusCode() != 200).findFirst().orElseThrow();
            assertThat(rejected.statusCode()).isIn(403, 409);
            assertProblem(get(ME, anonymous.cookie()), 401, "authentication-required");
            String authenticated = cookie(winner.headers().firstValue("Set-Cookie").orElseThrow());
            assertThat(summary(get(ME, authenticated))).isEqualTo(summary(winner));
        }
    }

    @Test
    void revalidatesDeletedAndRemappedAccountsAndExpiresIdleSessions() throws Exception {
        String email = "state-change@example.test";
        registerVerified(email);
        var changed = signIn(email);
        var identity = summary(get(ME, changed.cookie()));
        var replacement = jdbc.queryForObject("INSERT INTO mellow.learner DEFAULT VALUES RETURNING id", UUID.class);
        jdbc.update("UPDATE mellow.account SET learner_id = ? WHERE id = ?",
                replacement, UUID.fromString(identity.get("accountId").asString()));
        assertProblem(get(ME, changed.cookie()), 403, "access-denied");
        assertProblem(get(PREFERENCES, changed.cookie()), 403, "access-denied");
        assertThat(post(LOGOUT, changed, null).statusCode()).isEqualTo(204);

        var reissued = signIn(email);
        assertThat(summary(get(ME, reissued.cookie())).get("learnerId").asString()).isEqualTo(replacement.toString());
        jdbc.update("DELETE FROM mellow.account WHERE id = ?", UUID.fromString(identity.get("accountId").asString()));
        assertProblem(get(ME, reissued.cookie()), 403, "access-denied");
        assertProblem(get(PREFERENCES, reissued.cookie()), 403, "access-denied");

        String idleEmail = "idle@example.test";
        registerVerified(idleEmail);
        var idle = signIn(idleEmail);
        expiry.last.get().setMaxInactiveInterval(1);
        Thread.sleep(Duration.ofMillis(1200));
        assertProblem(get(ME, idle.cookie()), 401, "authentication-required");
        assertProblem(post(LOGOUT, idle, null), 403, "csrf-validation-failed");
    }

    @Test
    void rateLimitsCanonicalAccountAndSourceWithAResettableWindow() throws Exception {
        var session = bootstrap(null);
        for (int attempt = 0; attempt < 5; attempt++) {
            assertProblem(post(LOGIN, session, credentials("rate@example.test", PASSWORD)), 401, "invalid-credentials");
        }
        var limitedAccount = exchange(mutation(LOGIN, session, credentials("  RATE@EXAMPLE.TEST  ", PASSWORD))
                .header("X-Forwarded-For", "192.0.2.15"));
        assertProblem(limitedAccount, 429, "account-rate-limited");
        assertThat(limitedAccount.headers().firstValue("Retry-After")).contains("60");
        for (int attempt = 0; attempt < 5; attempt++) {
            assertProblem(post(LOGIN, session, credentials("rate-" + attempt + "@example.test", PASSWORD)),
                    401, "invalid-credentials");
        }
        assertProblem(post(LOGIN, session, credentials("other-rate@example.test", PASSWORD)), 429, "account-rate-limited");
        clock.advance(Duration.ofMinutes(1));
        assertProblem(post(LOGIN, session, credentials("rate@example.test", PASSWORD)), 401, "invalid-credentials");
    }

    @Test
    void sharesTheTwoHashPermitsBetweenLoginAndRegistration() throws Exception {
        String first = "concurrency-first@example.test";
        String second = "concurrency-second@example.test";
        registerVerified(first);
        registerVerified(second);
        var one = bootstrap(null);
        var two = bootstrap(null);
        var three = bootstrap(null);
        var gate = encoder.arm();
        try (var client = HttpClient.newHttpClient()) {
            var a = client.sendAsync(mutation(LOGIN, one, credentials(first, PASSWORD)).build(),
                    HttpResponse.BodyHandlers.ofString());
            var b = client.sendAsync(mutation(LOGIN, two, credentials(second, PASSWORD)).build(),
                    HttpResponse.BodyHandlers.ofString());
            try {
                assertThat(gate.entered().await(5, TimeUnit.SECONDS)).isTrue();
                var denied = post(REGISTER, three, registration("capacity@example.test"));
                assertProblem(denied, 429, "account-rate-limited");
            } finally {
                encoder.release(gate);
            }
            assertThat(a.get().statusCode()).isEqualTo(200);
            assertThat(b.get().statusCode()).isEqualTo(200);
        }
        assertThat(post(REGISTER, three, registration("capacity@example.test")).statusCode()).isEqualTo(202);
    }

    private void registerVerified(String email) throws Exception {
        var browser = register(email);
        var link = mailbox.messages.stream().filter(message -> message.recipient().equals(email))
                .findFirst().orElseThrow().link();
        var token = link.getFragment().substring("token=".length());
        var confirmation = json.writeValueAsString(Map.of("token", token, "password", PASSWORD));
        assertThat(post(CONFIRM, browser, confirmation).statusCode()).isEqualTo(204);
    }

    private BrowserSession register(String email) throws Exception {
        var browser = bootstrap(null);
        assertThat(post(REGISTER, browser, registration(email)).statusCode()).isEqualTo(202);
        return browser;
    }

    private String registration(String email) {
        return json.writeValueAsString(Map.of("displayName", "Synthetic learner", "email", email, "password", PASSWORD));
    }

    private String credentials(String email, String password) {
        return json.writeValueAsString(Map.of("email", email, "password", password));
    }

    private BrowserSession signIn(String email) throws Exception {
        var response = post(LOGIN, bootstrap(null), credentials(email, PASSWORD));
        summary(response);
        return bootstrap(cookie(response.headers().firstValue("Set-Cookie").orElseThrow()));
    }

    private BrowserSession bootstrap(String previous) throws Exception {
        var response = get(CSRF, previous);
        assertThat(response.statusCode()).isEqualTo(200);
        var current = response.headers().firstValue("Set-Cookie").map(AccountAuthenticationIT::cookie).orElse(previous);
        return new BrowserSession(current, body(response).get("token").asString());
    }

    private HttpResponse<String> patchPreferences(BrowserSession session, String etag, boolean translations) throws Exception {
        var request = request(PREFERENCES).header("Cookie", session.cookie()).header("X-CSRF-TOKEN", session.csrf())
                .header("Content-Type", "application/json").header("If-Match", etag)
                .method("PATCH", HttpRequest.BodyPublishers.ofString(json.writeValueAsString(Map.of("translations", translations))));
        return exchange(request);
    }

    private HttpResponse<String> post(String path, BrowserSession session, String payload) throws Exception {
        return exchange(mutation(path, session, payload));
    }

    private HttpRequest.Builder mutation(String path, BrowserSession session, String payload) {
        var request = request(path).header("Cookie", session.cookie());
        if (session.csrf() != null) request.header("X-CSRF-TOKEN", session.csrf());
        if (payload != null) request.header("Content-Type", "application/json");
        return request.POST(payload == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(payload));
    }

    private HttpResponse<String> get(String path, String cookie) throws Exception {
        var request = request(path);
        if (cookie != null) request.header("Cookie", cookie);
        return exchange(request.GET());
    }

    private HttpRequest.Builder request(String path) {
        return HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + path)).timeout(Duration.ofSeconds(15));
    }

    private static HttpResponse<String> exchange(HttpRequest.Builder request) throws Exception {
        try (var client = HttpClient.newHttpClient()) {
            return client.send(request.build(), HttpResponse.BodyHandlers.ofString());
        }
    }

    private JsonNode summary(HttpResponse<String> response) {
        assertThat(response.statusCode()).as(response.body()).isEqualTo(200);
        assertThat(response.headers().firstValue("Cache-Control")).contains("no-store");
        var summary = body(response);
        assertThat(summary.propertyNames()).containsExactlyInAnyOrder("accountId", "learnerId", "displayName", "email", "emailVerified");
        return summary;
    }

    private JsonNode body(HttpResponse<String> response) {
        return json.readTree(response.body());
    }

    private void assertProblem(HttpResponse<String> response, int status, String code) {
        assertThat(response.statusCode()).as(response.body()).isEqualTo(status);
        assertThat(response.headers().firstValue("Content-Type")).contains("application/problem+json");
        assertThat(response.headers().firstValue("Cache-Control").orElseThrow()).contains("no-store");
        assertThat(response.headers().firstValue("Location")).isEmpty();
        assertThat(body(response).get("type").asString()).isEqualTo("urn:mellow:problem:" + code);
    }

    private static String cookie(String value) {
        return value.split(";", 2)[0];
    }

    private static String sessionId(String cookie) {
        return cookie.substring("MELLOW_SESSION=".length());
    }

    private static void assertScope(String setCookie) {
        assertThat(setCookie).startsWith("MELLOW_SESSION=").contains("Path=/", "HttpOnly", "Secure")
                .containsIgnoringCase("SameSite=Lax").doesNotContain("Domain=");
    }

    private record BrowserSession(String cookie, String csrf) {}

    @TestConfiguration(proxyBeanMethods = false)
    static class SessionTestConfiguration {
        @Bean
        @Primary
        BlockingTestEncoder blockingTestEncoder(@Qualifier("passwordEncoder") PasswordEncoder encoder) {
            return new BlockingTestEncoder(encoder);
        }

        @Bean
        SessionExpiry sessionExpiry() {
            return new SessionExpiry();
        }

        @Bean
        ServletListenerRegistrationBean<SessionExpiry> observeTestSessions(SessionExpiry expiry) {
            return new ServletListenerRegistrationBean<>(expiry);
        }
    }

    static final class SessionExpiry implements HttpSessionListener {
        final AtomicReference<HttpSession> last = new AtomicReference<>();

        @Override
        public void sessionCreated(HttpSessionEvent event) {
            last.set(event.getSession());
        }
    }

    static final class BlockingTestEncoder implements PasswordEncoder {
        private final PasswordEncoder delegate;
        private final AtomicReference<HashGate> blocking = new AtomicReference<>();

        BlockingTestEncoder(PasswordEncoder delegate) {
            this.delegate = delegate;
        }

        HashGate arm() {
            return arm(2);
        }

        HashGate arm(int operations) {
            var gate = new HashGate(new CountDownLatch(operations), new CountDownLatch(1));
            blocking.set(gate);
            return gate;
        }

        void release(HashGate gate) {
            blocking.set(null);
            gate.release().countDown();
        }

        @Override
        public String encode(CharSequence rawPassword) {
            return delegate.encode(rawPassword);
        }

        @Override
        public boolean matches(CharSequence rawPassword, String encodedPassword) {
            var gate = blocking.get();
            if (gate != null) {
                gate.entered().countDown();
                try {
                    if (!gate.release().await(8, TimeUnit.SECONDS)) throw new IllegalStateException("Test hash was not released");
                } catch (InterruptedException interrupted) {
                    Thread.currentThread().interrupt();
                    throw new IllegalStateException("Test hash was interrupted", interrupted);
                }
            }
            return delegate.matches(rawPassword, encodedPassword);
        }
    }

    record HashGate(CountDownLatch entered, CountDownLatch release) {}
}
