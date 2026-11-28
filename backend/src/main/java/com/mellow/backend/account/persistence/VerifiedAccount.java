package com.mellow.backend.account.persistence;

import java.util.UUID;

public record VerifiedAccount(UUID accountId, UUID learnerId, String displayName, String email, long securityRevision) {

    @Override
    public String toString() {
        return "[verified account redacted]";
    }
}
