package com.mellow.backend.lesson.application;

import com.mellow.backend.exercise.persistence.ExerciseResult;
import com.mellow.backend.exercise.persistence.ExerciseResultRepository;
import com.mellow.backend.lesson.api.LessonProgressDto.*;
import com.mellow.backend.lesson.persistence.LessonActivity;
import com.mellow.backend.lesson.persistence.LessonActivityRepository;
import com.mellow.backend.lesson.persistence.LessonRun;
import com.mellow.backend.lesson.persistence.LessonRunRepository;
import com.mellow.backend.progress.api.ExerciseSnapshots;
import com.mellow.backend.progress.api.TrustedLearner;
import com.mellow.backend.progress.application.ExerciseProgress;
import com.mellow.backend.progress.application.ProgressCatalog;
import com.mellow.backend.progress.application.ProgressSupport;
import com.mellow.backend.study.persistence.RecordedDate;
import jakarta.persistence.EntityManager;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import tools.jackson.databind.json.JsonMapper;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;

import static com.mellow.backend.progress.application.ProgressCatalog.known;
import static com.mellow.backend.progress.application.ProgressSupport.*;

@Service
public class LessonProgressService {

    private final LessonRunRepository runs;
    private final LessonActivityRepository activities;
    private final ExerciseResultRepository results;
    private final ExerciseProgress exercises;
    private final ProgressCatalog catalog;
    private final ProgressSupport support;
    private final EntityManager entities;
    private final JsonMapper json;

    public LessonProgressService(LessonRunRepository runs, LessonActivityRepository activities,
                                 ExerciseResultRepository results, ExerciseProgress exercises,
                                 ProgressCatalog catalog, ProgressSupport support, EntityManager entities, JsonMapper json) {
        this.runs = runs;
        this.activities = activities;
        this.results = results;
        this.exercises = exercises;
        this.catalog = catalog;
        this.support = support;
        this.entities = entities;
        this.json = json;
    }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public List<View> list(TrustedLearner identity) {
        UUID owner = identity.id();
        support.verifyOwner(owner);
        var grouped = new LinkedHashMap<String, List<LessonRun>>();
        for (var run : runs.findByLearner_IdOrderByLessonRefAscRunRefAsc(owner)) {
            grouped.computeIfAbsent(run.lessonRef(), key -> new java.util.ArrayList<>()).add(run);
        }
        return grouped.entrySet().stream().map(entry -> view(owner, entry.getKey(), entry.getValue())).toList();
    }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public View get(TrustedLearner identity, String lesson) {
        return find(identity, lesson).orElseThrow(ProgressSupport::notFound);
    }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public Optional<View> find(TrustedLearner identity, String lesson) {
        UUID owner = identity.id();
        support.verifyOwner(owner);
        var records = runs.findByLearner_IdAndLessonRefOrderByRunRefAsc(owner, lesson);
        return records.isEmpty() ? Optional.empty() : Optional.of(view(owner, lesson, records));
    }

    @Transactional
    public View put(TrustedLearner identity, String lesson, String reference, Write input, String match, String noneMatch) {
        UUID owner = identity.id();
        var learner = support.lockOwner(owner);
        var records = runs.findByLearner_IdAndLessonRefOrderByRunRefAsc(owner, lesson);
        var before = view(owner, lesson, records);
        var prior = before.attempts().stream().filter(attempt -> attempt.runRef().equals(reference)).findFirst().orElse(null);
        if (matches(input, prior)) return before;
        Attempt next;
        try {
            next = plan(lesson, reference, input, prior,
                    before.attempts().stream().anyMatch(Attempt::firstCompletion), now());
        } catch (ResponseStatusException error) {
            if (prior != null && prior.current() && !prior.completed() && error.getStatusCode() == HttpStatus.CONFLICT) {
                support.requirePrecondition(before, match, noneMatch);
            }
            throw error;
        }
        if (next.equals(prior)) return before;
        if (prior != null && (!prior.current() || prior.completed())) {
            throw conflict("Finished or superseded lesson attempts are immutable.");
        }
        support.requirePrecondition(records.isEmpty() ? null : before, match, noneMatch);
        var run = records.stream().filter(entry -> entry.runRef().equals(reference)).findFirst().orElse(null);
        if (run == null) {
            records.stream().filter(LessonRun::currentRun).forEach(LessonRun::supersede);
            entities.flush();
            run = runs.save(new LessonRun(learner, lesson, reference, input.blockRef(), array(input.visitedBlockRefs()),
                    input.startedAt(), input.activeMs(), true, false, false, new RecordedDate(null, null)));
        } else {
            run.update(next.blockRef(), array(next.visitedBlockRefs()), next.activeMs());
        }
        if (next.completed()) run.complete(next.finishedAt(), next.firstCompletion());
        writeActivities(owner, run, next.activities());
        entities.flush();
        return view(owner, lesson, runs.findByLearner_IdAndLessonRefOrderByRunRefAsc(owner, lesson));
    }

