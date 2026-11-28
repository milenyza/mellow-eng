package com.mellow.backend.practical.persistence;

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
@Table(name = "simulation_session")
public class SimulationSession extends CompletedSession {

    public enum Fit { APPROPRIATE, CONTEXT, LANGUAGE }

    @Column(nullable = false, columnDefinition = "text")
    private String situationRef;

    @Column(nullable = false, columnDefinition = "text")
    private String scenarioRef;

    private long decisionsCompleted;
    private long reviewedCorrections;

    @ElementCollection
    @CollectionTable(name = "simulation_attempt", joinColumns = @JoinColumn(name = "simulation_session_id"))
    @OrderColumn(name = "position", nullable = false)
    private List<Attempt> attempts = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "simulation_study_day", joinColumns = @JoinColumn(name = "session_id"))
    @MapKeyColumn(name = "study_on")
    @Column(name = "active_ms", nullable = false)
    private Map<LocalDate, Long> studyDays = new LinkedHashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", updatable = false)
    private String sessionEvidence;

    protected SimulationSession() {
    }

    public SimulationSession(Learner learner, String sessionRef, Timing timing, String situationRef, String scenarioRef,
                             long decisionsCompleted, long reviewedCorrections, List<Attempt> attempts,
                             Map<LocalDate, Long> studyDays) {
        super(learner, sessionRef, timing);
        this.situationRef = situationRef;
        this.scenarioRef = scenarioRef;
        this.decisionsCompleted = decisionsCompleted;
        this.reviewedCorrections = reviewedCorrections;
        this.attempts.addAll(attempts);
        this.studyDays.putAll(studyDays);
    }

    public List<Attempt> attempts() {
        return List.copyOf(attempts);
    }


    public String situationRef() { return situationRef; }
    public String scenarioRef() { return scenarioRef; }
    public long decisionsCompleted() { return decisionsCompleted; }
    public long reviewedCorrections() { return reviewedCorrections; }

    @Override
    public Map<LocalDate, Long> studyDays() { return Map.copyOf(studyDays); }

    public String evidence() { return sessionEvidence; }

    public void addEvidence(String evidence) {
        if (sessionEvidence != null) throw new IllegalStateException("Session evidence is already recorded");
        sessionEvidence = evidence;
    }

    @Embeddable
    public record Attempt(@Column(nullable = false, columnDefinition = "text") String nodeRef,
                          @Column(nullable = false, columnDefinition = "text") String choiceRef,
                          @Enumerated(EnumType.STRING) @Column(nullable = false, columnDefinition = "text") Fit fit) {
    }
}
