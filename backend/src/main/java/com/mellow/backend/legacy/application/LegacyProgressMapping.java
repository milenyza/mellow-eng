package com.mellow.backend.legacy.application;

import com.mellow.backend.exercise.persistence.ExerciseResult.Mode;
import com.mellow.backend.exercise.persistence.ExerciseResult.Status;
import com.mellow.backend.lesson.api.LessonProgressDto;
import com.mellow.backend.progress.api.ExerciseSnapshots;
import com.mellow.backend.reading.api.ReadingProgressDto;
import tools.jackson.databind.JsonNode;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

import static com.mellow.backend.legacy.application.LegacyValues.*;

final class LegacyProgressMapping {
    private LegacyProgressMapping() {}

    static LessonProgressDto.View lesson(String ref, JsonNode input) {
        object(input, "run", "completion");
        var current = lessonRun(input.path("run"), true, false);
        var completion = input.path("completion");
        if (absent(completion)) {
            require(!current.completed(), "MISSING_FIRST_COMPLETION");
            return new LessonProgressDto.View(ref, List.of(current));
        }
        object(completion, "run", "completedAt");
        var first = lessonRun(completion.path("run"), false, true);
        require(instant(completion.path("completedAt")).equals(first.finishedAt()), "INCONSISTENT_COMPLETION");
        if (first.runRef().equals(current.runRef())) {
            var folded = lessonRun(input.path("run"), false, true);
            require(folded.completed() && first.finishedAt().equals(folded.finishedAt())
                    && first.startedAt().equals(folded.startedAt()), "INCONSISTENT_SAME_RUN_MILESTONE");
            return new LessonProgressDto.View(ref, List.of(lessonRun(input.path("run"), true, true)),
                    first.equals(folded) ? null : first);
        }
        return new LessonProgressDto.View(ref, byReference(current, first, LessonProgressDto.Attempt::runRef));
    }

    private static LessonProgressDto.Attempt lessonRun(JsonNode input, boolean current, boolean first) {
        object(input, "id", "blockId", "startedAt", "finishedAt", "activeMs", "visitedBlockIds", "activities");
        var start = instant(input.path("startedAt"));
        var finish = optionalInstant(input.path("finishedAt"));
        ordered(start, finish);
        return new LessonProgressDto.Attempt(id(input.path("id")), current, finish != null, first, start, finish, null,
                id(input.path("blockId")), array(input.path("visitedBlockIds"), LegacyValues::id),
                number(input.path("activeMs")), entries(input.path("activities"), LegacyProgressMapping::activity));
    }

    private static LessonProgressDto.ActivityView activity(JsonNode input) {
        object(input, "activityId", "finished", "textActivityIds", "heardActivityIds", "attempts");
        return new LessonProgressDto.ActivityView(id(input.path("activityId")), bool(input.path("finished")),
                array(input.path("textActivityIds"), LegacyValues::id),
                array(input.path("heardActivityIds"), LegacyValues::id), attempts(input.path("attempts")));
    }

    static ReadingProgressDto.View reading(String ref, JsonNode input) {
        object(input, "run", "completion", "readChapterIds", "activeMs");
        var current = readingRun(input.path("run"), true, null);
        var completion = input.path("completion");
        List<ReadingProgressDto.Attempt> runs = List.of(current);
        ReadingProgressDto.Attempt legacyFirst = null;
        if (!absent(completion)) {
            object(completion, "run", "completedAt");
            var finished = instant(completion.path("completedAt"));
            var first = readingRun(completion.path("run"), false, finished);
            if (first.runRef().equals(current.runRef())) {
                require(first.startedAt().equals(current.startedAt()), "INCONSISTENT_SAME_RUN_MILESTONE");
                if (!first.equals(readingRun(input.path("run"), false, finished))) legacyFirst = first;
                runs = List.of(readingRun(input.path("run"), true, finished));
            } else {
                runs = byReference(current, first, ReadingProgressDto.Attempt::runRef);
            }
        }
        var marks = array(input.path("readChapterIds"), LegacyValues::id).stream().distinct().sorted()
                .map(chapter -> new ReadingProgressDto.ReadMark(chapter, null)).toList();
        return new ReadingProgressDto.View(ref, number(input.path("activeMs")), marks, runs, legacyFirst);
    }

