# Authentication and frontend integration plan

This is the proposed next phase. The current application has no production authentication resolver, authenticated HTTP client, automatic migration or server-backed frontend repository.

## Identity and session model

Use an opaque server-managed browser session for the React application and Spring backend behind one HTTPS origin. The browser receives a host-only `Secure`, `HttpOnly` cookie with `Path=/` and an explicit SameSite policy, initially `Lax`. Rotate the identifier after login and privilege changes. Invalidate it on logout and expire idle and long-lived sessions. Verify the configuration across tabs, reverse proxies and browsers. Server-managed sessions permit revocation without maintaining a separate token blacklist, but need an appropriate session store when deploying across processes. A bearer-token architecture can be useful for independent API clients or native apps. It adds token issuance, rotation, storage and revocation decisions. JWT is optional for this same-origin browser architecture. [Spring session management](https://docs.spring.io/spring-security/reference/servlet/authentication/session-management.html)

Add a verified account identity with a stable one-to-one learner mapping. Enforce uniqueness and transactional provisioning, and define account suspension, learner-data deletion and migration consent. A production `TrustedLearnerResolver` should derive the ID from the authenticated server-side principal and its account-to-learner mapping. HTTP parameters and headers continue to carry no ownership authority. Replace the test-only resolver with isolated authentication fixtures for the future integration suite.

- Registration should validate the identity and email policy, verify control of the address and make retries safe. Login and recovery should use generic external responses, rate limits based on account and network signals, and security monitoring without exposing contact details or credentials. Use HTTPS and omit passwords and recovery tokens from logs.
- Use a maintained adaptive password hash such as Argon2id with reviewed parameters, per-password salts and a versioned encoding. Benchmark on the deployment environment and allow parameter upgrades on authenticated rehash. Recovery tokens need a cryptographic generator, short validity, single use, revocation and secure storage. Recovery should revoke old sessions when appropriate. [Spring password storage](https://docs.spring.io/spring-security/reference/features/authentication/password-storage.html) · [OWASP password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- Protect state-changing requests, including login, logout and import, with server-validated CSRF tokens. SameSite provides an additional boundary. Deliver the CSRF token under the reviewed Spring SPA model while keeping the session cookie inaccessible to JavaScript. Prefer the same origin with no CORS policy for cross-origin browser clients. If separate origins become necessary, allow explicit trusted origins and required headers only, review credentialed CORS and test preflight and error responses. [Spring CSRF guidance](https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html)
- Define public authentication error semantics. `401` prompts a new sign-in or session recovery. `403` indicates a resolved denial or failed CSRF validation and never selects another learner. Expiry pauses writes and clears account-scoped in-memory views. It must not silently apply a pending write under a different account.

## Browser architecture and ownership

Create one typed HTTP client for the versioned APIs. It should handle same-origin credentials, CSRF, request cancellation, timeout, Problem Details parsing and correlation metadata without logging private payloads. Represent loading, empty, offline, authentication-expired, conflict and validation states explicitly. Retrying an ordinary network failure must respect operation semantics.

Expose asynchronous, account-scoped API repository methods. The current `ProgressRepository` uses a synchronous `getSnapshot`, subscription and `update` callback. Retain that local interface for the guest experience. An API-backed view can expose a stable in-memory observable snapshot for React, while write operations stay explicit async commands with revision and error results. Avoid making the synchronous callback a network transaction or using local cache writes as silent fallbacks for signed-in data.

Use one authority per account and module during rollout. Browser data remains authoritative for the guest workspace and modules awaiting integration. Server-backed modules use the server as the record of truth after explicit adoption. Account caches and pending operations must be keyed by the verified account and canceled or discarded from the active view on logout or account switch. Do not reconcile data from the old account into the next session. Keep guest data independent, including when the user declines import.

For changed mutable writes, send the latest applicable `If-Match`, or `If-None-Match: *` for a genuinely absent progress aggregate. On `412`, fetch fresh state and surface both versions while preserving the intended draft. On `409`, distinguish a stale catalog, immutable collision, stale import plan or invalid transition. Retry session creation with the same ID and payload after uncertain transport completion. Retry import using its stable request ID and unchanged snapshot. A new play or practice session receives a new ID. Keep private answer keys server-side.

## Backup, consent and recovery

1. Sign in, confirm the destination account, and explain which four learning storage keys the importer uses. Keep the guest workspace available when consent is declined.
2. Offer an explicit downloadable local backup using the raw export helper. The file can contain personal notes and answers. Explain this before saving it and advise keeping it private. Use an opaque request ID and preserve the original raw values and version metadata.
3. After separate upload consent, request a dry run of that exact snapshot. Show eligible, identical, conflicting, invalid and unsupported items. Let the learner keep their original backup and defer the process. On a stale plan, regenerate and review it again.
4. Ask for confirmation before execution and separately acknowledge any proposed skips. Save the resulting redacted receipt for the account. Retain browser data and the backup so the learner can recover records that need manual review. Automatic localStorage deletion and automatic re-import are outside this plan.
5. Before switching a module to its server repository, verify saved counts, retained tombstones, contextual references and the expected history. Conflicting values stay unchanged until an explicit resolution workflow exists. An interrupted transfer or failed import should leave the local workspace usable.

## Gradual integration order

1. Establish production authentication and the trusted learner resolver, fix the dependency and deployment blockers, and add browser tests for CSRF, expiry, revocation, logout and account switching.
2. Add the shared client with observable request states and opt-in account integration. Pilot reading preferences on clean test accounts. The device's audio voices and capabilities remain local.
3. Add favorites and annotations as a related pair. Verify ETag conflicts, restore behavior and preservation of historical vocabulary. Introduce the backup and consent-based dry run before accepting existing browser histories.
4. Add paginated, read-only session histories and per-item progress reads. Compare projections with the local selectors before exposing lifetime and weekly metrics. Prefer bounded aggregates and targeted details over loading an entire history.
5. Connect lesson and reading writes with catalog revisions, staleness recovery and per-run preconditions. Add individual completed-session writers once the frontend retains their required evidence and preserves stable IDs across retries. Continue permitting explicit offline recovery.
6. Switch Dashboard and My Progress after reconciling local calendar windows, current session filters and active-time allocation. Verify totals across the legacy combined ledger and distinct session IDs. Keep a rollback path for each module while the others remain local.

See the [backend audit](backend-finalization.md) for compatibility limits, catalog retention and production prerequisites.
