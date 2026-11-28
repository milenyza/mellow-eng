package com.mellow.backend.study.persistence;

import com.mellow.backend.learner.persistence.Learner;
import jakarta.persistence.*;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "combined_study_day")
public class CombinedStudyDay {

    @EmbeddedId
    private Key id;

    @MapsId("learnerId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "learner_id", nullable = false)
    private Learner learner;

    private long activeMs;

    protected CombinedStudyDay() {
    }

    public CombinedStudyDay(Learner learner, LocalDate studyOn, long activeMs) {
        this.id = new Key(learner.id(), studyOn);
        this.learner = learner;
        this.activeMs = activeMs;
    }

    public long activeMs() {
        return activeMs;
    }

    @Embeddable
    public record Key(UUID learnerId, LocalDate studyOn) implements Serializable {
    }
}
