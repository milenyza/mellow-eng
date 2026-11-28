package com.mellow.backend.account.persistence;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface AccountRepository extends Repository<Account, UUID> {

    Optional<Account> findByEmailCanonical(String email);

    @Query("""
            select new com.mellow.backend.account.persistence.VerifiedAccount(
                account.id, learner.id, learner.displayName, account.emailOriginal, account.securityRevision)
            from Account account join Learner learner on learner.id = account.learnerId
            where account.id = :accountId and learner.id = :learnerId
                and account.status = VERIFIED and account.emailVerifiedAt is not null
            """)
    Optional<VerifiedAccount> findVerifiedIdentity(UUID accountId, UUID learnerId);

    @Modifying(flushAutomatically = true)
    @Query(value = """
            INSERT INTO mellow.account (id, learner_id, email_original, email_canonical, password_hash, status,
                                        created_at, updated_at)
            VALUES (:id, :learnerId, :email, :canonicalEmail, :passwordHash, 'PENDING_VERIFICATION', :now, :now)
            ON CONFLICT ON CONSTRAINT account_email_unique DO NOTHING
            """, nativeQuery = true)
    int insertPending(UUID id, UUID learnerId, String email, String canonicalEmail, String passwordHash, Instant now);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select account from Account account where account.id = :id")
    Optional<Account> lockById(UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select account from Account account where account.emailCanonical = :email
            and account.status = PENDING_VERIFICATION
            """)
    Optional<Account> lockPendingByCanonicalEmail(String email);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select account from Account account where account.emailCanonical = :email")
    Optional<Account> lockByCanonicalEmail(String email);

    @Query("""
            select account.securityRevision
            from Account account join Learner learner on learner.id = account.learnerId
            where account.id = :accountId and learner.id = :learnerId
                and account.status = VERIFIED and account.emailVerifiedAt is not null
            """)
    Optional<Long> findVerifiedRevision(UUID accountId, UUID learnerId);
}
