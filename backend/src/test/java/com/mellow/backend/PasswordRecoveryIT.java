package com.mellow.backend;

import com.mellow.backend.account.application.VerificationMail;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;
import tools.jackson.databind.json.JsonMapper;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static com.mellow.backend.account.api.AccountController.CONFIRM;
import static com.mellow.backend.account.api.AccountController.RECOVERY_CONFIRM;
import static com.mellow.backend.account.api.AccountController.RECOVERY_REQUEST;
import static com.mellow.backend.account.api.AccountController.REGISTER;
import static com.mellow.backend.account.api.AccountSessionController.LOGIN;
import static com.mellow.backend.account.api.AccountSessionController.ME;
import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
@ExtendWith(OutputCaptureExtension.class)
@Import({AccountRegistrationIT.MailConfiguration.class, AccountAuthenticationIT.SessionTestConfiguration.class})
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = {"mellow.account.verification-origin=http://127.0.0.1:5173", "logging.level.root=DEBUG"})
class PasswordRecoveryIT {

    private static final String OLD_PASSWORD = "  synthetic original password 🌿  ";
    private static final String NEW_PASSWORD = "  café com senha sintética 🌱  ";
    private static final String PREFERENCES = "/api/v1/preferences";

    @Container
    static final PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:17.12-bookworm");

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired private JdbcTemplate jdbc;
    @Autowired private JsonMapper json;
    @Autowired private AccountRegistrationIT.VerificationMailCapture mailbox;
    @Autowired private AccountRegistrationIT.AdjustableClock clock;
    @Autowired private AccountAuthenticationIT.BlockingTestEncoder encoder;
    @LocalServerPort private int port;

    @BeforeEach
    void resetTestState() {
        mailbox.messages.clear();
        mailbox.fail.set(false);
        clock.advance(Duration.ofHours(2));
    }

