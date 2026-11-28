package com.mellow.backend;

import com.mellow.backend.account.application.VerificationMail;
import com.mellow.backend.security.MellowPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;
import tools.jackson.databind.json.JsonMapper;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

import static com.mellow.backend.account.api.AccountController.CONFIRM;
import static com.mellow.backend.account.api.AccountController.REGISTER;
import static com.mellow.backend.account.api.AccountController.RESEND;
import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
@ExtendWith(OutputCaptureExtension.class)
@Import({AccountRegistrationIT.MailConfiguration.class, TestSecuritySessions.Configuration.class})
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = {"mellow.account.verification-origin=http://127.0.0.1:5173", "logging.level.root=DEBUG"})
class AccountRegistrationIT {

    private static final String PREFERENCES = "/api/v1/preferences";
    private static final String PASSWORD = "  café synthetic password 🌿  ";
    private static final String NAME = "  Júlia Synthetic  ";
    private static final String ACCEPTED = "{\"status\":\"accepted\"}";
    private static final String PROBLEM = "urn:mellow:problem:";

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
    @Autowired private PasswordEncoder passwords;
    @Autowired private VerificationMailCapture mailbox;
    @Autowired private AdjustableClock clock;
    @Autowired private TestSecuritySessions identities;
    @LocalServerPort private int port;

    @BeforeEach
    void resetFixtureState() {
        mailbox.messages.clear();
        mailbox.fail.set(false);
        clock.advance(Duration.ofHours(2));
        identities.clear();
    }

