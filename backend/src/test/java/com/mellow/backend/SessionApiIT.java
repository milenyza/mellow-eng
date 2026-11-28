package com.mellow.backend;

import com.mellow.backend.progress.api.TrustedLearnerResolver;
import com.mellow.backend.study.application.SessionCatalog;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Bean;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.util.ReflectionTestUtils;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        classes = {MellowApplication.class, SessionApiIT.TestIdentities.class})
class SessionApiIT {

    private static final String GAMES = "/api/v1/game-sessions";
    private static final String SIMULATIONS = "/api/v1/simulation-sessions";
    private static final String FLASHCARDS = "/api/v1/flashcard-sessions";
    private static final String LESSON = "english-for-pt-br/en-a1-introductions-hello/";
    private static final List<String> BOARD = List.of(LESSON + "greetings/good-morning",
            LESSON + "greetings/good-afternoon", LESSON + "greetings/goodbye", LESSON + "names/my-name-is");
    private static final Map<String, UUID> IDENTITIES = new ConcurrentHashMap<>();

    @Container
    static final PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:17.12-bookworm");

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @TestConfiguration
    static class TestIdentities {
        @Bean
        TrustedLearnerResolver fixtureSessionIdentityResolver() {
            return request -> Optional.ofNullable(request.getHeader("X-Integration-Test-Identity")).map(IDENTITIES::get);
        }
    }

    @LocalServerPort private int port;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private JsonMapper json;
    @Autowired private SessionCatalog catalog;

    private HttpClient client;
    private UUID learner;
    private UUID other;
    private String token;
    private String otherToken;

    @BeforeEach
    void fixtures() {
        client = HttpClient.newHttpClient();
        learner = jdbc.queryForObject("INSERT INTO mellow.learner DEFAULT VALUES RETURNING id", UUID.class);
        other = jdbc.queryForObject("INSERT INTO mellow.learner DEFAULT VALUES RETURNING id", UUID.class);
        token = UUID.randomUUID().toString();
        otherToken = UUID.randomUUID().toString();
        IDENTITIES.put(token, learner);
        IDENTITIES.put(otherToken, other);
    }

    @AfterEach
    void closeClient() {
        client.close();
        IDENTITIES.clear();
    }

    @Test
    void deniesAnonymousAccessAndScopesHistoryDetailsAndWritesToTrustedLearner() throws Exception {
        for (String route : List.of(GAMES, SIMULATIONS, FLASHCARDS)) {
            var denied = send("GET", route + "?learnerId=" + learner, null, null);
            assertThat(denied.headers().firstValue("Cache-Control")).contains("no-store");
            failure(denied, 401);
            failure(send("GET", route + "/private", null, null), 401);
            failure(send("PUT", route + "/private", null, "{}"), 401);
        }
        failure(send("GET", "/api/v1/game%2Dsessions/private", null, null), 401);
        failure(send("GET", GAMES + ";key=value/private", null, null), 401);
        var word = wordMatch();
        failure(put(GAMES + "/spoof", word.deepCopy().put("learnerId", other.toString())), 400);
        accept(send("PUT", GAMES + "/private?learnerId=" + other, token, word.toString()), 201);
        failure(send("GET", GAMES + "/private?learnerId=" + learner, otherToken, null), 404);
        assertThat(accept(send("GET", GAMES, otherToken, null), 200).path("items")).isEmpty();
        accept(send("PUT", GAMES + "/private", otherToken, word.toString()), 201);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM mellow.game_session WHERE session_ref = 'private'", Long.class))
                .isEqualTo(2);
    }

