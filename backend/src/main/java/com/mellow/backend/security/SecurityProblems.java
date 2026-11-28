package com.mellow.backend.security;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.security.web.csrf.CsrfException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.net.URI;

@Component
public final class SecurityProblems {

    private final JsonMapper json;

    SecurityProblems(JsonMapper json) {
        this.json = json;
    }

    AuthenticationEntryPoint entryPoint() {
        return (request, response, error) -> unauthenticated(response);
    }

    AccessDeniedHandler deniedHandler() {
        return (request, response, error) -> {
            if (error instanceof CsrfException) {
                write(response, HttpStatus.FORBIDDEN, "csrf-validation-failed", "A valid CSRF token is required.");
            } else {
                forbidden(response);
            }
        };
    }

    public void unauthenticated(HttpServletResponse response) throws IOException {
        write(response, HttpStatus.UNAUTHORIZED, "authentication-required", "A trusted learner identity is required.");
    }

    public void revoked(HttpServletResponse response) throws IOException {
        write(response, HttpStatus.UNAUTHORIZED, "session-revoked", "The authenticated session has been revoked.");
    }

    public void forbidden(HttpServletResponse response) throws IOException {
        write(response, HttpStatus.FORBIDDEN, "access-denied", "Access to this resource is denied.");
    }

    void rejected(HttpServletResponse response) throws IOException {
        write(response, HttpStatus.BAD_REQUEST, "request-rejected", "The request could not be accepted.");
    }

    private void write(HttpServletResponse response, HttpStatus status, String code, String detail) throws IOException {
        var problem = ProblemDetail.forStatusAndDetail(status, detail);
        problem.setType(URI.create("urn:mellow:problem:" + code));
        response.setStatus(status.value());
        response.setHeader("Cache-Control", "no-store");
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        json.writeValue(response.getOutputStream(), problem);
    }
}
