package com.mellow.backend.security;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.security.Principal;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

/** Account-to-learner binding established by a server-side authentication provider. */
public record MellowPrincipal(UUID accountId, UUID learnerId, long securityRevision) implements Principal {

    public static final String LEARNER_AUTHORITY = "ROLE_LEARNER";

    public static Optional<MellowPrincipal> from(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken
                || !(authentication.getPrincipal() instanceof MellowPrincipal principal)) {
            return Optional.empty();
        }
        return Optional.of(principal);
    }

    public MellowPrincipal {
        Objects.requireNonNull(accountId, "accountId");
        Objects.requireNonNull(learnerId, "learnerId");
        if (securityRevision < 0) throw new IllegalArgumentException("Invalid security revision");
    }

    @Override
    public String toString() {
        return "[learner principal redacted]";
    }

    @Override
    public String getName() {
        return accountId.toString();
    }
}
