package com.mellow.backend.account.persistence;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface PasswordResetTokenRepository extends Repository<PasswordResetToken, UUID> {

    PasswordResetToken save(PasswordResetToken token);

    @Query("select token.accountId from PasswordResetToken token where token.tokenDigest = :digest")
    Optional<UUID> findAccountId(String digest);

    Optional<PasswordResetToken> findByTokenDigest(String digest);

    Optional<PasswordResetToken> findByAccountIdAndConsumedAtIsNullAndSupersededAtIsNull(UUID accountId);

    @Modifying
    @Query("""
            update PasswordResetToken token set token.supersededAt = :now
            where token.accountId = :accountId and token.consumedAt is null and token.supersededAt is null
            """)
    int supersedeOpen(UUID accountId, Instant now);
}
