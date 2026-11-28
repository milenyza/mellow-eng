package com.mellow.backend.reading.application;

import com.mellow.backend.exercise.persistence.ExerciseResult;
import com.mellow.backend.exercise.persistence.ExerciseResultRepository;
import com.mellow.backend.progress.api.ExerciseSnapshots;
import com.mellow.backend.progress.api.TrustedLearner;
import com.mellow.backend.progress.application.ExerciseProgress;
import com.mellow.backend.progress.application.ProgressCatalog;
import com.mellow.backend.progress.application.ProgressSupport;
import com.mellow.backend.reading.api.ReadingProgressDto.*;
import com.mellow.backend.reading.persistence.*;
import com.mellow.backend.study.persistence.RecordedDate;
import jakarta.persistence.EntityManager;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import tools.jackson.databind.json.JsonMapper;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.UUID;

import static com.mellow.backend.progress.application.ProgressCatalog.known;
import static com.mellow.backend.progress.application.ProgressSupport.*;

@Service
public class ReadingProgressService {

    private final StoryProgressRepository stories;
    private final ReadingRunRepository runs;
    private final ReadingChapterRepository chapters;
    private final ExerciseResultRepository results;
    private final ExerciseProgress exercises;
    private final ProgressCatalog catalog;
    private final ProgressSupport support;
    private final EntityManager entities;
    private final JsonMapper json;

    public ReadingProgressService(StoryProgressRepository stories, ReadingRunRepository runs, ReadingChapterRepository chapters,
                                   ExerciseResultRepository results, ExerciseProgress exercises, ProgressCatalog catalog,
                                   ProgressSupport support, EntityManager entities, JsonMapper json) {
        this.stories = stories;
        this.runs = runs;
        this.chapters = chapters;
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
        return stories.findByLearner_IdOrderByStoryRefAsc(owner).stream()
                .map(story -> view(owner, story, history(owner, story.storyRef()))).toList();
    }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public View get(TrustedLearner identity, String story) {
        return find(identity, story).orElseThrow(ProgressSupport::notFound);
    }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public Optional<View> find(TrustedLearner identity, String story) {
        UUID owner = identity.id();
        support.verifyOwner(owner);
        return stories.findByLearner_IdAndStoryRef(owner, story)
                .map(record -> view(owner, record, history(owner, story)));
    }

    @Transactional
    public View put(TrustedLearner identity, String story, String reference, Write input, String match, String noneMatch) {
        UUID owner = identity.id();
        var learner = support.lockOwner(owner);
        var record = stories.findByLearner_IdAndStoryRef(owner, story).orElse(null);
        var history = record == null ? List.<ReadingRun>of() : history(owner, story);
        var before = record == null ? null : view(owner, record, history);
        var previous = before == null ? null : before.attempts().stream()
                .filter(attempt -> attempt.runRef().equals(reference)).findFirst().orElse(null);
        if (matches(input, previous)) return before;
        Attempt next;
        try {
            next = plan(story, reference, input, previous, history.stream().anyMatch(ReadingRun::firstCompletion), now());
        } catch (ResponseStatusException error) {
            if (previous != null && previous.current() && error.getStatusCode() == HttpStatus.CONFLICT) {
                support.requirePrecondition(before, match, noneMatch);
            }
            throw error;
        }
        if (next.equals(previous)) return before;
        if (previous != null && !previous.current()) throw conflict("Superseded reading attempts are immutable.");
        support.requirePrecondition(before, match, noneMatch);
        long delta = next.activeMs() - (previous == null ? 0 : previous.activeMs());
        if (before != null && delta > MAX_MS - before.lifetimeActiveMs()) throw conflict("Reading duration is outside its supported range.");
        if (record == null) record = stories.save(new StoryProgress(learner, story, 0, Set.of()));
        var run = history.stream().filter(item -> item.runRef().equals(reference)).findFirst().orElse(null);
        if (run == null) {
            history.stream().filter(ReadingRun::currentRun).forEach(ReadingRun::supersede);
            entities.flush();
            run = runs.save(new ReadingRun(record, reference, next.chapterRef(), true, false,
                    new RecordedDate(null, null), next.startedAt(), next.activeMs()));
        } else {
            run.update(next.chapterRef(), next.activeMs());
        }
        if (next.firstCompletion() && (previous == null || !previous.firstCompletion())) run.completeFirst(next.completedAt());
        record.addActiveTime(delta);
        for (var chapter : next.chapters().entrySet()) {
            if (chapter.getValue().read()) record.markChapter(chapter.getKey());
        }
        writeChapters(owner, run, next.chapters());
        entities.flush();
        return view(owner, record, history(owner, story));
    }

