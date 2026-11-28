package com.mellow.backend.study.persistence;

import com.mellow.backend.flashcards.persistence.FlashcardSession.Direction;
import com.mellow.backend.games.persistence.GameSession.Difficulty;
import com.mellow.backend.games.persistence.GameSession.Kind;

import java.time.Instant;

/** Scalar history projections keep session evidence and child collections out of list queries. */
public interface SessionHistoryRow {
    String getSessionRef();
    String getCatalogRevision();
    Instant getCompletedAt();
    long getActiveMs();

    interface Game extends SessionHistoryRow {
        Kind getGameKind();
        Difficulty getDifficulty();
    }

    interface Simulation extends SessionHistoryRow {
        String getSituationRef();
        String getScenarioRef();
    }

    interface Flashcard extends SessionHistoryRow {
        Direction getDirection();
    }
}
