package com.mellow.backend.account.api;

import com.mellow.backend.account.application.AccountAbuseLimits;
import com.mellow.backend.account.application.AccountRegistration;
import com.mellow.backend.account.application.PasswordRecovery;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AccountController {

    public static final String REGISTER = "/api/v1/auth/register";
    public static final String RESEND = "/api/v1/auth/email-verification/resend";
    public static final String CONFIRM = "/api/v1/auth/email-verification/confirm";

    public static final String RECOVERY_REQUEST = "/api/v1/auth/password-reset/request";
    public static final String RECOVERY_CONFIRM = "/api/v1/auth/password-reset/confirm";

    private final AccountRegistration registration;
    private final PasswordRecovery recovery;
    private final AccountAbuseLimits limits;

    AccountController(AccountRegistration registration, AccountAbuseLimits limits, PasswordRecovery recovery) {
        this.registration = registration;
        this.limits = limits;
        this.recovery = recovery;
    }

    @PostMapping(path = REGISTER, consumes = MediaType.APPLICATION_JSON_VALUE)
    ResponseEntity<Accepted> register(@RequestBody AccountRequests.Registration input, HttpServletRequest request) {
        limits.check(AccountAbuseLimits.Operation.REGISTER, request.getRemoteAddr());
        registration.register(input.displayName(), input.email(), input.password());
        return accepted();
    }

    @PostMapping(path = RESEND, consumes = MediaType.APPLICATION_JSON_VALUE)
    ResponseEntity<Accepted> resend(@RequestBody AccountRequests.Resend input, HttpServletRequest request) {
        limits.check(AccountAbuseLimits.Operation.RESEND, request.getRemoteAddr());
        registration.resend(input.email(), input.password());
        return accepted();
    }

    @PostMapping(path = CONFIRM, consumes = MediaType.APPLICATION_JSON_VALUE)
    ResponseEntity<Void> confirm(@RequestBody AccountRequests.Confirmation input, HttpServletRequest request) {
        limits.check(AccountAbuseLimits.Operation.CONFIRM, request.getRemoteAddr());
        registration.confirm(input.token(), input.password());
        return ResponseEntity.noContent().cacheControl(CacheControl.noStore()).build();
    }

    @PostMapping(path = RECOVERY_REQUEST, consumes = MediaType.APPLICATION_JSON_VALUE)
    ResponseEntity<Accepted> requestRecovery(@RequestBody AccountRequests.RecoveryRequest input, HttpServletRequest request) {
        recovery.request(input.email(), request.getRemoteAddr());
        return accepted();
    }

    @PostMapping(path = RECOVERY_CONFIRM, consumes = MediaType.APPLICATION_JSON_VALUE)
    ResponseEntity<Void> confirmRecovery(@RequestBody AccountRequests.RecoveryConfirmation input, HttpServletRequest request) {
        recovery.confirm(input.token(), input.newPassword(), request.getRemoteAddr());
        return ResponseEntity.noContent().cacheControl(CacheControl.noStore()).build();
    }

    private static ResponseEntity<Accepted> accepted() {
        return ResponseEntity.accepted().cacheControl(CacheControl.noStore()).body(new Accepted("accepted"));
    }

    record Accepted(String status) {}
}