    @Test
    void replacesTheHashRevokesAllOldSessionsAndPreservesLearnerData(CapturedOutput logs) throws Exception {
        String email = "Reset.Owner+Tag@Example.test";
        String other = "unrelated@example.test";
        register(email, true);
        register(other, true);
        var one = login(email, OLD_PASSWORD).cookie();
        var two = login(email, OLD_PASSWORD).cookie();
        var otherCookie = login(other, OLD_PASSWORD).cookie();
        var before = account("reset.owner+tag@example.test");
        UUID learner = (UUID) before.get("learner_id");
        seedStudy(learner);
        var saved = studySnapshot(learner);
        var anonymous = bootstrap();
        var requested = exchange(post(RECOVERY_REQUEST, anonymous, Map.of("email", "  RESET.OWNER+TAG@EXAMPLE.TEST  "))
                .header("X-Forwarded-Host", "untrusted.example.test"));
        var unknown = exchange(post(RECOVERY_REQUEST, anonymous, Map.of("email", "missing@example.test")));
        accepted(requested);
        accepted(unknown);
        assertThat(unknown.body()).isEqualTo(requested.body());
        assertThat(get(ME, one).statusCode()).isEqualTo(200);
        assertThat(account("reset.owner+tag@example.test")).isEqualTo(before);

        var message = recovery(email);
        var raw = token(message);
        var bytes = Base64.getUrlDecoder().decode(raw);
        assertThat(bytes).hasSize(32);
        assertThat(message.link().getRawQuery()).isNull();
        assertThat(message.link().toString()).startsWith("http://127.0.0.1:5173/redefinir-senha#token=");
        assertThat(message.expiresAt()).isEqualTo(clock.instant().plus(Duration.ofMinutes(30)));
        assertThat(message.subject()).contains("Mellow");
        assertThat(message.text()).contains("ignore esta mensagem", message.expiresAt().toString());
        var sha = MessageDigest.getInstance("SHA-256");
        sha.update("mellow:password-reset:v1\0".getBytes(StandardCharsets.US_ASCII));
        var digest = HexFormat.of().formatHex(sha.digest(bytes));
        assertThat(jdbc.queryForObject("SELECT token_digest FROM mellow.password_reset_token WHERE account_id = ?",
                String.class, before.get("id"))).isEqualTo(digest).isNotEqualTo(raw);

        var reset = exchange(post(RECOVERY_CONFIRM, anonymous, resetBody(raw, NEW_PASSWORD)));
        assertThat(reset.statusCode()).isEqualTo(204);
        assertThat(reset.body()).isEmpty();
        assertThat(reset.headers().firstValue("Set-Cookie")).isEmpty();
        assertThat(reset.headers().firstValue("Cache-Control")).contains("no-store");
        problem(get(ME, anonymous.cookie()), 401, "authentication-required");
        var revoked = get(ME, one);
        problem(revoked, 401, "session-revoked");
        assertThat(revoked.headers().firstValue("Set-Cookie").orElseThrow()).contains("MELLOW_SESSION=;", "Max-Age=0");
        problem(get(ME, one), 401, "authentication-required");
        problem(get(PREFERENCES, two), 401, "session-revoked");
        assertThat(get(ME, otherCookie).statusCode()).isEqualTo(200);

        problem(exchange(post(LOGIN, bootstrap(), credentials(email, OLD_PASSWORD))), 401, "invalid-credentials");
        problem(exchange(post(LOGIN, bootstrap(), credentials(email, NEW_PASSWORD.strip()))), 401, "invalid-credentials");
        var current = login(email, NEW_PASSWORD).cookie();
        var summary = json.readTree(get(ME, current).body());
        assertThat(summary.get("accountId").asString()).isEqualTo(before.get("id").toString());
        assertThat(summary.get("learnerId").asString()).isEqualTo(learner.toString());
        var after = account("reset.owner+tag@example.test");
        assertThat(after).containsEntry("security_revision", 1L);
        var hash = (String) after.get("password_hash");
        assertThat(hash).startsWith("{argon2id-v1}").isNotEqualTo(before.get("password_hash"));
        assertThat(encoder.matches(NEW_PASSWORD, hash)).isTrue();
        assertThat(studySnapshot(learner)).isEqualTo(saved);
        problem(exchange(post(RECOVERY_CONFIRM, anonymous, resetBody(raw, NEW_PASSWORD))), 400, "invalid-password-reset");
        var sensitive = List.of(raw, digest, OLD_PASSWORD, NEW_PASSWORD, hash, message.link().toString(), email);
        assertThat(sensitive.stream().anyMatch(logs.getAll()::contains)).as("recovery logs omit sensitive data").isFalse();
    }

    @Test
    void recoversPendingAccountsByMailboxOwnershipAndSeparatesTokenPurposes() throws Exception {
        String email = "pending-recovery@example.test";
        var browser = register(email, false);
        var before = account(email);
        String verification = token(mail(email, VerificationMail.Purpose.EMAIL_VERIFICATION));
        accepted(exchange(post(RECOVERY_REQUEST, browser, Map.of("email", email))));
        String reset = token(recovery(email));

        problem(exchange(post(RECOVERY_CONFIRM, browser, resetBody(verification, NEW_PASSWORD))), 400, "invalid-password-reset");
        problem(exchange(post(CONFIRM, browser, Map.of("token", reset, "password", OLD_PASSWORD))), 400, "invalid-email-verification");
        problem(exchange(post(LOGIN, bootstrap(), credentials(email, OLD_PASSWORD))), 401, "invalid-credentials");
        assertThat(exchange(post(RECOVERY_CONFIRM, browser, resetBody(reset, NEW_PASSWORD))).statusCode()).isEqualTo(204);
        problem(get(ME, browser.cookie()), 401, "authentication-required");
        var updated = account(email);
        assertThat(updated).containsEntry("id", before.get("id")).containsEntry("learner_id", before.get("learner_id"))
                .containsEntry("status", "VERIFIED").containsEntry("security_revision", 1L);
        assertThat(updated.get("email_verified_at")).isNotNull();
        assertThat(jdbc.queryForObject("SELECT superseded_at IS NOT NULL FROM mellow.email_verification WHERE account_id = ?",
                Boolean.class, before.get("id"))).isTrue();
        problem(exchange(post(CONFIRM, browser, Map.of("token", verification, "password", OLD_PASSWORD))),
                400, "invalid-email-verification");
        problem(exchange(post(LOGIN, bootstrap(), credentials(email, OLD_PASSWORD))), 401, "invalid-credentials");
        assertThat(get(ME, login(email, NEW_PASSWORD).cookie()).statusCode()).isEqualTo(200);
    }

