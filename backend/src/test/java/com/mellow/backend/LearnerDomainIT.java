package com.mellow.backend;

import com.mellow.backend.exercise.persistence.ExerciseResult;
import com.mellow.backend.exercise.persistence.ExerciseResultRepository;
import com.mellow.backend.flashcards.persistence.FlashcardSession;
import com.mellow.backend.flashcards.persistence.FlashcardSessionRepository;
import com.mellow.backend.games.persistence.GameSession;
import com.mellow.backend.games.persistence.GameSessionRepository;
import com.mellow.backend.learner.persistence.Learner;
import com.mellow.backend.learner.persistence.LearnerPreferences;
import com.mellow.backend.learner.persistence.LearnerPreferencesRepository;
import com.mellow.backend.learner.persistence.LearnerRepository;
import com.mellow.backend.lesson.persistence.LessonActivity;
import com.mellow.backend.lesson.persistence.LessonRun;
import com.mellow.backend.lesson.persistence.LessonRunRepository;
import com.mellow.backend.practical.persistence.SimulationSession;
import com.mellow.backend.practical.persistence.SimulationSessionRepository;
import com.mellow.backend.reading.persistence.ReadingChapter;
import com.mellow.backend.reading.persistence.ReadingRun;
import com.mellow.backend.reading.persistence.ReadingRunRepository;
import com.mellow.backend.reading.persistence.StoryProgress;
import com.mellow.backend.reading.persistence.StoryProgressRepository;
import com.mellow.backend.study.persistence.CombinedStudyDay;
import com.mellow.backend.study.persistence.CombinedStudyDayRepository;
import com.mellow.backend.study.persistence.CompletedSession;
import com.mellow.backend.study.persistence.RecordedDate;
import com.mellow.backend.vocabulary.persistence.VocabularyAnnotation;
import com.mellow.backend.vocabulary.persistence.VocabularyAnnotationRepository;
import com.mellow.backend.vocabulary.persistence.VocabularyFavorite;
import com.mellow.backend.vocabulary.persistence.VocabularyFavoriteRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import java.sql.SQLException;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
class LearnerDomainIT {

    private static final Instant AT = Instant.parse("2026-11-27T02:59:30.123Z");
    private static final LocalDate DAY = LocalDate.of(2026, 11, 26);
    private static final LocalDate NEXT_DAY = DAY.plusDays(1);
    private static final String WORD = "course/lesson/block/retired-context";
    private static final String ANSWER = "{\"kind\":\"true-or-false\",\"value\":false}";

    @Container
    static final PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:17.12-bookworm");

    @DynamicPropertySource
    static void databaseProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired private JdbcTemplate jdbc;
    @Autowired private TransactionTemplate transactions;
    @Autowired private EntityManager entities;
    @Autowired private LearnerRepository learners;
    @Autowired private LearnerPreferencesRepository preferences;
    @Autowired private LessonRunRepository lessons;
    @Autowired private StoryProgressRepository stories;
    @Autowired private ReadingRunRepository reading;
    @Autowired private ExerciseResultRepository results;
    @Autowired private GameSessionRepository games;
    @Autowired private SimulationSessionRepository simulations;
    @Autowired private FlashcardSessionRepository flashcards;
    @Autowired private VocabularyFavoriteRepository favorites;
    @Autowired private VocabularyAnnotationRepository annotations;
    @Autowired private CombinedStudyDayRepository daily;