    @Test
    void persistsWordMatchMatchesAndDerivesFirstAttemptAndReviewMetrics() throws Exception {
        var word = wordMatch();
        String path = GAMES + "/word";
        var response = put(path, word);
        var payload = accept(response, 201);
        assertThat(response.headers().firstValue("Location")).contains(path);
        assertThat(payload.path("answeredCount").intValue()).isEqualTo(13);
        assertThat(payload.path("correctCount").intValue()).isEqualTo(12);
        assertThat(payload.path("firstAttemptCorrect").intValue()).isEqualTo(10);
        assertThat(payload.path("vocabulary").get(1).path("reviewPosition").intValue()).isEqualTo(1);
        assertThat(payload.path("evidence").path("rounds")).hasSize(3);
        assertThat(accept(send("GET", path, token, null), 200)).isEqualTo(payload);

        var canonicalRetry = json.createObjectNode();
        canonicalRetry.set("result", word.path("result"));
        canonicalRetry.set("difficulty", word.path("difficulty"));
        canonicalRetry.set("level", word.path("level"));
        canonicalRetry.set("timing", timing("2025-01-02T14:00:00.000Z", "2025-01-02T14:01:00Z"));
        canonicalRetry.set("catalogRevision", word.path("catalogRevision"));
        assertThat(accept(put(path, canonicalRetry), 200)).isEqualTo(payload);

        var invalid = word.deepCopy();
        ((ObjectNode) invalid.path("result").path("rounds").get(0)).withArray("attempts").remove(4);
        failure(put(GAMES + "/incomplete-round", invalid), 400);
        failure(put(GAMES + "/client-total", word.deepCopy().put("correctCount", 12)), 400);
        failure(put(path, memory()), 409);
    }

    @Test
    void validatesSentenceAnswersThroughSharedEvaluatorAndPersistsReviewedCorrections() throws Exception {
        var body = base().put("level", "A1").put("difficulty", "EASY");
        var challenges = body.putObject("result").put("kind", "SENTENCE_BUILDER").put("topic", "INTRODUCTIONS")
                .putArray("challenges");
        try (var resource = new ClassPathResource("catalog/sessions-v1.json").getInputStream()) {
            var definitions = json.readTree(resource).path("sentences");
            for (var ref : List.of("name-ana", "name-leo", "meet-you", "morning-clara", "clara-intro")) {
                var challenge = challenges.addObject().put("challengeRef", ref).put("reviewed", ref.equals("name-leo"))
                        .put("hintUsed", false).putArray("responses");
                var order = definitions.path(ref).path("orders").get(0);
                if (ref.equals("name-ana") || ref.equals("name-leo")) {
                    var attempted = order.values().stream().map(JsonNode::stringValue)
                            .collect(java.util.stream.Collectors.toCollection(java.util.ArrayList::new));
                    Collections.reverse(attempted);
                    challenge.add(json.valueToTree(attempted));
                }
                if (!ref.equals("name-leo")) challenge.add(order);
            }
        }
        var view = accept(put(GAMES + "/sentence", body), 201);
        assertThat(view.path("correctCount").intValue()).isEqualTo(4);
        assertThat(view.path("answeredCount").intValue()).isEqualTo(6);
        assertThat(view.path("firstAttemptCorrect").intValue()).isEqualTo(3);
        assertThat(view.path("challenges").get(1).path("reviewed").booleanValue()).isTrue();
        assertThat(view.path("challenges").get(1).path("incorrectAnswers")).hasSize(1);
        assertThat(view.path("evidence").path("contentReferences").get(0).path("lessonId").stringValue())
                .isEqualTo("en-a1-introductions-hello");
        assertThat(view.toString()).doesNotContain("correctOrder", "\"orders\"", "\"tiles\"");
        var invalid = body.deepCopy();
        ((ObjectNode) invalid.path("result").path("challenges").get(1)).put("reviewed", false);
        failure(put(GAMES + "/false-independent", invalid), 400);
        ((ObjectNode) challenges.get(0)).put("hintUsed", true);
        failure(put(GAMES + "/nonexistent-hint", body), 400);
    }

