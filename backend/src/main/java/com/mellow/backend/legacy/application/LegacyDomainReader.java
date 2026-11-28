package com.mellow.backend.legacy.application;

import com.mellow.backend.learner.persistence.LearnerPreferencesRepository;
import com.mellow.backend.lesson.application.LessonProgressService;
import com.mellow.backend.lesson.api.LessonProgressDto;
import com.mellow.backend.progress.api.TrustedLearner;
import com.mellow.backend.reading.application.ReadingProgressService;
import com.mellow.backend.reading.api.ReadingProgressDto;
import com.mellow.backend.study.api.SessionDto;
import com.mellow.backend.study.application.SessionService;
import com.mellow.backend.study.persistence.CombinedStudyDay;
import com.mellow.backend.study.persistence.CombinedStudyDayRepository;
import com.mellow.backend.vocabulary.persistence.VocabularyAnnotationRepository;
import com.mellow.backend.vocabulary.persistence.VocabularyFavoriteRepository;
import org.springframework.stereotype.Component;

import java.util.Comparator;


import static com.mellow.backend.legacy.application.LegacyNormalizer.*;

@Component
class LegacyDomainReader {

    private final LessonProgressService lessons;
    private final ReadingProgressService reading;
    private final SessionService sessions;
    private final CombinedStudyDayRepository days;
    private final VocabularyFavoriteRepository favorites;
    private final VocabularyAnnotationRepository annotations;
    private final LearnerPreferencesRepository preferences;

    LegacyDomainReader(LessonProgressService lessons, ReadingProgressService reading, SessionService sessions,
                       CombinedStudyDayRepository days, VocabularyFavoriteRepository favorites,
                       VocabularyAnnotationRepository annotations, LearnerPreferencesRepository preferences) {
        this.lessons = lessons;
        this.reading = reading;
        this.sessions = sessions;
        this.days = days;
        this.favorites = favorites;
        this.annotations = annotations;
        this.preferences = preferences;
    }

    State read(TrustedLearner owner, Candidate candidate) {
        String ref = candidate.reference();
        var id = owner.id();
        return switch (candidate.category()) {
            case LESSON -> State.value(lessons.find(owner, ref).map(view -> new LessonProgressDto.View(view.lessonRef(),
                    view.attempts().stream().sorted(Comparator.comparing(LessonProgressDto.Attempt::runRef)).toList(),
                    view.legacyFirstCompletionSnapshot())).orElse(null));
            case READING -> State.value(reading.find(owner, ref).map(view -> new ReadingProgressDto.View(view.storyRef(),
                    view.lifetimeActiveMs(), view.readChapters(),
                    view.attempts().stream().sorted(Comparator.comparing(ReadingProgressDto.Attempt::runRef)).toList(),
                    view.legacyFirstCompletionSnapshot())).orElse(null));
            case GAME -> game(owner, ref);
            case SIMULATION -> simulation(owner, ref);
            case FLASHCARD -> flashcard(owner, ref);
            case STUDY_DAY -> {
                var day = ((StudyDay) candidate.value()).day();
                yield days.findById(new CombinedStudyDay.Key(id, day))
                        .map(row -> State.value(new StudyDay(day, row.activeMs()))).orElseGet(State::missing);
            }
            case FAVORITE -> favorites.findByLearner_IdAndVocabularyRef(id, ref)
                    .map(row -> new State(row.removed() ? null : new Favorite(ref, row.saved().at()),
                            new FavoriteState(row.revision(), row.saved().on()), row.removed(),
                            row.saved().on() == null)).orElseGet(State::missing);
            case ANNOTATION -> annotations.findByLearner_IdAndVocabularyRef(id, ref)
                    .map(row -> new State(row.removed() ? null : new Annotation(ref, row.note(), row.personalExample(),
                            row.familiarity(), row.createdAt(), row.updatedAt()), row.revision(), row.removed(), true))
                    .orElseGet(State::missing);
            case PREFERENCES -> preferences.findByLearnerId(id)
                    .map(row -> new State(new Preferences(row.readingFontSize(), row.showReadingTranslations()),
                            row.revision(), false, true)).orElseGet(State::missing);
            case STORAGE -> throw new IllegalStateException("Storage is not a domain record");
        };
    }

    private State game(TrustedLearner owner, String ref) {
        var row = sessions.findGame(owner, ref).orElse(null);
        if (row == null) return State.missing();
        var legacyFields = new SessionDto.GameView(legacyHeader(row.session()), row.kind(), row.level(), row.difficulty(),
                row.answeredCount(), row.correctCount(), row.vocabularySource(), row.firstAttemptCorrect(),
                row.roundsCompleted(), row.topic(), row.totalPairs(), row.incorrectAttempts(), row.vocabulary(),
                row.challenges(), null);
        return new State(legacyFields, row.session().catalogRevision(), false, true);
    }

    private State simulation(TrustedLearner owner, String ref) {
        var row = sessions.findSimulation(owner, ref).orElse(null);
        if (row == null) return State.missing();
        return new State(new SessionDto.SimulationView(legacyHeader(row.session()), row.situationRef(), row.scenarioRef(),
                row.decisionsCompleted(), row.reviewedCorrections(), row.attempts(), null),
                row.session().catalogRevision(), false, true);
    }

    private State flashcard(TrustedLearner owner, String ref) {
        var row = sessions.findFlashcard(owner, ref).orElse(null);
        if (row == null) return State.missing();
        return new State(new SessionDto.FlashcardView(legacyHeader(row.session()), row.configuration(), row.recalls()),
                row.session().catalogRevision(), false, true);
    }

    private static SessionDto.Header legacyHeader(SessionDto.Header header) {
        return new SessionDto.Header(header.sessionRef(), null, header.timing(), true);
    }

    record State(Object comparison, Object revision, boolean removed, boolean samePrecision) {
        static State missing() { return value(null); }
        static State value(Object value) { return new State(value, null, false, true); }
        boolean hasRecord() { return comparison != null || removed; }
    }

    private record FavoriteState(java.util.UUID revision, java.time.LocalDate savedOn) {}
}
