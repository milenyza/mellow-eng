package com.mellow.backend.account.application;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;

final class AccountTokens {

    private static final int TOKEN_BYTES = 32;
    private static final int ENCODED_LENGTH = 43;
    private static final Base64.Encoder ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final byte[] RESET_SCOPE = "mellow:password-reset:v1\0".getBytes(StandardCharsets.US_ASCII);

    private AccountTokens() {}

    static String generate() {
        byte[] bytes = new byte[TOKEN_BYTES];
        RANDOM.nextBytes(bytes);
        return ENCODER.encodeToString(bytes);
    }

    static Optional<String> digest(String token) {
        return digest(token, null);
    }

    static Optional<String> resetDigest(String token) {
        return digest(token, RESET_SCOPE);
    }

    private static Optional<String> digest(String token, byte[] scope) {
        if (token == null || token.length() != ENCODED_LENGTH) return Optional.empty();
        byte[] bytes;
        try {
            bytes = Base64.getUrlDecoder().decode(token);
        } catch (IllegalArgumentException invalid) {
            return Optional.empty();
        }
        if (bytes.length != TOKEN_BYTES || !ENCODER.encodeToString(bytes).equals(token)) return Optional.empty();
        try {
            var digest = MessageDigest.getInstance("SHA-256");
            if (scope != null) digest.update(scope);
            return Optional.of(HexFormat.of().formatHex(digest.digest(bytes)));
        } catch (NoSuchAlgorithmException unavailable) {
            throw new IllegalStateException("SHA-256 is required", unavailable);
        }
    }
}
