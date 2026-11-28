package com.mellow.backend.practical.persistence;

import com.mellow.backend.study.persistence.SessionHistoryRow;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;

import java.time.Instant;

import java.util.Optional;
import java.util.UUID;

public interface SimulationSessionRepository extends Repository<SimulationSession, UUID> {

    SimulationSession save(SimulationSession simulationSession);

    Optional<SimulationSession> findByLearner_IdAndSessionRef(UUID learnerId, String sessionRef);

    @Query("""
            select s.sessionRef as sessionRef, s.catalogRevision as catalogRevision,
                   s.completedAt as completedAt, s.activeMs as activeMs,
                   s.situationRef as situationRef, s.scenarioRef as scenarioRef
            from SimulationSession s
            where s.learner.id = :owner and s.completedAt >= :first and s.completedAt < :end
            and (:situation is null or s.situationRef = :situation)
            and (:scenario is null or s.scenarioRef = :scenario)
            order by s.completedAt desc, s.id asc
            """)
    Slice<SessionHistoryRow.Simulation> history(UUID owner, Instant first, Instant end,
                                                String situation, String scenario, Pageable page);
}