    private static ReadingProgressDto.Attempt readingRun(JsonNode input, boolean current, Instant completedAt) {
        object(input, "id", "chapterId", "startedAt", "chapters", "activeMs");
        var start = instant(input.path("startedAt"));
        ordered(start, completedAt);
        return new ReadingProgressDto.Attempt(id(input.path("id")), current, completedAt != null, start, completedAt, null,
                id(input.path("chapterId")), number(input.path("activeMs")),
                entries(input.path("chapters"), LegacyProgressMapping::chapter));
    }

    private static ReadingProgressDto.ChapterView chapter(JsonNode input) {
        object(input, "paragraphId", "readAt", "practice");
        var paragraph = input.path("paragraphId");
        var date = optionalInstant(input.path("readAt"));
        var practice = input.path("practice");
        return new ReadingProgressDto.ChapterView(absent(paragraph) ? null : id(paragraph), date != null, date,
                absent(practice) ? null : practice(practice));
    }

    private static ReadingProgressDto.PracticeView practice(JsonNode input) {
        object(input, "index", "finished", "attempts");
        return new ReadingProgressDto.PracticeView(number(input.path("index")), bool(input.path("finished")),
                attempts(input.path("attempts")));
    }

    private static Map<String, ExerciseSnapshots.View> attempts(JsonNode input) {
        return entries(input, value -> {
            object(value, "answer", "status", "reviewedAt", "submissions");
            var draft = value.path("answer");
            var status = enumeration(Status.class, value.path("status"));
            var reviewed = optionalInstant(value.path("reviewedAt"));
            var history = array(value.path("submissions"), LegacyProgressMapping::submission);
            require(!draft.isMissingNode(), "MISSING_EXERCISE_DRAFT");
            var last = history.isEmpty() ? null : history.getLast();
            require((status == Status.REVIEWED) == (reviewed != null), "INCONSISTENT_EXERCISE_STATUS");
            if (status != Status.EDITING) {
                require(!draft.isNull() && last != null && last.correct() == (status == Status.CORRECT),
                        "INCONSISTENT_EXERCISE_STATUS");
            }
            if (reviewed != null) ordered(last.submittedAt(), reviewed);
            return new ExerciseSnapshots.View(draft.isNull() ? null : answer(draft), status, reviewed, history);
        });
    }

    private static ExerciseSnapshots.SubmissionView submission(JsonNode input) {
        object(input, "answer", "correct", "submittedAt", "mode");
        return new ExerciseSnapshots.SubmissionView(answer(input.path("answer")), bool(input.path("correct")),
                instant(input.path("submittedAt")), enumeration(Mode.class, input.path("mode")));
    }

    private static JsonNode answer(JsonNode input) {
        String kind = string(input.path("kind"), 32);
        switch (kind) {
            case "multiple-choice" -> id(object(input, "kind", "optionId").path("optionId"));
            case "true-or-false" -> bool(object(input, "kind", "value").path("value"));
            case "sentence-builder" -> array(object(input, "kind", "tileIds").path("tileIds"), LegacyValues::id);
            case "sequence-ordering" -> array(object(input, "kind", "itemIds").path("itemIds"), LegacyValues::id);
            case "fill-in-the-blanks" -> entries(object(input, "kind", "values").path("values"), value -> string(value, 4096));
            case "matching-pairs" -> entries(object(input, "kind", "pairs").path("pairs"), value ->
                    value.isString() && value.stringValue().isEmpty() ? "" : id(value));
            default -> throw new Invalid("UNSUPPORTED_ANSWER_TYPE");
        }
        return input;
    }

    private static <T> List<T> byReference(T current, T first, java.util.function.Function<T, String> ref) {
        var result = new ArrayList<>(List.of(current, first));
        result.sort(Comparator.comparing(ref));
        return result;
    }
}
