package com.mellow.backend.lesson.persistence;

import jakarta.persistence.*;
import com.mellow.backend.learner.persistence.Learner;
import com.mellow.backend.study.persistence.RecordedDate;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "lesson_run")
public class LessonRun {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "learner_id", nullable = false, updatable = false)
    private Learner learner;

    @Column(nullable = false, columnDefinition = "text")
    private String lessonRef;

    @Column(nullable = false, columnDefinition = "text")
    private String runRef;

    private boolean currentRun;
    private boolean completed;
    private boolean firstCompletion;
    private Instant startedAt;
    private Instant finishedAt;
    private LocalDate finishedOn;

    @Column(nullable = false, columnDefinition = "text")
    private String blockRef;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(nullable = false, columnDefinition = "text[]")
    private String[] visitedBlockRefs;

    private long activeMs;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", updatable = false)
    private String legacyFirstSnapshot;

    protected LessonRun() {
    }

    public LessonRun(Learner learner, String lessonRef, String runRef, String blockRef, String[] visitedBlockRefs,
                     Instant startedAt, long activeMs, boolean currentRun, boolean completed, boolean firstCompletion,
                     RecordedDate finish) {
        this.learner = learner;
        this.lessonRef = lessonRef;
        this.runRef = runRef;
        this.blockRef = blockRef;
        this.visitedBlockRefs = visitedBlockRefs.clone();
        this.startedAt = startedAt;
        this.activeMs = activeMs;
        this.currentRun = currentRun;
        this.completed = completed;
        this.firstCompletion = firstCompletion;
        this.finishedAt = finish.at();
        this.finishedOn = finish.on();
    }

    public RecordedDate finish() {
        return new RecordedDate(finishedAt, finishedOn);
    }

    public String runRef() {
        return runRef;
    }

    public UUID id() { return id; }
    public String lessonRef() { return lessonRef; }
    public boolean currentRun() { return currentRun; }
    public boolean completed() { return completed; }
    public boolean firstCompletion() { return firstCompletion; }
    public Instant startedAt() { return startedAt; }
    public String blockRef() { return blockRef; }
    public String[] visitedBlockRefs() { return visitedBlockRefs.clone(); }
    public long activeMs() { return activeMs; }

    public String legacyFirstSnapshot() { return legacyFirstSnapshot; }
    public void retainLegacyFirstSnapshot(String value) { legacyFirstSnapshot = value; }

    public void supersede() { currentRun = false; }

    public void update(String blockRef, String[] visited, long activeMs) {
        this.blockRef = blockRef;
        this.visitedBlockRefs = visited.clone();
        this.activeMs = activeMs;
    }

    public void complete(Instant timestamp, boolean first) {
        completed = true;
        firstCompletion = first;
        finishedAt = timestamp;
    }

}
