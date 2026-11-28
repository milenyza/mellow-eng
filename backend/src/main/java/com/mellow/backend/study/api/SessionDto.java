package com.mellow.backend.study.api;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.mellow.backend.flashcards.persistence.FlashcardSession.*;
import com.mellow.backend.games.persistence.GameSession;
import com.mellow.backend.games.persistence.GameSession.Difficulty;
import com.mellow.backend.games.persistence.GameSession.Kind;
import com.mellow.backend.games.persistence.GameSession.Topic;
import com.mellow.backend.practical.persistence.SimulationSession.Fit;
import com.mellow.backend.progress.api.ProgressInstantDeserializer;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.annotation.JsonDeserialize;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static com.mellow.backend.progress.application.ProgressSupport.MAX_MS;
import static com.mellow.backend.progress.application.ProgressSupport.REFERENCE;

public final class SessionDto {

    public static final String VOCABULARY_REF = "[A-Za-z0-9_-]+(/[A-Za-z0-9_-]+)*";
    public static final int MAX_ATTEMPTS = 512;
    public static final int MAX_CARDS = 512;

    private SessionDto() {
    }

    public record Timing(
            @NotNull @JsonDeserialize(using = ProgressInstantDeserializer.class) Instant startedAt,
            @NotNull @JsonDeserialize(using = ProgressInstantDeserializer.class) Instant completedAt,
            @NotNull @PositiveOrZero @Max(MAX_MS) Long activeMs,
            @NotNull @Size(max = 32) Map<LocalDate, @NotNull @PositiveOrZero @Max(MAX_MS) Long> studyDays) {
    }

    public interface Write {
        String catalogRevision();
        Timing timing();
    }

    public record GameWrite(
            @NotNull @Pattern(regexp = "[a-f0-9]{64}") String catalogRevision,
            @NotNull @Valid Timing timing,
            @NotNull Level level,
            @NotNull Difficulty difficulty,
            @NotNull @Valid GameResult result) implements Write {
    }

    public enum Level { A1, A2, B1, B2, C1, C2 }

