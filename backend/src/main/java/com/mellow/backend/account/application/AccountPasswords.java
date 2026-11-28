package com.mellow.backend.account.application;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
class AccountPasswords {

    private final PasswordEncoder encoder;
    private final AccountAbuseLimits limits;
    private final String dummyHash;

    AccountPasswords(PasswordEncoder encoder, AccountAbuseLimits limits) {
        this.encoder = encoder;
        this.limits = limits;
        this.dummyHash = encode(UUID.randomUUID().toString());
    }

    String encode(String password) {
        return limits.hash(() -> encoder.encode(password));
    }

    boolean matches(String password, String storedHash) {
        return limits.hash(() -> encoder.matches(password, storedHash == null ? dummyHash : storedHash));
    }
}