    @Test
    void roundTripsOwnedLessonAndReadingSnapshotsIncludingUnpublishedReferencesAndUnknownDates() {
        transactions.executeWithoutResult(transaction -> {
            Learner first = learners.save(new Learner(AT));
            Learner other = learners.save(new Learner(AT));
            preferences.save(new LearnerPreferences(first, LearnerPreferences.ReadingFontSize.LARGE, true, AT));
            var unknownDate = new RecordedDate(null, null);
            var original = lessons.save(new LessonRun(first, "retired-lesson", "first-run", "intro",
                    new String[]{"intro"}, null, 1500, false, true, true, new RecordedDate(null, DAY)));
            lessons.save(new LessonRun(first, "retired-lesson", "current-run", "listen",
                    new String[]{"intro", "listen"}, AT, 500, true, false, false, unknownDate));
            var activity = new LessonActivity(original, "practice", "retired-activity", true,
                    new String[]{"used-text"}, new String[0]);
            entities.persist(activity);
            results.save(ExerciseResult.lesson(activity, "retired-exercise", ANSWER, ExerciseResult.Status.REVIEWED,
                    AT.plusSeconds(5), List.of(new ExerciseResult.Submission(ANSWER, false, AT,
                            ExerciseResult.Mode.TEXT_ALTERNATIVE))));

            var story = stories.save(new StoryProgress(first, "retired-story", 2500,
                    Set.of(new StoryProgress.ReadChapter("unknown", null),
                            new StoryProgress.ReadChapter("date-only", DAY))));
            var run = reading.save(new ReadingRun(story, "old-reading-run", "date-only", true,
                    true, unknownDate, AT, 1500));
            var chapter = new ReadingChapter(run, "date-only", "old-paragraph", null, 2L, false);
            entities.persist(chapter);
            results.save(ExerciseResult.reading(chapter, "optional", ANSWER, ExerciseResult.Status.CORRECT,
                    null, List.of(new ExerciseResult.Submission(ANSWER, true, AT,
                            ExerciseResult.Mode.PRACTICE))));
            daily.save(new CombinedStudyDay(first, DAY, 6000));
            entities.flush();
            entities.clear();

            assertThat(preferences.findByLearnerId(first.id()).orElseThrow().readingFontSize())
                    .isEqualTo(LearnerPreferences.ReadingFontSize.LARGE);
            assertThat(lessons.findByLearner_IdAndLessonRefAndCurrentRunTrue(first.id(), "retired-lesson")
                    .orElseThrow().runRef()).isEqualTo("current-run");
            assertThat(lessons.findByLearner_IdAndLessonRefAndCurrentRunTrue(other.id(), "retired-lesson")).isEmpty();
            assertThat(jdbc.queryForMap("SELECT finished_at, finished_on FROM mellow.lesson_run "
                    + "WHERE learner_id = ? AND first_completion", first.id())).containsEntry("finished_at", null)
                    .containsEntry("finished_on", java.sql.Date.valueOf(DAY));
            var lessonResult = results.findByLessonActivity_Run_Learner_IdAndLessonActivity_IdAndExerciseRef(
                    first.id(), activity.id(), "retired-exercise").orElseThrow();
            assertThat(lessonResult.status()).isEqualTo(ExerciseResult.Status.REVIEWED);
            assertThat(lessonResult.submissions()).singleElement().satisfies(submission -> {
                assertThat(submission.correct()).isFalse();
                assertThat(submission.mode()).isEqualTo(ExerciseResult.Mode.TEXT_ALTERNATIVE);
                assertThat(submission.answer()).contains("true-or-false");
            });
            assertThat(results.findByLessonActivity_Run_Learner_IdAndLessonActivity_IdAndExerciseRef(
                    other.id(), activity.id(), "retired-exercise")).isEmpty();
            assertThat(stories.findByLearner_IdAndStoryRef(first.id(), "retired-story").orElseThrow().readChapters())
                    .containsExactlyInAnyOrder(new StoryProgress.ReadChapter("unknown", null),
                            new StoryProgress.ReadChapter("date-only", DAY));
            assertThat(reading.findByStoryProgress_Learner_IdAndStoryProgress_StoryRefAndCurrentRunTrue(
                    first.id(), "retired-story").orElseThrow().chapterRef()).isEqualTo("date-only");
            assertThat(results.findByReadingChapter_Run_StoryProgress_Learner_IdAndReadingChapter_IdAndExerciseRef(
                    first.id(), chapter.id(), "optional").orElseThrow().submissions().getFirst().correct()).isTrue();
            assertThat(results.findByReadingChapter_Run_StoryProgress_Learner_IdAndReadingChapter_IdAndExerciseRef(
                    other.id(), chapter.id(), "optional")).isEmpty();
            assertThat(daily.findById(new CombinedStudyDay.Key(first.id(), DAY)).orElseThrow().activeMs()).isEqualTo(6000);
            assertThat(daily.findById(new CombinedStudyDay.Key(other.id(), DAY))).isEmpty();
        });
    }

