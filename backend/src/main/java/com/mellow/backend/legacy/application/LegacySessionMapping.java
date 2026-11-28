package com.mellow.backend.legacy.application;

import com.mellow.backend.flashcards.persistence.FlashcardSession;
import com.mellow.backend.games.persistence.GameSession;
import com.mellow.backend.practical.persistence.SimulationSession;
import com.mellow.backend.study.api.SessionDto;
import tools.jackson.databind.JsonNode;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;

import static com.mellow.backend.legacy.application.LegacyValues.*;

final class LegacySessionMapping {
    private LegacySessionMapping() {}

    static SessionDto.GameView game(String ref, JsonNode input) {
        var header = header(ref, input, "endedAt");
        require(textEquals(input.path("outcome"), "completed"), "EXPECTED_COMPLETED_SESSION");
        var level = enumeration(SessionDto.Level.class, input.path("level"));
        var difficulty = enumeration(GameSession.Difficulty.class, input.path("difficulty"));
        var kind = enumeration(GameSession.Kind.class, input.path("gameId"));
        long answered = number(input.path("answeredCount"));
        long correct = number(input.path("correctCount"));
        require(correct <= answered, "INCONSISTENT_GAME_TOTALS");
        var allowed = new ArrayList<>(List.of("sessionId", "gameId", "level", "difficulty", "startedAt", "endedAt",
                "activeMs", "dailyPracticeMs", "outcome", "answeredCount", "correctCount"));
        return switch (kind) {
            case WORD_MATCH -> {
                allowed.addAll(List.of("source", "roundsCompleted", "firstAttemptCorrect", "vocabularyIds", "reviewIds"));
                object(input, allowed.toArray(String[]::new));
                var source = enumeration(GameSession.Source.class, input.path("source"));
                long rounds = number(input.path("roundsCompleted"));
                long first = number(input.path("firstAttemptCorrect"));
                var refs = vocabulary(input);
                var review = unique(array(input.path("reviewIds"), LegacyValues::vocabularyId));
                require(rounds > 0 && first <= correct && refs.size() <= correct && refs.containsAll(review), "INCONSISTENT_GAME_TOTALS");
                var items = refs.stream().map(id -> new SessionDto.Vocabulary(id,
                        review.contains(id) ? review.indexOf(id) : null)).toList();
                yield new SessionDto.GameView(header, kind, level, difficulty, answered, correct, source, first,
                        rounds, null, null, null, items, List.of(), null);
            }
            case SENTENCE_BUILDER -> {
                allowed.addAll(List.of("topic", "firstAttemptCorrect", "challenges"));
                object(input, allowed.toArray(String[]::new));
                var topic = enumeration(GameSession.Topic.class, input.path("topic"));
                long first = number(input.path("firstAttemptCorrect"));
                var challenges = array(input.path("challenges"), LegacySessionMapping::challenge);
                unique(challenges.stream().map(SessionDto.CompletedChallenge::challengeRef).toList());
                long reviewed = challenges.stream().filter(SessionDto.CompletedChallenge::reviewed).count();
                require(!challenges.isEmpty() && first <= correct && answered >= challenges.size()
                        && correct + reviewed == challenges.size(), "INCONSISTENT_GAME_TOTALS");
                yield new SessionDto.GameView(header, kind, level, difficulty, answered, correct, null, first,
                        null, topic, null, null, List.of(), challenges, null);
            }
            case MEMORY_GAME -> {
                allowed.addAll(List.of("source", "totalPairs", "incorrectAttempts", "vocabularyIds"));
                object(input, allowed.toArray(String[]::new));
                var source = enumeration(GameSession.Source.class, input.path("source"));
                long pairs = number(input.path("totalPairs"));
                long wrong = number(input.path("incorrectAttempts"));
                var refs = vocabulary(input);
                require(pairs == correct && wrong == answered - correct && refs.size() == pairs, "INCONSISTENT_GAME_TOTALS");
                yield new SessionDto.GameView(header, kind, level, difficulty, answered, correct, source, null, null,
                        null, pairs, wrong, refs.stream().map(id -> new SessionDto.Vocabulary(id, null)).toList(),
                        List.of(), null);
            }
        };
    }

    private static SessionDto.CompletedChallenge challenge(JsonNode input) {
        object(input, "id", "reviewed", "incorrectAnswers");
        boolean reviewed = bool(input.path("reviewed"));
        var wrong = array(input.path("incorrectAnswers"), node -> {
            String value = string(node, 4096);
            require(!blank(value), "EMPTY_SENTENCE_RESPONSE");
            return value;
        });
        require(!reviewed || !wrong.isEmpty(), "REVIEW_WITHOUT_RESPONSES");
        return new SessionDto.CompletedChallenge(id(input.path("id")), reviewed, wrong);
    }