    @Test
    void serializesConcurrentRequestsAndConsumptionAndRejectsExpiredAndSupersededTokens() throws Exception {
        String email = "concurrent-reset@example.test";
        var one = register(email, true);
        var two = bootstrap();
        var payload = Map.of("email", email);
        accepted(exchange(post(RECOVERY_REQUEST, one, payload)));
        String first = token(recovery(email));
        clock.advance(Duration.ofMinutes(1));
        for (var response : concurrent(post(RECOVERY_REQUEST, one, payload), post(RECOVERY_REQUEST, two, payload))) {
            accepted(response);
        }
        assertThat(mailbox.messages.stream().filter(message -> message.purpose() == VerificationMail.Purpose.PASSWORD_RESET)).hasSize(2);
        String second = token(recovery(email));
        assertThat(second).isNotEqualTo(first);
        problem(exchange(post(RECOVERY_CONFIRM, one, resetBody(first, NEW_PASSWORD))), 400, "invalid-password-reset");
        clock.advance(Duration.ofMinutes(30));
        problem(exchange(post(RECOVERY_CONFIRM, one, resetBody(second, NEW_PASSWORD))), 400, "invalid-password-reset");
        accepted(exchange(post(RECOVERY_REQUEST, one, payload)));
        String third = token(recovery(email));
        var attempts = concurrent(post(RECOVERY_CONFIRM, one, resetBody(third, NEW_PASSWORD)),
                post(RECOVERY_CONFIRM, two, resetBody(third, NEW_PASSWORD)));
        assertThat(attempts.stream().map(HttpResponse::statusCode)).containsExactlyInAnyOrder(204, 400);
        assertThat(account(email)).containsEntry("security_revision", 1L);
    }

    @Test
    void rollbackKeepsTheOldPasswordRevisionTokenAndSession() throws Exception {
        String email = "rollback-reset@example.test";
        var browser = register(email, true);
        var oldSession = login(email, OLD_PASSWORD);
        accepted(exchange(post(RECOVERY_REQUEST, browser, Map.of("email", email))));
        String token = token(recovery(email));
        var before = account(email);
        jdbc.execute("ALTER TABLE mellow.password_reset_token ADD CONSTRAINT reject_reset_test CHECK (consumed_at IS NULL) NOT VALID");
        try {
            problem(exchange(post(RECOVERY_CONFIRM, browser, resetBody(token, NEW_PASSWORD))), 500, "account-request-failed");
            assertThat(account(email)).isEqualTo(before);
            assertThat(jdbc.queryForObject("SELECT consumed_at IS NULL FROM mellow.password_reset_token WHERE account_id = ?",
                    Boolean.class, before.get("id"))).isTrue();
            assertThat(get(ME, oldSession.cookie()).statusCode()).isEqualTo(200);
            assertThat(get(ME, login(email, OLD_PASSWORD).cookie()).statusCode()).isEqualTo(200);
        } finally {
            jdbc.execute("ALTER TABLE mellow.password_reset_token DROP CONSTRAINT reject_reset_test");
        }
        assertThat(exchange(post(RECOVERY_CONFIRM, browser, resetBody(token, NEW_PASSWORD))).statusCode()).isEqualTo(204);
        problem(get(ME, oldSession.cookie()), 401, "session-revoked");
    }

