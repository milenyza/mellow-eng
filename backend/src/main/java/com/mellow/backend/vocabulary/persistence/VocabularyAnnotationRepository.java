package com.mellow.backend.vocabulary.persistence;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.repository.Repository;

import java.util.Optional;
import java.util.UUID;

public interface VocabularyAnnotationRepository extends Repository<VocabularyAnnotation, UUID> {

    VocabularyAnnotation save(VocabularyAnnotation vocabularyAnnotation);

    Slice<VocabularyAnnotation> findByLearner_IdAndRemovedFalse(UUID learnerId, Pageable page);

    Optional<VocabularyAnnotation> findByLearner_IdAndVocabularyRef(UUID learnerId, String vocabularyRef);
}
