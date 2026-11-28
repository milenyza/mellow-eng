package com.mellow.backend.reading.persistence;

import org.springframework.data.repository.Repository;

import java.util.List;
import java.util.UUID;

public interface ReadingChapterRepository extends Repository<ReadingChapter, UUID> {

    ReadingChapter save(ReadingChapter entry);

    List<ReadingChapter> findByRun_StoryProgress_Learner_IdAndRun_Id(UUID owner, UUID runId);
}
