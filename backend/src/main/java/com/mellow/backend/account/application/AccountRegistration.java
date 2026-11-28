package com.mellow.backend.account.application;

import com.mellow.backend.account.persistence.AccountRepository;
import com.mellow.backend.account.persistence.EmailVerification;
import com.mellow.backend.account.persistence.EmailVerificationRepository;
import com.mellow.backend.learner.persistence.Learner;
import com.mellow.backend.learner.persistence.LearnerRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
public class AccountRegistration {

    private static final Duration RESEND_INTERVAL = Duration.ofMinutes(1);

    private final LearnerRepository learners;
    private final AccountRepository accounts;
    private final EmailVerificationRepository verifications;
    private final AccountPasswords passwords;
    private final AccountMail mail;
    private final TransactionTemplate transactions;
    private final Clock clock;
    private final Duration lifetime;

    AccountRegistration(LearnerRepository learners, AccountRepository accounts, EmailVerificationRepository verifications,
                        AccountPasswords passwords, AccountMail mail,
                        PlatformTransactionManager transactionManager, Clock clock,
                        @Value("${mellow.account.verification-token-lifetime:30m}") Duration lifetime) {
        this.learners = learners;
        this.accounts = accounts;
        this.verifications = verifications;
        this.passwords = passwords;
        this.mail = mail;
        this.transactions = new TransactionTemplate(transactionManager);
        this.transactions.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        this.clock = clock;
        if (lifetime.compareTo(RESEND_INTERVAL) < 0 || lifetime.compareTo(Duration.ofDays(1)) > 0) {
            throw new IllegalArgumentException("Email verification lifetime must be between one minute and one day");
        }
        this.lifetime = lifetime;
    }

    public void register(String displayName, String emailInput, String password) {
        String name = AccountInput.displayName(displayName);
        var email = AccountInput.email(emailInput);
        if (!AccountInput.validPassword(password)) throw AccountRequestException.invalidInput();
        var delivery = mail.requireDelivery();
        var hash = passwords.encode(password);
        var message = transactions.execute(transaction -> {
            Instant now = now();
            UUID learnerId = learners.save(new Learner(now, name)).id();
            UUID accountId = UUID.randomUUID();
            if (accounts.insertPending(accountId, learnerId, email.original(), email.canonical(), hash, now) == 0) {
                transaction.setRollbackOnly();
                return null;
            }
            return issue(accountId, email.original(), now);
        });
        mail.sendAfterCommit(delivery, message);
    }

    public void resend(String emailInput, String password) {
        var email = AccountInput.email(emailInput);
        if (!AccountInput.validPassword(password)) throw AccountRequestException.invalidInput();
        var delivery = mail.requireDelivery();
        var message = transactions.execute(transaction -> {
            var pending = accounts.lockPendingByCanonicalEmail(email.canonical());
            String hash = pending.map(account -> account.passwordHash()).orElse(null);
            boolean matches = passwords.matches(password, hash);
            if (pending.isEmpty() || !matches) return null;
            var account = pending.get();
            Instant now = now();
            var current = verifications.findByAccountIdAndConsumedAtIsNullAndSupersededAtIsNull(account.id());
            if (current.isPresent() && now.isBefore(current.get().createdAt().plus(RESEND_INTERVAL))) return null;
            verifications.supersedeOpen(account.id(), now);
            return issue(account.id(), account.email(), now);
        });
        mail.sendAfterCommit(delivery, message);
    }

    public void confirm(String token, String password) {
        String digest = AccountTokens.digest(token).orElseThrow(AccountRequestException::invalidToken);
        if (!AccountInput.validPassword(password)) throw AccountRequestException.invalidToken();
        transactions.executeWithoutResult(transaction -> {
            var accountId = verifications.findAccountId(digest).orElseThrow(AccountRequestException::invalidToken);
            // Resend and confirmation acquire the same parent lock before touching token state.
            var account = accounts.lockById(accountId).filter(candidate -> candidate.isPendingVerification())
                    .orElseThrow(AccountRequestException::invalidToken);
            var verification = verifications.findByTokenDigest(digest).orElseThrow(AccountRequestException::invalidToken);
            if (!verification.canConsume(now()) || !passwords.matches(password, account.passwordHash())) {
                throw AccountRequestException.invalidToken();
            }
            Instant verifiedAt = now();
            if (!verification.canConsume(verifiedAt)) throw AccountRequestException.invalidToken();
            verification.consume(verifiedAt);
            account.verifyEmail(verifiedAt);
        });
    }

    private VerificationMail.Message issue(UUID accountId, String email, Instant now) {
        String token = AccountTokens.generate();
        var expiresAt = now.plus(lifetime);
        verifications.save(new EmailVerification(accountId, AccountTokens.digest(token).orElseThrow(), now, expiresAt));
        return mail.message(email, token, expiresAt, VerificationMail.Purpose.EMAIL_VERIFICATION);
    }

    private Instant now() {
        return clock.instant().truncatedTo(ChronoUnit.MILLIS);
    }

}