    @Test
    void failedDeliveryLeavesThePasswordAndSessionsAloneAndAllowsResend(CapturedOutput logs) throws Exception {
        String email = "delivery-reset@example.test";
        var browser = register(email, true);
        var session = login(email, OLD_PASSWORD);
        var before = account(email);
        mailbox.fail.set(true);
        accepted(exchange(post(RECOVERY_REQUEST, browser, Map.of("email", email))));
        assertThat(account(email)).isEqualTo(before);
        assertThat(get(ME, session.cookie()).statusCode()).isEqualTo(200);
        assertThat(logs.getAll()).contains("Password reset email delivery failed after commit")
                .doesNotContain("synthetic delivery failure", "redefinir-senha#token=");
        mailbox.fail.set(false);
        clock.advance(Duration.ofMinutes(1));
        accepted(exchange(post(RECOVERY_REQUEST, browser, Map.of("email", email))));
        assertThat(exchange(post(RECOVERY_CONFIRM, browser, resetBody(token(recovery(email)), NEW_PASSWORD))).statusCode())
                .isEqualTo(204);
    }

    @Test
    void appliesCsrfPayloadPasswordAndAbuseLimits() throws Exception {
        var browser = bootstrap();
        for (String route : List.of(RECOVERY_REQUEST, RECOVERY_CONFIRM)) {
            problem(exchange(post(route, null, Map.of())), 403, "csrf-validation-failed");
            problem(exchange(post(route, new Browser(browser.cookie(), "wrong-csrf"), Map.of())), 403, "csrf-validation-failed");
        }
        problem(exchange(post(RECOVERY_REQUEST, browser, Map.of("email", "not an email"))), 400, "invalid-account-input");
        assertThat(exchange(post(RECOVERY_REQUEST, browser, Map.of("email", "x".repeat(4096)))).statusCode()).isEqualTo(413);
        for (int attempt = 0; attempt < 3; attempt++) {
            accepted(exchange(post(RECOVERY_REQUEST, browser, Map.of("email", "limits@example.test"))));
        }
        var limited = exchange(post(RECOVERY_REQUEST, browser, Map.of("email", " LIMITS@example.test "))
                .header("X-Forwarded-For", "192.0.2.60"));
        problem(limited, 429, "account-rate-limited");
        assertThat(limited.headers().firstValue("Retry-After")).contains("60");

        problem(exchange(post(RECOVERY_CONFIRM, browser, resetBody("invalid", "too short"))), 400, "invalid-account-input");
        problem(exchange(post(RECOVERY_CONFIRM, browser, resetBody("invalid", "🌱".repeat(129)))), 400, "invalid-account-input");
        for (int attempt = 0; attempt < 13; attempt++) {
            problem(exchange(post(RECOVERY_CONFIRM, browser, resetBody("invalid", NEW_PASSWORD))), 400, "invalid-password-reset");
        }
        problem(exchange(post(RECOVERY_CONFIRM, browser, resetBody("invalid", NEW_PASSWORD))), 429, "account-rate-limited");
        clock.advance(Duration.ofMinutes(1));
        accepted(exchange(post(RECOVERY_REQUEST, browser, Map.of("email", "limits@example.test"))));
    }

    @Test
    void sharesArgon2CapacityWithLoginWithoutConsumingTheResetToken() throws Exception {
        String email = "hash-limit-reset@example.test";
        var browser = register(email, true);
        accepted(exchange(post(RECOVERY_REQUEST, browser, Map.of("email", email))));
        String token = token(recovery(email));
        var one = bootstrap();
        var two = bootstrap();
        var gate = encoder.arm();
        try (var client = HttpClient.newHttpClient()) {
            var a = client.sendAsync(post(LOGIN, one, credentials(email, OLD_PASSWORD)).build(), HttpResponse.BodyHandlers.ofString());
            var b = client.sendAsync(post(LOGIN, two, credentials(email, OLD_PASSWORD)).build(), HttpResponse.BodyHandlers.ofString());
            try {
                assertThat(gate.entered().await(5, TimeUnit.SECONDS)).isTrue();
                problem(exchange(post(RECOVERY_CONFIRM, browser, resetBody(token, NEW_PASSWORD))), 429, "account-rate-limited");
                assertThat(account(email)).containsEntry("security_revision", 0L);
            } finally {
                encoder.release(gate);
            }
            assertThat(a.get().statusCode()).isEqualTo(200);
            assertThat(b.get().statusCode()).isEqualTo(200);
        }
        assertThat(exchange(post(RECOVERY_CONFIRM, browser, resetBody(token, NEW_PASSWORD))).statusCode()).isEqualTo(204);
    }