    @Test
    void derivesMemoryMatchesWithoutApplyingLanguageAccuracySemantics() throws Exception {
        var memory = memory();
        var result = accept(put(GAMES + "/memory", memory), 201);
        assertThat(result.path("totalPairs").intValue()).isEqualTo(4);
        assertThat(result.path("incorrectAttempts").intValue()).isEqualTo(1);
        assertThat(result.path("answeredCount").intValue()).isEqualTo(5);
        assertThat(result.path("firstAttemptCorrect").isNull()).isTrue();
        assertThat(result.path("vocabulary")).hasSize(4);
        var attempts = (ArrayNode) memory.path("result").path("attempts");
        attempts.add(attempts.get(0));
        failure(put(GAMES + "/matched-card-again", memory), 400);
    }

    @Test
    void acceptsBothConversationBranchesAndRejectsImpossibleOrIncompletePaths() throws Exception {
        String path = SIMULATIONS + "/passport";
        var primary = simulation(false);
        var alternate = simulation(true);
        var stored = accept(put(path, primary), 201);
        var alternateStored = accept(put(SIMULATIONS + "/flight", alternate), 201);
        assertThat(stored.path("decisionsCompleted").intValue()).isEqualTo(4);
        assertThat(stored.path("reviewedCorrections").intValue()).isEqualTo(1);
        assertThat(stored.path("attempts").get(0).path("fit").stringValue()).isEqualTo("CONTEXT");
        assertThat(stored.path("attempts").get(1).path("fit").stringValue()).isEqualTo("LANGUAGE");
        assertThat(stored.path("evidence").path("firstAttemptAppropriate").intValue()).isEqualTo(2);
        assertThat(alternateStored.path("evidence").path("decisions").get(1).path("nodeRef").stringValue())
                .isEqualTo("show-passport");
        assertThat(accept(send("GET", path, token, null), 200)).isEqualTo(stored);
        failure(send("GET", path, otherToken, null), 404);
        failure(put(SIMULATIONS + "/wrong-parent", primary.deepCopy().put("situationRef", "at-the-hotel")), 400);
        failure(put(SIMULATIONS + "/wrong-terminal", primary.deepCopy().put("terminalNodeRef", "gate")), 400);
        var invalid = primary.deepCopy();
        var decisions = (ArrayNode) invalid.get("decisions");
        decisions.set(1, alternate.get("decisions").get(1));
        failure(put(SIMULATIONS + "/wrong-transition", invalid), 400);
        ((ArrayNode) primary.get("decisions")).remove(3);
        failure(put(SIMULATIONS + "/incomplete", primary), 400);
        var filtered = accept(send("GET", SIMULATIONS + "?situation=at-the-airport&scenario=flight-check-in", token, null), 200);
        assertThat(filtered.path("items")).hasSize(2);
        assertThat(accept(send("GET", SIMULATIONS + "?situation=at-the-hotel", token, null), 200).path("items")).isEmpty();
    }

    @Test
    void validatesAndPersistsSubjectiveMixedRecallsAndKeepsHistoryAfterUnfavoriting() throws Exception {
        var flash = flashcards();
        String path = FLASHCARDS + "/mixed";
        failure(put(path, flash), 400);
        for (var ref : BOARD.subList(0, 2)) saveFavorite(other, ref);
        failure(put(path, flash), 400);
        for (var ref : BOARD.subList(0, 2)) saveFavorite(learner, ref);
        var stored = accept(put(path, flash), 201);
        assertThat(stored.path("configuration").path("direction").stringValue()).isEqualTo("MIXED");
        assertThat(stored.path("recalls").get(1).path("rating").stringValue()).isEqualTo("EFFORT");
        failure(send("GET", path, otherToken, null), 404);
        var malformed = flash.deepCopy();
        ((ObjectNode) malformed.path("recalls").get(0)).put("rating", "MASTERED");
        failure(put(FLASHCARDS + "/invalid-rating", malformed), 400);
        ((ObjectNode) malformed.path("recalls").get(0)).put("rating", 0);
        failure(put(FLASHCARDS + "/numeric-rating", malformed), 400);
        ((ObjectNode) malformed.path("recalls").get(0)).put("rating", "FORGOT").put("vocabularyRef", BOARD.get(1));
        failure(put(FLASHCARDS + "/duplicate-vocab", malformed), 400);
        ((ObjectNode) malformed.path("recalls").get(0)).put("vocabularyRef", BOARD.getFirst());
        ((ObjectNode) malformed.path("configuration")).put("direction", "EN_PT");
        failure(put(FLASHCARDS + "/wrong-direction", malformed), 400);
        assertThat(accept(send("GET", FLASHCARDS + "?direction=MIXED", token, null), 200).path("items")).hasSize(1);
        assertThat(accept(send("GET", FLASHCARDS + "?direction=EN_PT", token, null), 200).path("items")).isEmpty();
        jdbc.update("DELETE FROM mellow.vocabulary_favorite WHERE learner_id = ?", learner);
        assertThat(accept(put(path, flash), 200)).isEqualTo(stored);
        assertThat(accept(send("GET", path, token, null), 200)).isEqualTo(stored);
    }

