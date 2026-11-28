package com.mellow.backend.progress.api;

import com.mellow.backend.study.api.SessionController;
import com.mellow.backend.legacy.api.LegacyImportController;
import com.mellow.backend.learner.api.PreferencesController;
import com.mellow.backend.vocabulary.api.VocabularyController;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.http.server.PathContainer.PathSegment;
import org.springframework.http.server.RequestPath;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class ProgressBoundary extends OncePerRequestFilter {

    public static final String OWNER = "mellow.progress.trustedOwner";
    private static final List<String> OWNED_ROUTES = List.of("/api/v1/lesson-progress", "/api/v1/reading-progress",
            SessionController.GAMES, SessionController.SIMULATIONS, SessionController.FLASHCARDS,
            VocabularyController.FAVORITES, VocabularyController.ANNOTATIONS, PreferencesController.PATH, LegacyImportController.PATH);
    private final ObjectProvider<TrustedLearnerResolver> resolver;
    private final JsonMapper json;

    ProgressBoundary(ObjectProvider<TrustedLearnerResolver> resolver, JsonMapper json) {
        this.resolver = resolver;
        this.json = json;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = RequestPath.parse(request.getRequestURI(), request.getContextPath()).pathWithinApplication()
                .elements().stream().map(element -> element instanceof PathSegment segment
                        ? segment.valueToMatch() : element.value()).collect(Collectors.joining());
        return OWNED_ROUTES.stream().noneMatch(route -> path.equals(route) || path.startsWith(route + "/"));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        response.setHeader("Cache-Control", "no-store");
        var owner = resolver.getIfAvailable(() -> ignored -> Optional.empty()).resolve(request);
        if (owner.isEmpty()) {
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
            json.writeValue(response.getOutputStream(),
                    ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, "A trusted learner identity is required."));
            return;
        }
        request.setAttribute(OWNER, new TrustedLearner(owner.get()));
        chain.doFilter(request, response);
    }
}
