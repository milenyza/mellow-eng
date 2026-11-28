package com.mellow.backend.learner.persistence;

import org.springframework.data.repository.Repository;

import java.util.Optional;
import java.util.UUID;

public interface LearnerPreferencesRepository extends Repository<LearnerPreferences, UUID> {

    LearnerPreferences save(LearnerPreferences learnerPreferences);

    Optional<LearnerPreferences> findByLearnerId(UUID learnerId);
}