    private static boolean matches(Write input, Attempt retained) {
        return retained != null && Objects.equals(input.startedAt(), retained.startedAt())
                && input.blockRef().equals(retained.blockRef()) && input.activeMs() == retained.activeMs()
                && input.complete() == retained.completed() && input.visitedBlockRefs().equals(retained.visitedBlockRefs())
                && input.activities().keySet().equals(retained.activities().keySet())
                && input.activities().entrySet().stream().allMatch(entry -> {
                    var requested = entry.getValue();
                    var stored = retained.activities().get(entry.getKey());
                    return requested.activityRef().equals(stored.activityRef()) && requested.finished() == stored.finished()
                            && requested.textActivityRefs().equals(stored.textActivityRefs())
                            && requested.heardActivityRefs().equals(stored.heardActivityRefs())
                            && ExerciseProgress.matches(requested.exercises(), stored.exercises());
                });
    }

    private Attempt plan(String lesson, String reference, Write input, Attempt previous, boolean firstExists, Instant time) {
        var definition = catalog.lesson(lesson);
        known(definition, input.blockRef());
        validateReferences(input.visitedBlockRefs(), definition.keySet());
        if (!input.visitedBlockRefs().contains(input.blockRef())) throw invalid("The current block must have been visited.");
        if (previous == null) validateTime(input.startedAt(), null, time);
        if (previous != null && (!Objects.equals(previous.startedAt(), input.startedAt())
                || input.activeMs() < previous.activeMs() || !prefix(previous.visitedBlockRefs(), input.visitedBlockRefs())
                || (previous.completed() && !input.complete())
                || !input.activities().keySet().containsAll(previous.activities().keySet()))) {
            throw conflict("A lesson snapshot cannot discard retained progress.");
        }
        var projected = new TreeMap<String, ActivityView>();
        input.activities().forEach((block, activity) -> {
            var meta = known(definition, block);
            if (!input.visitedBlockRefs().contains(block)) throw invalid("An activity's block must have been visited.");
            known(meta.exercises(), activity.activityRef());
            validateReferences(activity.textActivityRefs(), meta.listeningRefs());
            validateReferences(activity.heardActivityRefs(), meta.listeningRefs());
            var old = previous == null ? null : previous.activities().get(block);
            if (old != null && (!activity.textActivityRefs().containsAll(old.textActivityRefs())
                    || !activity.heardActivityRefs().containsAll(old.heardActivityRefs())
                    || (old.finished() && !activity.finished()))) {
                throw conflict("Retained activity evidence cannot be removed.");
            }
            var evaluated = evaluate(activity.exercises(), meta.exercises(),
                    old == null ? Map.of() : old.exercises(), input.startedAt(), time, !meta.listeningRefs().isEmpty());
            evaluated.forEach((id, result) -> {
                if (result.submissions().stream().anyMatch(submission ->
                        (submission.mode() == ExerciseResult.Mode.TEXT_ALTERNATIVE && !activity.textActivityRefs().contains(id))
                        || (submission.mode() == ExerciseResult.Mode.LISTENING && !activity.heardActivityRefs().contains(id)))) {
                    throw invalid("A listening submission is missing its reported mode evidence.");
                }
            });
            var next = new ActivityView(activity.activityRef(), activity.finished(), activity.textActivityRefs(),
                    activity.heardActivityRefs(), evaluated);
            if (activity.finished() && !resolved(meta.exercises(), evaluated)) {
                throw conflict("A finished activity needs all required exercise results.");
            }
            projected.put(block, next);
        });
        boolean alreadyComplete = previous != null && previous.completed();
        if (input.complete() && !alreadyComplete) {
            definition.forEach((block, meta) -> {
                var activity = projected.get(block);
                if (meta.required() && (!input.visitedBlockRefs().contains(block)
                        || !resolved(meta.exercises(), activity == null ? Map.of() : activity.exercises()))) {
                    throw conflict("The lesson still has required blocks or exercises.");
                }
            });
        }
        return new Attempt(reference, previous == null || previous.current(), input.complete(),
                alreadyComplete ? previous.firstCompletion() : input.complete() && !firstExists,
                input.startedAt(), alreadyComplete ? previous.finishedAt() : input.complete() ? time : null,
                alreadyComplete ? previous.finishedOn() : null, input.blockRef(), input.visitedBlockRefs(), input.activeMs(), projected);
    }

