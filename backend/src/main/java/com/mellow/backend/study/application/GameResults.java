package com.mellow.backend.study.application;

import com.mellow.backend.flashcards.persistence.FlashcardSession;
import com.mellow.backend.games.persistence.GameSession;
import com.mellow.backend.games.persistence.GameSession.Kind;
import com.mellow.backend.games.persistence.GameSession.ResultDetails;
import com.mellow.backend.games.persistence.GameSession.SentenceChallenge;
import com.mellow.backend.games.persistence.GameSession.Topic;
import com.mellow.backend.games.persistence.GameSession.Vocabulary;
import com.mellow.backend.learner.persistence.Learner;
import com.mellow.backend.progress.application.ExerciseProgress;
import com.mellow.backend.study.api.SessionDto;
import com.mellow.backend.study.persistence.CompletedSession.Timing;
import com.mellow.backend.vocabulary.persistence.VocabularyFavoriteRepository;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static com.mellow.backend.progress.application.ProgressSupport.invalid;

@Component
class GameResults {

    private final SessionCatalog catalog;
    private final VocabularyFavoriteRepository favorites;
    private final ExerciseProgress exercises;
    private final JsonMapper json;

    GameResults(SessionCatalog catalog, VocabularyFavoriteRepository favorites, ExerciseProgress exercises,
                JsonMapper json) {
        this.catalog = catalog;
        this.favorites = favorites;
        this.exercises = exercises;
        this.json = json;
    }

    GameSession create(Learner owner, String ref, Timing timing, SessionDto.GameWrite input) {
        Scored scored = switch (input.result()) {
            case SessionDto.WordMatch result -> wordMatch(owner.id(), input, result);
            case SessionDto.SentenceBuilder result -> sentenceBuilder(input, result);
            case SessionDto.MemoryGame result -> memory(owner.id(), input, result);
        };
        var session = new GameSession(owner, ref, timing, input.level().name(), input.difficulty(), scored.answered(),
                scored.correct(), scored.details(), scored.vocabulary(), scored.challenges(), input.timing().studyDays());
        session.addEvidence(json.writeValueAsString(scored.evidence()));
        return session;
    }

    private Scored wordMatch(UUID owner, SessionDto.GameWrite input, SessionDto.WordMatch result) {
        int size = catalog.length(Kind.WORD_MATCH, input.level(), input.difficulty());
        if (result.rounds().size() != catalog.wordMatchRoundCount()) {
            throw invalid("Every configured Word Match round must be completed.");
        }
        var all = new LinkedHashSet<String>();
        var review = new LinkedHashSet<String>();
        int answered = 0;
        int first = 0;
        for (var round : result.rounds()) {
            var board = board(round.vocabularyRefs(), size);
            all.addAll(round.vocabularyRefs());
            var seen = new HashSet<String>();
            var matched = new HashSet<String>();
            for (var attempt : round.attempts()) {
                String english = attempt.englishRef();
                String portuguese = attempt.portugueseRef();
                if (!board.contains(english) || !board.contains(portuguese)
                        || matched.contains(english) || matched.contains(portuguese)) {
                    throw invalid("A Word Match attempt uses a reference outside its round or already matched.");
                }
                answered++;
                if (english.equals(portuguese)) {
                    matched.add(english);
                    if (!seen.contains(english)) first++;
                } else {
                    review.add(english);
                    review.add(portuguese);
                }
                seen.add(english);
                seen.add(portuguese);
            }
            if (!matched.equals(board)) throw invalid("A Word Match round is incomplete.");
        }
        requireAttemptLimit(answered);
        requireVocabulary(owner, input.level(), result.source(), all);
        var orderedReview = List.copyOf(review);
        var vocabulary = all.stream().map(ref -> {
            int position = orderedReview.indexOf(ref);
            return new Vocabulary(ref, position < 0 ? null : position);
        }).toList();
        return new Scored(answered, (long) size * result.rounds().size(),
                ResultDetails.wordMatch(result.source(), first, result.rounds().size()), vocabulary, List.of(), new WordEvidence(result.rounds()));
    }

    private Scored memory(UUID owner, SessionDto.GameWrite input, SessionDto.MemoryGame result) {
        int size = catalog.length(Kind.MEMORY_GAME, input.level(), input.difficulty());
        var board = board(result.vocabularyRefs(), size);
        requireVocabulary(owner, input.level(), result.source(), board);
        var matched = new HashSet<String>();
        for (var attempt : result.attempts()) {
            var first = attempt.first();
            var second = attempt.second();
            if (first.equals(second) || !board.contains(first.vocabularyRef()) || !board.contains(second.vocabularyRef())
                    || matched.contains(first.vocabularyRef()) || matched.contains(second.vocabularyRef())) {
                throw invalid("A Memory Game attempt uses an invalid or already matched card.");
            }
            if (first.vocabularyRef().equals(second.vocabularyRef())) matched.add(first.vocabularyRef());
        }
        if (!matched.equals(board)) throw invalid("The Memory Game board is incomplete.");
        var vocabulary = result.vocabularyRefs().stream().map(ref -> new Vocabulary(ref, null)).toList();
        return new Scored(result.attempts().size(), size,
                ResultDetails.memory(result.source(), size, result.attempts().size() - size),
                vocabulary, List.of(), new MemoryEvidence(result.attempts()));
    }

