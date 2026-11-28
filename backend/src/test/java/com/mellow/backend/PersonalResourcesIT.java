package com.mellow.backend;

import org.junit.jupiter.api.AfterEach;
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
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
@ExtendWith(OutputCaptureExtension.class)
@Import(TestSecuritySessions.Configuration.class)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class PersonalResourcesIT {

    private static final String FAVORITES = "/api/v1/favorites";
    private static final String ANNOTATIONS = "/api/v1/vocabulary-annotations";
    private static final String PREFERENCES = "/api/v1/preferences";
    private static final String MISSING = "\"missing\"";
    private static final String PREFIX = "english-for-pt-br/en-a1-introductions-hello/greetings/";
    private static final String MORNING = PREFIX + "good-morning";
    private static final String AFTERNOON = PREFIX + "good-afternoon";
    private static final String RETIRED = "previous-story/expressão com acento";

    @Container
    static final PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:17.12-bookworm");

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private TestSecuritySessions sessions;

    @LocalServerPort private int port;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private JsonMapper json;

    private HttpClient client;
    private UUID owner;
    private String token;
    private String otherToken;

    @BeforeEach
    void fixtures() {
        client = HttpClient.newHttpClient();
        owner = newLearner();
        token = tokenFor(owner);
        otherToken = tokenFor(newLearner());
    }

    @AfterEach
    void closeClient() {
        client.close();
        sessions.clear();
    }

    @Test
    void protectsEveryResourceAndScopesPersonalDataToTrustedIdentity() throws Exception {
        for (var path : List.of(FAVORITES, ANNOTATIONS, PREFERENCES, favorite(MORNING), annotation(MORNING))) {
            fail(send("GET", path, null, null, null), 401);
        }
        fail(send("PUT", favorite(MORNING), null, MISSING, null), 401);
        fail(send("PATCH", annotation(MORNING), null, MISSING, "{\"note\":\"private\"}"), 401);
        fail(send("PATCH", PREFERENCES, null, MISSING, "{\"translations\":true}"), 401);
        fail(send("GET", PREFERENCES, tokenFor(UUID.randomUUID()), null, null), 403);
        var original = get(favorite(MORNING));
        assertThat(original.headers().firstValue("Cache-Control")).contains("no-store");
        var saved = send("PUT", favorite(MORNING), token, tag(original), null);
        assertThat(body(saved, 200).path("saved").booleanValue()).isTrue();
        var note = patch(annotation(MORNING), MISSING, Map.of("note", "Nota particular"));
        body(note, 200);
        body(patch(PREFERENCES, MISSING, Map.of("translations", true)), 200);

        var otherView = send("GET", favorite(MORNING) + "&learnerId=" + owner, otherToken, null, null);
        assertThat(body(otherView, 200).path("saved").booleanValue()).isFalse();
        assertThat(body(send("GET", FAVORITES, otherToken, null, null), 200).path("items")).isEmpty();
        assertThat(body(send("GET", ANNOTATIONS, otherToken, null, null), 200).path("items")).isEmpty();
        assertThat(body(send("GET", annotation(MORNING), otherToken, null, null), 200).path("note").isNull()).isTrue();
        assertThat(body(send("GET", PREFERENCES, otherToken, null, null), 200).path("translations").booleanValue()).isFalse();
        fail(send("DELETE", favorite(MORNING), otherToken, tag(saved), null), 412);
        fail(send("PATCH", annotation(MORNING), otherToken, tag(note), "{\"note\":\"outro\"}"), 412);
        fail(patch(PREFERENCES, tag(get(PREFERENCES)), Map.of("learnerId", owner.toString())), 400);
        assertThat(body(get(annotation(MORNING)), 200).path("note").stringValue()).isEqualTo("Nota particular");
    }

    @Test
    void createsRemovesAndRestoresFavoritesWithoutAcceptingStaleOppositeRetries() throws Exception {
        String path = favorite(MORNING);
        var unseen = get(path);
        assertThat(tag(unseen)).isEqualTo(MISSING);
        fail(send("PUT", path, token, null, null), 428);
        fail(send("PUT", path, token, "*", null), 400);
        var saved = send("PUT", path, token, tag(unseen), null);
        var savedView = body(saved, 200);
        assertThat(savedView.path("savedAt").isString()).isTrue();
        assertThat(savedView.path("savedOn").isNull()).isTrue();
        assertThat(body(send("PUT", path, token, tag(unseen), null), 200)).isEqualTo(savedView);
        assertThat(body(send("PUT", path, token, tag(saved), null), 200)).isEqualTo(savedView);
        assertThat(body(get(path), 200)).isEqualTo(savedView);

        var removed = send("DELETE", path, token, tag(saved), null);
        assertCode(removed, 204);
        assertThat(tag(removed)).isNotEqualTo(tag(saved));
        assertThat(tag(send("DELETE", path, token, tag(saved), null))).isEqualTo(tag(removed));
        fail(send("PUT", path, token, tag(unseen), null), 412);
        assertThat(body(get(FAVORITES), 200).path("items")).isEmpty();

        var restored = send("PUT", path, token, tag(removed), null);
        assertThat(body(restored, 200).path("saved").booleanValue()).isTrue();
        assertThat(tag(restored)).isNotIn(tag(removed), tag(saved));
        fail(send("DELETE", path, token, tag(saved), null), 412);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM mellow.vocabulary_favorite WHERE learner_id = ?",
                Long.class, owner)).isEqualTo(1);

        var firstRemoval = send("DELETE", favorite(AFTERNOON), token, MISSING, null);
        assertCode(firstRemoval, 204);
        assertThat(tag(firstRemoval)).isNotEqualTo(MISSING);
        fail(send("PUT", favorite(AFTERNOON), token, MISSING, null), 412);
    }

    @Test
    void keepsLegacyPrecisionAndRetiredReferencesAndSupportsDeterministicFiltering() throws Exception {
        jdbc.update("INSERT INTO mellow.vocabulary_favorite (learner_id, vocabulary_ref) VALUES (?, ?)", owner, RETIRED);
        jdbc.update("""
                INSERT INTO mellow.vocabulary_favorite (learner_id, vocabulary_ref, saved_on)
                VALUES (?, 'date-only-historical', DATE '2024-07-19')
                """, owner);
        var historical = get(favorite(RETIRED));
        var legacy = body(historical, 200);
        assertThat(legacy.path("savedAt").isNull()).isTrue();
        assertThat(legacy.path("savedOn").isNull()).isTrue();
        assertThat(legacy.path("available").booleanValue()).isFalse();
        assertThat(legacy.path("source").isNull()).isTrue();
        assertThat(body(get(favorite("date-only-historical")), 200).path("savedOn").stringValue())
                .isEqualTo("2024-07-19");
        assertThat(body(send("PUT", favorite(RETIRED), token, tag(historical), null), 200)).isEqualTo(legacy);
        var removed = send("DELETE", favorite(RETIRED), token, tag(historical), null);
        assertCode(removed, 204);
        assertThat(body(send("PUT", favorite(RETIRED), token, tag(removed), null), 200)
                .path("available").booleanValue()).isFalse();
        fail(send("PUT", favorite("never-published"), token, MISSING, null), 400);

        for (var ref : List.of(MORNING, AFTERNOON)) body(send("PUT", favorite(ref), token, MISSING, null), 200);
        var first = body(get(FAVORITES + "?size=1&source=LESSON&type=EXPRESSION"), 200);
        var second = body(get(FAVORITES + "?size=1&page=1&source=LESSON&type=EXPRESSION"), 200);
        assertThat(first.path("items").get(0).path("vocabularyRef").stringValue()).isEqualTo(AFTERNOON);
        assertThat(second.path("items").get(0).path("vocabularyRef").stringValue()).isEqualTo(MORNING);
        assertThat(first.path("hasNext").booleanValue()).isTrue();
        assertThat(second.path("hasNext").booleanValue()).isFalse();
        assertThat(body(get(FAVORITES), 200).path("items")).hasSize(4);
        fail(get(FAVORITES + "?size=101"), 400);
        fail(get(FAVORITES + "?source=unknown"), 400);
    }

    @Test
    void deduplicatesSharedPracticalReferencesWhilePreservingDistinctMeanings() throws Exception {
        var practical = "practical-at-the-airport-passport";
        var first = send("PUT", favorite(practical), token, MISSING, null);
        assertThat(body(first, 200).path("type").stringValue()).isEqualTo("PHRASE");
        body(send("PUT", favorite(practical), token, MISSING, null), 200);
        assertThat(body(get(FAVORITES + "?source=PRACTICAL"), 200).path("items")).hasSize(1);
        var contextual = "english-for-pt-br/en-a1-introductions-about-me/personal-details/good-morning";
        body(send("PUT", favorite(MORNING), token, MISSING, null), 200);
        body(send("PUT", favorite(contextual), token, MISSING, null), 200);
        assertThat(body(get(FAVORITES + "?source=LESSON"), 200).path("items")).hasSize(2);
        body(send("PUT", favorite("story-rainy-morning-a-cup-of-coffee"), token, MISSING, null), 200);
        body(send("PUT", favorite("en-a-little"), token, MISSING, null), 200);
        assertThat(body(get(FAVORITES), 200).path("items")).hasSize(5);
    }

    @Test
    void editsAndClearsIndependentAnnotationFieldsPreservingOriginalTextAndUtf16Limits() throws Exception {
        String path = annotation(MORNING);
        String note = "  Café 😀\r\nsegunda linha\t ";
        String example = "  Good morning!\nI'm Ana.  ";
        var first = patch(path, MISSING, Map.of("note", note, "personalExample", example, "familiarity", "learning"));
        var initial = body(first, 200);
        assertThat(initial.path("note").stringValue()).isEqualTo(note);
        assertThat(initial.path("personalExample").stringValue()).isEqualTo(example);
        assertThat(initial.path("familiarity").stringValue()).isEqualTo("learning");
        var second = patch(path, tag(first), Map.of("personalExample", "Edited example.", "familiarity", "reviewing"));
        var edited = body(second, 200);
        assertThat(edited.path("note").stringValue()).isEqualTo(note);
        assertThat(edited.path("personalExample").stringValue()).isEqualTo("Edited example.");
        assertThat(edited.path("familiarity").stringValue()).isEqualTo("reviewing");
        assertThat(edited.path("createdAt")).isEqualTo(initial.path("createdAt"));
        fail(patch(path, tag(first), Map.of("note", "Stale")), 412);
        fail(patch(path, tag(second), Map.of("note", "😀".repeat(601))), 400);
        fail(patch(path, tag(second), Map.of("personalExample", "😀".repeat(201))), 400);
        fail(patch(path, tag(second), Map.of("note", "bad\u0000text")), 400);
        fail(send("PATCH", path, token, tag(second), "{\"note\":\"\\uD800\"}"), 400);
        fail(patch(path, tag(second), Map.of("familiarity", "unclassified")), 400);
        fail(patch(path, tag(second), Map.of("familiarity", 0)), 400);
        fail(patch(path, tag(second), Map.of()), 400);
        var boundary = patch(path, tag(second), Map.of("note", "😀".repeat(600), "personalExample", "😀".repeat(200)));
        assertThat(body(boundary, 200).path("note").stringValue()).hasSize(1200);

        var clear = send("PATCH", path, token, tag(boundary), "{\"note\":\" \\n \",\"personalExample\":null}");
        var fields = body(clear, 200);
        assertThat(fields.path("note").isNull()).isTrue();
        assertThat(fields.path("personalExample").isNull()).isTrue();
        assertThat(fields.path("familiarity").stringValue()).isEqualTo("reviewing");
        var last = send("PATCH", path, token, tag(clear), "{\"familiarity\":null}");
        assertThat(body(last, 200).path("createdAt").isNull()).isTrue();
        assertThat(body(get(ANNOTATIONS), 200).path("items")).isEmpty();
        fail(patch(path, MISSING, Map.of("note", "Old create")), 412);
    }

    @Test
    void retainsPersonalMetadataAndFlashcardHistoryAcrossFavoriteRemovalAndExplicitAnnotationDeletion() throws Exception {
        var saved = send("PUT", favorite(MORNING), token, MISSING, null);
        body(saved, 200);
        var annotation = patch(annotation(MORNING), MISSING, Map.of("note", "Um lembrete", "familiarity", "familiar"));
        body(annotation, 200);
        var oldSession = jdbc.queryForObject("""
                INSERT INTO mellow.flashcard_session
                (learner_id, session_ref, started_at, completed_at, active_ms, direction, review_scope, used_search)
                VALUES (?, 'historic-review', '2025-01-02T12:00:00Z', '2025-01-02T12:01:00Z', 0, 'EN_PT', 'SAVED', FALSE)
                RETURNING id
                """, UUID.class, owner);
        jdbc.update("""
                INSERT INTO mellow.flashcard_recall (flashcard_session_id, position, vocabulary_ref, direction, rating)
                VALUES (?, 0, ?, 'EN_PT', 'EASY')
                """, oldSession, MORNING);
        var removed = send("DELETE", favorite(MORNING), token, tag(saved), null);
        assertCode(removed, 204);
        assertThat(body(get(annotation(MORNING)), 200).path("note").stringValue()).isEqualTo("Um lembrete");
        body(send("PUT", favorite(MORNING), token, tag(removed), null), 200);
        assertThat(body(get(annotation(MORNING)), 200).path("familiarity").stringValue()).isEqualTo("familiar");
        var deleted = send("DELETE", annotation(MORNING), token, tag(annotation), null);
        assertCode(deleted, 204);
        assertThat(body(get(annotation(MORNING)), 200).path("note").isNull()).isTrue();
        fail(patch(annotation(MORNING), tag(annotation), Map.of("note", "Pre-delete retry")), 412);
        assertThat(body(get(favorite(MORNING)), 200).path("saved").booleanValue()).isTrue();
        assertThat(body(get("/api/v1/flashcard-sessions/historic-review"), 200).path("recalls").get(0)
                .path("vocabularyRef").stringValue()).isEqualTo(MORNING);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM mellow.combined_study_day WHERE learner_id = ?",
                Long.class, owner)).isZero();
    }

    @Test
    void editsRetiredAnnotationsAndDistinguishesBlankLegacyValuesFromOmittedProperties() throws Exception {
        jdbc.update("""
                INSERT INTO mellow.vocabulary_annotation (learner_id, vocabulary_ref, note, personal_example)
                VALUES (?, ?, '  ', 'Example')
                """, owner, RETIRED);
        var existing = get(annotation(RETIRED));
        var changed = patch(annotation(RETIRED), tag(existing), Map.of("personalExample", "A different example."));
        var view = body(changed, 200);
        assertThat(view.path("note").stringValue()).isEqualTo("  ");
        assertThat(view.path("available").booleanValue()).isFalse();
        assertThat(view.path("personalExample").stringValue()).isEqualTo("A different example.");
        fail(patch(annotation("unknown-ref"), MISSING, Map.of("note", "New")), 400);
        assertThat(body(get(ANNOTATIONS), 200).path("items")).hasSize(1);
    }

    @Test
    void appliesDefaultsAndPartialPreferenceUpdatesWithRevisionChecks() throws Exception {
        var initial = get(PREFERENCES);
        var defaults = body(initial, 200);
        assertThat(defaults.path("fontSize").stringValue()).isEqualTo("normal");
        assertThat(defaults.path("translations").booleanValue()).isFalse();
        assertThat(defaults.path("updatedAt").isNull()).isTrue();
        var size = patch(PREFERENCES, tag(initial), Map.of("fontSize", "extra-large"));
        assertThat(body(size, 200).path("fontSize").stringValue()).isEqualTo("extra-large");
        var translated = patch(PREFERENCES, tag(size), Map.of("translations", true));
        var view = body(translated, 200);
        assertThat(view.path("translations").booleanValue()).isTrue();
        assertThat(view.path("fontSize").stringValue()).isEqualTo("extra-large");
        fail(patch(PREFERENCES, tag(size), Map.of("fontSize", "large")), 412);
        for (var invalid : List.of("{\"fontSize\":\"\"}", "{\"fontSize\":\"wide\"}", "{\"fontSize\":2}",
                "{\"translations\":\"true\"}", "{\"voiceId\":\"browser-voice\"}", "{}")) {
            fail(send("PATCH", PREFERENCES, token, tag(translated), invalid), 400);
        }
        var reset = send("PATCH", PREFERENCES, token, tag(translated), "{\"fontSize\":null,\"translations\":null}");
        var restored = body(reset, 200);
        assertThat(restored.path("fontSize").stringValue()).isEqualTo("normal");
        assertThat(restored.path("translations").booleanValue()).isFalse();
        assertThat(tag(reset)).isNotEqualTo(MISSING);
        fail(patch(PREFERENCES, MISSING, Map.of("translations", true)), 412);
    }

    @Test
    void serializesConcurrentAdditionsAndCompetingAnnotationAndPreferenceWrites() throws Exception {
        assertThat(race(request("PUT", favorite(MORNING), token, MISSING, null),
                request("PUT", favorite(MORNING), token, MISSING, null))).containsExactly(200, 200);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM mellow.vocabulary_favorite WHERE learner_id = ?",
                Long.class, owner)).isEqualTo(1);
        assertThat(race(request("PATCH", annotation(MORNING), token, MISSING, "{\"note\":\"A\"}"),
                request("PATCH", annotation(MORNING), token, MISSING, "{\"note\":\"B\"}")))
                .containsExactlyInAnyOrder(200, 412);
        assertThat(race(request("PATCH", PREFERENCES, token, MISSING, "{\"fontSize\":\"large\"}"),
                request("PATCH", PREFERENCES, token, MISSING, "{\"translations\":true}")))
                .containsExactlyInAnyOrder(200, 412);

        var noteTag = tag(get(annotation(MORNING)));
        var savedTag = tag(get(favorite(MORNING)));
        assertThat(race(request("DELETE", favorite(MORNING), token, savedTag, null),
                request("PATCH", annotation(MORNING), token, noteTag, "{\"note\":\"Retained\"}")))
                .containsExactly(204, 200);
        assertThat(body(get(annotation(MORNING)), 200).path("note").stringValue()).isEqualTo("Retained");
    }

    @Test
    void failedDatabaseWriteRollsBackAllFieldsAndRevisionWithoutLoggingPrivateText(CapturedOutput output) throws Exception {
        String path = annotation("en-a-little");
        String originalSecret = "Initial private note";
        var original = patch(path, MISSING, Map.of("note", originalSecret, "personalExample", "An example."));
        body(original, 200);
        String privateSample = "rollback-test-private-example-741";
        jdbc.execute("ALTER TABLE mellow.vocabulary_annotation ADD CONSTRAINT test_annotation_failure "
                + "CHECK (char_length(personal_example) <> " + privateSample.length() + ") NOT VALID");
        try {
            var failed = patch(path, tag(original), Map.of("note", "Should roll back", "personalExample", privateSample));
            fail(failed, 500);
            assertThat(failed.body()).doesNotContain(privateSample, "test_annotation_failure");
            var retained = get(path);
            assertThat(body(retained, 200)).isEqualTo(json.readTree(original.body()));
            assertThat(tag(retained)).isEqualTo(tag(original));
            assertThat(output.getAll()).doesNotContain(privateSample, originalSecret);
        } finally {
            jdbc.execute("ALTER TABLE mellow.vocabulary_annotation DROP CONSTRAINT test_annotation_failure");
        }
    }

    private UUID newLearner() {
        return jdbc.queryForObject("INSERT INTO mellow.learner DEFAULT VALUES RETURNING id", UUID.class);
    }

    private String tokenFor(UUID learner) {
        String token = UUID.randomUUID().toString();
        sessions.register(token, learner);
        return token;
    }

    private static String favorite(String ref) { return item(FAVORITES, ref); }
    private static String annotation(String ref) { return item(ANNOTATIONS, ref); }
    private static String item(String base, String ref) {
        return base + "/item?ref=" + URLEncoder.encode(ref, StandardCharsets.UTF_8);
    }

    private HttpResponse<String> get(String path) throws Exception { return send("GET", path, token, null, null); }

    private HttpResponse<String> patch(String path, String match, Map<String, ?> values) throws Exception {
        return send("PATCH", path, token, match, json.writeValueAsString(values));
    }

    private HttpResponse<String> send(String method, String path, String identity, String match, String body) throws Exception {
        return client.send(request(method, path, identity, match, body), HttpResponse.BodyHandlers.ofString());
    }

    private HttpRequest request(String method, String path, String identity, String match, String body) {
        var builder = HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + path))
                .timeout(Duration.ofSeconds(15)).header("X-Learner-Id", owner.toString());
        sessions.authorize(builder, port, identity);
        if (match != null) builder.header("If-Match", match);
        if (body != null) builder.header("Content-Type", "application/json");
        return builder.method(method, body == null ? HttpRequest.BodyPublishers.noBody()
                : HttpRequest.BodyPublishers.ofString(body)).build();
    }

    private List<Integer> race(HttpRequest first, HttpRequest second) {
        var a = client.sendAsync(first, HttpResponse.BodyHandlers.ofString());
        var b = client.sendAsync(second, HttpResponse.BodyHandlers.ofString());
        CompletableFuture.allOf(a, b).join();
        return List.of(a.join().statusCode(), b.join().statusCode());
    }

    private static String tag(HttpResponse<String> response) { return response.headers().firstValue("ETag").orElseThrow(); }
    private static void assertCode(HttpResponse<String> response, int status) {
        assertThat(response.statusCode()).withFailMessage(response.body()).isEqualTo(status);
    }
    private JsonNode body(HttpResponse<String> response, int status) {
        assertCode(response, status);
        return json.readTree(response.body());
    }
    private void fail(HttpResponse<String> response, int status) {
        var problem = body(response, status);
        assertThat(problem.path("status").intValue()).isEqualTo(status);
        assertThat(problem.has("trace")).isFalse();
        assertThat(problem.has("exception")).isFalse();
    }
}