    @Test
    void anOldPasswordAlreadyBeingCheckedCannotEstablishANewRevisionSession() throws Exception {
        String email = "racing-login-reset@example.test";
        var browser = register(email, true);
        accepted(exchange(post(RECOVERY_REQUEST, browser, Map.of("email", email))));
        String token = token(recovery(email));
        var signIn = bootstrap();
        var gate = encoder.arm(1);
        try (var client = HttpClient.newHttpClient()) {
            var oldLogin = client.sendAsync(post(LOGIN, signIn, credentials(email, OLD_PASSWORD)).build(),
                    HttpResponse.BodyHandlers.ofString());
            try {
                assertThat(gate.entered().await(5, TimeUnit.SECONDS)).isTrue();
                assertThat(exchange(post(RECOVERY_CONFIRM, browser, resetBody(token, NEW_PASSWORD))).statusCode())
                        .isEqualTo(204);
            } finally {
                encoder.release(gate);
            }
            problem(oldLogin.get(), 401, "invalid-credentials");
        }
        assertThat(get(ME, login(email, NEW_PASSWORD).cookie()).statusCode()).isEqualTo(200);
    }

    private void seedStudy(UUID learner) {
        jdbc.update("""
                INSERT INTO mellow.lesson_run (learner_id, lesson_ref, run_ref, current_run, completed, first_completion, block_ref)
                VALUES (?, 'historical-lesson', 'saved-run', true, true, true, 'intro')
                """, learner);
        jdbc.update("INSERT INTO mellow.story_progress(learner_id, story_ref) VALUES (?, 'historical-story')", learner);
        jdbc.update("""
                INSERT INTO mellow.game_session (learner_id, session_ref, game_kind, level, difficulty, started_at, completed_at,
                    active_ms, answered_count, correct_count, vocabulary_source, total_pairs, incorrect_attempts)
                VALUES (?, 'saved-game', 'MEMORY_GAME', 'A1', 'EASY', now(), now(), 2, 2, 1, 'SAVED', 1, 1)
                """, learner);
        jdbc.update("""
                INSERT INTO mellow.simulation_session (learner_id, session_ref, situation_ref, scenario_ref, started_at, completed_at,
                    active_ms, decisions_completed, reviewed_corrections)
                VALUES (?, 'saved-simulation', 'historical-situation', 'scenario', now(), now(), 1000, 1, 0)
                """, learner);
        jdbc.update("""
                INSERT INTO mellow.flashcard_session (learner_id, session_ref, started_at, completed_at, active_ms,
                    direction, review_scope, used_search)
                VALUES (?, 'saved-review', now(), now(), 0, 'MIXED', 'SAVED', false)
                """, learner);
        jdbc.update("INSERT INTO mellow.vocabulary_favorite (learner_id, vocabulary_ref) VALUES (?, 'saved-context')", learner);
        jdbc.update("""
                INSERT INTO mellow.vocabulary_annotation (learner_id, vocabulary_ref, note, familiarity)
                VALUES (?, 'saved-context', 'Synthetic private note', 'REVIEWING')
                """, learner);
        jdbc.update("""
                INSERT INTO mellow.learner_preferences (learner_id, reading_font_size, show_reading_translations)
                VALUES (?, 'LARGE', true)
                """, learner);
        jdbc.update("""
                INSERT INTO mellow.legacy_import_receipt (learner_id, request_ref, snapshot_fingerprint, imported_at, report)
                VALUES (?, 'saved-import', repeat('a', 64), now(), '{}'::jsonb)
                """, learner);
    }

