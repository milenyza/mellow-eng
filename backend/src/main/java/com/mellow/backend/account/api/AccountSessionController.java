package com.mellow.backend.account.api;

import com.mellow.backend.account.persistence.VerifiedAccount;
import com.mellow.backend.security.SecuritySessions;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
public class AccountSessionController {

    public static final String LOGIN = "/api/v1/auth/login";
    public static final String ME = "/api/v1/auth/me";
    public static final String LOGOUT = "/api/v1/auth/logout";

    private final SecuritySessions sessions;

    AccountSessionController(SecuritySessions sessions) {
        this.sessions = sessions;
    }

    @PostMapping(path = LOGIN, consumes = MediaType.APPLICATION_JSON_VALUE)
    ResponseEntity<AccountSummary> login(@RequestBody AccountRequests.Login input, HttpServletRequest request,
                                         HttpServletResponse response) {
        return summary(sessions.login(input.email(), input.password(), request, response));
    }

    @GetMapping(ME)
    ResponseEntity<AccountSummary> me(Authentication authentication, HttpServletRequest request, HttpServletResponse response) {
        return summary(sessions.current(authentication, request, response));
    }

    @PostMapping(LOGOUT)
    ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        sessions.logout(request, response);
        return ResponseEntity.noContent().cacheControl(CacheControl.noStore()).build();
    }

    private static ResponseEntity<AccountSummary> summary(VerifiedAccount identity) {
        var response = new AccountSummary(identity.accountId(), identity.learnerId(), identity.displayName(),
                identity.email(), true);
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(response);
    }

    record AccountSummary(UUID accountId, UUID learnerId, String displayName, String email, boolean emailVerified) {
        @Override
        public String toString() {
            return "[account summary redacted]";
        }
    }
}
