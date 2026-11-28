package com.mellow.backend.security;

import com.mellow.backend.account.api.AccountController;
import com.mellow.backend.account.api.AccountSessionController;
import com.mellow.backend.learner.api.PreferencesController;
import com.mellow.backend.legacy.api.LegacyImportController;
import com.mellow.backend.progress.api.ProgressBoundary;
import com.mellow.backend.progress.api.TrustedLearnerResolver;
import com.mellow.backend.study.api.SessionController;
import com.mellow.backend.vocabulary.api.VocabularyController;
import jakarta.servlet.DispatcherType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.boot.web.servlet.ServletListenerRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseCookie;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.logout.CompositeLogoutHandler;
import org.springframework.security.web.authentication.logout.LogoutHandler;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.security.web.authentication.session.ChangeSessionIdAuthenticationStrategy;
import org.springframework.security.web.authentication.session.CompositeSessionAuthenticationStrategy;
import org.springframework.security.web.authentication.session.SessionAuthenticationStrategy;
import org.springframework.security.web.context.DelegatingSecurityContextRepository;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.RequestAttributeSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfAuthenticationStrategy;
import org.springframework.security.web.csrf.CsrfLogoutHandler;
import org.springframework.security.web.csrf.CsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestHandler;
import org.springframework.security.web.csrf.CsrfFilter;
import org.springframework.security.web.csrf.HttpSessionCsrfTokenRepository;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.security.web.util.matcher.AndRequestMatcher;
import org.springframework.security.web.util.matcher.DispatcherTypeRequestMatcher;
import org.springframework.security.web.util.matcher.OrRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.web.util.HttpSessionMutexListener;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Configuration(proxyBeanMethods = false)
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
class SecurityConfiguration {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, TrustedLearnerResolver resolver, SecurityProblems problems,
                                            SecurityContextRepository contexts, CsrfTokenRepository csrfTokens,
                                            CsrfTokenRequestHandler csrfHeaders, SecuritySessions sessions) throws Exception {
        var paths = PathPatternRequestMatcher.withDefaults();
        var owned = learnerRoutes(paths);
        var errorDispatch = new AndRequestMatcher(new DispatcherTypeRequestMatcher(DispatcherType.ERROR),
                paths.matcher("/error"));
        return http
                .authorizeHttpRequests(rules -> rules
                        .requestMatchers(errorDispatch, paths.matcher(HttpMethod.GET, "/api/v1/status"),
                                paths.matcher(HttpMethod.GET, "/actuator/health"),
                                paths.matcher(HttpMethod.GET, CsrfController.PATH),
                                paths.matcher(HttpMethod.POST, AccountController.REGISTER),
                                paths.matcher(HttpMethod.POST, AccountController.RESEND),
                                paths.matcher(HttpMethod.POST, AccountController.CONFIRM),
                                paths.matcher(HttpMethod.POST, AccountController.RECOVERY_REQUEST),
                                paths.matcher(HttpMethod.POST, AccountController.RECOVERY_CONFIRM),
                                paths.matcher(HttpMethod.POST, AccountSessionController.LOGIN),
                                paths.matcher(HttpMethod.POST, AccountSessionController.LOGOUT)).permitAll()
                        .requestMatchers(owned, paths.matcher(HttpMethod.GET, AccountSessionController.ME))
                        .hasAuthority(MellowPrincipal.LEARNER_AUTHORITY)
                        .anyRequest().denyAll())
                .addFilterBefore(new ProgressBoundary(owned, resolver, problems, sessions), CsrfFilter.class)
                .exceptionHandling(errors -> errors.authenticationEntryPoint(problems.entryPoint())
                        .accessDeniedHandler(problems.deniedHandler()))
                .csrf(csrf -> csrf.csrfTokenRepository(csrfTokens).csrfTokenRequestHandler(csrfHeaders))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                .securityContext(context -> context.requireExplicitSave(true).securityContextRepository(contexts))
                .headers(headers -> headers.referrerPolicy(policy -> policy.policy(ReferrerPolicy.NO_REFERRER))
                        .frameOptions(frame -> frame.deny()).httpStrictTransportSecurity(Customizer.withDefaults()))
                .requestCache(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .build();
    }

    @Bean
    SecurityContextRepository securityContexts() {
        return new DelegatingSecurityContextRepository(new RequestAttributeSecurityContextRepository(),
                new HttpSessionSecurityContextRepository());
    }

    @Bean
    CsrfTokenRepository csrfTokens() {
        return new HttpSessionCsrfTokenRepository();
    }

    @Bean
    CsrfTokenRequestHandler csrfHeaders() {
        return new HeaderCsrfTokenHandler();
    }

    @Bean
    SessionAuthenticationStrategy loginSessionStrategy(CsrfTokenRepository csrfTokens, CsrfTokenRequestHandler csrfHeaders) {
        var renewCsrf = new CsrfAuthenticationStrategy(csrfTokens);
        renewCsrf.setRequestHandler(csrfHeaders);
        return new CompositeSessionAuthenticationStrategy(List.of(new ChangeSessionIdAuthenticationStrategy(), renewCsrf));
    }

    @Bean
    LogoutHandler accountLogoutHandler(SecurityContextRepository contexts, CsrfTokenRepository csrfTokens,
                                       @Value("${server.servlet.session.cookie.same-site}") String sameSite) {
        var clearContext = new SecurityContextLogoutHandler();
        clearContext.setSecurityContextRepository(contexts);
        return new CompositeLogoutHandler(new CsrfLogoutHandler(csrfTokens), clearContext,
                (request, response, authentication) -> {
                    var settings = request.getServletContext().getSessionCookieConfig();
                    var expired = ResponseCookie.from(settings.getName(), "")
                            .path(settings.getPath()).httpOnly(settings.isHttpOnly())
                            .secure(settings.isSecure() || request.isSecure()).sameSite(sameSite)
                            .maxAge(Duration.ZERO).build();
                    response.addHeader(HttpHeaders.SET_COOKIE, expired.toString());
                });
    }

    @Bean
    ServletListenerRegistrationBean<HttpSessionMutexListener> sessionMutexListener() {
        return new ServletListenerRegistrationBean<>(new HttpSessionMutexListener());
    }

    @Bean
    WebSecurityCustomizer rejectedRequests(SecurityProblems problems) {
        return web -> web.requestRejectedHandler((request, response, error) -> problems.rejected(response));
    }

    private static RequestMatcher learnerRoutes(PathPatternRequestMatcher.Builder paths) {
        List<RequestMatcher> routes = new ArrayList<>();
        for (var base : List.of("/api/v1/lesson-progress", "/api/v1/reading-progress")) {
            routes.add(paths.matcher(HttpMethod.GET, base));
            routes.add(paths.matcher(HttpMethod.GET, base + "/{resource}"));
            routes.add(paths.matcher(HttpMethod.PUT, base + "/{resource}/attempts/{run}"));
        }
        for (var base : List.of(SessionController.GAMES, SessionController.SIMULATIONS, SessionController.FLASHCARDS)) {
            routes.add(paths.matcher(HttpMethod.GET, base));
            routes.add(paths.matcher(HttpMethod.GET, base + "/{ref}"));
            routes.add(paths.matcher(HttpMethod.PUT, base + "/{ref}"));
        }
        routes.addAll(List.of(
                paths.matcher(HttpMethod.GET, VocabularyController.FAVORITES),
                paths.matcher(HttpMethod.GET, VocabularyController.FAVORITES + "/item"),
                paths.matcher(HttpMethod.PUT, VocabularyController.FAVORITES + "/item"),
                paths.matcher(HttpMethod.DELETE, VocabularyController.FAVORITES + "/item"),
                paths.matcher(HttpMethod.GET, VocabularyController.ANNOTATIONS),
                paths.matcher(HttpMethod.GET, VocabularyController.ANNOTATIONS + "/item"),
                paths.matcher(HttpMethod.PATCH, VocabularyController.ANNOTATIONS + "/item"),
                paths.matcher(HttpMethod.DELETE, VocabularyController.ANNOTATIONS + "/item"),
                paths.matcher(HttpMethod.GET, PreferencesController.PATH),
                paths.matcher(HttpMethod.PATCH, PreferencesController.PATH),
                paths.matcher(HttpMethod.POST, LegacyImportController.PATH + "/dry-run"),
                paths.matcher(HttpMethod.PUT, LegacyImportController.PATH + "/{ref}"),
                paths.matcher(HttpMethod.GET, LegacyImportController.PATH + "/{ref}")));
        return new OrRequestMatcher(routes);
    }
}
