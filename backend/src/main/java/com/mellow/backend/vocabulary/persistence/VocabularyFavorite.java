package com.mellow.backend.vocabulary.persistence;

import jakarta.persistence.*;
import com.mellow.backend.learner.persistence.Learner;
import com.mellow.backend.study.persistence.RecordedDate;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "vocabulary_favorite")
public class VocabularyFavorite {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "learner_id", nullable = false, updatable = false)
    private Learner learner;

    @Column(nullable = false, columnDefinition = "text")
    private String vocabularyRef;

    private Instant savedAt;
    private LocalDate savedOn;

    @Column(nullable = false)
    private UUID revision = UUID.randomUUID();

    private UUID previousRevision;

    @Column(nullable = false)
    private boolean removed;

    protected VocabularyFavorite() {
    }

    public VocabularyFavorite(Learner learner, String vocabularyRef, RecordedDate saved) {
        this.learner = learner;
        this.vocabularyRef = vocabularyRef;
        this.savedAt = saved.at();
        this.savedOn = saved.on();
    }

    public String vocabularyRef() { return vocabularyRef; }
    public UUID revision() { return revision; }
    public UUID previousRevision() { return previousRevision; }
    public boolean removed() { return removed; }

    public void changeMembership(boolean saved, Instant at, boolean newRecord) {
        previousRevision = newRecord ? null : revision;
        revision = UUID.randomUUID();
        removed = !saved;
        savedAt = saved ? at : null;
        savedOn = null;
    }

    public RecordedDate saved() {
        return new RecordedDate(savedAt, savedOn);
    }
}
