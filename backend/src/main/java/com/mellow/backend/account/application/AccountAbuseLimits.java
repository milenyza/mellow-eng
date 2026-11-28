package com.mellow.backend.account.application;

import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.Semaphore;
import java.util.function.Supplier;

@Component
public class AccountAbuseLimits {

    public static final long RETRY_AFTER_SECONDS = 60;
    private static final Duration WINDOW = Duration.ofSeconds(RETRY_AFTER_SECONDS);

    private final Clock clock;
    private final Semaphore hashes = new Semaphore(2);
    private final Map<Operation, Window> windows = new EnumMap<>(Operation.class);

    AccountAbuseLimits(Clock clock) {
        this.clock = clock;
    }

    public void check(Operation operation, String source) {
        check(operation, source, null);
    }

    void checkLogin(String source, String canonicalEmail) {
        check(Operation.LOGIN, source, new AccountSource(source, canonicalEmail));
    }

    void checkRecoveryRequest(String source, String canonicalEmail) {
        check(Operation.RECOVERY_REQUEST, source, new AccountSource(source, canonicalEmail));
    }

    private synchronized void check(Operation operation, String source, AccountSource accountSource) {
        Instant now = clock.instant();
        Window window = windows.get(operation);
        if (window == null || !now.isBefore(window.startedAt.plus(WINDOW))) {
            window = new Window(now);
            windows.put(operation, window);
        }
        int sourceCount = window.bySource.getOrDefault(source, 0);
        if (window.total >= operation.totalLimit || sourceCount >= operation.sourceLimit) {
            throw AccountRequestException.limited();
        }
        if (accountSource != null) {
            int accountCount = window.byAccountSource.getOrDefault(accountSource, 0);
            if (accountCount >= operation.accountSourceLimit) throw AccountRequestException.limited();
            window.byAccountSource.put(accountSource, accountCount + 1);
        }
        window.total++;
        window.bySource.put(source, sourceCount + 1);
    }

    <T> T hash(Supplier<T> operation) {
        if (!hashes.tryAcquire()) throw AccountRequestException.limited();
        try {
            return operation.get();
        } finally {
            hashes.release();
        }
    }

    public enum Operation {
        REGISTER(8, 60, 0), RESEND(12, 90, 0), CONFIRM(30, 180, 0), LOGIN(10, 80, 5),
        RECOVERY_REQUEST(8, 60, 3), RECOVERY_CONFIRM(15, 100, 0);

        private final int sourceLimit;
        private final int totalLimit;
        private final int accountSourceLimit;

        Operation(int sourceLimit, int totalLimit, int accountSourceLimit) {
            this.sourceLimit = sourceLimit;
            this.totalLimit = totalLimit;
            this.accountSourceLimit = accountSourceLimit;
        }
    }

    private record AccountSource(String source, String canonicalEmail) {}

    private static final class Window {
        private final Instant startedAt;
        private final Map<String, Integer> bySource = new HashMap<>();
        private final Map<AccountSource, Integer> byAccountSource = new HashMap<>();
        private int total;

        private Window(Instant startedAt) {
            this.startedAt = startedAt;
        }
    }
}
