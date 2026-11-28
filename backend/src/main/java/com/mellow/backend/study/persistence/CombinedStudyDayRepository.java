package com.mellow.backend.study.persistence;

import org.springframework.data.repository.Repository;

import java.util.Optional;

public interface CombinedStudyDayRepository extends Repository<CombinedStudyDay, CombinedStudyDay.Key> {

    CombinedStudyDay save(CombinedStudyDay combinedStudyDay);

    Optional<CombinedStudyDay> findById(CombinedStudyDay.Key key);
}
