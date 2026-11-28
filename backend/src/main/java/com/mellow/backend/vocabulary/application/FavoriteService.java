package com.mellow.backend.vocabulary.application;

import com.mellow.backend.flashcards.persistence.FlashcardSession.Source;
import com.mellow.backend.flashcards.persistence.FlashcardSession.VocabularyType;
import com.mellow.backend.progress.api.ResourceRevision;
import com.mellow.backend.progress.api.ResourceRevision.Snapshot;
import com.mellow.backend.progress.api.TrustedLearner;
import com.mellow.backend.progress.application.ProgressSupport;
import com.mellow.backend.study.application.SessionCatalog;
import com.mellow.backend.study.persistence.RecordedDate;
import com.mellow.backend.vocabulary.api.VocabularyDto.Favorite;
import com.mellow.backend.vocabulary.api.VocabularyDto.Page;
import com.mellow.backend.vocabulary.persistence.VocabularyFavorite;
import com.mellow.backend.vocabulary.persistence.VocabularyFavoriteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static com.mellow.backend.progress.application.ProgressSupport.invalid;

@Service
@Transactional(readOnly = true)
public class FavoriteService {

    private final VocabularyFavoriteRepository favorites;
    private final SessionCatalog catalog;
    private final ProgressSupport support;

    FavoriteService(VocabularyFavoriteRepository favorites, SessionCatalog catalog, ProgressSupport support) {
        this.favorites = favorites;
        this.catalog = catalog;
        this.support = support;
    }

    public Page<Favorite> list(TrustedLearner owner, Source source, VocabularyType type, int page, int size) {
        support.verifyOwner(owner.id());
        var request = Page.request(page, size);
        if (source == null && type == null) {
            return Page.from(favorites.findByLearner_IdAndRemovedFalse(owner.id(), request)
                    .map(record -> view(record.vocabularyRef(), record)));
        }
        var eligible = catalog.findVocabularyReferences(source, type);
        if (eligible.isEmpty()) return new Page<>(List.of(), page, size, false);
        return Page.from(favorites.findByLearner_IdAndRemovedFalseAndVocabularyRefIn(owner.id(), eligible, request)
                .map(record -> view(record.vocabularyRef(), record)));
    }

    public Snapshot<Favorite> get(TrustedLearner owner, String ref) {
        support.verifyOwner(owner.id());
        return snapshot(ref, favorites.findByLearner_IdAndVocabularyRef(owner.id(), ref).orElse(null));
    }

    @Transactional
    public Snapshot<Favorite> setMembership(TrustedLearner owner, String ref, boolean saved, ResourceRevision match) {
        var learner = support.lockOwner(owner.id());
        var record = favorites.findByLearner_IdAndVocabularyRef(owner.id(), ref).orElse(null);
        if (record != null && saved == !record.removed()
                && (match.matches(record.revision()) || match.matches(record.previousRevision()))) {
            return snapshot(ref, record);
        }
        match.check(record == null ? null : record.revision());
        boolean available = catalog.describeVocabulary(ref).isPresent();
        // A removal with a previous revision follows a real save, unlike an initial removal of an unseen item.
        boolean previouslySaved = record != null && record.removed() && record.previousRevision() != null;
        if (saved && !available && !previouslySaved) {
            throw invalid("The vocabulary reference is not currently available.");
        }
        if (record == null && !available) return snapshot(ref, null);

        boolean newRecord = record == null;
        if (newRecord) record = new VocabularyFavorite(learner, ref, new RecordedDate(null, null));
        record.changeMembership(saved, ProgressSupport.now(), newRecord);
        if (newRecord) record = favorites.save(record);
        return snapshot(ref, record);
    }

    private Snapshot<Favorite> snapshot(String ref, VocabularyFavorite record) {
        return new Snapshot<>(view(ref, record), record == null ? null : record.revision());
    }

    private Favorite view(String ref, VocabularyFavorite record) {
        var entry = catalog.describeVocabulary(ref).orElse(null);
        boolean saved = record != null && !record.removed();
        var date = saved ? record.saved() : new RecordedDate(null, null);
        return new Favorite(ref, saved, date.at(), date.on(), entry != null,
                entry == null ? null : entry.source(), entry == null ? null : entry.type());
    }
}
