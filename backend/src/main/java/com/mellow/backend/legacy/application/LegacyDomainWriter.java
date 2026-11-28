package com.mellow.backend.legacy.application;

import com.mellow.backend.exercise.persistence.ExerciseResult;
import com.mellow.backend.exercise.persistence.ExerciseResultRepository;
import com.mellow.backend.flashcards.persistence.FlashcardSession;
import com.mellow.backend.flashcards.persistence.FlashcardSessionRepository;
import com.mellow.backend.games.persistence.GameSession;
import com.mellow.backend.games.persistence.GameSessionRepository;
import com.mellow.backend.learner.persistence.Learner;
import com.mellow.backend.learner.persistence.LearnerPreferences;
import com.mellow.backend.learner.persistence.LearnerPreferencesRepository;
import com.mellow.backend.lesson.api.LessonProgressDto;
import com.mellow.backend.lesson.persistence.LessonActivity;
import com.mellow.backend.lesson.persistence.LessonActivityRepository;
import com.mellow.backend.lesson.persistence.LessonRun;
import com.mellow.backend.lesson.persistence.LessonRunRepository;
import com.mellow.backend.practical.persistence.SimulationSession;
import com.mellow.backend.practical.persistence.SimulationSessionRepository;
import com.mellow.backend.progress.application.ExerciseProgress;
import com.mellow.backend.reading.api.ReadingProgressDto;
import com.mellow.backend.reading.persistence.ReadingChapter;
import com.mellow.backend.reading.persistence.ReadingChapterRepository;
import com.mellow.backend.reading.persistence.ReadingRun;
import com.mellow.backend.reading.persistence.ReadingRunRepository;
import com.mellow.backend.reading.persistence.StoryProgress;
import com.mellow.backend.reading.persistence.StoryProgressRepository;
import com.mellow.backend.study.api.SessionDto;
import com.mellow.backend.study.persistence.CombinedStudyDay;
import com.mellow.backend.study.persistence.CombinedStudyDayRepository;
import com.mellow.backend.study.persistence.CompletedSession;
import com.mellow.backend.study.persistence.RecordedDate;
import com.mellow.backend.vocabulary.persistence.VocabularyAnnotation;
import com.mellow.backend.vocabulary.persistence.VocabularyAnnotationRepository;
import com.mellow.backend.vocabulary.persistence.VocabularyFavorite;
import com.mellow.backend.vocabulary.persistence.VocabularyFavoriteRepository;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

import static com.mellow.backend.legacy.application.LegacyNormalizer.*;

@Component
class LegacyDomainWriter {
    private final LessonRunRepository lessons;
    private final LessonActivityRepository activities;
    private final StoryProgressRepository stories;
    private final ReadingRunRepository reading;
    private final ReadingChapterRepository chapters;
    private final ExerciseResultRepository results;
    private final ExerciseProgress exercises;
    private final GameSessionRepository games;
    private final SimulationSessionRepository simulations;
    private final FlashcardSessionRepository flashcards;
    private final CombinedStudyDayRepository days;
    private final VocabularyFavoriteRepository favorites;
    private final VocabularyAnnotationRepository annotations;
    private final LearnerPreferencesRepository preferences;
    private final JsonMapper json;

    LegacyDomainWriter(LessonRunRepository lessons, LessonActivityRepository activities, StoryProgressRepository stories,
                       ReadingRunRepository reading, ReadingChapterRepository chapters, ExerciseResultRepository results,
                       ExerciseProgress exercises, GameSessionRepository games, SimulationSessionRepository simulations,
                       FlashcardSessionRepository flashcards, CombinedStudyDayRepository days,
                       VocabularyFavoriteRepository favorites, VocabularyAnnotationRepository annotations,
                       LearnerPreferencesRepository preferences, JsonMapper json) {
        this.lessons = lessons;
        this.activities = activities;
        this.stories = stories;
        this.reading = reading;
        this.chapters = chapters;
        this.results = results;
        this.exercises = exercises;
        this.games = games;
        this.simulations = simulations;
        this.flashcards = flashcards;
        this.days = days;
        this.favorites = favorites;
        this.annotations = annotations;
        this.preferences = preferences;
        this.json = json;
    }

    void insert(Learner owner, Candidate record, Instant importedAt) {
        switch (record.value()) {
            case LessonProgressDto.View value -> lesson(owner, value);
            case ReadingProgressDto.View value -> story(owner, value);
            case StudyDay value -> days.save(new CombinedStudyDay(owner, value.day(), value.activeMs()));
            case SessionDto.GameView value -> game(owner, value);
            case SessionDto.SimulationView value -> simulation(owner, value);
            case SessionDto.FlashcardView value -> flashcard(owner, value);
            case Favorite value -> favorites.save(new VocabularyFavorite(owner, value.reference(), new RecordedDate(value.savedAt(), null)));
            case Annotation value -> annotations.save(new VocabularyAnnotation(owner, value.reference(), value.note(), value.example(),
                    value.familiarity(), value.createdAt(), value.updatedAt()));
            case Preferences value -> preferences.save(new LearnerPreferences(owner, value.fontSize(), value.translations(), importedAt));
            default -> throw new IllegalStateException("Unsupported legacy domain record");
        }
    }

