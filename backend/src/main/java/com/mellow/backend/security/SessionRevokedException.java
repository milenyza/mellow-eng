package com.mellow.backend.security;

import org.springframework.security.core.AuthenticationException;

public final class SessionRevokedException extends AuthenticationException {

    public SessionRevokedException() {
        super("The authenticated session has been revoked.");
    }
}
