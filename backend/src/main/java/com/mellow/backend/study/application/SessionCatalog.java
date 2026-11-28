package com.mellow.backend.study.application;

import com.mellow.backend.flashcards.persistence.FlashcardSession.Source;
import com.mellow.backend.flashcards.persistence.FlashcardSession.VocabularyType;
import com.mellow.backend.games.persistence.GameSession.Difficulty;
import com.mellow.backend.games.persistence.GameSession.Kind;
import com.mellow.backend.games.persistence.GameSession.Topic;
import com.mellow.backend.practical.persistence.SimulationSession.Fit;
import com.mellow.backend.progress.application.ProgressCatalog.Rule;
import com.mellow.backend.study.api.SessionDto.Level;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Optional;

import static com.mellow.backend.progress.application.ProgressCatalog.known;
import static com.mellow.backend.progress.application.ProgressSupport.conflict;
import static com.mellow.backend.progress.application.ProgressSupport.invalid;

@Component
public class SessionCatalog {

    private final String revision;
    private final Content content;

    SessionCatalog(JsonMapper json) throws IOException {
        byte[] bytes = new ClassPathResource("catalog/sessions-v1.json").getContentAsByteArray();
        content = json.readValue(bytes, Content.class);
        if (content.schema() != 1) throw new IllegalStateException("Unsupported session catalog schema");
        try {
            revision = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
        } catch (NoSuchAlgorithmException impossible) {
            throw new IllegalStateException(impossible);
        }
    }

    public String revision() {
        return revision;
    }

    void requireRevision(String value) {
        if (!revision.equals(value)) {
            throw conflict("The session catalog revision is unavailable. Start a new session with current content.");
        }
    }

    int length(Kind kind, Level level, Difficulty difficulty) {
        var game = content.games().get(kind);
        if (game == null || !game.levels().contains(level) || !game.lengths().containsKey(difficulty)) {
            throw invalid("The game does not support this level or difficulty.");
        }
        return game.lengths().get(difficulty);
    }

    int wordMatchRoundCount() {
        return content.wordMatchRoundCount();
    }

    Vocabulary vocabulary(String reference) {
        return known(content.vocabulary(), reference);
    }

    public Optional<VocabularyMetadata> describeVocabulary(String reference) {
        return Optional.ofNullable(content.vocabulary().get(reference))
                .map(entry -> new VocabularyMetadata(entry.source(), entry.type()));
    }

    public List<String> findVocabularyReferences(Source source, VocabularyType type) {
        return content.vocabulary().entrySet().stream()
                .filter(entry -> (source == null || source == entry.getValue().source())
                        && (type == null || type == entry.getValue().type()))
                .map(Map.Entry::getKey).toList();
    }

    public record VocabularyMetadata(Source source, VocabularyType type) {
    }

    Sentence sentence(String reference) {
        return known(content.sentences(), reference);
    }

    Simulation simulation(String situation, String scenario) {
        return known(known(content.simulations(), situation), scenario);
    }

    record Content(int schema, int wordMatchRoundCount, Map<Kind, Game> games, Map<String, Vocabulary> vocabulary,
                   Map<String, Sentence> sentences, Map<String, Map<String, Simulation>> simulations) {
    }

    record Game(Set<Level> levels, Map<Difficulty, Integer> lengths) {
    }

    record Vocabulary(Source source, Level level, VocabularyType type, boolean gameEligible, Set<String> conflicts) {
    }

    record Sentence(Difficulty difficulty, Set<Topic> topics, SentenceReference reference, boolean hint,
                    Map<String, String> tiles, List<List<String>> orders) {
        Rule exerciseRule() {
            return new Rule(true, "sentence-builder", null, null, null, null, tiles, orders, null);
        }
    }

    record SentenceReference(String kind, String lessonId, String blockId, String storyId,
                             String chapterId, String paragraphId) {
    }

    record Simulation(String start, Map<String, Node> nodes) {
    }

    record Node(boolean success, boolean hint, Map<String, Choice> choices) {
    }

    record Choice(Fit fit, String next) {
    }
}
