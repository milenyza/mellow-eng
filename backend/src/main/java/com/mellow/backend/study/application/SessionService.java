package com.mellow.backend.study.application;

import com.mellow.backend.flashcards.persistence.FlashcardSession;
import com.mellow.backend.flashcards.persistence.FlashcardSessionRepository;
import com.mellow.backend.games.persistence.GameSession;
import com.mellow.backend.games.persistence.GameSessionRepository;
import com.mellow.backend.learner.persistence.Learner;
import com.mellow.backend.practical.persistence.SimulationSession;
import com.mellow.backend.practical.persistence.SimulationSessionRepository;
import com.mellow.backend.progress.api.TrustedLearner;
import com.mellow.backend.progress.application.ProgressSupport;
import com.mellow.backend.study.api.SessionDto;
import com.mellow.backend.study.persistence.CompletedSession;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.function.BiFunction;
import java.util.function.Function;

import static com.mellow.backend.progress.application.ProgressSupport.*;

@Service
@Transactional(readOnly = true)
public class SessionService {

    private final ProgressSupport support;
    private final SessionCatalog catalog;
    private final GameResults gameResults;
    private final ConversationResults conversationResults;
    private final FlashcardResults flashcardResults;
    private final GameSessionRepository games;
    private final SimulationSessionRepository simulations;
    private final FlashcardSessionRepository flashcards;
    private final JsonMapper json;

    SessionService(ProgressSupport support, SessionCatalog catalog, GameResults gameResults,
                   ConversationResults conversationResults, FlashcardResults flashcardResults,
                   GameSessionRepository games, SimulationSessionRepository simulations,
                   FlashcardSessionRepository flashcards, JsonMapper json) {
        this.support = support;
        this.catalog = catalog;
        this.gameResults = gameResults;
        this.conversationResults = conversationResults;
        this.flashcardResults = flashcardResults;
        this.games = games;
        this.simulations = simulations;
        this.flashcards = flashcards;
        this.json = json;
    }

    public SessionDto.GameView game(TrustedLearner owner, String ref) {
        return findGame(owner, ref).orElseThrow(ProgressSupport::notFound);
    }

    public Optional<SessionDto.GameView> findGame(TrustedLearner owner, String ref) {
        support.verifyOwner(owner.id());
        return games.findByLearner_IdAndSessionRef(owner.id(), ref).map(this::gameView);
    }

    public SessionDto.SimulationView simulation(TrustedLearner owner, String ref) {
        return findSimulation(owner, ref).orElseThrow(ProgressSupport::notFound);
    }

    public Optional<SessionDto.SimulationView> findSimulation(TrustedLearner owner, String ref) {
        support.verifyOwner(owner.id());
        return simulations.findByLearner_IdAndSessionRef(owner.id(), ref).map(this::simulationView);
    }

    public SessionDto.FlashcardView flashcard(TrustedLearner owner, String ref) {
        return findFlashcard(owner, ref).orElseThrow(ProgressSupport::notFound);
    }

    public Optional<SessionDto.FlashcardView> findFlashcard(TrustedLearner owner, String ref) {
        support.verifyOwner(owner.id());
        return flashcards.findByLearner_IdAndSessionRef(owner.id(), ref).map(this::flashcardView);
    }

    @Transactional
    public Stored<SessionDto.GameView> recordGame(TrustedLearner owner, String ref, SessionDto.GameWrite input) {
        return store(owner, ref, input, games::findByLearner_IdAndSessionRef, games::save,
                (learner, timing) -> gameResults.create(learner, ref, timing, input), this::gameView);
    }

    @Transactional
    public Stored<SessionDto.SimulationView> recordSimulation(TrustedLearner owner, String ref,
                                                              SessionDto.SimulationWrite input) {
        return store(owner, ref, input, simulations::findByLearner_IdAndSessionRef, simulations::save,
                (learner, timing) -> conversationResults.create(learner, ref, timing, input), this::simulationView);
    }

