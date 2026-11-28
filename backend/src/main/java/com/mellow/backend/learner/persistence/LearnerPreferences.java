package com.mellow.backend.learner.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "learner_preferences")
public class LearnerPreferences {

    public enum ReadingFontSize { NORMAL, LARGE, EXTRA_LARGE }

    @Id
    private UUID learnerId;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "learner_id")
    private Learner learner;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "text")
    private ReadingFontSize readingFontSize;

    @Column(nullable = false)
    private boolean showReadingTranslations;

    @Column(nullable = false)
    private Instant updatedAt;

    @Column(nullable = false)
    private UUID revision = UUID.randomUUID();

    protected LearnerPreferences() {
    }

    public LearnerPreferences(Learner learner, ReadingFontSize readingFontSize, boolean showReadingTranslations,
                              Instant updatedAt) {
        this.learner = learner;
        this.readingFontSize = readingFontSize;
        this.showReadingTranslations = showReadingTranslations;
        this.updatedAt = updatedAt;
    }

    public boolean showReadingTranslations() { return showReadingTranslations; }
    public Instant updatedAt() { return updatedAt; }
    public UUID revision() { return revision; }

    public void edit(ReadingFontSize size, boolean translations, Instant at) {
        readingFontSize = size;
        showReadingTranslations = translations;
        updatedAt = at;
        revision = UUID.randomUUID();
    }

    public ReadingFontSize readingFontSize() {
        return readingFontSize;
    }
}
