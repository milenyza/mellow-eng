package com.mellow.backend.progress.api;

import com.mellow.backend.security.SecurityProblems;
import com.mellow.backend.security.SecuritySessions;
import com.mellow.backend.security.SessionRevokedException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;
import java.util.UUID;

public class ProgressBoundary extends OncePerRequestFilter {

    public static final String OWNER = "mellow.progress.trustedOwner";

    private final RequestMatcher learnerRoutes;
    private final TrustedLearnerResolver resolver;
    private final SecurityProblems problems;
    private final SecuritySessions sessions;

    public ProgressBoundary(RequestMatcher learnerRoutes, TrustedLearnerResolver resolver, SecurityProblems problems,
                            SecuritySessions sessions) {
        this.learnerRoutes = learnerRoutes;
        this.resolver = resolver;
        this.problems = problems;
        this.sessions = sessions;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !learnerRoutes.matches(request);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        response.setHeader("Cache-Control", "no-store");
        Optional<UUID> owner;
        try {
            owner = resolver.resolve();
        } catch (SessionRevokedException revoked) {
            sessions.invalidateRevoked(request, response);
            problems.revoked(response);
            return;
        } catch (AccessDeniedException denied) {
            problems.forbidden(response);
            return;
        }
        if (owner.isEmpty()) {
            problems.unauthenticated(response);
            return;
        }
        request.setAttribute(OWNER, new TrustedLearner(owner.get()));
        chain.doFilter(request, response);
    }
}
