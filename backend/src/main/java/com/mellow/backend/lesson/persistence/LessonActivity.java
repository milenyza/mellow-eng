package com.mellow.backend.lesson.persistence;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.util.UUID;

@Entity
@Table(name = "lesson_activity")
public class LessonActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "run_id", nullable = false, updatable = false)
    private LessonRun run;

    @Column(nullable = false, columnDefinition = "text")
    private String blockRef;

    @Column(nullable = false, columnDefinition = "text")
    private String activityRef;

    private boolean finished;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(nullable = false, columnDefinition = "text[]")
    private String[] textActivityRefs;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(nullable = false, columnDefinition = "text[]")
    private String[] heardActivityRefs;

    protected LessonActivity() {
    }

    public LessonActivity(LessonRun run, String blockRef, String activityRef, boolean finished,
                          String[] textActivityRefs, String[] heardActivityRefs) {
        this.run = run;
        this.blockRef = blockRef;
        this.activityRef = activityRef;
        this.finished = finished;
        this.textActivityRefs = textActivityRefs.clone();
        this.heardActivityRefs = heardActivityRefs.clone();
    }

    public String activityRef() {
        return activityRef;
    }

    public UUID id() {
        return id;
    }

    public String blockRef() { return blockRef; }
    public boolean finished() { return finished; }
    public String[] textActivityRefs() { return textActivityRefs.clone(); }
    public String[] heardActivityRefs() { return heardActivityRefs.clone(); }

    public void update(String exercise, boolean finished, String[] text, String[] heard) {
        this.activityRef = exercise;
        this.finished = finished;
        this.textActivityRefs = text.clone();
        this.heardActivityRefs = heard.clone();
    }

}