    private List<String> studySnapshot(UUID learner) {
        var data = new ArrayList<String>();
        for (String table : List.of("lesson_run", "story_progress", "game_session", "simulation_session", "flashcard_session",
                "vocabulary_favorite", "vocabulary_annotation", "learner_preferences", "legacy_import_receipt")) {
            data.add(jdbc.queryForObject("SELECT to_jsonb(study)::text FROM mellow." + table
                    + " study WHERE learner_id = ?", String.class, learner));
        }
        return data;
    }

    private Browser register(String email, boolean verify) throws Exception {
        var browser = bootstrap();
        accepted(exchange(post(REGISTER, browser, Map.of("email", email, "displayName", "Synthetic learner", "password", OLD_PASSWORD))));
        if (verify) {
            String token = token(mail(email, VerificationMail.Purpose.EMAIL_VERIFICATION));
            assertThat(exchange(post(CONFIRM, browser, Map.of("token", token, "password", OLD_PASSWORD))).statusCode()).isEqualTo(204);
        }
        return browser;
    }

    private Browser login(String email, String password) throws Exception {
        var response = exchange(post(LOGIN, bootstrap(), credentials(email, password)));
        assertThat(response.statusCode()).as(response.body()).isEqualTo(200);
        return new Browser(cookie(response), null);
    }

    private Browser bootstrap() throws Exception {
        var response = get("/api/v1/security/csrf", null);
        assertThat(response.statusCode()).isEqualTo(200);
        return new Browser(cookie(response), json.readTree(response.body()).get("token").asString());
    }

    private VerificationMail.Message recovery(String email) {
        return mail(email, VerificationMail.Purpose.PASSWORD_RESET);
    }

    private VerificationMail.Message mail(String email, VerificationMail.Purpose purpose) {
        return mailbox.messages.stream().filter(message -> message.recipient().equals(email) && message.purpose() == purpose)
                .reduce((older, latest) -> latest).orElseThrow();
    }

    private Map<String, Object> account(String canonical) {
        return jdbc.queryForMap("SELECT * FROM mellow.account WHERE email_canonical = ?", canonical);
    }

    private static String token(VerificationMail.Message message) {
        return message.link().getFragment().substring("token=".length());
    }

    private static Map<String, String> resetBody(String token, String password) {
        return Map.of("token", token, "newPassword", password);
    }

    private static Map<String, String> credentials(String email, String password) {
        return Map.of("email", email, "password", password);
    }

    private HttpRequest.Builder post(String path, Browser browser, Map<String, String> body) {
        var request = request(path).header("Content-Type", "application/json");
        if (browser != null) request.header("Cookie", browser.cookie()).header("X-CSRF-TOKEN", browser.csrf());
        return request.POST(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body)));
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

    private static List<HttpResponse<String>> concurrent(HttpRequest.Builder first, HttpRequest.Builder second) throws Exception {
        try (var client = HttpClient.newHttpClient()) {
            var a = client.sendAsync(first.build(), HttpResponse.BodyHandlers.ofString());
            var b = client.sendAsync(second.build(), HttpResponse.BodyHandlers.ofString());
            return List.of(a.get(), b.get());
        }
    }

    private static String cookie(HttpResponse<String> response) {
        return response.headers().firstValue("Set-Cookie").orElseThrow().split(";", 2)[0];
    }

    private static void accepted(HttpResponse<String> response) {
        assertThat(response.statusCode()).as(response.body()).isEqualTo(202);
        assertThat(response.body()).isEqualTo("{\"status\":\"accepted\"}");
        assertThat(response.headers().firstValue("Cache-Control")).contains("no-store");
    }

    private void problem(HttpResponse<String> response, int status, String suffix) {
        assertThat(response.statusCode()).as(response.body()).isEqualTo(status);
        assertThat(response.headers().firstValue("Cache-Control").orElseThrow()).contains("no-store");
        assertThat(json.readTree(response.body()).get("type").asString()).isEqualTo("urn:mellow:problem:" + suffix);
    }

    private record Browser(String cookie, String csrf) {}
}
