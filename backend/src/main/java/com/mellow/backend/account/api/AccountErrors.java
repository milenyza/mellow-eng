package com.mellow.backend.account.api;

import com.mellow.backend.account.application.AccountAbuseLimits;
import com.mellow.backend.account.application.AccountRequestException;
import com.mellow.backend.security.SessionRevokedException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;

@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice(assignableTypes = {AccountController.class, AccountSessionController.class})
class AccountErrors {

    private static final Logger LOGGER = LoggerFactory.getLogger(AccountErrors.class);

    @ExceptionHandler(AccountRequestException.class)
    ResponseEntity<ProblemDetail> accountError(AccountRequestException error) {
        var body = problem(error.status(), error.code(), error.getMessage());
        if (error.status() == HttpStatus.TOO_MANY_REQUESTS) {
            return ResponseEntity.status(error.status()).cacheControl(CacheControl.noStore())
                    .header(HttpHeaders.RETRY_AFTER, Long.toString(AccountAbuseLimits.RETRY_AFTER_SECONDS)).body(body);
        }
        return noStore(body);
    }

    @ExceptionHandler(BadCredentialsException.class)
    ResponseEntity<ProblemDetail> invalidCredentials() {
        return accountError(AccountRequestException.invalidCredentials());
    }

    @ExceptionHandler(SessionRevokedException.class)
    ResponseEntity<ProblemDetail> revokedSession(SessionRevokedException error) {
        return noStore(problem(HttpStatus.UNAUTHORIZED, "session-revoked", error.getMessage()));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ProblemDetail> malformedRequest() {
        return accountError(AccountRequestException.invalidInput());
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    ResponseEntity<ProblemDetail> unsupportedMediaType() {
        return noStore(problem(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "account-json-required",
                "The account request must use JSON."));
    }

    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<ProblemDetail> requestLimit(ResponseStatusException error) {
        return noStore(error.getBody());
    }

    @ExceptionHandler(RuntimeException.class)
    ResponseEntity<ProblemDetail> unexpected() {
        LOGGER.error("Account request failed");
        return noStore(problem(HttpStatus.INTERNAL_SERVER_ERROR, "account-request-failed",
                "The account request could not be processed."));
    }

    private static ProblemDetail problem(HttpStatus status, String code, String detail) {
        var body = ProblemDetail.forStatusAndDetail(status, detail);
        body.setType(URI.create("urn:mellow:problem:" + code));
        return body;
    }

    private static ResponseEntity<ProblemDetail> noStore(ProblemDetail body) {
        return ResponseEntity.status(body.getStatus()).cacheControl(CacheControl.noStore()).body(body);
    }
}
