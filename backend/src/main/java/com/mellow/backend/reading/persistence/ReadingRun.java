package com.mellow.backend.reading.persistence;

import jakarta.persistence.*;
import com.mellow.backend.study.persistence.RecordedDate;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "reading_run")
public class ReadingRun {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "story_progress_id", nullable = false, updatable = false)
    private StoryProgress storyProgress;

    @Column(nullable = false, columnDefinition = "text")
    private String runRef;

    private boolean currentRun;
    private boolean firstCompletion;
    private Instant completedAt;
    private LocalDate completedOn;
    private Instant startedAt;

    @Column(nullable = false, columnDefinition = "text")
    private String chapterRef;

    private long activeMs;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", updatable = false)
    private String legacyFirstSnapshot;

    protected ReadingRun() {
    }

    public ReadingRun(StoryProgress storyProgress, String runRef, String chapterRef, boolean currentRun,
                      boolean firstCompletion, RecordedDate completion, Instant startedAt, long activeMs) {
        this.storyProgress = storyProgress;
        this.runRef = runRef;
        this.chapterRef = chapterRef;
        this.currentRun = currentRun;
        this.firstCompletion = firstCompletion;
        this.completedAt = completion.at();
        this.completedOn = completion.on();
        this.startedAt = startedAt;
        this.activeMs = activeMs;
    }

    public String chapterRef() {
        return chapterRef;
    }

    public UUID id() { return id; }
    public String runRef() { return runRef; }
    public boolean currentRun() { return currentRun; }
    public boolean firstCompletion() { return firstCompletion; }
    public Instant startedAt() { return startedAt; }
    public Instant completedAt() { return completedAt; }
    public LocalDate completedOn() { return completedOn; }
    public long activeMs() { return activeMs; }

    public String legacyFirstSnapshot() { return legacyFirstSnapshot; }
    public void retainLegacyFirstSnapshot(String value) { legacyFirstSnapshot = value; }

    public void supersede() { currentRun = false; }

    public void update(String chapterRef, long activeMs) {
        this.chapterRef = chapterRef;
        this.activeMs = activeMs;
    }

    public void completeFirst(Instant timestamp) {
        firstCompletion = true;
        completedAt = timestamp;
    }

}
