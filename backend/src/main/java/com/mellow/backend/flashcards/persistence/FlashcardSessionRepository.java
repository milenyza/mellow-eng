package com.mellow.backend.flashcards.persistence;

import com.mellow.backend.study.persistence.SessionHistoryRow;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;

import java.time.Instant;

import java.util.Optional;
import java.util.UUID;

public interface FlashcardSessionRepository extends Repository<FlashcardSession, UUID> {

    FlashcardSession save(FlashcardSession flashcardSession);

    Optional<FlashcardSession> findByLearner_IdAndSessionRef(UUID learnerId, String sessionRef);

    @Query("""
            select s.sessionRef as sessionRef, s.catalogRevision as catalogRevision,
                   s.completedAt as completedAt, s.activeMs as activeMs,
                   s.configuration.direction as direction
            from FlashcardSession s
            where s.learner.id = :owner and s.completedAt >= :first and s.completedAt < :end
            and (:direction is null or s.configuration.direction = :direction)
            order by s.completedAt desc, s.id asc
            """)
    Slice<SessionHistoryRow.Flashcard> history(UUID owner, Instant first, Instant end,
                                                FlashcardSession.Direction direction, Pageable page);
}
