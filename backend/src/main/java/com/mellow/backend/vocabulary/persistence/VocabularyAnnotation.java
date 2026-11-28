package com.mellow.backend.vocabulary.persistence;

import jakarta.persistence.*;
import com.mellow.backend.learner.persistence.Learner;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "vocabulary_annotation")
public class VocabularyAnnotation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "learner_id", nullable = false, updatable = false)
    private Learner learner;

    public enum Familiarity { LEARNING, REVIEWING, FAMILIAR }

    @Column(nullable = false, columnDefinition = "text")
    private String vocabularyRef;

    @Column(columnDefinition = "text")
    private String note;

    @Column(columnDefinition = "text")
    private String personalExample;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "text")
    private Familiarity familiarity;

    private Instant createdAt;
    private Instant updatedAt;

    @Column(nullable = false)
    private UUID revision = UUID.randomUUID();

    @Column(nullable = false)
    private boolean removed;

    protected VocabularyAnnotation() {
    }

    public VocabularyAnnotation(Learner learner, String vocabularyRef, String note, String personalExample,
                                Familiarity familiarity, Instant createdAt, Instant updatedAt) {
        this.learner = learner;
        this.vocabularyRef = vocabularyRef;
        this.note = note;
        this.personalExample = personalExample;
        this.familiarity = familiarity;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String vocabularyRef() { return vocabularyRef; }
    public String personalExample() { return personalExample; }
    public Familiarity familiarity() { return familiarity; }
    public Instant createdAt() { return createdAt; }
    public Instant updatedAt() { return updatedAt; }
    public UUID revision() { return revision; }
    public boolean removed() { return removed; }

    public void edit(String note, String example, Familiarity familiarity, Instant at) {
        boolean empty = note == null && example == null && familiarity == null;
        if (removed && !empty) createdAt = at;
        this.note = note;
        personalExample = example;
        this.familiarity = familiarity;
        updatedAt = at;
        revision = UUID.randomUUID();
        removed = empty;
    }

    public String note() {
        return note;
    }
}
