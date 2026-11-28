# Password recovery API

Mellow supports mailbox-based password recovery for verified and pending accounts. The backend runs in loopback development with synthetic data. The integration suite captures email in memory. The executable JAR ships without a mail adapter.

## Requests and responses

Fetch `GET /api/v1/security/csrf` on the same origin and keep the returned token in memory. Both routes require the corresponding session cookie and the masked token in `X-CSRF-TOKEN`. Requests are JSON with a 4 KiB limit. Responses use `Cache-Control: no-store`.

| Route                                      | Payload                                                                                     | Success                            |
| ------------------------------------------ | ------------------------------------------------------------------------------------------- | ---------------------------------- |
| `POST /api/v1/auth/password-reset/request` | `{"email":"learner@example.test"}`                                                          | `202` with `{"status":"accepted"}` |
| `POST /api/v1/auth/password-reset/confirm` | `{"token":"<token from the email fragment>","newPassword":"Synthetic recovery passphrase"}` | `204` with an empty body           |

Email canonicalization is the same as [registration](account-registration.md). With delivery infrastructure configured, valid request input produces the same `202` for existing, pending, nonexistent and ineligible addresses, including requests suppressed by the resend cooldown and failures to deliver after commit. Rate-limit responses depend on request counters, independent of account existence. The generic contract reduces ordinary enumeration signals. Database access and email delivery may still affect timing. When the delivery adapter or trusted origin is missing, the request route returns a service-wide `503` before writing or looking up the account.

Confirmation requires the reset token and a new password of 15–128 Unicode code points. Spaces and Unicode characters are preserved exactly. The encoder is the existing versioned Argon2id encoder, and the previous password is unnecessary. GET requests never consume tokens. A successful confirmation requires a fresh credential login for the recovered identity.

| Status | Problem type suffix             | Condition                                                                      |
| ------ | ------------------------------- | ------------------------------------------------------------------------------ |
| 400    | `invalid-account-input`         | Invalid email, new password or JSON                                            |
| 400    | `invalid-password-reset`        | Malformed, unknown, expired, superseded or consumed token                      |
| 403    | `csrf-validation-failed`        | CSRF absent or invalid                                                         |
| 413    | Standard Problem Details        | Payload exceeds 4 KiB                                                          |
| 429    | `account-rate-limited`          | Request limit or shared hashing capacity exceeded. Includes `Retry-After: 60`. |
| 500    | `account-request-failed`        | Unexpected persistence or application error                                    |
| 503    | `verification-mail-unavailable` | Account email infrastructure is unavailable for issuance                       |

## Token, transaction and email

Mellow generates 32 random bytes with Java `SecureRandom` and encodes them as unpadded Base64url. V7 gives reset tokens a dedicated table and a digest scoped to the reset purpose. The digest is SHA-256 over the ASCII prefix `mellow:password-reset:v1`, a zero byte and the random bytes. V6 email-verification tokens retain their original digest and separate store. A reset token cannot be used for verification, and a verification token cannot be used for reset. The database retains only the digest with its account ownership and lifecycle dates.

`MELLOW_PASSWORD_RESET_TOKEN_LIFETIME` defaults to 30 minutes and accepts durations between one minute and one day. An eligible account receives at most one new token per minute while an open record exists. Issuing a fresh token supersedes the previous one under the account lock. The partial unique index allows at most one open token, so consuming it leaves no other usable reset token. Confirmation locks the same account and rechecks the token and expiry before and after hashing. The password update, token consumption, superseding open verification tokens and incrementing the account security revision commit together. Concurrent consumption can succeed once. If persistence fails, the previous password, revision, verification state and usable token remain in place. Requests to send email never change credentials or revoke sessions.

The shared account mail abstraction sends the branded message only after the issuance transaction commits. The link uses the configured loopback `MELLOW_VERIFICATION_ORIGIN` and the path `/redefinir-senha#token=…`. The address comes from the stored account and the origin is independent of Host and forwarding headers. The message has an expiry and instructions for unsolicited requests. Delivery failures are logged as a generic event without the link or recipient. A retry after the cooldown can issue another link. The normal artifact uses no external mail delivery. An already issued token can still be confirmed while delivery is unavailable.

## Recovering a pending account

Possession of a valid reset token sent to the registered address proves current mailbox control. The same transaction replaces the original signup password, marks the pending account verified, and supersedes its outstanding verification tokens. This lets the mailbox owner reclaim the pending account without knowing a password chosen by somebody else. The previous password and earlier verification links can no longer grant access. The account UUID and one-to-one learner UUID are retained, and no educational or personal records are changed.

## Session revocation and frontend behavior

V7 initializes existing accounts at security revision zero. Login binds the revision read during credential verification to the session principal. It also checks that revision again before establishing the session. Each learner-owned API request and `GET /api/v1/auth/me` compares the session revision with the database. Once reset commits, sessions with the old revision receive `401` with `urn:mellow:problem:session-revoked` the first time they reach one of these routes. The backend clears that session and expires its cookie. Subsequent use of the same identifier is anonymous. The independent database checks enforce revocation across all sessions without a process-local account session registry. Other accounts are unaffected.

Revocation is effective for authorization checks after commit. A request already authorized before the commit can finish processing with its captured identity. Revision comparison does not cancel in-flight requests or roll back a separate transaction. The current server keeps sessions in memory, so a normal deployment restart already loses them. V7 itself does not increment existing account revisions.

A future frontend should read the raw token from the URL fragment, remove it from history immediately, and keep it in memory until deliberate submission. It should keep analytics and third-party scripts off that page. On success or `session-revoked` for the current account, clear its views, cancel or discard in-flight responses and pending writes, and navigate to sign-in. Use `/auth/me` after completion to discover whether a cookie from a previous login was revoked. An unrelated authenticated browser session should be explicitly logged out before switching accounts. Bootstrap CSRF for the resulting anonymous session, then reacquire it after login. Browser-local educational data remains separate.

## Abuse controls and production requirements

Each one-minute window admits eight recovery requests per connection address, three per canonical address and source pair, and 60 overall. Confirmations allow 15 per source and 100 overall. The global totals bound memory use. The database-backed resend cooldown also applies across process restarts. Confirmations share the two simultaneous Argon2id operations with registration, verification and login. The limiter ignores arbitrary forwarded client IPs and creates no permanent account lockout. Single-instance counters reset on restart, share capacity among users behind a connection address and need a deployment-specific edge strategy. Continued unauthenticated recovery requests can supersede delayed links after the cooldown without revoking sessions or changing a password.

Compromised-password screening is a production requirement. A future shared creation-time policy should compare registration and reset candidates to a maintained local blocklist of common, expected and compromised passwords and return a specific policy error. Select and test a reviewed source and update process. No blocklist or remote lookup is active in this phase. Passwords and full password hashes should stay inside the application boundary. Production also requires managed email delivery, a trusted HTTPS origin, token retention cleanup, abuse monitoring, browser tests and dependency/image review.

[OWASP forgot password guidance](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html) · [NIST password guidance](https://pages.nist.gov/800-63-4/sp800-63b.html)