    @Test
    void roundTripsOrderedModuleSpecificOutcomesAndPreservesNotesAndPastReviewsAfterUnfavoriting() {
        transactions.executeWithoutResult(transaction -> {
            Learner learner = learners.save(new Learner(AT));
            Learner other = learners.save(new Learner(AT));
            var timing = new CompletedSession.Timing(AT, AT.plusSeconds(60), 60_000);
            var buckets = Map.of(DAY, 30_000L, NEXT_DAY, 30_000L);
            games.save(new GameSession(learner, "same-legacy-ref", timing, "A1", GameSession.Difficulty.EASY,
                    3, 1, GameSession.ResultDetails.wordMatch(GameSession.Source.SAVED, 0, 1),
                    List.of(new GameSession.Vocabulary(WORD, 0)), List.of(), buckets));
            games.save(new GameSession(learner, "sentence-replay", timing, "A1", GameSession.Difficulty.EASY,
                    2, 0, GameSession.ResultDetails.sentenceBuilder(GameSession.Topic.TO_BE, 0),
                    List.of(), List.of(new GameSession.SentenceChallenge("old-challenge", true,
                            new String[]{"name my is", "my is name"})), buckets));
            games.save(new GameSession(learner, "memory-replay", timing, "A1", GameSession.Difficulty.BASIC,
                    3, 1, GameSession.ResultDetails.memory(GameSession.Source.SAVED, 1, 2),
                    List.of(new GameSession.Vocabulary(WORD, null)), List.of(), buckets));

            simulations.save(new SimulationSession(learner, "same-legacy-ref", timing, "old-situation",
                    "old-scenario", 2, 1,
                    List.of(new SimulationSession.Attempt("node-1", "wrong-context", SimulationSession.Fit.CONTEXT),
                            new SimulationSession.Attempt("node-1", "appropriate", SimulationSession.Fit.APPROPRIATE),
                            new SimulationSession.Attempt("node-2", "old-answer", SimulationSession.Fit.LANGUAGE)), buckets));
            var configuration = new FlashcardSession.Configuration(FlashcardSession.Direction.MIXED, null,
                    FlashcardSession.Scope.HISTORY, null, null, null, null, false);
            flashcards.save(new FlashcardSession(learner, "same-legacy-ref", timing, configuration,
                    List.of(new FlashcardSession.Recall(WORD, FlashcardSession.CardDirection.EN_PT,
                                    FlashcardSession.Rating.EFFORT),
                            new FlashcardSession.Recall("removed-vocabulary", FlashcardSession.CardDirection.PT_EN,
                                    FlashcardSession.Rating.FORGOT)), buckets));
            favorites.save(new VocabularyFavorite(learner, WORD, new RecordedDate(null, null)));
            annotations.save(new VocabularyAnnotation(learner, WORD, "Nota local", "My example",
                    VocabularyAnnotation.Familiarity.LEARNING, AT, AT));
            entities.flush();
            entities.clear();

            assertThat(games.findByLearner_IdAndSessionRef(learner.id(), "same-legacy-ref").orElseThrow().studyDays())
                    .isEqualTo(buckets);
            assertThat(games.findByLearner_IdAndSessionRef(learner.id(), "memory-replay").orElseThrow().kind())
                    .isEqualTo(GameSession.Kind.MEMORY_GAME);
            assertThat(games.findByLearner_IdAndSessionRef(learner.id(), "sentence-replay").orElseThrow()
                    .challenges().getFirst().incorrectAnswers()).containsExactly("name my is", "my is name");
            assertThat(games.findByLearner_IdAndSessionRef(other.id(), "same-legacy-ref")).isEmpty();
            assertThat(simulations.findByLearner_IdAndSessionRef(other.id(), "same-legacy-ref")).isEmpty();
            assertThat(flashcards.findByLearner_IdAndSessionRef(other.id(), "same-legacy-ref")).isEmpty();
            assertThat(simulations.findByLearner_IdAndSessionRef(learner.id(), "same-legacy-ref").orElseThrow().attempts())
                    .extracting(SimulationSession.Attempt::fit)
                    .containsExactly(SimulationSession.Fit.CONTEXT, SimulationSession.Fit.APPROPRIATE,
                            SimulationSession.Fit.LANGUAGE);
            assertThat(favorites.findByLearner_IdAndVocabularyRef(learner.id(), WORD).orElseThrow().saved())
                    .isEqualTo(new RecordedDate(null, null));
            assertThat(favorites.findOwnedReferences(other.id(), List.of(WORD))).isEmpty();
            var favorite = favorites.findByLearner_IdAndVocabularyRef(learner.id(), WORD).orElseThrow();
            favorite.changeMembership(false, java.time.Instant.now(), false);
            entities.flush();
            entities.clear();
            assertThat(favorites.findOwnedReferences(learner.id(), List.of(WORD))).isEmpty();
            assertThat(annotations.findByLearner_IdAndVocabularyRef(learner.id(), WORD).orElseThrow().note())
                    .isEqualTo("Nota local");
            assertThat(flashcards.findByLearner_IdAndSessionRef(learner.id(), "same-legacy-ref").orElseThrow().recalls())
                    .extracting(FlashcardSession.Recall::rating)
                    .containsExactly(FlashcardSession.Rating.EFFORT, FlashcardSession.Rating.FORGOT);
        });
    }

