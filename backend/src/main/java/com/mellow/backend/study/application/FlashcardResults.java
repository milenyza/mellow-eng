package com.mellow.backend.study.application;

import com.mellow.backend.flashcards.persistence.FlashcardSession;
import com.mellow.backend.flashcards.persistence.FlashcardSession.CardDirection;
import com.mellow.backend.flashcards.persistence.FlashcardSession.Direction;
import com.mellow.backend.learner.persistence.Learner;
import com.mellow.backend.study.api.SessionDto;
import com.mellow.backend.study.persistence.CompletedSession.Timing;
import com.mellow.backend.vocabulary.persistence.VocabularyFavoriteRepository;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;

import static com.mellow.backend.progress.application.ProgressSupport.invalid;

@Component
class FlashcardResults {

    private final SessionCatalog catalog;
    private final VocabularyFavoriteRepository favorites;

    FlashcardResults(SessionCatalog catalog, VocabularyFavoriteRepository favorites) {
        this.catalog = catalog;
        this.favorites = favorites;
    }

    FlashcardSession create(Learner owner, String ref, Timing timing, SessionDto.FlashcardWrite input) {
        var config = input.configuration();
        int count = input.recalls().size();
        if (config.requestedLength() != null && (!Set.of(5, 10, 20).contains(config.requestedLength())
                || config.requestedLength() != count)) {
            throw invalid("The recall count does not match the selected review length.");
        }
        var seen = new HashSet<String>();
        int englishFirst = 0;
        for (var recall : input.recalls()) {
            var entry = catalog.vocabulary(recall.vocabularyRef());
            if (!seen.add(recall.vocabularyRef()) || (config.filterSource() != null && config.filterSource() != entry.source())
                    || (config.filterType() != null && config.filterType() != entry.type())
                    || (config.filterLevel() != null && config.filterLevel() != entry.level())) {
                throw invalid("A review reference is repeated or does not match the educational filters.");
            }
            if (recall.direction() == CardDirection.EN_PT) englishFirst++;
        }
        boolean validDirections = switch (config.direction()) {
            case EN_PT -> englishFirst == count;
            case PT_EN -> englishFirst == 0;
            case MIXED -> Math.abs(2 * englishFirst - count) <= 1;
        };
        if (!validDirections) throw invalid("The card directions do not match the review configuration.");
        if (!favorites.findOwnedReferences(owner.id(), seen).containsAll(seen)) {
            throw invalid("New flashcard sessions require vocabulary saved by the learner.");
        }
        var storedConfig = new FlashcardSession.Configuration(config.direction(), config.requestedLength(),
                config.scope(), config.filterSource(), config.filterType(),
                config.filterLevel() == null ? null : config.filterLevel().name(),
                config.filterFamiliarity(), config.usedSearch());
        var recalls = input.recalls().stream().map(item ->
                new FlashcardSession.Recall(item.vocabularyRef(), item.direction(), item.rating())).toList();
        return new FlashcardSession(owner, ref, timing, storedConfig, recalls, input.timing().studyDays());
    }
}
