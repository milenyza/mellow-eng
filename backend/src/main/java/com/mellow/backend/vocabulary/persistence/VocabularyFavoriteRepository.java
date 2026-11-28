package com.mellow.backend.vocabulary.persistence;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.repository.Repository;

import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.Set;
import java.util.Optional;
import java.util.UUID;

public interface VocabularyFavoriteRepository extends Repository<VocabularyFavorite, UUID> {

    VocabularyFavorite save(VocabularyFavorite vocabularyFavorite);

    Optional<VocabularyFavorite> findByLearner_IdAndVocabularyRef(UUID learnerId, String vocabularyRef);

    @Query("select f.vocabularyRef from VocabularyFavorite f where f.learner.id = :learnerId and f.removed = false and f.vocabularyRef in :references")
    Set<String> findOwnedReferences(UUID learnerId, Collection<String> references);

    Slice<VocabularyFavorite> findByLearner_IdAndRemovedFalse(UUID learnerId, Pageable page);

    Slice<VocabularyFavorite> findByLearner_IdAndRemovedFalseAndVocabularyRefIn(
            UUID learnerId, Collection<String> references, Pageable page);
}
