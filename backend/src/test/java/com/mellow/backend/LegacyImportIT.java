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
import tools.jackson.databind.node.ObjectNode;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
@ExtendWith(OutputCaptureExtension.class)
@Import(TestSecuritySessions.Configuration.class)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class LegacyImportIT {

    @Container
    static final PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:17.12-bookworm");
    private static final String PATH = "/api/v1/data-import";
    private static final String PROGRESS = "mellow:learner-progress";
    private static final String FAVORITES = "mellow:favorite-words";
    private static final String FAVORITE_DATES = "mellow:favorite-words-saved-at";
    private static final String ANNOTATIONS = "mellow:vocabulary-annotations";
    private static final String PRIVATE = "PRIVATE_LEGACY_CONTENT_581";

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
    private UUID owner;
    private String token;
    private String otherToken;
    private HttpClient client;

    @BeforeEach
    void prepare() {
        client = HttpClient.newHttpClient();
        owner = learner();
        token = identity(owner);
        otherToken = identity(learner());
    }

    @AfterEach
    void close() {
        client.close();
        sessions.clear();
    }

    @Test
    void dryRunsAllFiveStoredVersionsWithoutPersistingAnyPartOfThePlan() throws Exception {
        for (int version = 1; version <= 5; version++) {
            var report = dry(snapshot("version-" + version, version));
            assertThat(report.path("status").stringValue()).isEqualTo("DRY_RUN");
            assertThat(report.path("importedAt").isNull()).isTrue();
            assertThat(report.path("exportedAt").isNull()).isTrue();
            var counts = report.path("counts");
            assertThat(counts.path("LESSON").path("ELIGIBLE").longValue()).isEqualTo(1);
            assertThat(counts.path("STUDY_DAY").path("ELIGIBLE").longValue()).isEqualTo(1);
            assertThat(counts.has("READING")).isEqualTo(version >= 2);
            assertThat(counts.path("GAME").has("ELIGIBLE")).isEqualTo(version >= 3);
            assertThat(counts.path("SIMULATION").has("ELIGIBLE")).isEqualTo(version >= 4);
            assertThat(counts.path("FLASHCARD").has("ELIGIBLE")).isEqualTo(version >= 5);
            fail(send("GET", PATH + "/version-" + version, token, null), 404);
        }
        assertNoWrites();
    }

    @Test
    void importsRelationalProgressCompletedSessionsPersonalResourcesAndTimeWithoutInventedEvidence(CapturedOutput output)
            throws Exception {
        var snapshot = snapshot("complete", 5).put("exportedAt", "2025-01-07T00:00:00Z");
        var planned = dry(snapshot);
        assertThat(planned.toString()).doesNotContain(PRIVATE, "retired-favorite", "old-answer");
        var applied = body(apply(snapshot, planned, false), 200);
        assertThat(applied.path("status").stringValue()).isEqualTo("APPLIED");
        assertThat(applied.path("counts").path("GAME").path("IMPORTED").longValue()).isEqualTo(3);
        assertThat(applied.path("importedAt").isString()).isTrue();
        assertThat(applied.path("exportedAt").stringValue()).isEqualTo("2025-01-07T00:00:00Z");
        assertThat(applied.toString()).doesNotContain(PRIVATE, "retired-favorite", "old-answer");
        assertThat(body(send("GET", PATH + "/complete", token, null), 200)).isEqualTo(applied);
        assertThat(body(apply(snapshot, planned, false), 200)).isEqualTo(applied);
        assertThat(output.getAll()).doesNotContain(PRIVATE);
        fail(send("GET", PATH + "/complete?learnerId=" + owner, otherToken, null), 404);

        var lesson = body(send("GET", "/api/v1/lesson-progress/retired-lesson", token, null), 200);
        assertThat(lesson.path("attempts")).hasSize(2);
        var first = lesson.path("attempts").get(0);
        assertThat(first.path("firstCompletion").booleanValue()).isTrue();
        var exercise = first.path("activities").path("archived-block").path("exercises").path("retired-exercise");
        assertThat(exercise.path("status").stringValue()).isEqualTo("REVIEWED");
        assertThat(exercise.path("reviewedAt").isString()).isTrue();
        assertThat(exercise.path("submissions").get(0).path("answer").path("optionId").stringValue())
                .isEqualTo("old-answer");
        var story = body(send("GET", "/api/v1/reading-progress/retired-story", token, null), 200);
        assertThat(story.path("readChapters").get(0).path("readOn").isNull()).isTrue();
        assertThat(story.path("attempts").get(0).path("chapters").path("chapter-old").path("paragraphRef").stringValue())
                .isEqualTo("paragraph-later");
        assertThat(story.path("legacyFirstCompletionSnapshot").path("chapters").path("chapter-old")
                .path("paragraphRef").stringValue()).isEqualTo("paragraph-first");
        assertThat(story.path("attempts").get(0).path("chapters").path("chapter-old").path("practice")
                .path("exercises").path("retired-exercise").path("reviewedAt").isString()).isTrue();
        assertThat(body(send("GET", "/api/v1/game-sessions/word-old", token, null), 200).path("evidence").isNull()).isTrue();
        var simulation = body(send("GET", "/api/v1/simulation-sessions/sim-old", token, null), 200);
        assertThat(simulation.path("session").path("legacyImported").booleanValue()).isTrue();
        assertThat(simulation.path("session").path("catalogRevision").isNull()).isTrue();
        assertThat(simulation.path("attempts").get(0).path("fit").stringValue()).isEqualTo("CONTEXT");
        var flashcard = body(send("GET", "/api/v1/flashcard-sessions/flash-old", token, null), 200);
        assertThat(flashcard.path("recalls").get(0).path("rating").stringValue()).isEqualTo("EFFORT");
        var saved = body(send("GET", "/api/v1/favorites/item?ref=retired-favorite", token, null), 200);
        assertThat(saved.path("savedAt").isNull()).isTrue();
        assertThat(saved.path("available").booleanValue()).isFalse();
        assertThat(body(send("GET", "/api/v1/favorites/item?ref=retained-note", token, null), 200)
                .path("saved").booleanValue()).isFalse();
        assertThat(body(send("GET", "/api/v1/vocabulary-annotations/item?ref=retained-note", token, null), 200)
                .path("familiarity").stringValue()).isEqualTo("reviewing");
        assertThat(body(send("GET", "/api/v1/preferences", token, null), 200).path("fontSize").stringValue()).isEqualTo("large");
        assertThat(jdbc.queryForObject("SELECT sum(active_ms) FROM mellow.combined_study_day WHERE learner_id=?",
                Long.class, owner)).isEqualTo(700);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM mellow.game_session WHERE learner_id=? AND legacy_imported",
                Long.class, owner)).isEqualTo(3);
        assertThat(jdbc.queryForObject("SELECT report::text FROM mellow.legacy_import_receipt WHERE learner_id=?",
                String.class, owner)).doesNotContain(PRIVATE, "old-answer");
    }

    @Test
    void recognizesRecordOverlapAndAnIndependentReplayDespiteDifferentExportMetadata() throws Exception {
        var first = snapshot("first", 5);
        body(apply(first, dry(first), false), 200);
        var same = first.deepCopy().put("requestId", "same").put("exportedAt", "2025-01-08T00:00:00Z");
        var repeated = dry(same);
        assertThat(repeated.path("previouslyImportedSnapshot").booleanValue()).isTrue();
        assertThat(repeated.path("counts").path("GAME").path("IDENTICAL").intValue()).isEqualTo(3);
        assertThat(repeated.path("counts").path("READING").path("IDENTICAL").intValue()).isEqualTo(1);
        assertThat(repeated.path("counts").path("LESSON").path("IDENTICAL").intValue()).isEqualTo(1);
        var changed = first.deepCopy().put("requestId", "overlap");
        var source = progress(changed);
        var games = (ObjectNode) source.path("data").path("gameSessions");
        games.set("memory-replay", ((ObjectNode) games.get("memory-old")).deepCopy().put("sessionId", "memory-replay"));
        setStorage(changed, PROGRESS, 5, source.toString());
        var second = dry(changed);
        assertThat(second.path("counts").path("GAME").path("IDENTICAL").intValue()).isEqualTo(3);
        assertThat(second.path("counts").path("GAME").path("ELIGIBLE").intValue()).isEqualTo(1);
        body(apply(changed, second, false), 200);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM mellow.game_session WHERE learner_id=?", Long.class, owner))
                .isEqualTo(4);
        assertThat(jdbc.queryForObject("SELECT sum(active_ms) FROM mellow.combined_study_day WHERE learner_id=?",
                Long.class, owner)).isEqualTo(700);
    }

    @Test
    void reportsConflictsAndNeverResurrectsRemovedResourcesOrOverwritesServerProgress() throws Exception {
        var baseline = snapshot("baseline", 5);
        body(apply(baseline, dry(baseline), false), 200);
        for (var path : List.of("/api/v1/favorites/item?ref=retired-favorite",
                "/api/v1/vocabulary-annotations/item?ref=retained-note")) {
            var tag = send("GET", path, token, null).headers().firstValue("ETag").orElseThrow();
            assertThat(client.send(request("DELETE", path, token, null).header("If-Match", tag).build(),
                    HttpResponse.BodyHandlers.ofString()).statusCode()).isEqualTo(204);
        }
        var next = baseline.deepCopy().put("requestId", "conflicting");
        var source = progress(next);
        ((ObjectNode) source.path("data").path("dailyStudyMs")).put("2025-01-02", 800);
        ((ObjectNode) source.path("data").path("gameSessions").path("memory-old")).put("answeredCount", 4)
                .put("incorrectAttempts", 3);
        ((ObjectNode) source.path("data").path("lessons").path("retired-lesson").path("run")).put("blockId", "another-block");
        setStorage(next, PROGRESS, 5, source.toString());
        var plan = dry(next);
        for (var category : List.of("LESSON", "STUDY_DAY", "GAME", "FAVORITE", "ANNOTATION")) {
            assertThat(plan.path("counts").path(category).path("CONFLICT").longValue()).isEqualTo(1);
        }
        fail(apply(next, plan, false), 409);
        assertThat(body(apply(next, plan, true), 200).path("status").stringValue()).isEqualTo("APPLIED_WITH_SKIPS");
        assertThat(body(send("GET", "/api/v1/favorites/item?ref=retired-favorite", token, null), 200)
                .path("saved").booleanValue()).isFalse();
        assertThat(body(send("GET", "/api/v1/vocabulary-annotations/item?ref=retained-note", token, null), 200)
                .path("note").isNull()).isTrue();
        assertThat(jdbc.queryForObject("SELECT sum(active_ms) FROM mellow.combined_study_day WHERE learner_id=?",
                Long.class, owner)).isEqualTo(700);
    }

    @Test
    void rejectsStalePlansAndMakesConcurrentRequestsIdempotent() throws Exception {
        var snapshot = snapshot("race", 2);
        var plan = dry(snapshot);
        var start = client.sendAsync(request("PUT", PATH + "/race", token, applyPayload(snapshot, plan, false)).build(),
                HttpResponse.BodyHandlers.ofString());
        var repeat = client.sendAsync(request("PUT", PATH + "/race", token, applyPayload(snapshot, plan, false)).build(),
                HttpResponse.BodyHandlers.ofString());
        CompletableFuture.allOf(start, repeat).join();
        assertThat(body(start.join(), 200)).isEqualTo(body(repeat.join(), 200));
        assertThat(count("legacy_import_receipt")).isEqualTo(1);
        var stale = snapshot("stale", 2);
        var stalePlan = dry(stale);
        jdbc.update("UPDATE mellow.combined_study_day SET active_ms=999 WHERE learner_id=?", owner);
        fail(apply(stale, stalePlan, true), 409);
        var altered = snapshot.deepCopy().put("requestId", "race");
        setStorage(altered, FAVORITES, null, "[\"elsewhere\"]");
        fail(apply(altered, plan, true), 409);
        assertThat(count("legacy_import_receipt")).isEqualTo(1);
    }

    @Test
    void reportsUnsupportedAndMalformedStorageAndRejectsUnsafeInputBeforePlanning() throws Exception {
        var snapshot = snapshot("invalid", 1);
        setStorage(snapshot, PROGRESS, 99, "{\"version\":99,\"data\":{}}");
        setStorage(snapshot, ANNOTATIONS, 1, "{malformed");
        var report = dry(snapshot);
        assertThat(report.path("counts").path("STORAGE").path("INVALID").intValue()).isEqualTo(1);
        assertThat(report.path("counts").path("STORAGE").path("UNSUPPORTED").intValue()).isEqualTo(1);
        fail(apply(snapshot, report, false), 409);
        assertThat(body(apply(snapshot, report, true), 200).path("status").stringValue()).isEqualTo("APPLIED_WITH_SKIPS");
        var unknown = snapshot("unknown", 1);
        ((ObjectNode) unknown.path("storage")).remove(FAVORITE_DATES);
        setStorage(unknown, "unrelated-credentials", null, "sensitive");
        fail(send("POST", PATH + "/dry-run", token, unknown.toString()), 400);
        fail(send("POST", PATH + "/dry-run", token, "{bad"), 400);
        fail(send("POST", PATH + "/dry-run", token, snapshot.toString() + "{}"), 400);
        fail(send("POST", PATH + "/dry-run", token, " ".repeat(2 * 1024 * 1024 + 1) + "{}"), 413);
        var deep = snapshot("deep", 1);
        setStorage(deep, PROGRESS, 1, "[".repeat(45) + "0" + "]".repeat(45));
        fail(send("POST", PATH + "/dry-run", token, deep.toString()), 400);
        setStorage(deep, PROGRESS, 1, "[".repeat(80) + "0" + "]".repeat(80));
        fail(send("POST", PATH + "/dry-run", token, deep.toString()), 400);
        fail(send("POST", PATH + "/dry-run", token, snapshot.deepCopy().put("learnerId", owner.toString()).toString()), 400);
        fail(send("PUT", PATH + "/invalid", otherToken, applyPayload(snapshot, report, true)), 409);
        fail(send("GET", PATH + "/invalid", null, null), 401);
        fail(send("POST", PATH + "/dry-run", null, snapshot.toString()), 401);
        fail(send("PUT", PATH + "/invalid", null, applyPayload(snapshot, report, true)), 401);
    }

    @Test
    void leavesAmbiguousDefaultsAndCannotRepresentMalformedTimesOrOversizedAnnotations() throws Exception {
        var snapshot = snapshot("problematic", 3);
        var source = progress(snapshot);
        ((ObjectNode) source.path("data").path("reading").path("preferences"))
                .put("fontSize", "normal").put("translations", false);
        ((ObjectNode) source.path("data").path("dailyStudyMs")).put("2025-02-30", 39);
        ((ObjectNode) source.path("data").path("gameSessions").path("memory-old")).remove("endedAt");
        setStorage(snapshot, PROGRESS, 3, source.toString());
        setStorage(snapshot, ANNOTATIONS, 1, """
                {"version":1,"records":{"too-long":{"vocabularyId":"too-long","note":"%s","createdAt":1,"updatedAt":2}}}
                """.formatted("😀".repeat(601)));
        var report = dry(snapshot);
        assertThat(report.path("counts").path("PREFERENCES").path("UNSUPPORTED").intValue()).isEqualTo(1);
        assertThat(report.path("counts").path("GAME").path("INVALID").intValue()).isEqualTo(1);
        assertThat(report.path("counts").path("STUDY_DAY").path("INVALID").intValue()).isEqualTo(1);
        assertThat(report.path("counts").path("ANNOTATION").path("INVALID").intValue()).isEqualTo(1);
        body(apply(snapshot, report, true), 200);
        assertThat(count("learner_preferences")).isZero();
        assertThat(count("vocabulary_annotation")).isZero();
    }

    @Test
    void rollsBackAllDomainWritesIfTheFinalReceiptCannotBeStored() throws Exception {
        var snapshot = snapshot("rollback", 5);
        var report = dry(snapshot);
        jdbc.execute("ALTER TABLE mellow.legacy_import_receipt ADD CONSTRAINT test_legacy_rollback CHECK (request_ref <> 'rollback')");
        try {
            fail(apply(snapshot, report, false), 500);
            assertNoWrites();
            fail(send("GET", PATH + "/rollback", token, null), 404);
        } finally {
            jdbc.execute("ALTER TABLE mellow.legacy_import_receipt DROP CONSTRAINT test_legacy_rollback");
        }
        body(apply(snapshot, report, false), 200);
    }

    @Test
    void fixedLengthFlashcardsImportAndMalformedSessionScalarsAreReportedPerRecord() throws Exception {
        var snapshot = snapshot("typed-scalars", 5);
        var raw = progress(snapshot);
        var data = raw.withObject("/data");
        var valid = data.withObject("/flashcardSessions/flash-old");
        valid.withObject("/configuration").put("length", 5);
        for (int i = 1; i < 5; i++) {
            valid.withArray("/observations").addObject().put("vocabularyId", "detached-word-" + i)
                    .put("direction", "en-pt").put("rating", "easy");
        }
        var wrongFilter = valid.deepCopy().put("sessionId", "bad-filter");
        wrongFilter.withObject("/configuration/filters").put("type", 4);
        data.withObject("/flashcardSessions").set("bad-filter", wrongFilter);
        data.withObject("/gameSessions/word-old").remove("outcome");
        setStorage(snapshot, PROGRESS, 5, raw.toString());

        var plan = dry(snapshot);
        assertThat(plan.path("counts").path("FLASHCARD").path("ELIGIBLE").longValue()).isEqualTo(1);
        assertThat(plan.path("counts").path("FLASHCARD").path("INVALID").longValue()).isEqualTo(1);
        assertThat(plan.path("counts").path("GAME").path("INVALID").longValue()).isEqualTo(1);
        var result = body(apply(snapshot, plan, true), 200);
        assertThat(result.path("status").stringValue()).isEqualTo("APPLIED_WITH_SKIPS");
        assertThat(jdbc.queryForObject("SELECT requested_length FROM mellow.flashcard_session WHERE learner_id=?",
                Integer.class, owner)).isEqualTo(5);
    }

    private ObjectNode snapshot(String ref, int version) {
        var snapshot = json.createObjectNode().put("requestId", ref).put("formatVersion", 1);
        snapshot.putObject("storage");
        var attempt = """
                {"answer":{"kind":"multiple-choice","optionId":"old-answer"},"status":"reviewed","reviewedAt":1735819200300,
                 "submissions":[{"answer":{"kind":"multiple-choice","optionId":"old-answer"},"correct":false,
                 "submittedAt":1735819200200,"mode":"text-alternative"}]}
                """;
        var data = (ObjectNode) json.readTree("""
                {"lessons":{"retired-lesson":{
                    "run":{"id":"run-z","blockId":"retired-block","startedAt":1735819260000,"activeMs":100,
                      "visitedBlockIds":["retired-block"],"activities":{}},
                    "completion":{"completedAt":1735819200500,"run":{
                      "id":"run-a","blockId":"archived-block","startedAt":1735819200000,"finishedAt":1735819200500,
                      "activeMs":100,"visitedBlockIds":["archived-block"],"activities":{"archived-block":{
                         "activityId":"retired-exercise","finished":true,"textActivityIds":["retired-exercise"],
                         "heardActivityIds":[],"attempts":{"retired-exercise":%s}}}}}}},
                  "dailyStudyMs":{"2025-01-02":700}}
                """.formatted(attempt));
        if (version >= 2) {
            var reading = data.putObject("reading");
            reading.putObject("preferences").put("fontSize", "large").put("translations", true);
            var story = reading.putObject("stories").putObject("retired-story").put("activeMs", 411);
            story.putArray("readChapterIds").add("chapter-old").add("unknown-date");
            var first = (ObjectNode) json.readTree("""
                    {"id":"same-reading-run","startedAt":1735819200000,"activeMs":122,"chapterId":"chapter-old",
                     "chapters":{"chapter-old":{"paragraphId":"paragraph-first","readAt":1735819200500,
                      "practice":{"index":0,"finished":true,"attempts":{"retired-exercise":%s}}}}}
                    """.formatted(attempt));
            var current = first.deepCopy().put("activeMs", 321);
            ((ObjectNode) current.path("chapters").path("chapter-old")).put("paragraphId", "paragraph-later");
            story.set("run", current);
            story.putObject("completion").put("completedAt", 1735819200500L).set("run", first);
        }
        if (version >= 3) {
            var games = data.putObject("gameSessions");
            var common = (ObjectNode) json.readTree("""
                    {"level":"A1","difficulty":"easy","startedAt":1735819200000,"endedAt":1735819201000,
                     "activeMs":100,"dailyPracticeMs":{"2025-01-02":100},"outcome":"completed",
                     "answeredCount":2,"correctCount":1}
                    """);
            var word = common.deepCopy().put("sessionId", "word-old").put("gameId", "word-match")
                    .put("source", "lessons").put("roundsCompleted", 1).put("firstAttemptCorrect", 0);
            word.putArray("vocabularyIds").add("removed/word");
            word.putArray("reviewIds").add("removed/word");
            games.set("word-old", word);
            var memory = common.deepCopy().put("sessionId", "memory-old").put("gameId", "memory-game")
                    .put("source", "stories").put("totalPairs", 1).put("incorrectAttempts", 1);
            memory.putArray("vocabularyIds").add("removed/word");
            games.set("memory-old", memory);
            var sentence = common.deepCopy().put("sessionId", "sentence-old").put("gameId", "sentence-builder")
                    .put("topic", "to-be").put("firstAttemptCorrect", 1);
            sentence.putArray("challenges").addObject().put("id", "retired-challenge").put("reviewed", false)
                    .putArray("incorrectAnswers").add("An old response.");
            games.set("sentence-old", sentence);
        }
        if (version >= 4) data.set("simulationSessions", json.readTree("""
                {"sim-old":{"sessionId":"sim-old","situationId":"retired-place","scenarioId":"retired-scenario",
                 "startedAt":1735819200000,"completedAt":1735819201000,"decisionsCompleted":1,"reviewedCorrections":1,
                 "attempts":[{"nodeId":"old-node","choiceId":"old-reply","fit":"context"}],
                 "activeMs":200,"dailyPracticeMs":{"2025-01-02":200}}}
                """));
        if (version >= 5) data.set("flashcardSessions", json.readTree("""
                {"flash-old":{"sessionId":"flash-old","startedAt":1735819200000,"completedAt":1735819201000,
                 "activeMs":100,"dailyPracticeMs":{"2025-01-02":100},
                 "configuration":{"scope":"saved","direction":"mixed","length":"all","filters":{"source":"","type":"","level":""},"usedSearch":false},
                 "observations":[{"vocabularyId":"removed-word","direction":"pt-en","rating":"effort"}]}}
                """));
        setStorage(snapshot, PROGRESS, version, json.createObjectNode().put("version", version).set("data", data).toString());
        setStorage(snapshot, FAVORITES, null, "[\"retired-favorite\", \"historical-timestamp\", \"retired-favorite\"]");
        setStorage(snapshot, FAVORITE_DATES, null, "{\"historical-timestamp\":1735819200000}");
        setStorage(snapshot, ANNOTATIONS, 1, """
                {"version":1,"records":{"retained-note":{"vocabularyId":"retained-note","note":"%s","personalExample":"😀 Example",
                 "familiarity":"reviewing","createdAt":1735819200000,"updatedAt":1735819200000}}}
                """.formatted(PRIVATE));
        return snapshot;
    }

    private ObjectNode progress(ObjectNode snapshot) {
        return (ObjectNode) json.readTree(snapshot.path("storage").path(PROGRESS).path("raw").stringValue());
    }

    private void setStorage(ObjectNode snapshot, String key, Integer version, String raw) {
        var entry = ((ObjectNode) snapshot.path("storage")).putObject(key).put("raw", raw);
        if (version != null) entry.put("schemaVersion", version);
    }

    private JsonNode dry(ObjectNode value) throws Exception {
        return body(send("POST", PATH + "/dry-run", token, value.toString()), 200);
    }

    private HttpResponse<String> apply(ObjectNode snapshot, JsonNode report, boolean skip) throws Exception {
        return send("PUT", PATH + "/" + snapshot.path("requestId").stringValue(), token, applyPayload(snapshot, report, skip));
    }

    private String applyPayload(ObjectNode snapshot, JsonNode report, boolean skip) {
        return json.createObjectNode().put("planToken", report.path("planToken").stringValue())
                .put("acceptSkipped", skip).set("snapshot", snapshot).toString();
    }

    private UUID learner() {
        return jdbc.queryForObject("INSERT INTO mellow.learner DEFAULT VALUES RETURNING id", UUID.class);
    }

    private String identity(UUID learner) {
        var token = UUID.randomUUID().toString();
        sessions.register(token, learner);
        return token;
    }

    private void assertNoWrites() {
        for (var table : List.of("lesson_run", "story_progress", "combined_study_day", "game_session", "simulation_session",
                "flashcard_session", "vocabulary_favorite", "vocabulary_annotation", "learner_preferences", "legacy_import_receipt")) {
            assertThat(count(table)).as(table).isZero();
        }
    }

    private long count(String table) {
        return jdbc.queryForObject("SELECT count(*) FROM mellow." + table + " WHERE learner_id=?", Long.class, owner);
    }

    private HttpResponse<String> send(String method, String path, String token, String body) throws Exception {
        return client.send(request(method, path, token, body).build(), HttpResponse.BodyHandlers.ofString());
    }

    private HttpRequest.Builder request(String method, String path, String token, String body) {
        var request = HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + path)).timeout(Duration.ofSeconds(15))
                .header("X-Learner-Id", owner.toString());
        sessions.authorize(request, port, token);
        if (body != null) request.header("Content-Type", "application/json");
        return request.method(method, body == null ? HttpRequest.BodyPublishers.noBody()
                : HttpRequest.BodyPublishers.ofString(body));
    }

    private JsonNode body(HttpResponse<String> response, int status) {
        assertThat(response.statusCode()).withFailMessage(response.body()).isEqualTo(status);
        return json.readTree(response.body());
    }

    private void fail(HttpResponse<String> response, int status) {
        var problem = body(response, status);
        assertThat(problem.path("status").intValue()).isEqualTo(status);
        assertThat(problem.has("trace")).isFalse();
        assertThat(problem.has("exception")).isFalse();
    }
}
