package com.mellow.backend.account.application;

import com.mellow.backend.account.persistence.AccountRepository;
import com.mellow.backend.account.persistence.EmailVerificationRepository;
import com.mellow.backend.account.persistence.PasswordResetToken;
import com.mellow.backend.account.persistence.PasswordResetTokenRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class PasswordRecovery {

    private static final Duration RESEND_INTERVAL = Duration.ofMinutes(1);

    private final AccountRepository accounts;
    private final PasswordResetTokenRepository tokens;
    private final EmailVerificationRepository verifications;
    private final AccountPasswords passwords;
    private final AccountAbuseLimits limits;
    private final AccountMail mail;
    private final TransactionTemplate transactions;
    private final Clock clock;
    private final Duration lifetime;

    PasswordRecovery(AccountRepository accounts, PasswordResetTokenRepository tokens,
                     EmailVerificationRepository verifications, AccountPasswords passwords, AccountAbuseLimits limits,
                     AccountMail mail, PlatformTransactionManager transactionManager, Clock clock,
                     @Value("${mellow.account.password-reset-token-lifetime:30m}") Duration lifetime) {
        this.accounts = accounts;
        this.tokens = tokens;
        this.verifications = verifications;
        this.passwords = passwords;
        this.limits = limits;
        this.mail = mail;
        this.transactions = new TransactionTemplate(transactionManager);
        this.transactions.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        this.clock = clock;
        if (lifetime.compareTo(RESEND_INTERVAL) < 0 || lifetime.compareTo(Duration.ofDays(1)) > 0) {
            throw new IllegalArgumentException("Password reset lifetime must be between one minute and one day");
        }
        this.lifetime = lifetime;
    }

    public void request(String emailInput, String source) {
        var email = AccountInput.email(emailInput);
        limits.checkRecoveryRequest(source, email.canonical());
        var delivery = mail.requireDelivery();
        var message = transactions.execute(transaction -> {
            var eligible = accounts.lockByCanonicalEmail(email.canonical())
                    .filter(account -> account.isVerified() || account.isPendingVerification());
            if (eligible.isEmpty()) return null;

            var account = eligible.orElseThrow();
            Instant now = now();
            var current = tokens.findByAccountIdAndConsumedAtIsNullAndSupersededAtIsNull(account.id());
            if (current.isPresent() && now.isBefore(current.get().createdAt().plus(RESEND_INTERVAL))) return null;

            tokens.supersedeOpen(account.id(), now);
            String raw = AccountTokens.generate();
            Instant expiresAt = now.plus(lifetime);
            tokens.save(new PasswordResetToken(account.id(), AccountTokens.resetDigest(raw).orElseThrow(), now, expiresAt));
            return mail.message(account.email(), raw, expiresAt, VerificationMail.Purpose.PASSWORD_RESET);
        });
        mail.sendAfterCommit(delivery, message);
    }

    public void confirm(String rawToken, String newPassword, String source) {
        limits.check(AccountAbuseLimits.Operation.RECOVERY_CONFIRM, source);
        if (!AccountInput.validPassword(newPassword)) throw AccountRequestException.invalidInput();
        String digest = AccountTokens.resetDigest(rawToken).orElseThrow(AccountRequestException::invalidResetToken);
        transactions.executeWithoutResult(transaction -> {
            var accountId = tokens.findAccountId(digest).orElseThrow(AccountRequestException::invalidResetToken);
            // Email verification, recovery issuance and token use take the account lock first.
            var account = accounts.lockById(accountId).filter(candidate -> candidate.isVerified() || candidate.isPendingVerification())
                    .orElseThrow(AccountRequestException::invalidResetToken);
            var token = tokens.findByTokenDigest(digest).orElseThrow(AccountRequestException::invalidResetToken);
            if (!token.canConsume(now())) throw AccountRequestException.invalidResetToken();

            String hash = passwords.encode(newPassword);
            Instant resetAt = now();
            if (!token.canConsume(resetAt)) throw AccountRequestException.invalidResetToken();

            verifications.supersedeOpen(accountId, resetAt);
            token.consume(resetAt);
            account.recoverPassword(hash, resetAt);
        });
    }

    private Instant now() {
        return clock.instant().truncatedTo(ChronoUnit.MILLIS);
    }
}