    private static List<String> vocabulary(JsonNode input) {
        var refs = unique(array(input.path("vocabularyIds"), LegacyValues::vocabularyId));
        require(!refs.isEmpty(), "EMPTY_VOCABULARY_LIST");
        return refs;
    }

    static SessionDto.SimulationView simulation(String ref, JsonNode input) {
        object(input, "sessionId", "situationId", "scenarioId", "startedAt", "completedAt", "decisionsCompleted",
                "reviewedCorrections", "attempts", "activeMs", "dailyPracticeMs");
        var header = header(ref, input, "completedAt");
        var attempts = array(input.path("attempts"), attempt -> {
            object(attempt, "nodeId", "choiceId", "fit");
            return new SessionDto.Attempt(id(attempt.path("nodeId")), id(attempt.path("choiceId")),
                    enumeration(SimulationSession.Fit.class, attempt.path("fit")));
        });
        var outcomes = new LinkedHashMap<String, Boolean>();
        for (var attempt : attempts) {
            require(!Boolean.TRUE.equals(outcomes.get(attempt.nodeRef())), "ATTEMPT_AFTER_APPROPRIATE_RESPONSE");
            outcomes.put(attempt.nodeRef(), attempt.fit() == SimulationSession.Fit.APPROPRIATE);
        }
        long decisions = number(input.path("decisionsCompleted"));
        long reviewed = number(input.path("reviewedCorrections"));
        require(decisions > 0 && decisions == outcomes.size()
                && reviewed == outcomes.values().stream().filter(value -> !value).count(), "INCONSISTENT_SIMULATION_TOTALS");
        return new SessionDto.SimulationView(header, id(input.path("situationId")), id(input.path("scenarioId")),
                decisions, reviewed, attempts, null);
    }

    static SessionDto.FlashcardView flashcard(String ref, JsonNode input) {
        object(input, "sessionId", "startedAt", "completedAt", "activeMs", "dailyPracticeMs", "configuration", "observations");
        var header = header(ref, input, "completedAt");
        var config = object(input.path("configuration"), "direction", "length", "scope", "filters", "usedSearch");
        var filters = object(config.path("filters"), "source", "type", "level", "familiarity");
        var direction = enumeration(FlashcardSession.Direction.class, config.path("direction"));
        var lengthField = config.path("length");
        Long length = textEquals(lengthField, "all") ? null : number(lengthField);
        var seen = new HashSet<String>();
        var recalls = array(input.path("observations"), row -> {
            object(row, "vocabularyId", "rating", "direction");
            var id = vocabularyId(row.path("vocabularyId"));
            var face = enumeration(FlashcardSession.CardDirection.class, row.path("direction"));
            require(seen.add(id) && (direction == FlashcardSession.Direction.MIXED || direction.name().equals(face.name())),
                    "INCONSISTENT_FLASHCARD_OBSERVATION");
            return new SessionDto.Recall(id, face, enumeration(FlashcardSession.Rating.class, row.path("rating")));
        });
        require(!recalls.isEmpty() && (length == null || (List.of(5L, 10L, 20L).contains(length)
                && length == recalls.size())), "INCONSISTENT_FLASHCARD_LENGTH");
        return new SessionDto.FlashcardView(header, new SessionDto.ReviewConfiguration(direction,
                length == null ? null : length.intValue(), enumeration(FlashcardSession.Scope.class, config.path("scope")),
                optionalEnum(FlashcardSession.Source.class, filters.path("source")),
                optionalEnum(FlashcardSession.VocabularyType.class, filters.path("type")),
                optionalEnum(SessionDto.Level.class, filters.path("level")),
                optionalEnum(FlashcardSession.FamiliarityFilter.class, filters.path("familiarity")),
                bool(config.path("usedSearch"))), recalls);
    }

    private static <E extends Enum<E>> E optionalEnum(Class<E> type, JsonNode value) {
        return absent(value) || textEquals(value, "") ? null : enumeration(type, value);
    }

    private static boolean textEquals(JsonNode value, String expected) {
        return value.isString() && expected.equals(value.stringValue());
    }

    private static SessionDto.Header header(String ref, JsonNode input, String completed) {
        object(input);
        require(ref.equals(id(input.path("sessionId"))), "SESSION_KEY_MISMATCH");
        var start = instant(input.path("startedAt"));
        var finish = instant(input.path(completed));
        ordered(start, finish);
        long ms = number(input.path("activeMs"));
        return new SessionDto.Header(ref, null, new SessionDto.Timing(start, finish, ms,
                sessionDays(input.path("dailyPracticeMs"), ms)), true);
    }
}