    @Test
    void createsALinkedPendingAccountAndStoresOnlyAPasswordHashAndTokenDigest(CapturedOutput output) throws Exception {
        var session = anonymousSession();
        var response = exchange(mutation(REGISTER, session).header("X-Forwarded-Host", "spoof.example.test")
                .POST(HttpRequest.BodyPublishers.ofString(registration("  Julia.Tag+Trial@Example.TEST  ", PASSWORD))));
        assertAccepted(response);
        var account = account("julia.tag+trial@example.test");
        var learner = (UUID) account.get("learner_id");
        assertThat(account).containsEntry("email_original", "Julia.Tag+Trial@Example.TEST")
                .containsEntry("status", "PENDING_VERIFICATION").containsEntry("email_verified_at", null);
        assertThat(jdbc.queryForObject("SELECT display_name FROM mellow.learner WHERE id = ?", String.class, learner))
                .isEqualTo(NAME.strip());

        var hash = (String) account.get("password_hash");
        assertThat(hash).startsWith("{argon2id-v1}$argon2id$").doesNotContain(PASSWORD);
        assertThat(passwords.matches(PASSWORD, hash)).isTrue();
        assertThat(passwords.matches(PASSWORD.strip(), hash)).isFalse();

        var message = mailbox.onlyMessage();
        var rawToken = token(message);
        assertThat(Base64.getUrlDecoder().decode(rawToken)).hasSize(32);
        assertThat(message.recipient()).isEqualTo("Julia.Tag+Trial@Example.TEST");
        assertThat(message.subject()).contains("Mellow");
        assertThat(message.text()).contains("ignore esta mensagem").contains(message.expiresAt().toString());
        assertThat(message.link().getRawQuery()).isNull();
        assertThat(message.link().toString()).startsWith("http://127.0.0.1:5173/verificar-email#token=");
        assertThat(message.expiresAt()).isEqualTo(clock.instant().plus(Duration.ofMinutes(30)));
        var digest = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(Base64.getUrlDecoder().decode(rawToken)));
        assertThat(jdbc.queryForObject("SELECT token_digest FROM mellow.email_verification WHERE account_id = ?",
                String.class, account.get("id"))).isEqualTo(digest).isNotEqualTo(rawToken);
        assertThat(response.body()).doesNotContain(PASSWORD, hash, rawToken, digest, learner.toString(), message.recipient());
        assertThat(output.getAll()).doesNotContain(PASSWORD, hash, rawToken, digest, message.recipient(), NAME.strip());
        assertThat(exchange(request(PREFERENCES).header("Cookie", session.cookie()).GET()).statusCode()).isEqualTo(401);
    }

    @Test
    void rejectsUnexpectedIdentityFieldsAndInvalidInputsAndCapsTheBody() throws Exception {
        var session = anonymousSession();
        var email = "validation@example.test";
        var before = count("learner");
        assertProblem(post(REGISTER, session, registration(email, "short")), 400, "invalid-account-input");
        assertProblem(post(REGISTER, session, registration(email, "a".repeat(129))), 400, "invalid-account-input");
        assertProblem(post(REGISTER, session, registration("bad..mail@example.test", PASSWORD)), 400, "invalid-account-input");
        assertProblem(post(REGISTER, session, registration("x".repeat(65) + "@example.test", PASSWORD)), 400, "invalid-account-input");
        for (String field : new String[]{"learnerId", "roles", "status", "emailVerifiedAt"}) {
            var forged = ((tools.jackson.databind.node.ObjectNode) json.readTree(registration(email, PASSWORD)))
                    .put(field, "forged").toString();
            assertProblem(post(REGISTER, session, forged), 400, "invalid-account-input");
        }
        assertProblem(post(REGISTER, session, "{\"email\":\"one@example.test\",\"email\":\"two@example.test\"}"),
                400, "invalid-account-input");
        assertThat(post(REGISTER, session, " ".repeat(4097)).statusCode()).isEqualTo(413);
        var oversizedStream = mutation(REGISTER, session)
                .POST(HttpRequest.BodyPublishers.ofInputStream(() -> new java.io.ByteArrayInputStream(
                        " ".repeat(4097).getBytes(java.nio.charset.StandardCharsets.UTF_8))));
        assertThat(exchange(oversizedStream).statusCode()).isEqualTo(413);
        assertThat(count("learner")).isEqualTo(before);
        assertThat(mailbox.messages).isEmpty();

        assertAccepted(post(REGISTER, session, registration(email, "🌿".repeat(64))));
        assertThat(passwords.matches("🌿".repeat(64), (String) account(email).get("password_hash"))).isTrue();
    }

    @Test
    void duplicateAndConcurrentRegistrationReturnTheSameResponseWithoutChangingCredentials() throws Exception {
        var one = anonymousSession();
        var two = anonymousSession();
        var before = count("learner");
        var first = mutation(REGISTER, one).POST(HttpRequest.BodyPublishers.ofString(registration("Race@Example.test", PASSWORD)));
        var second = mutation(REGISTER, two).POST(HttpRequest.BodyPublishers.ofString(registration("race@example.TEST", PASSWORD)));
        try (var client = HttpClient.newHttpClient()) {
            var a = client.sendAsync(first.build(), HttpResponse.BodyHandlers.ofString());
            var b = client.sendAsync(second.build(), HttpResponse.BodyHandlers.ofString());
            assertAccepted(a.get());
            assertAccepted(b.get());
        }
        var existing = account("race@example.test");
        assertAccepted(post(REGISTER, one, registration("race@example.test", "A different synthetic password")));
        var message = mailbox.onlyMessage();
        assertThat(post(CONFIRM, one, confirmation(token(message), PASSWORD)).statusCode()).isEqualTo(204);
        assertAccepted(post(REGISTER, two, registration("RACE@example.test", "A different synthetic password")));
        assertThat(count("learner")).isEqualTo(before + 1);
        assertThat(account("race@example.test")).containsEntry("password_hash", existing.get("password_hash"))
                .containsEntry("learner_id", existing.get("learner_id")).containsEntry("status", "VERIFIED");
        assertThat(mailbox.messages).hasSize(1);
    }

    @Test
    void rollsBackLearnerAccountAndVerificationWhenWritingTheTokenFails(CapturedOutput output) throws Exception {
        var session = anonymousSession();
        var learners = count("learner");
        var accounts = count("account");
        var tokens = count("email_verification");
        String email = "rollback@example.test";
        jdbc.execute("""
                ALTER TABLE mellow.email_verification ADD CONSTRAINT reject_test_token
                CHECK (length(token_digest) = 0) NOT VALID
                """);
        try {
            var failure = post(REGISTER, session, registration(email, PASSWORD));
            assertProblem(failure, 500, "account-request-failed");
            assertThat(failure.body()).doesNotContain(email, PASSWORD, "reject_test_token", "SQL");
            assertThat(count("learner")).isEqualTo(learners);
            assertThat(count("account")).isEqualTo(accounts);
            assertThat(count("email_verification")).isEqualTo(tokens);
            assertThat(mailbox.messages).isEmpty();
            assertThat(output.getAll()).doesNotContain(email, PASSWORD);
        } finally {
            jdbc.execute("ALTER TABLE mellow.email_verification DROP CONSTRAINT reject_test_token");
        }
    }

    @Test
    void consumesVerificationOnceAndKeepsOrdinarySessionsAnonymous(CapturedOutput output) throws Exception {
        var anonymous = anonymousSession();
        var second = anonymousSession();
        var email = "ownership@example.test";
        assertAccepted(post(REGISTER, anonymous, registration(email, PASSWORD)));
        var account = account(email);
        var principal = new MellowPrincipal((UUID) account.get("id"), (UUID) account.get("learner_id"), 0);
        String fixture = UUID.randomUUID().toString();
        identities.register(fixture, TestSecuritySessions.authenticated(principal, "ROLE_LEARNER"));
        var synthetic = identities.open(port, fixture);
        assertProblem(exchange(request(PREFERENCES).header("Cookie", synthetic.cookie()).GET()), 403, "access-denied");

        var token = token(mailbox.onlyMessage());
        assertProblem(exchange(request(CONFIRM + "?token=" + token).GET()), 401, "authentication-required");
        assertThat(output.getAll()).doesNotContain(token, PASSWORD);
        assertProblem(post(CONFIRM, anonymous, confirmation(token, "Other synthetic password")), 400, "invalid-email-verification");
        var missing = post(CONFIRM, anonymous, confirmation("malformed", PASSWORD));
        assertProblem(missing, 400, "invalid-email-verification");
        var invalidToken = Base64.getUrlEncoder().withoutPadding().encodeToString(new byte[32]);
        assertThat(post(CONFIRM, anonymous, confirmation(invalidToken, PASSWORD)).body()).isEqualTo(missing.body());

        var first = mutation(CONFIRM, anonymous).POST(HttpRequest.BodyPublishers.ofString(confirmation(token, PASSWORD)));
        var other = mutation(CONFIRM, second).POST(HttpRequest.BodyPublishers.ofString(confirmation(token, PASSWORD)));
        try (var client = HttpClient.newHttpClient()) {
            var a = client.sendAsync(first.build(), HttpResponse.BodyHandlers.ofString());
            var b = client.sendAsync(other.build(), HttpResponse.BodyHandlers.ofString());
            var resultA = a.get();
            var resultB = b.get();
            assertThat(java.util.List.of(resultA.statusCode(), resultB.statusCode())).containsExactlyInAnyOrder(204, 400);
            var successful = resultA.statusCode() == 204 ? resultA : resultB;
            assertThat(successful.headers().firstValue("Set-Cookie")).isEmpty();
            assertThat(successful.headers().firstValue("Cache-Control")).contains("no-store");
        }
        assertThat(post(CONFIRM, anonymous, confirmation(token, PASSWORD)).body()).isEqualTo(missing.body());
        assertThat(account(email)).containsEntry("status", "VERIFIED")
                .doesNotContainEntry("email_verified_at", null);
        assertThat(jdbc.queryForObject("""
                SELECT count(*) FROM mellow.email_verification WHERE account_id = ? AND consumed_at IS NOT NULL
                """, Long.class, account.get("id"))).isEqualTo(1);
        assertThat(exchange(request(PREFERENCES).header("Cookie", anonymous.cookie()).GET()).statusCode()).isEqualTo(401);
        assertThat(exchange(request(PREFERENCES).header("Cookie", synthetic.cookie()).GET()).statusCode()).isEqualTo(200);

        var otherLearner = jdbc.queryForObject("INSERT INTO mellow.learner DEFAULT VALUES RETURNING id", UUID.class);
        String mismatched = UUID.randomUUID().toString();
        identities.register(mismatched, TestSecuritySessions.authenticated(
                new MellowPrincipal(principal.accountId(), otherLearner, 0), "ROLE_LEARNER"));
        assertProblem(exchange(request(PREFERENCES).header("Cookie", identities.open(port, mismatched).cookie()).GET()),
                403, "access-denied");
        assertThat(output.getAll()).doesNotContain(token, PASSWORD);
    }

    @Test
    void handlesExpiryAndSupersedesOnlyWhenIssuingAReplacement() throws Exception {
        var session = anonymousSession();
        var email = "resend@example.test";
        assertAccepted(post(REGISTER, session, registration(email, PASSWORD)));
        var first = mailbox.onlyMessage();
        assertAccepted(post(RESEND, session, resend(email, PASSWORD)));
        assertThat(mailbox.messages).hasSize(1);

        clock.advance(Duration.ofMinutes(1));
        assertAccepted(post(RESEND, session, resend(email, "Wrong synthetic password")));
        assertThat(mailbox.messages).hasSize(1);
        var resend = resend("RESEND@EXAMPLE.TEST", PASSWORD);
        var secondSession = anonymousSession();
        try (var client = HttpClient.newHttpClient()) {
            var a = client.sendAsync(mutation(RESEND, session).POST(HttpRequest.BodyPublishers.ofString(resend)).build(),
                    HttpResponse.BodyHandlers.ofString());
            var b = client.sendAsync(mutation(RESEND, secondSession).POST(HttpRequest.BodyPublishers.ofString(resend)).build(),
                    HttpResponse.BodyHandlers.ofString());
            assertAccepted(a.get());
            assertAccepted(b.get());
        }
        assertThat(mailbox.messages).hasSize(2);
        var replacement = mailbox.messages.stream().skip(1).findFirst().orElseThrow();
        assertThat(replacement.recipient()).isEqualTo(email);
        assertThat(token(replacement)).isNotEqualTo(token(first));
        assertProblem(post(CONFIRM, session, confirmation(token(first), PASSWORD)), 400, "invalid-email-verification");
        assertThat(jdbc.queryForObject("""
                SELECT count(*) FROM mellow.email_verification WHERE account_id = ? AND superseded_at IS NOT NULL
                """, Long.class, account(email).get("id"))).isEqualTo(1);

        clock.advance(Duration.ofMinutes(30));
        assertProblem(post(CONFIRM, session, confirmation(token(replacement), PASSWORD)), 400, "invalid-email-verification");
        assertAccepted(post(RESEND, session, resend("unknown@example.test", PASSWORD)));
        assertThat(mailbox.messages).hasSize(2);
        assertAccepted(post(RESEND, session, resend));
        var fresh = mailbox.messages.stream().skip(2).findFirst().orElseThrow();
        assertThat(post(CONFIRM, session, confirmation(token(fresh), PASSWORD)).statusCode()).isEqualTo(204);
        assertAccepted(post(RESEND, session, resend));
        assertThat(mailbox.messages).hasSize(3);
    }

    @Test
    void recoversAfterMailDeliveryFailsWithoutExposingSecrets(CapturedOutput output) throws Exception {
        var session = anonymousSession();
        String email = "delivery@example.test";
        mailbox.fail.set(true);
        assertAccepted(post(REGISTER, session, registration(email, PASSWORD)));
        assertThat(account(email)).containsEntry("status", "PENDING_VERIFICATION");
        assertThat(mailbox.messages).isEmpty();
        assertThat(output.getAll()).contains("Verification email delivery failed after commit")
                .doesNotContain(email, "synthetic delivery failure");
        mailbox.fail.set(false);
        clock.advance(Duration.ofMinutes(1));
        assertAccepted(post(RESEND, session, resend(email, PASSWORD)));
        assertThat(post(CONFIRM, session, confirmation(token(mailbox.onlyMessage()), PASSWORD)).statusCode()).isEqualTo(204);
    }

    @Test
    void requiresCsrfAndAppliesSourceLimitsDespiteForgedForwardedHeaders() throws Exception {
        var session = anonymousSession();
        var body = registration("limited@example.test", "short");
        for (var path : new String[]{REGISTER, RESEND, CONFIRM}) {
            assertProblem(exchange(request(path).header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString("{}"))), 403, "csrf-validation-failed");
            assertProblem(post(path, new AnonymousSession(session.cookie(), "invalid"), "{}"), 403, "csrf-validation-failed");
        }
        for (int i = 0; i < 8; i++) {
            assertProblem(post(REGISTER, session, body), 400, "invalid-account-input");
        }
        var limited = exchange(mutation(REGISTER, session).header("X-Forwarded-For", "192.0.2.180")
                .POST(HttpRequest.BodyPublishers.ofString(body)));
        assertProblem(limited, 429, "account-rate-limited");
        assertThat(limited.headers().firstValue("Retry-After")).contains("60");

        var invalid = confirmation("invalid", PASSWORD);
        for (int i = 0; i < 30; i++) {
            assertProblem(post(CONFIRM, session, invalid), 400, "invalid-email-verification");
        }
        assertProblem(post(CONFIRM, session, invalid), 429, "account-rate-limited");
        var resend = resend("no-mail@example.test", PASSWORD);
        for (int i = 0; i < 12; i++) {
            assertAccepted(post(RESEND, session, resend));
        }
        assertProblem(post(RESEND, session, resend), 429, "account-rate-limited");

        clock.advance(Duration.ofMinutes(1));
        assertProblem(post(REGISTER, session, body), 400, "invalid-account-input");
        assertThat(mailbox.messages).isEmpty();
    }

    private Map<String, Object> account(String email) {
        return jdbc.queryForMap("SELECT * FROM mellow.account WHERE email_canonical = ?", email);
    }

    private long count(String table) {
        return jdbc.queryForObject("SELECT count(*) FROM mellow." + table, Long.class);
    }

    private String registration(String email, String password) {
        return json.writeValueAsString(Map.of("displayName", NAME, "email", email, "password", password));
    }

    private String resend(String email, String password) {
        return json.writeValueAsString(Map.of("email", email, "password", password));
    }

    private String confirmation(String token, String password) {
        return json.writeValueAsString(Map.of("token", token, "password", password));
    }

    private static String token(VerificationMail.Message message) {
        return message.link().getFragment().substring("token=".length());
    }

    private AnonymousSession anonymousSession() throws Exception {
        var response = exchange(request(TestSecuritySessions.CSRF_PATH).GET());
        assertThat(response.statusCode()).isEqualTo(200);
        return new AnonymousSession(response.headers().firstValue("Set-Cookie").orElseThrow().split(";", 2)[0],
                json.readTree(response.body()).get("token").asString());
    }

    private HttpResponse<String> post(String path, AnonymousSession session, String body) throws Exception {
        return exchange(mutation(path, session).POST(HttpRequest.BodyPublishers.ofString(body)));
    }

    private HttpRequest.Builder mutation(String path, AnonymousSession session) {
        return request(path).header("Content-Type", "application/json")
                .header("Cookie", session.cookie()).header("X-CSRF-TOKEN", session.token());
    }

    private HttpRequest.Builder request(String path) {
        return HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + path)).timeout(Duration.ofSeconds(15));
    }

    private static HttpResponse<String> exchange(HttpRequest.Builder request) throws Exception {
        try (var client = HttpClient.newHttpClient()) {
            return client.send(request.build(), HttpResponse.BodyHandlers.ofString());
        }
    }

    private void assertProblem(HttpResponse<String> response, int status, String code) {
        assertThat(response.statusCode()).as(response.body()).isEqualTo(status);
        assertThat(response.headers().firstValue("Content-Type")).contains("application/problem+json");
        assertThat(response.headers().firstValue("Cache-Control").orElseThrow()).contains("no-store");
        assertThat(json.readTree(response.body()).get("type").asString()).isEqualTo(PROBLEM + code);
    }

    private static void assertAccepted(HttpResponse<String> response) {
        assertThat(response.statusCode()).as(response.body()).isEqualTo(202);
        assertThat(response.body()).isEqualTo(ACCEPTED);
        assertThat(response.headers().firstValue("Cache-Control").orElseThrow()).contains("no-store");
        assertThat(response.headers().firstValue("Set-Cookie")).isEmpty();
    }

    private record AnonymousSession(String cookie, String token) {}

    @TestConfiguration(proxyBeanMethods = false)
    static class MailConfiguration {

        @Bean
        VerificationMailCapture verificationMailCapture() {
            return new VerificationMailCapture();
        }

        @Bean
        @Primary
        AdjustableClock testClock() {
            return new AdjustableClock();
        }
    }

    static final class VerificationMailCapture implements VerificationMail {

        final ConcurrentLinkedQueue<Message> messages = new ConcurrentLinkedQueue<>();
        final AtomicBoolean fail = new AtomicBoolean();

        @Override
        public void send(Message message) {
            assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();
            assertThat(message.recipient().toLowerCase(java.util.Locale.ROOT)).endsWith(".test");
            if (fail.get()) throw new IllegalStateException("synthetic delivery failure " + message.link());
            messages.add(message);
        }

        Message onlyMessage() {
            assertThat(messages).hasSize(1);
            return messages.element();
        }
    }

    static final class AdjustableClock extends Clock {

        private final AtomicReference<Instant> now = new AtomicReference<>(
                Instant.now().truncatedTo(java.time.temporal.ChronoUnit.MILLIS));

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            if (!getZone().equals(zone)) throw new UnsupportedOperationException("The test clock uses UTC.");
            return this;
        }

        @Override
        public Instant instant() {
            return now.get();
        }

        void advance(Duration elapsed) {
            now.updateAndGet(current -> current.plus(elapsed));
        }
    }
}