    @JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "kind")
    @JsonSubTypes({
            @JsonSubTypes.Type(value = WordMatch.class, name = "WORD_MATCH"),
            @JsonSubTypes.Type(value = SentenceBuilder.class, name = "SENTENCE_BUILDER"),
            @JsonSubTypes.Type(value = MemoryGame.class, name = "MEMORY_GAME")
    })
    public sealed interface GameResult permits WordMatch, SentenceBuilder, MemoryGame {
    }

    public record WordMatch(
            @NotNull GameSession.Source source,
            @NotNull @Size(min = 1, max = 16) List<@NotNull @Valid WordRound> rounds) implements GameResult {
    }

    public record WordRound(
            @NotNull @Size(min = 1, max = 32)
            List<@NotNull @Size(max = 240) @Pattern(regexp = VOCABULARY_REF) String> vocabularyRefs,
            @NotNull @Size(min = 1, max = MAX_ATTEMPTS) List<@NotNull @Valid WordAttempt> attempts) {
    }

    public record WordAttempt(
            @NotNull @Size(max = 240) @Pattern(regexp = VOCABULARY_REF) String englishRef,
            @NotNull @Size(max = 240) @Pattern(regexp = VOCABULARY_REF) String portugueseRef) {
    }

    public record SentenceBuilder(
            @NotNull Topic topic,
            @NotNull @Size(min = 1, max = 32) List<@NotNull @Valid Challenge> challenges) implements GameResult {
    }

    public record Challenge(
            @NotNull @Pattern(regexp = REFERENCE) String challengeRef,
            @NotNull Boolean reviewed,
            @NotNull Boolean hintUsed,
            @NotNull @Size(min = 1, max = MAX_ATTEMPTS)
            List<@NotNull @Size(min = 1, max = 32) List<@NotNull @Pattern(regexp = REFERENCE) String>> responses) {
    }

    public record MemoryGame(
            @NotNull GameSession.Source source,
            @NotNull @Size(min = 1, max = 32)
            List<@NotNull @Size(max = 240) @Pattern(regexp = VOCABULARY_REF) String> vocabularyRefs,
            @NotNull @Size(min = 1, max = MAX_ATTEMPTS) List<@NotNull @Valid MemoryAttempt> attempts) implements GameResult {
    }

    public enum CardLanguage { EN, PT_BR }

    public record Card(
            @NotNull @Size(max = 240) @Pattern(regexp = VOCABULARY_REF) String vocabularyRef,
            @NotNull CardLanguage language) {
    }

    public record MemoryAttempt(@NotNull @Valid Card first, @NotNull @Valid Card second) {
    }

    public record SimulationWrite(
            @NotNull @Pattern(regexp = "[a-f0-9]{64}") String catalogRevision,
            @NotNull @Valid Timing timing,
            @NotNull @Pattern(regexp = REFERENCE) String situationRef,
            @NotNull @Pattern(regexp = REFERENCE) String scenarioRef,
            @NotNull @Pattern(regexp = REFERENCE) String terminalNodeRef,
            @NotNull @Size(min = 1, max = 64) List<@NotNull @Valid Decision> decisions) implements Write {
    }

    public record Decision(
            @NotNull @Pattern(regexp = REFERENCE) String nodeRef,
            @NotNull @Pattern(regexp = REFERENCE) String choiceRef,
            @NotNull Boolean reviewed,
            @NotNull Boolean hintUsed,
            @NotNull @Size(min = 1, max = MAX_ATTEMPTS)
            List<@NotNull @Pattern(regexp = REFERENCE) String> attemptedChoiceRefs) {
    }

    public record FlashcardWrite(
            @NotNull @Pattern(regexp = "[a-f0-9]{64}") String catalogRevision,
            @NotNull @Valid Timing timing,
            @NotNull @Valid ReviewConfiguration configuration,
            @NotNull @Size(min = 1, max = MAX_CARDS) List<@NotNull @Valid Recall> recalls) implements Write {
    }

    public record ReviewConfiguration(
            @NotNull Direction direction, Integer requestedLength, @NotNull Scope scope,
            Source filterSource, VocabularyType filterType, Level filterLevel,
            FamiliarityFilter filterFamiliarity, @NotNull Boolean usedSearch) {
    }

    public record Recall(@NotNull @Size(max = 240) @Pattern(regexp = VOCABULARY_REF) String vocabularyRef,
                         @NotNull CardDirection direction, @NotNull Rating rating) {
    }

    public record Header(String sessionRef, String catalogRevision, Timing timing, boolean legacyImported) {
    }

    public record Vocabulary(String vocabularyRef, Integer reviewPosition) {
    }

    public record CompletedChallenge(String challengeRef, boolean reviewed, List<String> incorrectAnswers) {
    }

    public record GameView(Header session, Kind kind, Level level, Difficulty difficulty,
                           long answeredCount, long correctCount,
                           GameSession.Source vocabularySource,
                           Long firstAttemptCorrect, Long roundsCompleted, Topic topic, Long totalPairs,
                           Long incorrectAttempts, List<Vocabulary> vocabulary, List<CompletedChallenge> challenges,
                           JsonNode evidence) {
    }

    public record Attempt(String nodeRef, String choiceRef, Fit fit) {
    }

    public record SimulationView(Header session, String situationRef, String scenarioRef, long decisionsCompleted,
                                 long reviewedCorrections, List<Attempt> attempts, JsonNode evidence) {
    }

    public record FlashcardView(Header session, ReviewConfiguration configuration, List<Recall> recalls) {
    }

    public record Summary(String sessionRef, String catalogRevision, Instant completedAt, long activeMs,
                          Kind gameKind, Difficulty difficulty, String situationRef, String scenarioRef,
                          Direction direction) {
    }

    public record History(List<Summary> items, int page, int size, boolean hasNext) {
    }
}
