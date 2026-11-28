package com.mellow.backend;

import com.mellow.backend.progress.application.ProgressCatalog;
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

import java.io.ByteArrayInputStream;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
@ExtendWith(OutputCaptureExtension.class)
@Import(TestSecuritySessions.Configuration.class)
@SpringBootTest(properties = "logging.level.root=DEBUG", webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ProgressApiIT {

    private static final String LESSON_ID = "en-a1-introductions-hello";
    private static final String STORY_ID = "a-rainy-morning";
    private static final String LESSON = "/api/v1/lesson-progress/" + LESSON_ID;
    private static final String STORY = "/api/v1/reading-progress/" + STORY_ID;
    private static final Instant START = Instant.parse("2025-01-02T14:00:00Z");

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
    @Autowired private JsonMapper json;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private ProgressCatalog catalog;

    private String ownerToken;
    private String otherToken;
    private UUID owner;

    @BeforeEach
    void establishFixtures() {
        sessions.clear();
        ownerToken = UUID.randomUUID().toString();
        otherToken = UUID.randomUUID().toString();
        owner = jdbc.queryForObject("INSERT INTO mellow.learner DEFAULT VALUES RETURNING id", UUID.class);
        var other = jdbc.queryForObject("INSERT INTO mellow.learner DEFAULT VALUES RETURNING id", UUID.class);
        sessions.register(ownerToken, owner);
        sessions.register(otherToken, other);
    }

    @Test
    void rejectsUnauthenticatedSpoofedAndNonexistentIdentitiesBeforeExposingProgress() throws Exception {
        var path = LESSON + "?learnerId=" + owner;
        var anonymous = send("GET", path, null, null, null);
        failure(anonymous, 401);
        failure(send("PUT", STORY + "/attempts/new", null, null, json.createObjectNode()), 401);
        var fictitious = UUID.randomUUID().toString();
        sessions.register(fictitious, UUID.randomUUID());
        failure(send("GET", LESSON, fictitious, null, null), 403);
        assertThat(anonymous.headers().firstValue("Cache-Control")).contains("no-store");
    }

    @Test
    void recordsCorrectnessReviewFirstCompletionAndLegitimateReplay() throws Exception {
        var path = LESSON + "/attempts/first";
        var initial = lessonStart(100);
        failure(put(path, null, initial), 428);
        var first = put(path, "*", initial);
        success(first);
        assertThat(etag(put(path, "*", initial))).isEqualTo(etag(first));
        success(send("GET", LESSON, ownerToken, null, null));
        assertThat(body(send("GET", "/api/v1/lesson-progress", ownerToken, null, null)).size()).isEqualTo(1);
        failure(send("GET", LESSON, otherToken, null, null), 404);
        failure(send("PUT", path, otherToken, etag(first), initial), 412);

        var definition = catalog.lesson(LESSON_ID);
        var listening = definition.get("listening");
        var wrongRef = listening.listeningRefs().getFirst();
        var rule = listening.exercises().get(wrongRef);
        String wrongOption = rule.choices().stream().filter(option -> !option.equals(rule.correctOptionId())).findFirst().orElseThrow();
        var wrong = json.createObjectNode().put("kind", "multiple-choice").put("optionId", wrongOption);
        var wrongInput = exercise(wrong, "INCORRECT", "TEXT_ALTERNATIVE", false);
        var incorrect = lessonStart(200);
        incorrect.put("blockRef", "listening").putArray("visitedBlockRefs").add("introduction").add("listening");
        incorrect.withObject("/activities").set("listening",
                activity(wrongRef, false, List.of(wrongRef), Map.of(wrongRef, wrongInput)));
        var answered = put(path, etag(first), incorrect);
        success(answered);
        assertThat(body(answered).at("/attempts/0/activities/listening/exercises/" + wrongRef + "/submissions/0/correct").booleanValue()).isFalse();
        failure(put(path, etag(first), incorrect.deepCopy().put("activeMs", 201)), 412);

        var invalidComplete = incorrect.deepCopy().put("complete", true);
        failure(put(path, etag(answered), invalidComplete), 409);
        assertThat(etag(send("GET", LESSON, ownerToken, null, null))).isEqualTo(etag(answered));
        var completed = completeLesson(300, wrongRef, wrong);
        var finish = put(path, etag(answered), completed);
        success(finish);
        var result = body(finish).at("/attempts/0/activities/listening/exercises/" + wrongRef);
        assertThat(result.path("status").stringValue()).isEqualTo("REVIEWED");
        assertThat(result.path("reviewedAt").isNull()).isFalse();
        assertThat(body(finish).at("/attempts/0/firstCompletion").booleanValue()).isTrue();
        var firstTime = body(finish).at("/attempts/0/finishedAt");
        assertThat(firstTime.isNull()).isFalse();
        assertThat(etag(put(path, etag(answered), completed))).isEqualTo(etag(finish));
        failure(put(path, etag(finish), completed.deepCopy().put("activeMs", 301)), 409);

        var replayPath = LESSON + "/attempts/replay";
        var replay = put(replayPath, etag(finish), lessonStart(25));
        success(replay);
        var replayFinished = put(replayPath, etag(replay), completeLesson(50, null, null));
        success(replayFinished);
        assertThat(body(replayFinished).at("/attempts/0/finishedAt")).isEqualTo(firstTime);
        assertThat(body(replayFinished).at("/attempts/1/completed").booleanValue()).isTrue();
        assertThat(body(replayFinished).at("/attempts/1/firstCompletion").booleanValue()).isFalse();
        assertThat(body(replayFinished).at("/attempts/1/activities/listening/exercises/" + wrongRef + "/submissions/0/correct")
                .booleanValue()).isTrue();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM mellow.lesson_run WHERE learner_id = ?", Long.class, owner))
                .isEqualTo(2L);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM mellow.combined_study_day WHERE learner_id = ?", Long.class, owner))
                .isZero();
    }

    @Test
    void preservesReadingPositionsOptionalComprehensionAndDeduplicatedChapterMarks() throws Exception {
        var definition = catalog.story(STORY_ID);
        var chapterRef = "rain-at-the-window";
        var metadata = definition.get(chapterRef);
        var paragraph = metadata.paragraphs().getFirst();
        var path = STORY + "/attempts/read-1";
        var firstInput = reading(120, chapterRef);
        firstInput.withObject("/chapters").set(chapterRef, chapter(paragraph, false));
        var first = put(path, "*", firstInput);
        success(first);
        var invalid = firstInput.deepCopy();
        invalid.withObject("/chapters/" + chapterRef).put("paragraphRef", "not-in-this-chapter");
        failure(put(path, etag(first), invalid), 400);
        failure(send("GET", STORY, otherToken, null, null), 404);
        success(send("GET", STORY, ownerToken, null, null));
        assertThat(body(send("GET", "/api/v1/reading-progress", ownerToken, null, null)).size()).isEqualTo(1);

        var allRead = reading(220, chapterRef);
        definition.forEach((reference, entry) -> allRead.withObject("/chapters").set(reference, chapter(null, true)));
        var finish = put(path, etag(first), allRead);
        success(finish);
        assertThat(body(finish).path("readChapters").size()).isEqualTo(definition.size());
        assertThat(body(finish).at("/attempts/0/firstCompletion").booleanValue()).isTrue();
        assertThat(body(finish).path("lifetimeActiveMs").longValue()).isEqualTo(220);
        assertThat(etag(put(path, etag(first), allRead))).isEqualTo(etag(finish));
        var comprehension = allRead.deepCopy().put("activeMs", 250);
        String exerciseRef = metadata.exerciseOrder().getFirst();
        comprehension.withObject("/chapters/" + chapterRef).set("practice", json.createObjectNode()
                .put("index", 0).put("finished", false).set("exercises", json.createObjectNode()
                        .set(exerciseRef, exercise(solution(metadata.exercises().get(exerciseRef)), "CORRECT", "PRACTICE", false))));
        var revised = put(path, etag(finish), comprehension);
        success(revised);
        assertThat(body(revised).at("/attempts/0/completedAt")).isEqualTo(body(finish).at("/attempts/0/completedAt"));
        assertThat(body(revised).at("/attempts/0/chapters/" + chapterRef + "/practice/exercises/" + exerciseRef + "/status")
                .stringValue()).isEqualTo("CORRECT");

        var nextRun = reading(40, chapterRef);
        nextRun.withObject("/chapters").set(chapterRef, chapter(paragraph, true));
        var replay = put(STORY + "/attempts/read-2", etag(revised), nextRun);
        success(replay);
        assertThat(body(replay).path("lifetimeActiveMs").longValue()).isEqualTo(290);
        assertThat(body(replay).path("readChapters").size()).isEqualTo(definition.size());
        assertThat(body(replay).at("/attempts/1/chapters/" + chapterRef + "/paragraphRef").stringValue()).isEqualTo(paragraph);
        assertThat(body(replay).at("/attempts/1/firstCompletion").booleanValue()).isFalse();
        assertThat(etag(put(path, etag(finish), comprehension))).isEqualTo(etag(replay));
    }

    @Test
    void rejectsInvalidReferencesAndMalformedFieldsAndRetrievesRetiredSnapshots() throws Exception {
        var path = LESSON + "/attempts/validate";
        failure(put(path, "*", lessonStart(-1)), 400);
        failure(put(path, "*", lessonStart(10).put("learnerId", owner.toString())), 400);
        failure(put(path, "*", lessonStart(10).put("startedAt", 100)), 400);
        failure(put(path, "*", lessonStart(10).put("activeMs", 1.5)), 400);
        var invalid = lessonStart(10);
        invalid.withObject("/activities").set("introduction", activity("invalid", false, List.of(), Map.of()));
        failure(put(path, "*", invalid), 400);
        failure(put(STORY + "/attempts/validate", "*", reading(10, "different-story-chapter")), 400);
        jdbc.update("""
                INSERT INTO mellow.lesson_run
                    (learner_id,lesson_ref,run_ref,current_run,completed,first_completion,block_ref,finished_on)
                VALUES (?, 'retired-lesson','former',true,true,true,'unavailable',DATE '2021-01-14')
                """, owner);
        UUID story = jdbc.queryForObject("""
                INSERT INTO mellow.story_progress(learner_id,story_ref)
                VALUES (?,'retired-story') RETURNING id
                """, UUID.class, owner);
        jdbc.update("INSERT INTO mellow.story_read_chapter(story_progress_id,chapter_ref) VALUES (?, 'old')", story);
        var former = body(send("GET", "/api/v1/lesson-progress/retired-lesson", ownerToken, null, null));
        assertThat(former.at("/attempts/0/finishedOn").stringValue()).isEqualTo("2021-01-14");
        assertThat(former.at("/attempts/0/finishedAt").isNull()).isTrue();
        var formerStory = body(send("GET", "/api/v1/reading-progress/retired-story", ownerToken, null, null));
        assertThat(formerStory.at("/readChapters/0/readOn").isNull()).isTrue();
        failure(put("/api/v1/lesson-progress/retired-lesson/attempts/former", "*", lessonStart(10)), 400);
    }

    @Test
    void serializesConcurrentUpdatesAndRollsBackWhenTheDatabaseRejectsANewRun() throws Exception {
        var path = LESSON + "/attempts/race";
        var initial = put(path, "*", lessonStart(1));
        success(initial);
        try (var client = HttpClient.newHttpClient()) {
            var a = client.sendAsync(request("PUT", path, ownerToken, etag(initial), lessonStart(11)),
                    HttpResponse.BodyHandlers.ofString());
            var b = client.sendAsync(request("PUT", path, ownerToken, etag(initial), lessonStart(12)),
                    HttpResponse.BodyHandlers.ofString());
            assertThat(List.of(a.get().statusCode(), b.get().statusCode())).containsExactlyInAnyOrder(200, 412);
        }
        var after = send("GET", LESSON, ownerToken, null, null);
        assertThat(body(after).at("/attempts/0/activeMs").longValue()).isIn(11L, 12L);
        jdbc.execute("ALTER TABLE mellow.lesson_run ADD CONSTRAINT reject_rollback_fixture CHECK (run_ref <> 'rollback-fixture')");
        try {
            failure(put(LESSON + "/attempts/rollback-fixture", etag(after), lessonStart(1)), 500);
            assertThat(etag(send("GET", LESSON, ownerToken, null, null))).isEqualTo(etag(after));
            assertThat(jdbc.queryForObject("""
                    SELECT run_ref FROM mellow.lesson_run WHERE learner_id = ? AND lesson_ref = ? AND current_run
                    """, String.class, owner, LESSON_ID)).isEqualTo("race");
        } finally {
            jdbc.execute("ALTER TABLE mellow.lesson_run DROP CONSTRAINT reject_rollback_fixture");
        }
    }

    @Test
    void rejectsOversizedProgressBodiesEvenWithoutAContentLength() throws Exception {
        byte[] oversized = (" ".repeat(2 * 1024 * 1024) + "{}").getBytes(StandardCharsets.UTF_8);
        try (var client = HttpClient.newHttpClient()) {
            var lesson = rawPut(LESSON + "/attempts/large", HttpRequest.BodyPublishers.ofByteArray(oversized));
            failure(client.send(lesson, HttpResponse.BodyHandlers.ofString()), 413);
            var reading = rawPut(STORY + "/attempts/large",
                    HttpRequest.BodyPublishers.ofInputStream(() -> new ByteArrayInputStream(oversized)));
            failure(client.send(reading, HttpResponse.BodyHandlers.ofString()), 413);
        }
    }

    @Test
    void rejectsBadExerciseUnicodeBeforePersistingAndKeepsLearnerTextOutOfDebugLogs(CapturedOutput output) throws Exception {
        var block = catalog.lesson(LESSON_ID).entrySet().stream()
                .filter(entry -> entry.getValue().exercises().values().stream().anyMatch(rule -> rule.accepted() != null))
                .findFirst().orElseThrow();
        var exercise = block.getValue().exercises().entrySet().stream().filter(entry -> entry.getValue().accepted() != null)
                .findFirst().orElseThrow();
        String blank = exercise.getValue().accepted().keySet().iterator().next();
        var body = lessonStart(0);
        body.withArray("/visitedBlockRefs").add(block.getKey());
        var answer = json.createObjectNode().put("kind", "fill-in-the-blanks");
        var values = answer.putObject("values");
        var snapshot = json.createObjectNode().put("status", "EDITING");
        snapshot.set("draft", answer);
        snapshot.putArray("submissions");
        body.withObject("/activities").set(block.getKey(),
                activity(exercise.getKey(), false, List.of(), Map.of(exercise.getKey(), snapshot)));
        String path = LESSON + "/attempts/unicode";
        values.put(blank, "invalid" + (char) 0 + "text");
        failure(put(path, "*", body), 400);
        failure(send("GET", LESSON, ownerToken, null, null), 404);

        values.put(blank, "AuditPrivateAnswer581 — café 😀");
        success(put(path, "*", body));
        success(send("GET", LESSON, ownerToken, null, null));
        assertThat(output.getAll()).doesNotContain("AuditPrivateAnswer581");
    }

    @Test
    void repeatsIdenticalHistoricalProgressForReferencesMissingFromTheActiveCatalog() throws Exception {
        jdbc.update("""
                INSERT INTO mellow.lesson_run (learner_id, lesson_ref, run_ref, current_run, completed, first_completion,
                    started_at, finished_at, block_ref, visited_block_refs, active_ms)
                VALUES (?, 'retired-audit-lesson', 'saved-run', true, true, true, '2025-01-02 14:00:00Z',
                    '2025-01-02 14:01:00Z', 'introduction', ARRAY['introduction'], 15)
                """, owner);
        var story = jdbc.queryForObject("""
                INSERT INTO mellow.story_progress (learner_id, story_ref, lifetime_active_ms)
                VALUES (?, 'retired-audit-story', 25) RETURNING id
                """, UUID.class, owner);
        jdbc.update("""
                INSERT INTO mellow.reading_run (story_progress_id, run_ref, current_run, started_at, chapter_ref, active_ms)
                VALUES (?, 'saved-run', true, '2025-01-02 14:00:00Z', 'archived-chapter', 25)
                """, story);
        String lessonRoute = "/api/v1/lesson-progress/retired-audit-lesson";
        String storyRoute = "/api/v1/reading-progress/retired-audit-story";
        var savedLesson = send("GET", lessonRoute, ownerToken, null, null);
        var savedStory = send("GET", storyRoute, ownerToken, null, null);
        var exactLesson = put(lessonRoute + "/attempts/saved-run", null, lessonStart(15).put("complete", true));
        var exactStory = put(storyRoute + "/attempts/saved-run", null, reading(25, "archived-chapter"));
        success(exactLesson);
        success(exactStory);
        assertThat(body(exactLesson)).isEqualTo(body(savedLesson));
        assertThat(body(exactStory)).isEqualTo(body(savedStory));
        failure(put(storyRoute + "/attempts/saved-run", etag(savedStory), reading(26, "archived-chapter")), 400);
    }

    private HttpRequest rawPut(String path, HttpRequest.BodyPublisher body) {
        var request = HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + path))
                .timeout(Duration.ofSeconds(15)).header("If-None-Match", "*")
                .header("Content-Type", "application/json");
        sessions.authorize(request, port, ownerToken);
        return request.PUT(body).build();
    }

    private ObjectNode lessonStart(long duration) {
        var body = json.createObjectNode().put("startedAt", START.toString()).put("blockRef", "introduction")
                .put("activeMs", duration).put("complete", false);
        body.putArray("visitedBlockRefs").add("introduction");
        body.putObject("activities");
        return body;
    }

    private ObjectNode completeLesson(long duration, String reviewedReference, JsonNode wrong) {
        var request = lessonStart(duration).put("complete", true).put("blockRef", "introduction");
        var definition = catalog.lesson(LESSON_ID);
        var visited = request.withArray("/visitedBlockRefs");
        if (reviewedReference != null) visited.add("listening");
        definition.keySet().stream().filter(id -> !id.equals("introduction") && (reviewedReference == null || !id.equals("listening")))
                .forEach(visited::add);
        definition.forEach((blockRef, block) -> {
            if (block.exercises().isEmpty()) return;
            var snapshots = new LinkedHashMap<String, ObjectNode>();
            block.exercises().forEach((id, rule) -> {
                boolean review = id.equals(reviewedReference);
                snapshots.put(id, exercise(review ? wrong : solution(rule), review ? "REVIEWED" : "CORRECT",
                        review ? "TEXT_ALTERNATIVE" : block.listeningRefs().isEmpty() ? "PRACTICE" : "LISTENING", review));
            });
            request.withObject("/activities").set(blockRef, activity(block.exercises().keySet().iterator().next(),
                    true, reviewedReference != null && block.listeningRefs().contains(reviewedReference) ? List.of(reviewedReference) : List.of(), snapshots));
        });
        return request;
    }

    private ObjectNode reading(long duration, String chapter) {
        var node = json.createObjectNode().put("startedAt", START.toString()).put("activeMs", duration).put("chapterRef", chapter);
        node.putObject("chapters");
        return node;
    }

    private ObjectNode chapter(String paragraph, boolean read) {
        return json.createObjectNode().put("paragraphRef", paragraph).put("read", read).putNull("practice");
    }

    private ObjectNode activity(String reference, boolean finished, List<String> text, Map<String, ObjectNode> snapshots) {
        var activity = json.createObjectNode().put("activityRef", reference).put("finished", finished);
        var ids = activity.putArray("textActivityRefs");
        text.forEach(ids::add);
        var heard = activity.putArray("heardActivityRefs");
        snapshots.forEach((id, snapshot) -> {
            var mode = snapshot.at("/submissions/0/mode");
            if (mode.isString() && "LISTENING".equals(mode.stringValue())) heard.add(id);
        });
        var attempts = activity.putObject("exercises");
        snapshots.forEach(attempts::set);
        return activity;
    }

    private ObjectNode exercise(JsonNode answer, String status, String mode, boolean reviewed) {
        var entry = json.createObjectNode().put("status", status);
        if (reviewed) entry.put("reviewedAt", START.plusSeconds(2).toString());
        entry.set("draft", answer);
        entry.putArray("submissions").addObject().put("submittedAt", START.plusSeconds(1).toString())
                .put("mode", mode).set("answer", answer);
        return entry;
    }

    private JsonNode solution(ProgressCatalog.Rule rule) {
        var answer = json.createObjectNode().put("kind", rule.kind());
        switch (rule.kind()) {
            case "multiple-choice" -> answer.put("optionId", rule.correctOptionId());
            case "true-or-false" -> answer.put("value", rule.correctValue());
            case "fill-in-the-blanks" -> {
                var values = answer.putObject("values");
                rule.accepted().forEach((id, choices) -> values.put(id, choices.getFirst()));
            }
            case "matching-pairs" -> answer.set("pairs", json.valueToTree(rule.pairs()));
            case "sequence-ordering" -> answer.set("itemIds", json.valueToTree(rule.orders().getFirst()));
            case "sentence-builder" -> answer.set("tileIds", json.valueToTree(rule.orders().getFirst()));
            default -> throw new IllegalArgumentException(rule.kind());
        }
        return answer;
    }

    private HttpResponse<String> put(String path, String precondition, JsonNode body) throws Exception {
        return send("PUT", path, ownerToken, precondition, body);
    }

    private HttpResponse<String> send(String method, String path, String token, String precondition, JsonNode body) throws Exception {
        try (var client = HttpClient.newHttpClient()) {
            return client.send(request(method, path, token, precondition, body), HttpResponse.BodyHandlers.ofString());
        }
    }

    private HttpRequest request(String method, String path, String token, String precondition, JsonNode body) {
        var builder = HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + path))
                .timeout(Duration.ofSeconds(15)).header("X-Learner-Id", owner.toString());
        sessions.authorize(builder, port, token);
        if (precondition != null) builder.header(precondition.equals("*") ? "If-None-Match" : "If-Match", precondition);
        if (body != null) builder.header("Content-Type", "application/json");
        return builder.method(method, body == null ? HttpRequest.BodyPublishers.noBody()
                : HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body))).build();
    }

    private JsonNode body(HttpResponse<String> response) {
        return json.readTree(response.body());
    }

    private static void success(HttpResponse<String> response) {
        assertThat(response.statusCode()).withFailMessage(response.body()).isEqualTo(200);
    }

    private void failure(HttpResponse<String> response, int status) {
        assertThat(response.statusCode()).withFailMessage(response.body()).isEqualTo(status);
        assertThat(body(response).path("status").intValue()).isEqualTo(status);
        assertThat(body(response).has("trace")).isFalse();
        assertThat(body(response).has("exception")).isFalse();
    }

    private static String etag(HttpResponse<String> response) {
        return response.headers().firstValue("ETag").orElseThrow();
    }
}