    private Scored sentenceBuilder(SessionDto.GameWrite input, SessionDto.SentenceBuilder result) {
        int size = catalog.length(Kind.SENTENCE_BUILDER, input.level(), input.difficulty());
        if (result.challenges().size() != size) {
            throw invalid("Every configured Sentence Builder challenge must be completed.");
        }
        var seen = new HashSet<String>();
        var practiced = new ArrayList<SentenceChallenge>();
        var references = new ArrayList<SessionCatalog.SentenceReference>();
        int answered = 0;
        int independent = 0;
        int first = 0;
        for (var challenge : result.challenges()) {
            var rule = catalog.sentence(challenge.challengeRef());
            if (!seen.add(challenge.challengeRef()) || rule.difficulty() != input.difficulty()
                    || (result.topic() != Topic.MIXED && !rule.topics().contains(result.topic()))
                    || (challenge.hintUsed() && !rule.hint())) {
                throw invalid("A challenge or hint does not match the Sentence Builder configuration.");
            }
            var incorrect = new ArrayList<String>();
            boolean correct = false;
            for (var response : challenge.responses()) {
                if (correct) throw invalid("A challenge cannot accept more attempts after a correct answer.");
                var answer = json.createObjectNode();
                answer.put("kind", "sentence-builder");
                answer.set("tileIds", json.valueToTree(response));
                correct = exercises.evaluate(rule.exerciseRule(), answer, true);
                if (!correct) incorrect.add(String.join(" ", response.stream().map(rule.tiles()::get).toList()));
                answered++;
            }
            if (correct == challenge.reviewed()) {
                throw invalid("A challenge must end in independent success or explicit correction review.");
            }
            if (correct) {
                independent++;
                if (incorrect.isEmpty()) first++;
            }
            practiced.add(new SentenceChallenge(challenge.challengeRef(), challenge.reviewed(),
                    incorrect.toArray(String[]::new)));
            references.add(rule.reference());
        }
        requireAttemptLimit(answered);
        return new Scored(answered, independent, ResultDetails.sentenceBuilder(result.topic(), first), List.of(),
                practiced, new SentenceEvidence(result.challenges(), references));
    }

    private Set<String> board(List<String> refs, int size) {
        var set = new HashSet<>(refs);
        if (refs.size() != size || set.size() != size) {
            throw invalid("The vocabulary board has the wrong size or repeated references.");
        }
        for (var ref : refs) {
            var conflicts = catalog.vocabulary(ref).conflicts();
            if (conflicts != null && conflicts.stream().anyMatch(set::contains)) {
                throw invalid("The vocabulary board has ambiguous pairs.");
            }
        }
        return set;
    }

    private void requireVocabulary(UUID owner, SessionDto.Level level, GameSession.Source source, Set<String> refs) {
        var needsFavorite = new HashSet<String>();
        for (String ref : refs) {
            var entry = catalog.vocabulary(ref);
            if (!entry.gameEligible() || entry.level() != level) throw invalid("Vocabulary is unavailable for this game level.");
            boolean lesson = entry.source() == FlashcardSession.Source.LESSON;
            boolean story = entry.source() == FlashcardSession.Source.STORY;
            switch (source) {
                case LESSONS -> {
                    if (!lesson) throw invalid("Vocabulary does not match the chosen game source.");
                }
                case STORIES -> {
                    if (!story) throw invalid("Vocabulary does not match the chosen game source.");
                }
                case SAVED -> needsFavorite.add(ref);
                case MIXED -> {
                    if (!lesson && !story) needsFavorite.add(ref);
                }
            }
        }
        if (!needsFavorite.isEmpty() && !favorites.findOwnedReferences(owner, needsFavorite).containsAll(needsFavorite)) {
            throw invalid("This vocabulary selection requires saved references owned by the learner.");
        }
    }

    static void requireAttemptLimit(int attempts) {
        if (attempts > SessionDto.MAX_ATTEMPTS) throw invalid("The session contains too many attempts.");
    }

    private record Scored(long answered, long correct, ResultDetails details, List<Vocabulary> vocabulary,
                          List<SentenceChallenge> challenges, Object evidence) {
    }

    private record WordEvidence(List<SessionDto.WordRound> rounds) {
    }

    private record MemoryEvidence(List<SessionDto.MemoryAttempt> attempts) {
    }

    private record SentenceEvidence(List<SessionDto.Challenge> challenges,
                                    List<SessionCatalog.SentenceReference> contentReferences) {
    }
}