    @Test
    void databaseRejectsOrphansDuplicateSessionsAndInvalidValues() {
        UUID learnerId = jdbc.queryForObject("INSERT INTO mellow.learner DEFAULT VALUES RETURNING id", UUID.class);
        UUID otherId = jdbc.queryForObject("INSERT INTO mellow.learner DEFAULT VALUES RETURNING id", UUID.class);
        verifyConstraint("23503", () -> jdbc.update(
                "INSERT INTO mellow.vocabulary_favorite(learner_id, vocabulary_ref) VALUES (?, 'missing-content')",
                UUID.randomUUID()));
        verifyConstraint("23514", () -> jdbc.update(
                "INSERT INTO mellow.combined_study_day(learner_id, study_on, active_ms) VALUES (?, current_date, -1)",
                learnerId));
        verifyConstraint("23514", () -> jdbc.update(
                "INSERT INTO mellow.vocabulary_annotation(learner_id, vocabulary_ref, note) VALUES (?, 'word', repeat('a',1201))",
                learnerId));
        verifyConstraint("23514", () -> jdbc.update(
                "INSERT INTO mellow.vocabulary_annotation(learner_id, vocabulary_ref, personal_example) "
                        + "VALUES (?, 'word', repeat('a',401))", learnerId));
        verifyConstraint("23514", () -> jdbc.update(
                "INSERT INTO mellow.vocabulary_annotation(learner_id, vocabulary_ref, note) VALUES (?, 'astral', ?)",
                learnerId, "😀".repeat(601)));
        verifyConstraint("23514", () -> jdbc.update(
                "INSERT INTO mellow.vocabulary_favorite(learner_id, vocabulary_ref, saved_at, saved_on) "
                        + "VALUES (?, 'word', now(), current_date)", learnerId));
        verifyConstraint("23514", () -> jdbc.update(
                "INSERT INTO mellow.exercise_result(exercise_ref, result_status) VALUES ('orphan', 'EDITING')"));

        String insertLesson = """
                INSERT INTO mellow.lesson_run
                    (learner_id, lesson_ref, run_ref, current_run, completed, first_completion, block_ref)
                VALUES (?, 'retired', ?, ?, ?, ?, 'intro')
                """;
        jdbc.update(insertLesson, learnerId, "first", true, true, true);
        verifyConstraint("23505", () -> jdbc.update(insertLesson, learnerId, "first", false, false, false));
        verifyConstraint("23505", () -> jdbc.update(insertLesson, learnerId, "another-first", false, true, true));
        verifyConstraint("23505", () -> jdbc.update(insertLesson, learnerId, "another-current", true, false, false));
        jdbc.update(insertLesson, learnerId, "legitimate-replay", false, true, false);
        jdbc.update(insertLesson, otherId, "first", true, true, true);
        UUID activity = jdbc.queryForObject("""
                INSERT INTO mellow.lesson_activity (run_id, block_ref, activity_ref)
                SELECT id, 'intro', 'practice' FROM mellow.lesson_run
                WHERE learner_id = ? AND run_ref = 'first' RETURNING id
                """, UUID.class, learnerId);
        verifyConstraint("23514", () -> jdbc.update("""
                INSERT INTO mellow.exercise_result(lesson_activity_id, exercise_ref, result_status, draft)
                VALUES (?, 'invalid-draft', 'EDITING', '{"kind":"matching-pairs","pairs":{"one":99}}'::jsonb)
                """, activity));
        verifyConstraint("23514", () -> jdbc.update("""
                INSERT INTO mellow.exercise_result(lesson_activity_id, exercise_ref, result_status, draft)
                VALUES (?, 'not-reviewed', 'REVIEWED', '{"kind":"true-or-false","value":true}'::jsonb)
                """, activity));

        String simulation = """
                INSERT INTO mellow.simulation_session
                    (learner_id, session_ref, situation_ref, scenario_ref, started_at, completed_at,
                     active_ms, decisions_completed, reviewed_corrections)
                VALUES (?, ?, 'retired', 'scenario', now(), now(), 1000, 1, 0)
                """;
        jdbc.update(simulation, learnerId, "retry-id");
        verifyConstraint("23505", () -> jdbc.update(simulation, learnerId, "retry-id"));
        jdbc.update(simulation, learnerId, "replay-id");
        jdbc.update(simulation, otherId, "retry-id");
        assertThat(jdbc.queryForObject("SELECT count(*) FROM mellow.simulation_session WHERE learner_id = ?",
                Long.class, learnerId)).isEqualTo(2);
        assertThat(jdbc.queryForObject("SELECT sum(active_ms) FROM mellow.simulation_session WHERE learner_id = ?",
                Long.class, learnerId)).isEqualTo(2000);
    }

