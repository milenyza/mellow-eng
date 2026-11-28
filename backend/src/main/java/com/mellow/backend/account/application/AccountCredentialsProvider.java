package com.mellow.backend.account.application;

import com.mellow.backend.account.persistence.Account;
import com.mellow.backend.account.persistence.AccountRepository;
import com.mellow.backend.security.MellowPrincipal;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.stereotype.Component;

@Component
class AccountCredentialsProvider implements AuthenticationProvider {

    private final AccountRepository accounts;
    private final AccountPasswords passwords;

    AccountCredentialsProvider(AccountRepository accounts, AccountPasswords passwords) {
        this.accounts = accounts;
        this.passwords = passwords;
    }

    @Override
    public Authentication authenticate(Authentication authentication) {
        var account = accounts.findByEmailCanonical(authentication.getName());
        String hash = account.map(Account::passwordHash).orElse(null);
        if (!passwords.matches((String) authentication.getCredentials(), hash)
                || account.filter(Account::isVerified).isEmpty()) {
            throw new BadCredentialsException("Invalid credentials");
        }
        var verified = account.orElseThrow();
        var principal = new MellowPrincipal(verified.id(), verified.learnerId(), verified.securityRevision());
        return UsernamePasswordAuthenticationToken.authenticated(principal, null,
                AuthorityUtils.createAuthorityList(MellowPrincipal.LEARNER_AUTHORITY));
    }

    @Override
    public boolean supports(Class<?> authentication) {
        return authentication == UsernamePasswordAuthenticationToken.class;
    }
}