    @Test
    void retrievesLegacyRowsWithoutRevalidatingTheirRetiredVocabulary() throws Exception {
        var id = jdbc.queryForObject("""
                INSERT INTO mellow.flashcard_session
                    (learner_id, session_ref, started_at, completed_at, active_ms, direction, review_scope, used_search)
                VALUES (?, 'history-before-v3', TIMESTAMPTZ '2025-01-02 14:00:00Z', TIMESTAMPTZ '2025-01-02 14:01:00Z',
                        1000, 'EN_PT', 'HISTORY', FALSE)
                RETURNING id
                """, UUID.class, learner);
        jdbc.update("""
                INSERT INTO mellow.flashcard_recall (flashcard_session_id, position, vocabulary_ref, direction, rating)
                VALUES (?, 0, 'no-longer-in-the-catalog', 'EN_PT', 'EASY')
                """, id);
        String path = FLASHCARDS + "/history-before-v3";
        var body = accept(send("GET", path, token, null), 200);
        assertThat(body.path("session").path("catalogRevision").isNull()).isTrue();
        assertThat(body.path("recalls").get(0).path("vocabularyRef").stringValue()).isEqualTo("no-longer-in-the-catalog");
        failure(put(path, flashcards()), 409);
    }

    @Test
    void acceptsOldIdenticalRetryButRejectsNewSubmissionsAgainstRetiredRevision() throws Exception {
        var body = wordMatch();
        String prior = catalog.revision();
        String path = GAMES + "/revision";
        var retained = accept(put(path, body), 201);
        try {
            ReflectionTestUtils.setField(catalog, "revision", "f".repeat(64));
            var list = send("GET", GAMES, token, null);
            assertThat(list.headers().firstValue("Mellow-Catalog-Revision")).contains("f".repeat(64));
            assertThat(accept(put(path, body), 200)).isEqualTo(retained);
            failure(put(GAMES + "/retired-draft", body), 409);
            var current = body.deepCopy().put("catalogRevision", catalog.revision());
            failure(put(path, current), 409);
            accept(put(GAMES + "/new-revision", current), 201);
        } finally {
            ReflectionTestUtils.setField(catalog, "revision", prior);
        }
    }