    private static boolean matches(Write input, Attempt retained) {
        return retained != null && Objects.equals(input.startedAt(), retained.startedAt())
                && input.chapterRef().equals(retained.chapterRef()) && input.activeMs() == retained.activeMs()
                && input.chapters().keySet().equals(retained.chapters().keySet())
                && input.chapters().entrySet().stream().allMatch(entry -> {
                    var requested = entry.getValue();
                    var stored = retained.chapters().get(entry.getKey());
                    return Objects.equals(requested.paragraphRef(), stored.paragraphRef()) && requested.read() == stored.read()
                            && matchesPractice(requested.practice(), stored.practice());
                });
    }

    private static boolean matchesPractice(PracticeWrite input, PracticeView retained) {
        if (input == null || retained == null) return input == null && retained == null;
        return input.index() == retained.index() && input.finished() == retained.finished()
                && ExerciseProgress.matches(input.exercises(), retained.exercises());
    }

    private Attempt plan(String story, String reference, Write input, Attempt previous, boolean firstExists, Instant time) {
        var definition = catalog.story(story);
        known(definition, input.chapterRef());
        if (previous == null) validateTime(input.startedAt(), null, time);
        if (previous != null && (!Objects.equals(previous.startedAt(), input.startedAt())
                || input.activeMs() < previous.activeMs() || !input.chapters().keySet().containsAll(previous.chapters().keySet()))) {
            throw conflict("A reading snapshot cannot discard retained progress.");
        }
        var next = new TreeMap<String, ChapterView>();
        input.chapters().forEach((ref, incoming) -> {
            var metadata = known(definition, ref);
            if (incoming.paragraphRef() != null && !metadata.paragraphs().contains(incoming.paragraphRef())) {
                throw invalid("The paragraph does not belong to the chapter.");
            }
            var old = previous == null ? null : previous.chapters().get(ref);
            if (old != null && old.read() && !incoming.read()) throw conflict("A chapter read mark cannot be cleared.");
            Instant readAt = old != null && old.read() ? old.readAt() : incoming.read() ? time : null;
            next.put(ref, new ChapterView(incoming.paragraphRef(), incoming.read(), readAt,
                    practice(incoming.practice(), old == null ? null : old.practice(), metadata, input.startedAt(), time)));
        });
        boolean wasFirst = previous != null && previous.firstCompletion();
        boolean newFirst = !firstExists && definition.keySet().stream().allMatch(id -> next.containsKey(id) && next.get(id).read());
        return new Attempt(reference, previous == null || previous.current(), wasFirst || newFirst, input.startedAt(),
                wasFirst ? previous.completedAt() : newFirst ? time : null, wasFirst ? previous.completedOn() : null,
                input.chapterRef(), input.activeMs(), next);
    }

