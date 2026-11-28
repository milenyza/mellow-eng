package com.mellow.backend.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRequestHandler;
import org.springframework.security.web.csrf.XorCsrfTokenRequestAttributeHandler;

import java.util.function.Supplier;

final class HeaderCsrfTokenHandler implements CsrfTokenRequestHandler {

    private final XorCsrfTokenRequestAttributeHandler masked = new XorCsrfTokenRequestAttributeHandler();

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, Supplier<CsrfToken> token) {
        masked.handle(request, response, token);
    }

    @Override
    public String resolveCsrfTokenValue(HttpServletRequest request, CsrfToken token) {
        if (request.getHeader(token.getHeaderName()) == null) {
            return null;
        }
        return masked.resolveCsrfTokenValue(request, token);
    }
}
