package com.mellow.backend.account.application;

import org.springframework.http.HttpStatus;

public final class AccountRequestException extends RuntimeException {

    private final HttpStatus status;
    private final String code;

    private AccountRequestException(HttpStatus status, String code, String detail) {
        super(detail);
        this.status = status;
        this.code = code;
    }

    public HttpStatus status() {
        return status;
    }

    public String code() {
        return code;
    }

    public static AccountRequestException invalidInput() {
        return new AccountRequestException(HttpStatus.BAD_REQUEST, "invalid-account-input",
                "The account request has invalid fields.");
    }

    public static AccountRequestException invalidCredentials() {
        return new AccountRequestException(HttpStatus.UNAUTHORIZED, "invalid-credentials",
                "The email or password could not be verified.");
    }

    public static AccountRequestException sessionAlreadyAuthenticated() {
        return new AccountRequestException(HttpStatus.CONFLICT, "session-already-authenticated",
                "Log out before signing in again.");
    }

    public static AccountRequestException invalidCsrf() {
        return new AccountRequestException(HttpStatus.FORBIDDEN, "csrf-validation-failed",
                "A valid CSRF token is required.");
    }

    static AccountRequestException authenticationRequired() {
        return new AccountRequestException(HttpStatus.UNAUTHORIZED, "authentication-required",
                "A trusted learner identity is required.");
    }

    static AccountRequestException accessDenied() {
        return new AccountRequestException(HttpStatus.FORBIDDEN, "access-denied",
                "Access to this resource is denied.");
    }

    static AccountRequestException invalidToken() {
        return new AccountRequestException(HttpStatus.BAD_REQUEST, "invalid-email-verification",
                "The email verification could not be confirmed.");
    }

    static AccountRequestException invalidResetToken() {
        return new AccountRequestException(HttpStatus.BAD_REQUEST, "invalid-password-reset",
                "The password reset could not be confirmed.");
    }

    static AccountRequestException limited() {
        return new AccountRequestException(HttpStatus.TOO_MANY_REQUESTS, "account-rate-limited",
                "Too many requests. Try again shortly.");
    }

    static AccountRequestException mailUnavailable() {
        return new AccountRequestException(HttpStatus.SERVICE_UNAVAILABLE, "verification-mail-unavailable",
                "Account email delivery is temporarily unavailable.");
    }
}
