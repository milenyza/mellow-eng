package com.mellow.backend;

import com.mellow.backend.security.MellowPrincipal;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.core.Ordered;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.filter.OncePerRequestFilter;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

final class TestSecuritySessions {

    static final String CSRF_PATH = "/api/v1/security/csrf";
    private static final String FIXTURE_HEADER = "X-Integration-Test-Identity";
    private final Map<String, Authentication> identities = new ConcurrentHashMap<>();
    private final Map<String, HttpSession> sessions = new ConcurrentHashMap<>();
    private final Map<String, SessionCredentials> credentials = new ConcurrentHashMap<>();
    private final JsonMapper json;

    private final JdbcTemplate jdbc;
    private final String fixtureHash;

    TestSecuritySessions(JsonMapper json, JdbcTemplate jdbc, PasswordEncoder passwords) {
        this.json = json;
        this.jdbc = jdbc;
        fixtureHash = passwords.encode("Synthetic session fixture password");
    }

    void register(String token, UUID learner) {
        register(token, authenticated(verifiedPrincipal(learner), "ROLE_LEARNER"));
    }

    MellowPrincipal verifiedPrincipal(UUID learner) {
        var account = UUID.randomUUID();
        String email = account + "@example.test";
        var results = jdbc.query("""
                INSERT INTO mellow.account (id, learner_id, email_original, email_canonical, password_hash, status,
                                            email_verified_at, created_at, updated_at)
                SELECT ?, id, ?, ?, ?, 'VERIFIED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                FROM mellow.learner WHERE id = ?
                ON CONFLICT (learner_id) DO UPDATE SET learner_id = EXCLUDED.learner_id
                RETURNING id
                """, (row, index) -> row.getObject("id", UUID.class), account, email, email, fixtureHash, learner);
        return new MellowPrincipal(results.isEmpty() ? account : results.getFirst(), learner, 0);
    }

    void register(String token, Authentication authentication) {
        identities.put(token, authentication);
    }

    static Authentication authenticated(Object principal, String... authorities) {
        return UsernamePasswordAuthenticationToken.authenticated(principal, null,
                AuthorityUtils.createAuthorityList(authorities));
    }

    void clear() {
        identities.clear();
        sessions.clear();
        credentials.clear();
    }

    void expire(String token) {
        sessions.remove(token).invalidate();
    }

    void authorize(HttpRequest.Builder request, int port, String token) {
        if (token != null) {
            var session = open(port, token);
            request.header("Cookie", session.cookie()).header(session.headerName(), session.csrfToken());
        }
    }

    SessionCredentials open(int port, String token) {
        return credentials.computeIfAbsent(token, ignored -> bootstrap(port, token));
    }

    private SessionCredentials bootstrap(int port, String token) {
        var request = HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + CSRF_PATH))
                .timeout(Duration.ofSeconds(15)).header(FIXTURE_HEADER, token).GET().build();
        try (var client = HttpClient.newHttpClient()) {
            var response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new IllegalStateException("Could not obtain a test session: " + response.statusCode());
            }
            var body = json.readTree(response.body());
            var setCookie = response.headers().firstValue("Set-Cookie").orElseThrow();
            return new SessionCredentials(setCookie.split(";", 2)[0], body.get("headerName").asString(),
                    body.get("token").asString());
        } catch (IOException error) {
            throw new UncheckedIOException(error);
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted while obtaining a test session", error);
        }
    }

    record SessionCredentials(String cookie, String headerName, String csrfToken) {}

    @TestConfiguration(proxyBeanMethods = false)
    static class Configuration {

        @Bean
        TestSecuritySessions testSecuritySessions(JsonMapper json, JdbcTemplate jdbc, PasswordEncoder passwords) {
            return new TestSecuritySessions(json, jdbc, passwords);
        }

        @Bean
        FilterRegistrationBean<OncePerRequestFilter> testSessionBootstrap(TestSecuritySessions fixtures) {
            var repository = new HttpSessionSecurityContextRepository();
            OncePerRequestFilter filter = new OncePerRequestFilter() {
                @Override
                protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
                        throws ServletException, IOException {
                    var token = request.getHeader(FIXTURE_HEADER);
                    var authentication = token == null ? null : fixtures.identities.remove(token);
                    if (authentication != null && request.getMethod().equals("GET")) {
                        var context = SecurityContextHolder.createEmptyContext();
                        context.setAuthentication(authentication);
                        fixtures.sessions.put(token, request.getSession());
                        repository.saveContext(context, request, response);
                    }
                    chain.doFilter(request, response);
                }
            };
            var registration = new FilterRegistrationBean<>(filter);
            registration.addUrlPatterns(CSRF_PATH);
            registration.setOrder(Ordered.HIGHEST_PRECEDENCE + 20);
            return registration;
        }
    }
}
