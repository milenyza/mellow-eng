package com.mellow.backend.account.application;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.time.Instant;
import java.util.Locale;
import java.util.Set;

@Component
class AccountMail {

    private static final Logger LOGGER = LoggerFactory.getLogger(AccountMail.class);
    private static final Set<String> LOOPBACK_HOSTS = Set.of("127.0.0.1", "localhost", "[::1]");

    private final ObjectProvider<VerificationMail> adapters;
    private final URI origin;

    AccountMail(ObjectProvider<VerificationMail> adapters,
                @Value("${mellow.account.verification-origin:}") String origin) {
        this.adapters = adapters;
        this.origin = origin.isBlank() ? null : validateOrigin(origin);
    }

    VerificationMail requireDelivery() {
        var adapter = adapters.getIfAvailable();
        if (origin == null || adapter == null) throw AccountRequestException.mailUnavailable();
        return adapter;
    }

    VerificationMail.Message message(String recipient, String token, Instant expiresAt, VerificationMail.Purpose purpose) {
        String route = switch (purpose) {
            case EMAIL_VERIFICATION -> "/verificar-email";
            case PASSWORD_RESET -> "/redefinir-senha";
        };
        return new VerificationMail.Message(recipient, origin.resolve(route + "#token=" + token), expiresAt, purpose);
    }

    void sendAfterCommit(VerificationMail adapter, VerificationMail.Message message) {
        if (message == null) return;
        try {
            adapter.send(message);
        } catch (RuntimeException failure) {
            if (message.purpose() == VerificationMail.Purpose.EMAIL_VERIFICATION) {
                LOGGER.warn("Verification email delivery failed after commit");
            } else {
                LOGGER.warn("Password reset email delivery failed after commit");
            }
        }
    }

    private static URI validateOrigin(String input) {
        URI origin;
        try {
            origin = URI.create(input);
        } catch (IllegalArgumentException invalid) {
            throw new IllegalArgumentException("Invalid account email origin");
        }
        String host = origin.getHost();
        if (!("https".equals(origin.getScheme()) || "http".equals(origin.getScheme())) || host == null
                || !LOOPBACK_HOSTS.contains(host.toLowerCase(Locale.ROOT)) || origin.getPort() == 0 || origin.getPort() > 65535
                || origin.getRawUserInfo() != null || origin.getRawQuery() != null || origin.getRawFragment() != null
                || !("".equals(origin.getRawPath()) || "/".equals(origin.getRawPath()))) {
            throw new IllegalArgumentException("Account email origin must be a loopback HTTP(S) origin");
        }
        return origin;
    }
}
