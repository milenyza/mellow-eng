package com.mellow.backend.security;

import com.mellow.backend.account.persistence.AccountRepository;
import com.mellow.backend.progress.api.TrustedLearnerResolver;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component
final class SpringTrustedLearnerResolver implements TrustedLearnerResolver {

    private final AccountRepository accounts;

    SpringTrustedLearnerResolver(AccountRepository accounts) {
        this.accounts = accounts;
    }

    @Override
    public Optional<UUID> resolve() {
        return MellowPrincipal.from(SecurityContextHolder.getContext().getAuthentication()).map(principal -> {
            long revision = accounts.findVerifiedRevision(principal.accountId(), principal.learnerId())
                    .orElseThrow(() -> new AccessDeniedException("Verified account unavailable"));
            if (revision != principal.securityRevision()) throw new SessionRevokedException();
            return principal.learnerId();
        });
    }
}
