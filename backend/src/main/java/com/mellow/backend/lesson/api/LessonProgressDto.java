package com.mellow.backend.lesson.api;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.mellow.backend.progress.api.ExerciseSnapshots;
import com.mellow.backend.progress.api.ExerciseSnapshots.Input;
import com.mellow.backend.progress.api.ProgressInstantDeserializer;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import tools.jackson.databind.annotation.JsonDeserialize;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static com.mellow.backend.progress.application.ProgressSupport.MAX_MS;
import static com.mellow.backend.progress.application.ProgressSupport.REFERENCE;

public final class LessonProgressDto {

    private LessonProgressDto() {
    }

    public record Write(@JsonDeserialize(using = ProgressInstantDeserializer.class) Instant startedAt, @NotNull @Pattern(regexp = REFERENCE) String blockRef,
                        @NotNull @Size(min = 1, max = 200) List<@NotNull @Pattern(regexp = REFERENCE) String> visitedBlockRefs,
                        @NotNull @Min(0) @Max(MAX_MS) Long activeMs, @NotNull Boolean complete,
                        @NotNull @Size(max = 200) Map<@Pattern(regexp = REFERENCE) String, @NotNull @Valid ActivityWrite> activities) {
    }

    public record ActivityWrite(@NotNull @Pattern(regexp = REFERENCE) String activityRef, @NotNull Boolean finished,
                                @NotNull @Size(max = 200) List<@NotNull @Pattern(regexp = REFERENCE) String> textActivityRefs,
                                @NotNull @Size(max = 200) List<@NotNull @Pattern(regexp = REFERENCE) String> heardActivityRefs,
                                @NotNull @Size(max = 200) Map<@Pattern(regexp = REFERENCE) String, @NotNull @Valid Input> exercises) {
    }

    public record ActivityView(String activityRef, boolean finished, List<String> textActivityRefs,
                               List<String> heardActivityRefs, Map<String, ExerciseSnapshots.View> exercises) {
    }

    public record Attempt(String runRef, boolean current, boolean completed, boolean firstCompletion,
                          Instant startedAt, Instant finishedAt, LocalDate finishedOn,
                          String blockRef, List<String> visitedBlockRefs, long activeMs, Map<String, ActivityView> activities) {
    }

    public record View(String lessonRef, List<Attempt> attempts, @JsonInclude(JsonInclude.Include.NON_NULL) Attempt legacyFirstCompletionSnapshot) {
        public View(String lessonRef, List<Attempt> attempts) { this(lessonRef, attempts, null); }
    }
}
