package com.mellow.backend.exercise.persistence;

import org.springframework.data.repository.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ExerciseResultRepository extends Repository<ExerciseResult, UUID> {

    ExerciseResult save(ExerciseResult exerciseResult);

    Optional<ExerciseResult> findByLessonActivity_Run_Learner_IdAndLessonActivity_IdAndExerciseRef(
            UUID learnerId, UUID lessonActivityId, String exerciseRef);

    Optional<ExerciseResult> findByReadingChapter_Run_StoryProgress_Learner_IdAndReadingChapter_IdAndExerciseRef(
            UUID learnerId, UUID readingChapterId, String exerciseRef);
    List<ExerciseResult> findByLessonActivity_Run_Learner_IdAndLessonActivity_Id(UUID learnerId, UUID activityId);

    List<ExerciseResult> findByReadingChapter_Run_StoryProgress_Learner_IdAndReadingChapter_Id(UUID learnerId, UUID chapterId);

}
