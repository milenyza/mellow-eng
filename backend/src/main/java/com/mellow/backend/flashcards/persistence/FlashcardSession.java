package com.mellow.backend.flashcards.persistence;

import com.mellow.backend.learner.persistence.Learner;
import com.mellow.backend.study.persistence.CompletedSession;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "flashcard_session")
public class FlashcardSession extends CompletedSession {

    public enum Direction { EN_PT, PT_EN, MIXED }
    public enum CardDirection { EN_PT, PT_EN }
    public enum Scope { SAVED, DIFFICULT, HISTORY, RECOMMENDED }
    public enum Source { LESSON, STORY, PRACTICAL, DAILY }
    public enum VocabularyType { WORD, EXPRESSION, PHRASE }
    public enum FamiliarityFilter { LEARNING, REVIEWING, FAMILIAR, UNCLASSIFIED }
    public enum Rating { FORGOT, EFFORT, EASY }

    @Embedded
    private Configuration configuration;

    @ElementCollection
    @CollectionTable(name = "flashcard_recall", joinColumns = @JoinColumn(name = "flashcard_session_id"))
    @OrderColumn(name = "position", nullable = false)
    private List<Recall> recalls = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "flashcard_study_day", joinColumns = @JoinColumn(name = "session_id"))
    @MapKeyColumn(name = "study_on")
    @Column(name = "active_ms", nullable = false)
    private Map<LocalDate, Long> studyDays = new LinkedHashMap<>();

    protected FlashcardSession() {
    }

    public FlashcardSession(Learner learner, String sessionRef, Timing timing, Configuration configuration,
                            List<Recall> recalls, Map<LocalDate, Long> studyDays) {
        super(learner, sessionRef, timing);
        this.configuration = configuration;
        this.recalls.addAll(recalls);
        this.studyDays.putAll(studyDays);
    }

    public List<Recall> recalls() {
        return List.copyOf(recalls);
    }


    public Configuration configuration() { return configuration; }

    @Override
    public Map<LocalDate, Long> studyDays() { return Map.copyOf(studyDays); }

    @Embeddable
    public record Configuration(
            @Enumerated(EnumType.STRING) @Column(nullable = false, columnDefinition = "text") Direction direction,
            Integer requestedLength,
            @Enumerated(EnumType.STRING) @Column(nullable = false, columnDefinition = "text") Scope reviewScope,
            @Enumerated(EnumType.STRING) @Column(columnDefinition = "text") Source filterSource,
            @Enumerated(EnumType.STRING) @Column(columnDefinition = "text") VocabularyType filterType,
            @Column(columnDefinition = "text") String filterLevel,
            @Enumerated(EnumType.STRING) @Column(columnDefinition = "text") FamiliarityFilter filterFamiliarity,
            boolean usedSearch) {
    }

    @Embeddable
    public record Recall(
            @Column(nullable = false, columnDefinition = "text") String vocabularyRef,
            @Enumerated(EnumType.STRING) @Column(nullable = false, columnDefinition = "text") CardDirection direction,
            @Enumerated(EnumType.STRING) @Column(nullable = false, columnDefinition = "text") Rating rating) {
    }
}
