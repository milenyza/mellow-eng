package com.mellow.backend.study.persistence;

import java.time.Instant;
import java.time.LocalDate;

/** A known instant, an explicitly known calendar date, or neither. */
public record RecordedDate(Instant at, LocalDate on) {

    public RecordedDate {
        if (at != null && on != null) {
            throw new IllegalArgumentException("Choose an exact timestamp or a date");
        }
    }
}