    private Map<String, ExerciseSnapshots.View> evaluate(Map<String, ExerciseSnapshots.Input> requested,
            Map<String, ProgressCatalog.Rule> definition, Map<String, ExerciseSnapshots.View> previous,
            Instant start, Instant time, boolean listening) {
        if (!requested.keySet().containsAll(previous.keySet())) throw conflict("Exercise history cannot be removed.");
        var evaluated = new TreeMap<String, ExerciseSnapshots.View>();
        requested.forEach((reference, input) -> evaluated.put(reference,
                exercises.validate(input, known(definition, reference), previous.get(reference), start, time, listening)));
        return evaluated;
    }

    private static boolean resolved(Map<String, ProgressCatalog.Rule> required,
                                    Map<String, ExerciseSnapshots.View> results) {
        return required.entrySet().stream().filter(entry -> entry.getValue().required()).allMatch(entry ->
                results.containsKey(entry.getKey()) && results.get(entry.getKey()).resolved());
    }

    private static boolean prefix(List<String> prior, List<String> next) {
        return prior.size() <= next.size() && next.subList(0, prior.size()).equals(prior);
    }

    private View view(UUID owner, String lesson, List<LessonRun> records) {
        var first = records.stream().map(LessonRun::legacyFirstSnapshot).filter(Objects::nonNull)
                .findFirst().map(value -> json.readValue(value, Attempt.class)).orElse(null);
        return new View(lesson, records.stream().map(run -> attempt(owner, run)).toList(), first);
    }

    private Attempt attempt(UUID owner, LessonRun run) {
        var snapshots = new TreeMap<String, ActivityView>();
        for (var row : activities.findByRun_Learner_IdAndRun_Id(owner, run.id())) {
            var answers = new TreeMap<String, ExerciseSnapshots.View>();
            for (var result : results.findByLessonActivity_Run_Learner_IdAndLessonActivity_Id(owner, row.id())) {
                answers.put(result.exerciseRef(), exercises.read(result));
            }
            snapshots.put(row.blockRef(), new ActivityView(row.activityRef(), row.finished(),
                    List.of(row.textActivityRefs()), List.of(row.heardActivityRefs()), answers));
        }
        return new Attempt(run.runRef(), run.currentRun(), run.completed(), run.firstCompletion(), run.startedAt(),
                run.finish().at(), run.finish().on(), run.blockRef(), List.of(run.visitedBlockRefs()), run.activeMs(), snapshots);
    }

    private void writeActivities(UUID owner, LessonRun run, Map<String, ActivityView> snapshots) {
        var existing = new TreeMap<String, LessonActivity>();
        activities.findByRun_Learner_IdAndRun_Id(owner, run.id()).forEach(row -> existing.put(row.blockRef(), row));
        snapshots.forEach((block, snapshot) -> {
            var row = existing.get(block);
            if (row == null) {
                row = activities.save(new LessonActivity(run, block, snapshot.activityRef(), snapshot.finished(),
                        array(snapshot.textActivityRefs()), array(snapshot.heardActivityRefs())));
            } else {
                row.update(snapshot.activityRef(), snapshot.finished(),
                        array(snapshot.textActivityRefs()), array(snapshot.heardActivityRefs()));
            }
            var parent = row;
            var known = new TreeMap<String, ExerciseResult>();
            results.findByLessonActivity_Run_Learner_IdAndLessonActivity_Id(owner, row.id())
                    .forEach(result -> known.put(result.exerciseRef(), result));
            snapshot.exercises().forEach((id, state) -> {
                var result = known.get(id);
                if (result == null) {
                    result = ExerciseResult.lesson(parent, id, null, ExerciseResult.Status.EDITING, null, List.of());
                    exercises.write(result, state);
                    results.save(result);
                } else {
                    exercises.write(result, state);
                }
            });
        });
    }

    private static String[] array(List<String> values) {
        return values.toArray(String[]::new);
    }
}
