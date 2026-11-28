package com.mellow.backend.progress.api;

import java.util.Optional;
import java.util.UUID;

/** Resolve only identities verified by server-side authentication infrastructure. */
@FunctionalInterface
public interface TrustedLearnerResolver {

    Optional<UUID> resolve();
}