    @Transactional
    public Stored<SessionDto.FlashcardView> recordFlashcard(TrustedLearner owner, String ref,
                                                            SessionDto.FlashcardWrite input) {
        return store(owner, ref, input, flashcards::findByLearner_IdAndSessionRef, flashcards::save,
                (learner, timing) -> flashcardResults.create(learner, ref, timing, input), this::flashcardView);
    }

    private <E extends CompletedSession, V> Stored<V> store(TrustedLearner owner, String ref, SessionDto.Write input,
            BiFunction<UUID, String, Optional<E>> find, Function<E, E> save,
            BiFunction<Learner, CompletedSession.Timing, E> validateAndBuild, Function<E, V> view) {
        Learner learner = support.lockOwner(owner.id());
        String digest = support.fingerprint(input);
        var previous = find.apply(owner.id(), ref);
        if (previous.isPresent()) {
            var session = previous.get();
            if (!digest.equals(session.requestDigest())) {
                throw conflict("This completed session identifier already has a retained result.");
            }
            return new Stored<>(view.apply(session), false);
        }
        catalog.requireRevision(input.catalogRevision());
        E session = validateAndBuild.apply(learner, validateTiming(input.timing()));
        session.recordValidation(input.catalogRevision(), digest);
        return new Stored<>(view.apply(save.apply(session)), true);
    }

    private static CompletedSession.Timing validateTiming(SessionDto.Timing timing) {
        var now = now();
        validateTime(timing.startedAt(), null, now);
        validateTime(timing.completedAt(), timing.startedAt(), now);
        LocalDate firstDay = timing.startedAt().atOffset(ZoneOffset.UTC).toLocalDate().minusDays(1);
        LocalDate lastDay = timing.completedAt().atOffset(ZoneOffset.UTC).toLocalDate().plusDays(1);
        long bucketTotal = 0;
        for (var bucket : timing.studyDays().entrySet()) {
            if (bucket.getKey().isBefore(firstDay) || bucket.getKey().isAfter(lastDay)) {
                throw invalid("A local study day is outside the session interval.");
            }
            bucketTotal += bucket.getValue();
        }
        if (bucketTotal != timing.activeMs()
                || timing.activeMs() > Duration.between(timing.startedAt(), timing.completedAt()).toMillis()) {
            throw invalid("Study buckets and active duration must agree with the session interval.");
        }
        return new CompletedSession.Timing(timing.startedAt(), timing.completedAt(), timing.activeMs());
    }

    public SessionDto.History gameHistory(TrustedLearner owner, GameSession.Kind kind,
                                           GameSession.Difficulty difficulty, Range range) {
        support.verifyOwner(owner.id());
        var slice = games.history(owner.id(), range.first(), range.end(), kind, difficulty, range.page());
        return history(slice, row -> new SessionDto.Summary(row.getSessionRef(), row.getCatalogRevision(),
                row.getCompletedAt(), row.getActiveMs(), row.getGameKind(), row.getDifficulty(), null, null, null));
    }

    public SessionDto.History simulationHistory(TrustedLearner owner, String situation, String scenario, Range range) {
        support.verifyOwner(owner.id());
        var slice = simulations.history(owner.id(), range.first(), range.end(), situation, scenario, range.page());
        return history(slice, row -> new SessionDto.Summary(row.getSessionRef(), row.getCatalogRevision(),
                row.getCompletedAt(), row.getActiveMs(), null, null, row.getSituationRef(), row.getScenarioRef(), null));
    }

    public SessionDto.History flashcardHistory(TrustedLearner owner, FlashcardSession.Direction direction, Range range) {
        support.verifyOwner(owner.id());
        var slice = flashcards.history(owner.id(), range.first(), range.end(), direction, range.page());
        return history(slice, row -> new SessionDto.Summary(row.getSessionRef(), row.getCatalogRevision(),
                row.getCompletedAt(), row.getActiveMs(), null, null, null, null, row.getDirection()));
    }