    private PracticeView practice(PracticeWrite input, PracticeView previous, ProgressCatalog.Chapter metadata, Instant start, Instant time) {
        if (input == null) {
            if (previous != null) throw conflict("Comprehension history cannot be removed.");
            return null;
        }
        if (previous != null && previous.finished() && !input.finished()) throw conflict("Finished comprehension cannot be reopened.");
        if (input.index() >= metadata.exerciseOrder().size()) throw invalid("The comprehension position is unavailable.");
        var before = previous == null ? Map.<String, ExerciseSnapshots.View>of() : previous.exercises();
        if (!input.exercises().keySet().containsAll(before.keySet())) throw conflict("Exercise history cannot be removed.");
        var next = new TreeMap<String, ExerciseSnapshots.View>();
        input.exercises().forEach((id, entry) -> next.put(id, exercises.validate(entry,
                known(metadata.exercises(), id), before.get(id), start, time, false)));
        if (input.finished() && metadata.exercises().keySet().stream().anyMatch(id ->
                !next.containsKey(id) || !next.get(id).resolved())) {
            throw conflict("A finished comprehension activity needs resolved results.");
        }
        return new PracticeView(input.index(), input.finished(), next);
    }

    private List<ReadingRun> history(UUID owner, String story) {
        return runs.findByStoryProgress_Learner_IdAndStoryProgress_StoryRefOrderByRunRefAsc(owner, story);
    }

    private View view(UUID owner, StoryProgress story, List<ReadingRun> history) {
        var first = history.stream().map(ReadingRun::legacyFirstSnapshot).filter(Objects::nonNull)
                .findFirst().map(value -> json.readValue(value, Attempt.class)).orElse(null);
        return new View(story.storyRef(), story.lifetimeActiveMs(), story.readChapters().stream()
                .map(mark -> new ReadMark(mark.chapterRef(), mark.readOn())).sorted(Comparator.comparing(ReadMark::chapterRef)).toList(),
                history.stream().map(run -> attempt(owner, run)).toList(), first);
    }

    private Attempt attempt(UUID owner, ReadingRun run) {
        var snapshots = new TreeMap<String, ChapterView>();
        for (var chapter : chapters.findByRun_StoryProgress_Learner_IdAndRun_Id(owner, run.id())) {
            PracticeView practice = null;
            if (chapter.practiceIndex() != null) {
                var answers = new TreeMap<String, ExerciseSnapshots.View>();
                for (var result : results.findByReadingChapter_Run_StoryProgress_Learner_IdAndReadingChapter_Id(owner, chapter.id())) {
                    answers.put(result.exerciseRef(), exercises.read(result));
                }
                practice = new PracticeView(chapter.practiceIndex(), chapter.practiceFinished(), answers);
            }
            snapshots.put(chapter.chapterRef(), new ChapterView(chapter.paragraphRef(), chapter.readAt() != null, chapter.readAt(), practice));
        }
        return new Attempt(run.runRef(), run.currentRun(), run.firstCompletion(), run.startedAt(), run.completedAt(),
                run.completedOn(), run.chapterRef(), run.activeMs(), snapshots);
    }

    private void writeChapters(UUID owner, ReadingRun run, Map<String, ChapterView> snapshots) {
        var existing = new TreeMap<String, ReadingChapter>();
        chapters.findByRun_StoryProgress_Learner_IdAndRun_Id(owner, run.id()).forEach(row -> existing.put(row.chapterRef(), row));
        snapshots.forEach((ref, snapshot) -> {
            var practice = snapshot.practice();
            Long index = practice == null ? null : practice.index();
            Boolean finished = practice == null ? null : practice.finished();
            var row = existing.get(ref);
            if (row == null) {
                row = chapters.save(new ReadingChapter(run, ref, snapshot.paragraphRef(), snapshot.readAt(), index, finished));
            } else {
                row.update(snapshot.paragraphRef(), snapshot.readAt(), index, finished);
            }
            if (practice == null) return;
            var parent = row;
            var known = new TreeMap<String, ExerciseResult>();
            results.findByReadingChapter_Run_StoryProgress_Learner_IdAndReadingChapter_Id(owner, row.id())
                    .forEach(result -> known.put(result.exerciseRef(), result));
            practice.exercises().forEach((id, state) -> {
                var result = known.get(id);
                if (result == null) {
                    result = ExerciseResult.reading(parent, id, null, ExerciseResult.Status.EDITING, null, List.of());
                    exercises.write(result, state);
                    results.save(result);
                } else {
                    exercises.write(result, state);
                }
            });
        });
    }
}
