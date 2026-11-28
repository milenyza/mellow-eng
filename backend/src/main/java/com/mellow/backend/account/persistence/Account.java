package com.mellow.backend.account.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "account")
public class Account {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true, updatable = false)
    private UUID learnerId;

    @Column(nullable = false, length = 254)
    private String emailOriginal;

    @Column(nullable = false, unique = true, length = 254)
    private String emailCanonical;

    @Column(nullable = false, length = 255)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private Status status;

    private Instant emailVerifiedAt;

    @Column(nullable = false)
    private long securityRevision;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected Account() {}

    public UUID id() {
        return id;
    }

    public UUID learnerId() {
        return learnerId;
    }

    public boolean isVerified() {
        return status == Status.VERIFIED && emailVerifiedAt != null;
    }

    public String email() {
        return emailOriginal;
    }

    public String passwordHash() {
        return passwordHash;
    }

    public long securityRevision() {
        return securityRevision;
    }

    public void recoverPassword(String hash, Instant now) {
        passwordHash = hash;
        securityRevision = Math.incrementExact(securityRevision);
        updatedAt = now;
        if (isPendingVerification()) verifyEmail(now);
    }

    public boolean isPendingVerification() {
        return status == Status.PENDING_VERIFICATION;
    }

    public void verifyEmail(Instant now) {
        status = Status.VERIFIED;
        emailVerifiedAt = now;
        updatedAt = now;
    }

    enum Status {
        PENDING_VERIFICATION, VERIFIED
    }
}
