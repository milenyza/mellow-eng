# Authentication API

Mellow uses server-managed HTTP sessions. The backend is limited to controlled loopback development with synthetic accounts. Registration and email verification use the [account API](account-registration.md). Tests register and verify accounts through HTTP with a test-only email capture. For future browser testing, an explicitly local mail capture service can implement the existing delivery interface behind loopback. Review its access and retention before enabling it. The normal artifact has no delivery adapter.

## Contracts

| Method and route           | Request                                                                       | Success                                                                       |
| -------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `POST /api/v1/auth/login`  | JSON with `email` and `password`, plus a valid session cookie and CSRF header | `200` with the account summary. `Set-Cookie` replaces the session identifier. |
| `GET /api/v1/auth/me`      | Authenticated session cookie                                                  | `200` with the same account summary                                           |
| `POST /api/v1/auth/logout` | A valid session cookie and CSRF header. No body is required.                  | `204` and an expired session cookie                                           |

The account summary contains only `accountId`, `learnerId`, `displayName`, `email` and `emailVerified`. The name can be null for an existing learner with no name, and the email uses its original trimmed form. Successful login and identity retrieval always return `emailVerified: true`. All three responses and their errors use `Cache-Control: no-store`. The session identifier is only sent in the cookie. Filters still deny unexpected methods and routes, including the framework's default login and logout paths.

Login uses the registration email canonicalization and 15–128 Unicode code point password policy. Passwords retain their exact whitespace and characters. JSON bodies are bounded at 4 KiB and unknown fields are rejected. The Spring `ProviderManager` selects the account provider. The provider verifies the stored Argon2id hash and grants `ROLE_LEARNER` only for verified accounts. A fresh join confirms the account, learner and verification state when establishing the session. A nonexistent account goes through the same protected hash budget against an in-memory dummy hash. Missing accounts, wrong passwords and unverified accounts share a single external failure. This reduces visible differences in responses without promising identical database or network timing.

The authenticated principal holds the account and learner UUIDs and the internal security revision. Every learner-owned request rechecks that pair, verified status and the revision. `/me` retrieves its summary and checks eligibility in one query. Deletion or changing the learner relationship denies access on the next request. V6 has pending and verified states. A future disabled state must remain ineligible and should add explicit revocation and session lifecycle rules. Clients cannot change ownership through headers, parameters or request bodies.

A successful [password reset](password-recovery.md) atomically increments the revision. A stale session receives `401 session-revoked` on its next protected request or identity lookup and the backend expires its cookie. A request already authorized before the reset commit can finish. Fresh logins use the revision corresponding to the verified credentials.

## Session and CSRF lifecycle

- Start with a same-origin request to `GET /api/v1/security/csrf`. Keep the returned masked token in memory and send it in `X-CSRF-TOKEN`. The browser supplies the `HttpOnly` session cookie.
- After credential verification, Spring's `ChangeSessionIdAuthenticationStrategy` rotates the identifier and `CsrfAuthenticationStrategy` clears the previous token. The controller explicitly saves the credential-free security context to a repository backed by the HTTP session. Future requests recover the authenticated identity with the replacement cookie.
- Fetch another CSRF token after login before performing writes or logging out. The pre-login token is invalid after rotation, even if presented with the replacement cookie.
- An already authenticated session must log out before signing in again. Login and logout are serialized within the current session. A concurrent login using the old session identifier cannot switch the account. Separate sessions remain independent.
- Logout clears the context and CSRF state, invalidates the current session and expires its cookie. A logout with an existing anonymous session and valid token also returns `204`. An expired session or repeated logout with the old cookie or token returns `403`. Bootstrap a fresh anonymous session to obtain a new token. The previous authenticated token is unusable with the new session.
- `MELLOW_SESSION` is host-only, `Path=/`, `HttpOnly`, `SameSite=Lax` and `Secure` in the base profile. The `dev` profile permits loopback HTTP. Sessions expire after 30 minutes without activity. There is no absolute lifetime, persistent login or distributed session store. Backend restart loses sessions and their tokens.

Login and logout validate CSRF before processing credentials or session state. The learner-owned routes preserve their identity-before-CSRF behavior. Missing or expired authentication on `GET /api/v1/auth/me` returns `401`.

## Errors and limits

