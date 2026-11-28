package com.mellow.backend.reading.persistence;

import org.springframework.data.repository.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StoryProgressRepository extends Repository<StoryProgress, UUID> {

    StoryProgress save(StoryProgress storyProgress);

    Optional<StoryProgress> findByLearner_IdAndStoryRef(UUID learnerId, String storyRef);
    List<StoryProgress> findByLearner_IdOrderByStoryRefAsc(UUID learnerId);

}
