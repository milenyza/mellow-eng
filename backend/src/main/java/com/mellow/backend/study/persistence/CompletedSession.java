package com.mellow.backend.study.persistence;

import com.mellow.backend.learner.persistence.Learner;
import jakarta.persistence.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

@MappedSuperclass
public abstract class CompletedSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "learner_id", nullable = false, updatable = false)
    private Learner learner;

    @Column(nullable = false, columnDefinition = "text", updatable = false)
    private String sessionRef;

    @Column(nullable = false)
    private Instant startedAt;

    @Column(nullable = false)
    private Instant completedAt;

    private long activeMs;

    @Column(columnDefinition = "text", updatable = false)
    private String catalogRevision;

    @Column(columnDefinition = "text", updatable = false)
    private String requestDigest;

    @Column(nullable = false, updatable = false)
    private boolean legacyImported;

    protected CompletedSession() {
    }

    protected CompletedSession(Learner learner, String sessionRef, Timing timing) {
        this.learner = learner;
        this.sessionRef = sessionRef;
        this.startedAt = timing.startedAt();
        this.completedAt = timing.completedAt();
        this.activeMs = timing.activeMs();
    }

    public UUID id() {
        return id;
    }

    public long activeMs() {
        return activeMs;
    }

    public String sessionRef() { return sessionRef; }
    public Instant startedAt() { return startedAt; }
    public Instant completedAt() { return completedAt; }
    public String catalogRevision() { return catalogRevision; }
    public String requestDigest() { return requestDigest; }
    public boolean legacyImported() { return legacyImported; }
    public void markLegacyImported() { legacyImported = true; }

    public void recordValidation(String revision, String digest) {
        if (catalogRevision != null) throw new IllegalStateException("Session validation is already recorded");
        catalogRevision = revision;
        requestDigest = digest;
    }

    public abstract Map<LocalDate, Long> studyDays();

    public record Timing(Instant startedAt, Instant completedAt, long activeMs) {
    }
}
