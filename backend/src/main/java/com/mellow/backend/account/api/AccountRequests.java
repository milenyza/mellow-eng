package com.mellow.backend.account.api;

public final class AccountRequests {

    private AccountRequests() {}

    public sealed interface Payload permits Registration, Resend, Confirmation, Login, RecoveryRequest, RecoveryConfirmation {}

    public record RecoveryRequest(String email) implements Payload {
        @Override
        public String toString() {
            return "[password recovery request redacted]";
        }
    }

    public record RecoveryConfirmation(String token, String newPassword) implements Payload {
        @Override
        public String toString() {
            return "[password reset confirmation redacted]";
        }
    }

    public record Login(String email, String password) implements Payload {
        @Override
        public String toString() {
            return "[login request redacted]";
        }
    }

    public record Registration(String displayName, String email, String password) implements Payload {
        @Override
        public String toString() {
            return "[registration request redacted]";
        }
    }

    public record Resend(String email, String password) implements Payload {
        @Override
        public String toString() {
            return "[verification resend request redacted]";
        }
    }

    public record Confirmation(String token, String password) implements Payload {
        @Override
        public String toString() {
            return "[verification confirmation request redacted]";
        }
    }
}
