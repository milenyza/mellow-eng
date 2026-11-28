package com.mellow.backend.account.persistence;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface EmailVerificationRepository extends Repository<EmailVerification, UUID> {

    EmailVerification save(EmailVerification verification);

    @Query("select token.accountId from EmailVerification token where token.tokenDigest = :digest")
    Optional<UUID> findAccountId(String digest);

    Optional<EmailVerification> findByTokenDigest(String digest);

    Optional<EmailVerification> findByAccountIdAndConsumedAtIsNullAndSupersededAtIsNull(UUID accountId);

    @Modifying
    @Query("""
            update EmailVerification token set token.supersededAt = :now
            where token.accountId = :accountId and token.consumedAt is null and token.supersededAt is null
            """)
    int supersedeOpen(UUID accountId, Instant now);
}