    @Test
    void scopesGameAndReviewSessionKeysAndRejectsInconsistentTypedOutcomes() {
        UUID learner = jdbc.queryForObject("INSERT INTO mellow.learner DEFAULT VALUES RETURNING id", UUID.class);
        UUID other = jdbc.queryForObject("INSERT INTO mellow.learner DEFAULT VALUES RETURNING id", UUID.class);

        String game = """
                INSERT INTO mellow.game_session
                    (learner_id, session_ref, game_kind, level, difficulty, started_at, completed_at, active_ms,
                     answered_count, correct_count, vocabulary_source, total_pairs, incorrect_attempts)
                VALUES (?, ?, 'MEMORY_GAME', 'A1', 'EASY', now(), now(), 2, 2, 1, 'SAVED', 1, ?)
                """;
        jdbc.update(game, learner, "attempt-1", 1);
        jdbc.update(game, learner, "attempt-2", 1);
        jdbc.update(game, other, "attempt-1", 1);
        verifyConstraint("23505", () -> jdbc.update(game, learner, "attempt-1", 1));
        verifyConstraint("23514", () -> jdbc.update(game, learner, "incorrect-arithmetic", 4));

        String card = """
                INSERT INTO mellow.flashcard_session
                    (learner_id, session_ref, started_at, completed_at, active_ms, direction, review_scope, used_search)
                VALUES (?, ?, now(), now(), 0, 'MIXED', 'SAVED', false)
                """;
        jdbc.update(card, learner, "attempt-1");
        jdbc.update(card, learner, "attempt-2");
        jdbc.update(card, other, "attempt-1");
        verifyConstraint("23505", () -> jdbc.update(card, learner, "attempt-1"));
        UUID cardId = jdbc.queryForObject(
                "SELECT id FROM mellow.flashcard_session WHERE learner_id = ? AND session_ref = 'attempt-1'",
                UUID.class, learner);
        String recall = """
                INSERT INTO mellow.flashcard_recall(flashcard_session_id, position, vocabulary_ref, direction, rating)
                VALUES (?, ?, 'unavailable-vocabulary', 'EN_PT', ?)
                """;
        jdbc.update(recall, cardId, 0, "EFFORT");
        verifyConstraint("23505", () -> jdbc.update(recall, cardId, 1, "EASY"));
        verifyConstraint("23514", () -> jdbc.update(recall, cardId, 2, "FAMILIAR"));
    }

    private static void verifyConstraint(String sqlState, Runnable write) {
        var failure = catchThrowableOfType(write::run, DataIntegrityViolationException.class);
        assertThat(failure).isNotNull();
        assertThat(failure.getMostSpecificCause()).isInstanceOfSatisfying(SQLException.class,
                sql -> assertThat(sql.getSQLState()).isEqualTo(sqlState));
    }
}
