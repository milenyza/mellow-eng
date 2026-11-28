package com.mellow.backend.reading.api;

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

public final class ReadingProgressDto {

    private ReadingProgressDto() {
    }

    public record Write(@JsonDeserialize(using = ProgressInstantDeserializer.class) Instant startedAt, @NotNull @Pattern(regexp = REFERENCE) String chapterRef,
                        @NotNull @Min(0) @Max(MAX_MS) Long activeMs,
                        @NotNull @Size(max = 200) Map<@Pattern(regexp = REFERENCE) String, @NotNull @Valid ChapterWrite> chapters) {
    }

    public record ChapterWrite(@Pattern(regexp = REFERENCE) String paragraphRef, @NotNull Boolean read,
                               @Valid PracticeWrite practice) {
    }

    public record PracticeWrite(@NotNull @Min(0) Integer index, @NotNull Boolean finished,
                                @NotNull @Size(max = 200) Map<@Pattern(regexp = REFERENCE) String, @NotNull @Valid Input> exercises) {
    }

    public record PracticeView(long index, boolean finished, Map<String, ExerciseSnapshots.View> exercises) {
    }

    public record ChapterView(String paragraphRef, boolean read, Instant readAt, PracticeView practice) {
    }

    public record Attempt(String runRef, boolean current, boolean firstCompletion, Instant startedAt,
                          Instant completedAt, LocalDate completedOn, String chapterRef, long activeMs,
                          Map<String, ChapterView> chapters) {
    }

    public record ReadMark(String chapterRef, LocalDate readOn) {
    }

    public record View(String storyRef, long lifetimeActiveMs, List<ReadMark> readChapters, List<Attempt> attempts,
                       @JsonInclude(JsonInclude.Include.NON_NULL) Attempt legacyFirstCompletionSnapshot) {
        public View(String storyRef, long lifetimeActiveMs, List<ReadMark> readChapters, List<Attempt> attempts) {
            this(storyRef, lifetimeActiveMs, readChapters, attempts, null);
        }
    }
}
