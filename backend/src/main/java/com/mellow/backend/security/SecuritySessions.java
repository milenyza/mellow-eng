package com.mellow.backend.security;

import com.mellow.backend.account.application.AccountAuthentication;
import com.mellow.backend.account.application.AccountRequestException;
import com.mellow.backend.account.persistence.VerifiedAccount;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.security.authentication.AuthenticationTrustResolverImpl;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.logout.LogoutHandler;
import org.springframework.security.web.authentication.session.SessionAuthenticationStrategy;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Component;
import org.springframework.web.util.WebUtils;

@Component
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
public class SecuritySessions {

    private final AccountAuthentication accounts;
    private final SecurityContextRepository contexts;
    private final SessionAuthenticationStrategy loginStrategy;
    private final LogoutHandler logoutHandler;
    private final AuthenticationTrustResolverImpl trust = new AuthenticationTrustResolverImpl();

    SecuritySessions(AccountAuthentication accounts, SecurityContextRepository contexts,
                     SessionAuthenticationStrategy loginStrategy, LogoutHandler logoutHandler) {
        this.accounts = accounts;
        this.contexts = contexts;
        this.loginStrategy = loginStrategy;
        this.logoutHandler = logoutHandler;
    }

    public VerifiedAccount login(String email, String password, HttpServletRequest request, HttpServletResponse response) {
        var session = requireSession(request);
        // Both state transitions serialize against a mutex that survives session ID rotation.
        synchronized (sessionMutex(session)) {
            requireCurrentSession(request, session);
            var current = contexts.loadDeferredContext(request).get().getAuthentication();
            if (trust.isAuthenticated(current)) {
                if (MellowPrincipal.from(current).isPresent()) current(current, request, response);
                throw AccountRequestException.sessionAlreadyAuthenticated();
            }

            var authenticated = accounts.authenticate(email, password, request.getRemoteAddr());
            var identity = accounts.loginIdentity(authenticated);
            loginStrategy.onAuthentication(authenticated, request, response);
            var context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authenticated);
            contexts.saveContext(context, request, response);
            SecurityContextHolder.setContext(context);
            return identity;
        }
    }

    public VerifiedAccount current(Authentication authentication, HttpServletRequest request, HttpServletResponse response) {
        try {
            return accounts.current(authentication);
        } catch (SessionRevokedException revoked) {
            invalidateRevoked(request, response);
            throw revoked;
        }
    }

    public void invalidateRevoked(HttpServletRequest request, HttpServletResponse response) {
        logoutHandler.logout(request, response, SecurityContextHolder.getContext().getAuthentication());
    }

    public void logout(HttpServletRequest request, HttpServletResponse response) {
        var session = requireSession(request);
        synchronized (sessionMutex(session)) {
            requireCurrentSession(request, session);
            var authentication = contexts.loadDeferredContext(request).get().getAuthentication();
            logoutHandler.logout(request, response, authentication);
        }
    }

    private static HttpSession requireSession(HttpServletRequest request) {
        var session = request.getSession(false);
        if (session == null) throw AccountRequestException.invalidCsrf();
        return session;
    }

    private static Object sessionMutex(HttpSession session) {
        try {
            return WebUtils.getSessionMutex(session);
        } catch (IllegalStateException expired) {
            throw AccountRequestException.invalidCsrf();
        }
    }

    private static void requireCurrentSession(HttpServletRequest request, HttpSession session) {
        if (!session.getId().equals(request.getRequestedSessionId()) || !request.isRequestedSessionIdValid()) {
            throw AccountRequestException.invalidCsrf();
        }
    }
}