    private void lesson(Learner owner, LessonProgressDto.View view) {
        for (var attempt : view.attempts()) {
            var run = new LessonRun(owner, view.lessonRef(), attempt.runRef(), attempt.blockRef(),
                    array(attempt.visitedBlockRefs()), attempt.startedAt(), attempt.activeMs(), attempt.current(),
                    attempt.completed(), attempt.firstCompletion(), new RecordedDate(attempt.finishedAt(), attempt.finishedOn()));
            if (attempt.firstCompletion() && view.legacyFirstCompletionSnapshot() != null) {
                run.retainLegacyFirstSnapshot(json.writeValueAsString(view.legacyFirstCompletionSnapshot()));
            }
            lessons.save(run);
            attempt.activities().forEach((ref, item) -> {
                var act = activities.save(new LessonActivity(run, ref, item.activityRef(), item.finished(),
                        array(item.textActivityRefs()), array(item.heardActivityRefs())));
                item.exercises().forEach((exerciseRef, state) -> {
                    var row = ExerciseResult.lesson(act, exerciseRef, null, ExerciseResult.Status.EDITING, null, List.of());
                    exercises.write(row, state);
                    results.save(row);
                });
            });
        }
    }

    private void story(Learner owner, ReadingProgressDto.View view) {
        var marks = view.readChapters().stream().map(mark -> new StoryProgress.ReadChapter(mark.chapterRef(), mark.readOn()))
                .collect(Collectors.toSet());
        var story = stories.save(new StoryProgress(owner, view.storyRef(), view.lifetimeActiveMs(), marks));
        for (var attempt : view.attempts()) {
            var run = new ReadingRun(story, attempt.runRef(), attempt.chapterRef(), attempt.current(),
                    attempt.firstCompletion(), new RecordedDate(attempt.completedAt(), attempt.completedOn()),
                    attempt.startedAt(), attempt.activeMs());
            if (attempt.firstCompletion() && view.legacyFirstCompletionSnapshot() != null) {
                run.retainLegacyFirstSnapshot(json.writeValueAsString(view.legacyFirstCompletionSnapshot()));
            }
            reading.save(run);
            attempt.chapters().forEach((ref, item) -> {
                var practice = item.practice();
                var chapter = chapters.save(new ReadingChapter(run, ref, item.paragraphRef(), item.readAt(),
                        practice == null ? null : practice.index(), practice == null ? null : practice.finished()));
                if (practice == null) return;
                practice.exercises().forEach((exerciseRef, state) -> {
                    var row = ExerciseResult.reading(chapter, exerciseRef, null, ExerciseResult.Status.EDITING, null, List.of());
                    exercises.write(row, state);
                    results.save(row);
                });
            });
        }
    }

    private void game(Learner owner, SessionDto.GameView view) {
        var header = view.session();
        var details = new GameSession.ResultDetails(view.kind(), view.vocabularySource(), view.firstAttemptCorrect(),
                view.roundsCompleted(), view.topic(), view.totalPairs(), view.incorrectAttempts());
        var vocabulary = view.vocabulary().stream()
                .map(word -> new GameSession.Vocabulary(word.vocabularyRef(), word.reviewPosition())).toList();
        var challenges = view.challenges().stream()
                .map(item -> new GameSession.SentenceChallenge(item.challengeRef(), item.reviewed(), array(item.incorrectAnswers())))
                .toList();
        var stored = new GameSession(owner, header.sessionRef(), timing(header), view.level().name(), view.difficulty(),
                view.answeredCount(), view.correctCount(), details, vocabulary, challenges, header.timing().studyDays());
        stored.markLegacyImported();
        games.save(stored);
    }

    private void simulation(Learner owner, SessionDto.SimulationView view) {
        var header = view.session();
        var attempts = view.attempts().stream().map(item ->
                new SimulationSession.Attempt(item.nodeRef(), item.choiceRef(), item.fit())).toList();
        var stored = new SimulationSession(owner, header.sessionRef(), timing(header), view.situationRef(), view.scenarioRef(),
                view.decisionsCompleted(), view.reviewedCorrections(), attempts, header.timing().studyDays());
        stored.markLegacyImported();
        simulations.save(stored);
    }

    private void flashcard(Learner owner, SessionDto.FlashcardView view) {
        var header = view.session();
        var config = view.configuration();
        var options = new FlashcardSession.Configuration(config.direction(), config.requestedLength(), config.scope(),
                config.filterSource(), config.filterType(), config.filterLevel() == null ? null : config.filterLevel().name(),
                config.filterFamiliarity(), config.usedSearch());
        var recalls = view.recalls().stream().map(item ->
                new FlashcardSession.Recall(item.vocabularyRef(), item.direction(), item.rating())).toList();
        var stored = new FlashcardSession(owner, header.sessionRef(), timing(header), options, recalls, header.timing().studyDays());
        stored.markLegacyImported();
        flashcards.save(stored);
    }

    private static CompletedSession.Timing timing(SessionDto.Header header) {
        var time = header.timing();
        return new CompletedSession.Timing(time.startedAt(), time.completedAt(), time.activeMs());
    }

    private static String[] array(List<String> values) {
        return values.toArray(String[]::new);
    }
}