    @Test
    void serializesSimultaneousRetriesConflictsAndIndependentSessions() throws Exception {
        var word = wordMatch();
        var memory = memory();
        assertThat(race(GAMES + "/same", word, GAMES + "/same", word)).containsExactlyInAnyOrder(201, 200);
        assertThat(race(GAMES + "/conflict", word, GAMES + "/conflict", memory)).containsExactlyInAnyOrder(201, 409);
        assertThat(race(GAMES + "/independent-a", word, GAMES + "/independent-b", memory))
                .containsExactlyInAnyOrder(201, 201);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM mellow.game_session WHERE learner_id = ?", Long.class, learner))
                .isEqualTo(4);
        assertThat(jdbc.queryForObject("""
                SELECT count(*) FROM mellow.game_vocabulary v JOIN mellow.game_session s ON s.id = v.game_session_id
                WHERE s.learner_id = ? AND s.session_ref = 'same'
                """, Long.class, learner)).isEqualTo(4);
        assertThat(jdbc.queryForObject("""
                SELECT sum(d.active_ms) FROM mellow.game_study_day d JOIN mellow.game_session s ON s.id = d.session_id
                WHERE s.learner_id = ?
                """, Long.class, learner)).isEqualTo(4_000);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM mellow.combined_study_day WHERE learner_id = ?", Long.class, learner))
                .isZero();
    }

    @Test
    void rollsBackParentAndDependentRowsWhenPostgresRejectsChild() throws Exception {
        for (var ref : BOARD.subList(0, 2)) saveFavorite(learner, ref);
        jdbc.execute("ALTER TABLE mellow.flashcard_recall ADD CONSTRAINT test_recall_failure CHECK (rating <> 'EFFORT') NOT VALID");
        try {
            failure(put(FLASHCARDS + "/rollback", flashcards()), 500);
            assertThat(jdbc.queryForObject("SELECT count(*) FROM mellow.flashcard_session WHERE learner_id = ?", Long.class, learner))
                    .isZero();
            failure(send("GET", FLASHCARDS + "/rollback", token, null), 404);
        } finally {
            jdbc.execute("ALTER TABLE mellow.flashcard_recall DROP CONSTRAINT test_recall_failure");
        }
        accept(put(FLASHCARDS + "/rollback", flashcards()), 201);
    }

    @Test
    void paginatesFilteredHistoryUsingInclusiveUtcDatesAndStableDatabaseTieBreaks() throws Exception {
        accept(put(GAMES + "/alpha", wordMatch()), 201);
        accept(put(GAMES + "/beta", wordMatch()), 201);
        var recent = memory();
        recent.set("timing", timing("2025-01-04T14:00:00Z", "2025-01-04T14:01:00Z"));
        accept(put(GAMES + "/recent", recent), 201);
        var expectedTies = jdbc.queryForList("""
                SELECT session_ref FROM mellow.game_session WHERE learner_id = ? AND game_kind = 'WORD_MATCH'
                ORDER BY completed_at DESC, id ASC
                """, String.class, learner);
        String query = GAMES + "?kind=WORD_MATCH&difficulty=EASY&from=2025-01-02&through=2025-01-02&size=1";
        var first = accept(send("GET", query, token, null), 200);
        var second = accept(send("GET", query + "&page=1", token, null), 200);
        assertThat(first.path("hasNext").booleanValue()).isTrue();
        assertThat(second.path("hasNext").booleanValue()).isFalse();
        assertThat(List.of(first.path("items").get(0).path("sessionRef").stringValue(),
                second.path("items").get(0).path("sessionRef").stringValue())).isEqualTo(expectedTies);
        assertThat(first.toString()).doesNotContain("attempts", "evidence", "requestDigest", learner.toString());
        var descending = accept(send("GET", GAMES, token, null), 200);
        assertThat(descending.path("items").get(0).path("sessionRef").stringValue()).isEqualTo("recent");
        for (String invalid : List.of("?kind=other", "?size=101", "?page=-1", "?page=1001",
                "?from=2025-01-04&through=2025-01-02", "?from=2025-02-31", "?from=2025-01-02%2B02:00")) {
            failure(send("GET", GAMES + invalid, token, null), 400);
        }
    }

