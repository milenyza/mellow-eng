package com.mellow.backend.security;

import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
final class CsrfController {

    static final String PATH = "/api/v1/security/csrf";

    @GetMapping(PATH)
    ResponseEntity<TokenResponse> csrf(CsrfToken token) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .body(new TokenResponse(token.getHeaderName(), token.getToken()));
    }

    record TokenResponse(String headerName, String token) {}
}
