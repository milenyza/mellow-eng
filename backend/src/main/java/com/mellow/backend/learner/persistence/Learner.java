package com.mellow.backend.learner.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "learner")
public class Learner {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(length = 80)
    private String displayName;

    protected Learner() {
    }

    public Learner(Instant createdAt) {
        this(createdAt, null);
    }

    public Learner(Instant createdAt, String displayName) {
        this.createdAt = createdAt;
        this.displayName = displayName;
    }

    public UUID id() {
        return id;
    }
}
