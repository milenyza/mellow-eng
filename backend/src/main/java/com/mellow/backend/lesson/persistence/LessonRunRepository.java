package com.mellow.backend.lesson.persistence;

import org.springframework.data.repository.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LessonRunRepository extends Repository<LessonRun, UUID> {

    LessonRun save(LessonRun lessonRun);

    Optional<LessonRun> findByLearner_IdAndLessonRefAndCurrentRunTrue(UUID learnerId, String lessonRef);
    List<LessonRun> findByLearner_IdOrderByLessonRefAscRunRefAsc(UUID learnerId);

    List<LessonRun> findByLearner_IdAndLessonRefOrderByRunRefAsc(UUID learnerId, String lessonRef);

}
