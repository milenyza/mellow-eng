package com.mellow.backend.progress.api;

import com.mellow.backend.exercise.persistence.ExerciseResult.Mode;
import com.mellow.backend.exercise.persistence.ExerciseResult.Status;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.annotation.JsonDeserialize;

import java.time.Instant;
import java.util.List;

public final class ExerciseSnapshots {

    private ExerciseSnapshots() {
    }

    public record SubmissionInput(@NotNull JsonNode answer,
                                  @NotNull @JsonDeserialize(using = ProgressInstantDeserializer.class) Instant submittedAt,
                                  @NotNull Mode mode) {
    }

    public record Input(JsonNode draft, @NotNull Status status,
                        @JsonDeserialize(using = ProgressInstantDeserializer.class) Instant reviewedAt,
                        @NotNull @Size(max = 1000) List<@NotNull @Valid SubmissionInput> submissions) {
    }

    public record SubmissionView(JsonNode answer, boolean correct, Instant submittedAt, Mode mode) {
    }

    public record View(JsonNode draft, Status status, Instant reviewedAt, List<SubmissionView> submissions) {
        public boolean resolved() {
            return status == Status.CORRECT || status == Status.REVIEWED;
        }
    }
}