    private static <T> SessionDto.History history(Slice<T> result, Function<T, SessionDto.Summary> view) {
        return new SessionDto.History(result.map(view).getContent(), result.getNumber(), result.getSize(), result.hasNext());
    }

    private static SessionDto.Header header(CompletedSession session) {
        return new SessionDto.Header(session.sessionRef(), session.catalogRevision(),
                new SessionDto.Timing(session.startedAt(), session.completedAt(), session.activeMs(), session.studyDays()), session.legacyImported());
    }

    private SessionDto.GameView gameView(GameSession session) {
        var details = session.details();
        var vocabulary = session.vocabulary().stream()
                .map(item -> new SessionDto.Vocabulary(item.vocabularyRef(), item.reviewPosition())).toList();
        var challenges = session.challenges().stream().map(item ->
                new SessionDto.CompletedChallenge(item.challengeRef(), item.reviewed(), List.of(item.incorrectAnswers())))
                .toList();
        return new SessionDto.GameView(header(session), session.kind(), SessionDto.Level.valueOf(session.level()),
                session.difficulty(), session.answeredCount(), session.correctCount(), details.vocabularySource(),
                details.firstAttemptCorrect(), details.roundsCompleted(), details.sentenceTopic(), details.totalPairs(),
                details.incorrectAttempts(), vocabulary, challenges, evidence(session.evidence()));
    }

    private SessionDto.SimulationView simulationView(SimulationSession session) {
        var attempts = session.attempts().stream().map(item ->
                new SessionDto.Attempt(item.nodeRef(), item.choiceRef(), item.fit())).toList();
        return new SessionDto.SimulationView(header(session), session.situationRef(), session.scenarioRef(),
                session.decisionsCompleted(), session.reviewedCorrections(), attempts, evidence(session.evidence()));
    }

    private SessionDto.FlashcardView flashcardView(FlashcardSession session) {
        var config = session.configuration();
        var filters = new SessionDto.ReviewConfiguration(config.direction(), config.requestedLength(), config.reviewScope(),
                config.filterSource(), config.filterType(),
                config.filterLevel() == null ? null : SessionDto.Level.valueOf(config.filterLevel()),
                config.filterFamiliarity(), config.usedSearch());
        var recalls = session.recalls().stream().map(item ->
                new SessionDto.Recall(item.vocabularyRef(), item.direction(), item.rating())).toList();
        return new SessionDto.FlashcardView(header(session), filters, recalls);
    }

    private JsonNode evidence(String stored) {
        return stored == null ? null : json.readTree(stored);
    }

    public record Stored<T>(T view, boolean created) {
    }

    public record Range(Instant first, Instant end, PageRequest page) {
        public static Range of(String fromValue, String throughValue, int page, int size) {
            var earliest = LocalDate.of(1970, 1, 1);
            var latest = LocalDate.of(9999, 12, 31);
            var from = date(fromValue, earliest);
            var through = date(throughValue, latest);
            if (from.isBefore(earliest) || through.isAfter(latest) || from.isAfter(through)
                    || page < 0 || page > 1000 || size < 1 || size > 100) {
                throw invalid("The history date range or pagination is invalid.");
            }
            return new Range(from.atStartOfDay().toInstant(ZoneOffset.UTC),
                    through.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC), PageRequest.of(page, size));
        }

        private static LocalDate date(String value, LocalDate fallback) {
            if (value == null) return fallback;
            if (value.matches("[0-9]{4}-[0-9]{2}-[0-9]{2}")) {
                try {
                    return LocalDate.parse(value);
                } catch (DateTimeParseException badDate) {
                    throw invalid("A history date must be a valid YYYY-MM-DD calendar date.");
                }
            }
            throw invalid("A history date must be a valid YYYY-MM-DD calendar date.");
        }
    }
}
