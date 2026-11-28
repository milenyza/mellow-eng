package com.mellow.backend.lesson.persistence;

import org.springframework.data.repository.Repository;

import java.util.List;
import java.util.UUID;

public interface LessonActivityRepository extends Repository<LessonActivity, UUID> {

    LessonActivity save(LessonActivity entry);

    List<LessonActivity> findByRun_Learner_IdAndRun_Id(UUID owner, UUID runId);
}
