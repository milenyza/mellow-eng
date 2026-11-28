package com.mellow.backend.exercise.persistence;

import jakarta.persistence.*;
import com.mellow.backend.lesson.persistence.LessonActivity;
import com.mellow.backend.reading.persistence.ReadingChapter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "exercise_result")
public class ExerciseResult {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    public enum Status { EDITING, INCORRECT, CORRECT, REVIEWED }
    public enum Mode { PRACTICE, LISTENING, TEXT_ALTERNATIVE, NO_AUDIO }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_activity_id", updatable = false)
    private LessonActivity lessonActivity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reading_chapter_id", updatable = false)
    private ReadingChapter readingChapter;

    @Column(nullable = false, columnDefinition = "text")
    private String exerciseRef;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String draft;

    @Enumerated(EnumType.STRING)
    @Column(name = "result_status", nullable = false, columnDefinition = "text")
    private Status status;

    private Instant reviewedAt;

    @ElementCollection
    @CollectionTable(name = "exercise_submission", joinColumns = @JoinColumn(name = "exercise_result_id"))
    @OrderColumn(name = "position", nullable = false)
    private List<Submission> submissions = new ArrayList<>();

    protected ExerciseResult() {
    }

    private ExerciseResult(String exerciseRef, String draft, Status status, Instant reviewedAt,
                           List<Submission> submissions) {
        this.exerciseRef = exerciseRef;
        this.draft = draft;
        this.status = status;
        this.reviewedAt = reviewedAt;
        this.submissions.addAll(submissions);
    }

    public static ExerciseResult lesson(LessonActivity activity, String exerciseRef, String draft, Status status,
                                        Instant reviewedAt, List<Submission> submissions) {
        ExerciseResult result = new ExerciseResult(exerciseRef, draft, status, reviewedAt, submissions);
        result.lessonActivity = Objects.requireNonNull(activity);
        return result;
    }

    public static ExerciseResult reading(ReadingChapter chapter, String exerciseRef, String draft, Status status,
                                         Instant reviewedAt, List<Submission> submissions) {
        ExerciseResult result = new ExerciseResult(exerciseRef, draft, status, reviewedAt, submissions);
        result.readingChapter = Objects.requireNonNull(chapter);
        return result;
    }

    public List<Submission> submissions() {
        return List.copyOf(submissions);
    }

    public Status status() {
        return status;
    }

    @Embeddable
    public record Submission(
            @JdbcTypeCode(SqlTypes.JSON) @Column(nullable = false, columnDefinition = "jsonb") String answer,
            boolean correct,
            Instant submittedAt,
            @Enumerated(EnumType.STRING) @Column(nullable = false, columnDefinition = "text") Mode mode) {
    }

    public String exerciseRef() { return exerciseRef; }
    public String draft() { return draft; }
    public Instant reviewedAt() { return reviewedAt; }

    public void update(String draft, Status status, Instant reviewedAt, List<Submission> history) {
        this.draft = draft;
        this.status = status;
        this.reviewedAt = reviewedAt;
        if (history.size() > submissions.size()) {
            submissions.addAll(history.subList(submissions.size(), history.size()));
        }
    }

}