    @Test
    void rejectsInvalidTimesDurationsReferencesAndOversizedBodies() throws Exception {
        var bad = wordMatch();
        var timing = (ObjectNode) bad.get("timing");
        timing.put("completedAt", "2025-01-01T11:00:00Z");
        failure(put(GAMES + "/backdated", bad), 400);
        timing.put("completedAt", "2025-01-02T14:01:00.0001Z");
        failure(put(GAMES + "/submillisecond", bad), 400);
        timing.put("completedAt", "2099-01-02T14:01:00Z");
        failure(put(GAMES + "/future", bad), 400);
        timing.put("completedAt", "2025-01-02T14:01:00Z").put("activeMs", -1);
        failure(put(GAMES + "/negative", bad), 400);
        timing.put("activeMs", 1001);
        failure(put(GAMES + "/inconsistent", bad), 400);
        timing.put("activeMs", 1000).withObject("/studyDays").put("2025-06-01", 0);
        failure(put(GAMES + "/outside", bad), 400);
        failure(put(GAMES + "/" + "x".repeat(161), wordMatch()), 400);
        failure(send("PUT", GAMES + "/oversized", token, " ".repeat(256 * 1024 + 1) + "{}"), 413);
        failure(send("PUT", GAMES + "/two-values", token, wordMatch() + "{}"), 400);
    }

    @Test
    void historyUsesUtcMidnightsRatherThanLocalStudyDayKeys() throws Exception {
        var before = memory();
        before.set("timing", timing("2025-01-02T23:59:50Z", "2025-01-02T23:59:59.999Z"));
        var at = memory();
        at.set("timing", timing("2025-01-02T23:59:50Z", "2025-01-03T00:00:00Z"));
        ((ObjectNode) at.path("timing").path("studyDays")).removeAll().put("2025-01-02", 1000);
        accept(put(GAMES + "/before-utc-midnight", before), 201);
        accept(put(GAMES + "/at-utc-midnight", at), 201);
        var january2 = accept(send("GET", GAMES + "?from=2025-01-02&through=2025-01-02", token, null), 200);
        var january3 = accept(send("GET", GAMES + "?from=2025-01-03&through=2025-01-03", token, null), 200);
        assertThat(january2.path("items")).hasSize(1);
        assertThat(january3.path("items")).hasSize(1);
        assertThat(january2.path("items").get(0).path("sessionRef").stringValue()).isEqualTo("before-utc-midnight");
        assertThat(january3.path("items").get(0).path("sessionRef").stringValue()).isEqualTo("at-utc-midnight");
    }

    private ObjectNode base() {
        var base = json.createObjectNode().put("catalogRevision", catalog.revision());
        base.set("timing", timing("2025-01-02T14:00:00Z", "2025-01-02T14:01:00Z"));
        return base;
    }

    private ObjectNode timing(String start, String end) {
        var timing = json.createObjectNode().put("startedAt", start).put("completedAt", end).put("activeMs", 1000);
        timing.putObject("studyDays").put(end.substring(0, 10), 1000);
        return timing;
    }

    private ObjectNode wordMatch() {
        var request = base().put("level", "A1").put("difficulty", "EASY");
        var rounds = request.putObject("result").put("kind", "WORD_MATCH").put("source", "LESSONS").putArray("rounds");
        for (int index = 0; index < 3; index++) {
            var round = rounds.addObject();
            round.set("vocabularyRefs", json.valueToTree(BOARD));
            var attempts = round.putArray("attempts");
            if (index == 0) attempts.addObject().put("englishRef", BOARD.getFirst()).put("portugueseRef", BOARD.get(1));
            for (var ref : BOARD) attempts.addObject().put("englishRef", ref).put("portugueseRef", ref);
        }
        return request;
    }

    private ObjectNode memory() {
        var request = base().put("level", "A1").put("difficulty", "EASY");
        var result = request.putObject("result").put("kind", "MEMORY_GAME").put("source", "LESSONS");
        result.set("vocabularyRefs", json.valueToTree(BOARD));
        var attempts = result.putArray("attempts");
        var mismatch = attempts.addObject();
        mismatch.putObject("first").put("vocabularyRef", BOARD.getFirst()).put("language", "EN");
        mismatch.putObject("second").put("vocabularyRef", BOARD.get(1)).put("language", "EN");
        for (String ref : BOARD) {
            var attempt = attempts.addObject();
            attempt.putObject("first").put("vocabularyRef", ref).put("language", "PT_BR");
            attempt.putObject("second").put("vocabularyRef", ref).put("language", "EN");
        }
        return request;
    }

