package com.mellow.backend.games.persistence;

import com.mellow.backend.study.persistence.SessionHistoryRow;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;

import java.time.Instant;

import java.util.Optional;
import java.util.UUID;

public interface GameSessionRepository extends Repository<GameSession, UUID> {

    GameSession save(GameSession gameSession);

    Optional<GameSession> findByLearner_IdAndSessionRef(UUID learnerId, String sessionRef);

    @Query("""
            select s.sessionRef as sessionRef, s.catalogRevision as catalogRevision,
                   s.completedAt as completedAt, s.activeMs as activeMs,
                   s.details.gameKind as gameKind, s.difficulty as difficulty
            from GameSession s
            where s.learner.id = :owner and s.completedAt >= :first and s.completedAt < :end
            and (:kind is null or s.details.gameKind = :kind)
            and (:difficulty is null or s.difficulty = :difficulty)
            order by s.completedAt desc, s.id asc
            """)
    Slice<SessionHistoryRow.Game> history(UUID owner, Instant first, Instant end,
                                                GameSession.Kind kind, GameSession.Difficulty difficulty, Pageable page);
}
