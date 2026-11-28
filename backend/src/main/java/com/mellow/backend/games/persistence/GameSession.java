package com.mellow.backend.games.persistence;

import com.mellow.backend.learner.persistence.Learner;
import com.mellow.backend.study.persistence.CompletedSession;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "game_session")
public class GameSession extends CompletedSession {

    public enum Kind { WORD_MATCH, SENTENCE_BUILDER, MEMORY_GAME }
    public enum Difficulty { EASY, MEDIUM, HARD, BASIC, INTERMEDIATE }
    public enum Source { LESSONS, STORIES, SAVED, MIXED }
    public enum Topic { MIXED, INTRODUCTIONS, PRONOUNS, TO_BE, ORIGINS, AFFIRMATIVE, NEGATIVE, QUESTIONS }

    @Column(nullable = false, columnDefinition = "text")
    private String level;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "text")
    private Difficulty difficulty;

    private long answeredCount;
    private long correctCount;

    @Embedded
    private ResultDetails details;

    @ElementCollection
    @CollectionTable(name = "game_vocabulary", joinColumns = @JoinColumn(name = "game_session_id"))
    @OrderColumn(name = "position", nullable = false)
    private List<Vocabulary> vocabulary = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "game_sentence_challenge", joinColumns = @JoinColumn(name = "game_session_id"))
    @OrderColumn(name = "position", nullable = false)
    private List<SentenceChallenge> challenges = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "game_study_day", joinColumns = @JoinColumn(name = "session_id"))
    @MapKeyColumn(name = "study_on")
    @Column(name = "active_ms", nullable = false)
    private Map<LocalDate, Long> studyDays = new LinkedHashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", updatable = false)
    private String sessionEvidence;

    protected GameSession() {
    }

    public GameSession(Learner learner, String sessionRef, Timing timing, String level, Difficulty difficulty,
                       long answeredCount, long correctCount, ResultDetails details,
                       List<Vocabulary> vocabulary, List<SentenceChallenge> challenges, Map<LocalDate, Long> studyDays) {
        super(learner, sessionRef, timing);
        this.level = level;
        this.difficulty = difficulty;
        this.answeredCount = answeredCount;
        this.correctCount = correctCount;
        this.details = details;
        this.vocabulary.addAll(vocabulary);
        this.challenges.addAll(challenges);
        this.studyDays.putAll(studyDays);
    }

    public Kind kind() {
        return details.gameKind();
    }

    public List<Vocabulary> vocabulary() {
        return List.copyOf(vocabulary);
    }

    public List<SentenceChallenge> challenges() {
        return List.copyOf(challenges);
    }

    public Map<LocalDate, Long> studyDays() {
        return Map.copyOf(studyDays);
    }


    public String level() { return level; }
    public Difficulty difficulty() { return difficulty; }
    public long answeredCount() { return answeredCount; }
    public long correctCount() { return correctCount; }
    public ResultDetails details() { return details; }

    public String evidence() { return sessionEvidence; }

    public void addEvidence(String evidence) {
        if (sessionEvidence != null) throw new IllegalStateException("Session evidence is already recorded");
        sessionEvidence = evidence;
    }

    @Embeddable
    public record ResultDetails(
            @Enumerated(EnumType.STRING) @Column(nullable = false, columnDefinition = "text") Kind gameKind,
            @Enumerated(EnumType.STRING) @Column(columnDefinition = "text") Source vocabularySource,
            Long firstAttemptCorrect,
            Long roundsCompleted,
            @Enumerated(EnumType.STRING) @Column(columnDefinition = "text") Topic sentenceTopic,
            Long totalPairs,
            Long incorrectAttempts) {

        public static ResultDetails wordMatch(Source source, long firstAttemptCorrect, long roundsCompleted) {
            return new ResultDetails(Kind.WORD_MATCH, source, firstAttemptCorrect, roundsCompleted, null, null, null);
        }

        public static ResultDetails sentenceBuilder(Topic topic, long firstAttemptCorrect) {
            return new ResultDetails(Kind.SENTENCE_BUILDER, null, firstAttemptCorrect, null, topic, null, null);
        }

        public static ResultDetails memory(Source source, long totalPairs, long incorrectAttempts) {
            return new ResultDetails(Kind.MEMORY_GAME, source, null, null, null, totalPairs, incorrectAttempts);
        }
    }

    @Embeddable
    public record Vocabulary(@Column(nullable = false, columnDefinition = "text") String vocabularyRef,
                             Integer reviewPosition) {
    }

    @Embeddable
    public record SentenceChallenge(@Column(nullable = false, columnDefinition = "text") String challengeRef,
                                    boolean reviewed,
                                    @JdbcTypeCode(SqlTypes.ARRAY)
                                    @Column(nullable = false, columnDefinition = "text[]") String[] incorrectAnswers) {
        public SentenceChallenge {
            incorrectAnswers = incorrectAnswers.clone();
        }

        @Override
        public String[] incorrectAnswers() {
            return incorrectAnswers.clone();
        }
    }
}