| Status | Problem type suffix             | Condition                                                                             |
| ------ | ------------------------------- | ------------------------------------------------------------------------------------- |
| 400    | `invalid-account-input`         | Invalid input or JSON                                                                 |
| 401    | `invalid-credentials`           | Unknown account, wrong password or ineligible account during login                    |
| 401    | `authentication-required`       | No valid authenticated identity on a protected request                                |
| 401    | `session-revoked`               | The session predates an account-wide password reset                                   |
| 403    | `csrf-validation-failed`        | Missing, stale or invalid CSRF on a mutation with the applicable session policy       |
| 403    | `access-denied`                 | The session's account and learner pair is no longer eligible, or authority is missing |
| 409    | `session-already-authenticated` | Attempt to log in again before logout                                                 |
| 413    | Standard Problem Details        | Request exceeds 4 KiB                                                                 |
| 415    | Standard Problem Details        | Login requires JSON                                                                   |
| 429    | `account-rate-limited`          | Login budget or shared hashing capacity exceeded, with `Retry-After: 60`              |
| 500    | `account-request-failed`        | Unexpected processing or persistence failure                                          |

The single-instance fixed window allows 10 login attempts per connection address, 5 per canonical email and address pair, and 80 overall per minute. Shape-valid submissions count whether authentication succeeds or fails. Both unknown and known emails use the same bounded key space. Using the email and source pair avoids a standalone address lockout across other sources. One semaphore limits concurrent Argon2id operations across registration, resend, confirmation and login to two. Forwarded client IP headers are ignored. These limits reset on process restart, share capacity across users behind a network address and cannot coordinate across instances. Review abuse signals, retry policy and edge limits before deploying.

## Complete example HTTP sequence

The following sequence uses a synthetic verified account. Cookie values and tokens are illustrative placeholders. The example omits routine headers and shows the session changes explicitly.

1. Obtain a pre-login token and cookie.

   ```http
   GET /api/v1/security/csrf

   HTTP/1.1 200 OK
   Set-Cookie: MELLOW_SESSION=anonymous-id; Path=/; HttpOnly; SameSite=Lax
   Cache-Control: no-store

   {"headerName":"X-CSRF-TOKEN","token":"anonymous-token"}
   ```

2. Submit the credentials with that cookie and token.

   ```http
   POST /api/v1/auth/login
   Content-Type: application/json
   Cookie: MELLOW_SESSION=anonymous-id
   X-CSRF-TOKEN: anonymous-token

   {"email":"learner@example.test","password":"Synthetic practice passphrase"}
   ```

3. The browser stores the rotated cookie.

   ```http
   HTTP/1.1 200 OK
   Set-Cookie: MELLOW_SESSION=authenticated-id; Path=/; HttpOnly; SameSite=Lax
   Cache-Control: no-store

   {"accountId":"11111111-1111-4111-8111-111111111111","learnerId":"22222222-2222-4222-8222-222222222222","displayName":"Synthetic learner","email":"learner@example.test","emailVerified":true}
   ```

4. Obtain a token for the rotated session.

   ```http
   GET /api/v1/security/csrf
   Cookie: MELLOW_SESSION=authenticated-id

   HTTP/1.1 200 OK
   Cache-Control: no-store

   {"headerName":"X-CSRF-TOKEN","token":"authenticated-token"}
   ```

5. Recover the current account using the cookie. The response is the same `200` summary as login.

   ```http
   GET /api/v1/auth/me
   Cookie: MELLOW_SESSION=authenticated-id
   ```

6. Access a learner-owned resource using that cookie.

   ```http
   GET /api/v1/preferences
   Cookie: MELLOW_SESSION=authenticated-id

   HTTP/1.1 200 OK
   Cache-Control: no-store
   ```

7. Log out with the authenticated session token.

   ```http
   POST /api/v1/auth/logout
   Cookie: MELLOW_SESSION=authenticated-id
   X-CSRF-TOKEN: authenticated-token

   HTTP/1.1 204 No Content
   Set-Cookie: MELLOW_SESSION=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax
   Cache-Control: no-store
   ```

8. The old session no longer authorizes a request.

   ```http
   GET /api/v1/auth/me
   Cookie: MELLOW_SESSION=authenticated-id

   HTTP/1.1 401 Unauthorized
   Content-Type: application/problem+json
   Cache-Control: no-store

   {"type":"urn:mellow:problem:authentication-required","title":"Unauthorized","status":401,"detail":"A trusted learner identity is required."}
   ```

The examples use local HTTP cookie attributes. The base profile adds `Secure`. Use same-origin HTTPS in a future public deployment. The frontend should coalesce token fetches, serialize account transitions, discard account-scoped data and in-flight responses on logout or account switch, and reacquire CSRF before further mutations. Keep guest learning data separate. A request that was already authorized can finish while logout is in progress. Never replay a pending write under another account. Production email, trusted proxy and rate-limit configuration, absolute session lifetime and browser integration are future work.

[Spring Security session management](https://docs.spring.io/spring-security/reference/7.1/servlet/authentication/session-management.html) · [Spring Security logout](https://docs.spring.io/spring-security/reference/7.1/servlet/authentication/logout.html) · [Spring Security CSRF](https://docs.spring.io/spring-security/reference/7.1/servlet/exploits/csrf.html) · [OWASP authentication guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
