package com.mellow.backend.account.application;

import com.mellow.backend.account.persistence.AccountRepository;
import com.mellow.backend.account.persistence.VerifiedAccount;
import com.mellow.backend.security.MellowPrincipal;
import com.mellow.backend.security.SessionRevokedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AccountAuthentication {

    private final AccountRepository accounts;
    private final AccountAbuseLimits limits;
    private final ProviderManager authenticationManager;

    AccountAuthentication(AccountRepository accounts, AccountAbuseLimits limits, AccountCredentialsProvider provider) {
        this.accounts = accounts;
        this.limits = limits;
        this.authenticationManager = new ProviderManager(provider);
    }

    public Authentication authenticate(String email, String password, String source) {
        String canonicalEmail = AccountInput.email(email).canonical();
        if (!AccountInput.validPassword(password)) throw AccountRequestException.invalidInput();
        limits.checkLogin(source, canonicalEmail);
        return authenticationManager.authenticate(UsernamePasswordAuthenticationToken.unauthenticated(canonicalEmail, password));
    }

    public VerifiedAccount current(Authentication authentication) {
        var principal = MellowPrincipal.from(authentication).orElseThrow(AccountRequestException::authenticationRequired);
        var account = verifiedIdentity(principal).orElseThrow(AccountRequestException::accessDenied);
        if (account.securityRevision() != principal.securityRevision()) throw new SessionRevokedException();
        return account;
    }

    public VerifiedAccount loginIdentity(Authentication authentication) {
        return MellowPrincipal.from(authentication).flatMap(principal ->
                        verifiedIdentity(principal).filter(account -> account.securityRevision() == principal.securityRevision()))
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));
    }

    private Optional<VerifiedAccount> verifiedIdentity(MellowPrincipal principal) {
        return accounts.findVerifiedIdentity(principal.accountId(), principal.learnerId());
    }
}
