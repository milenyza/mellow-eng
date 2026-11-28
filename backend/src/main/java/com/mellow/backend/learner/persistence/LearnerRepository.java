package com.mellow.backend.learner.persistence;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;

import java.util.Optional;
import java.util.UUID;

public interface LearnerRepository extends Repository<Learner, UUID> {

    Learner save(Learner learner);

    Optional<Learner> findById(UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select learner from Learner learner where learner.id = :id")
    Optional<Learner> findForProgressUpdate(UUID id);
}
