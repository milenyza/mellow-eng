package com.mellow.backend.account.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "email_verification")
public class EmailVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, updatable = false)
    private UUID accountId;

    @Column(nullable = false, unique = true, length = 64, updatable = false)
    private String tokenDigest;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false, updatable = false)
    private Instant expiresAt;

    private Instant consumedAt;
    private Instant supersededAt;

    protected EmailVerification() {}

    public EmailVerification(UUID accountId, String tokenDigest, Instant now, Instant expiresAt) {
        this.accountId = accountId;
        this.tokenDigest = tokenDigest;
        this.createdAt = now;
        this.expiresAt = expiresAt;
    }

    public Instant createdAt() {
        return createdAt;
    }

    public boolean canConsume(Instant now) {
        return consumedAt == null && supersededAt == null && now.isBefore(expiresAt);
    }

    public void consume(Instant now) {
        consumedAt = now;
    }
}
