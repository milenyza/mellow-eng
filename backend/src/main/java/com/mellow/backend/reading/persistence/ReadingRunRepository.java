package com.mellow.backend.reading.persistence;

import org.springframework.data.repository.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReadingRunRepository extends Repository<ReadingRun, UUID> {

    ReadingRun save(ReadingRun readingRun);

    Optional<ReadingRun> findByStoryProgress_Learner_IdAndStoryProgress_StoryRefAndCurrentRunTrue(
            UUID learnerId, String storyRef);
    List<ReadingRun> findByStoryProgress_Learner_IdAndStoryProgress_StoryRefOrderByRunRefAsc(UUID learnerId, String storyRef);

}
