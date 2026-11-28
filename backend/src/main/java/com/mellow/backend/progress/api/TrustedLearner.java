package com.mellow.backend.progress.api;

import java.util.UUID;

/** Request identity created only after a trusted resolver has succeeded. */
public final class TrustedLearner {

    private final UUID id;

    TrustedLearner(UUID id) {
        this.id = id;
    }

    public UUID id() {
        return id;
    }
}