    private ObjectNode simulation(boolean alternate) {
        var request = base().put("situationRef", "at-the-airport").put("scenarioRef", "flight-check-in")
                .put("terminalNodeRef", "done");
        var steps = request.putArray("decisions");
        if (alternate) {
            decision(steps, "documents", "documents-flight", false, false, "documents-flight");
            decision(steps, "show-passport", "show-passport-show", false, false, "show-passport-show");
        } else {
            decision(steps, "documents", "documents-passport", true, true, "documents-hotel");
            decision(steps, "flight-number", "flight-number-number", false, false,
                    "flight-number-omit-verb", "flight-number-number");
        }
        decision(steps, "luggage", "luggage-check", false, false, "luggage-check");
        decision(steps, "gate", "gate-confirm", false, false, "gate-confirm");
        return request;
    }

    private void decision(ArrayNode steps, String node, String choice, boolean reviewed, boolean hint, String... attempts) {
        steps.addObject().put("nodeRef", node).put("choiceRef", choice).put("reviewed", reviewed).put("hintUsed", hint)
                .set("attemptedChoiceRefs", json.valueToTree(attempts));
    }

    private ObjectNode flashcards() {
        var request = base();
        request.putObject("configuration").put("direction", "MIXED").put("scope", "SAVED").put("usedSearch", false);
        var recalls = request.putArray("recalls");
        recalls.addObject().put("vocabularyRef", BOARD.getFirst()).put("direction", "EN_PT").put("rating", "FORGOT");
        recalls.addObject().put("vocabularyRef", BOARD.get(1)).put("direction", "PT_EN").put("rating", "EFFORT");
        return request;
    }

    private void saveFavorite(UUID owner, String ref) {
        jdbc.update("INSERT INTO mellow.vocabulary_favorite (learner_id, vocabulary_ref, saved_on) VALUES (?, ?, DATE '2025-01-01')",
                owner, ref);
    }

    private HttpResponse<String> put(String path, ObjectNode body) throws Exception {
        return send("PUT", path, token, body.toString());
    }

    private List<Integer> race(String first, ObjectNode firstBody, String second, ObjectNode secondBody) {
        var a = client.sendAsync(request("PUT", first, token, firstBody.toString()), HttpResponse.BodyHandlers.ofString());
        var b = client.sendAsync(request("PUT", second, token, secondBody.toString()), HttpResponse.BodyHandlers.ofString());
        CompletableFuture.allOf(a, b).join();
        return List.of(a.join().statusCode(), b.join().statusCode());
    }

    private HttpResponse<String> send(String method, String path, String identity, String body) throws Exception {
        return client.send(request(method, path, identity, body), HttpResponse.BodyHandlers.ofString());
    }

    private HttpRequest request(String method, String path, String identity, String body) {
        var builder = HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + path))
                .timeout(Duration.ofSeconds(15)).header("X-Learner-Id", learner.toString());
        if (identity != null) builder.header("X-Integration-Test-Identity", identity);
        if (body != null) builder.header("Content-Type", "application/json");
        return builder.method(method, body == null ? HttpRequest.BodyPublishers.noBody()
                : HttpRequest.BodyPublishers.ofString(body)).build();
    }

    private JsonNode accept(HttpResponse<String> response, int status) {
        assertThat(response.statusCode()).withFailMessage(response.body()).isEqualTo(status);
        return json.readTree(response.body());
    }

    private void failure(HttpResponse<String> response, int status) {
        var body = accept(response, status);
        assertThat(body.path("status").intValue()).isEqualTo(status);
        assertThat(body.has("trace")).isFalse();
        assertThat(body.has("exception")).isFalse();
    }
}
