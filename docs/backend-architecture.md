# Backend architecture

The Java service lives directly under `backend/`. The React application and its browser-local repositories run independently. The service provides public status and Actuator health plus protected APIs for progress, completed sessions and personal learner data over the Flyway-managed model.

## Runtime and tooling

| Component                         | Version                                         | Purpose                                                                         |
| --------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------- |
| Java                              | 21 LTS, verified with Eclipse Temurin 21.0.13   | Compile and run the application                                                 |
| Spring Boot and its starters      | 4.1.3                                           | Spring MVC, Data JPA, Bean Validation, Flyway, Actuator and test infrastructure |
| Spring Security                   | 7.1.3                                           | Session security, CSRF and authorization                                        |
| Spring Framework                  | 7.0.11                                          | Boot-managed application framework                                              |
| Hibernate ORM and Validator       | 7.4.15.Final and 9.1.6.Final                    | Boot-managed JPA mapping and Jakarta Bean Validation                            |
| Maven and Maven Wrapper           | 3.10.2 and 3.3.4                                | Project build and distribution download                                         |
| Tomcat embedded                   | 11.0.29                                         | Core, EL and WebSocket aligned using a Boot property override                   |
| PostgreSQL                        | 17.12, official `postgres:17.12-bookworm` image | Local development and integration tests                                         |
| PostgreSQL JDBC                   | 42.7.15                                         | Targeted Boot property override                                                 |
| Flyway Core and PostgreSQL module | 12.4.0                                          | Versioned migrations and PostgreSQL support                                     |
| Testcontainers and Maven Failsafe | 2.0.5 and 3.5.6                                 | Disposable PostgreSQL and integration test execution                            |

Spring Boot 4.1.3 supports Java 21 and Maven 3.10.2. Its parent manages the dependency versions, with targeted pgJDBC and Tomcat patch overrides. See [security remediation](security-remediation.md) for the resolved versions, evidence and image decision. PostgreSQL 17 is a supported major line and Flyway supports it through the separate PostgreSQL module. The Apache Wrapper uses the script distribution, with a pinned SHA-256 for the Maven download. The project ignores repositories declared by transitive dependencies so the declared build resolves through Maven Central or the developer's configured mirror.

- [Spring Boot 4.1 release and system requirements](https://docs.spring.io/spring-boot/4.1/system-requirements.html)
- [Spring Boot managed versions](https://docs.spring.io/spring-boot/4.1/appendix/dependency-versions/coordinates.html)
- [Spring Boot database initialization](https://docs.spring.io/spring-boot/4.1/how-to/data-initialization.html)
- [PostgreSQL version support](https://www.postgresql.org/support/versioning/)
- [Flyway PostgreSQL module](https://documentation.red-gate.com/flyway/reference/database-driver-reference/postgresql-database)
- [Apache Maven downloads](https://maven.apache.org/download.cgi)
- [Apache Maven Wrapper](https://maven.apache.org/tools/wrapper/)
- [PostgreSQL Testcontainers module](https://java.testcontainers.org/modules/databases/postgres/)

## Modular monolith

`com.mellow.backend.MellowApplication` is the entry point and component-scan root. `status.api` owns the HTTP status controller and its response record. The endpoint has no domain dependency, so one controller is sufficient. Operational health is handled by Actuator. `src/main/resources/` contains application profiles and migrations.

Future features belong under capability packages. Add `api` for controllers and API DTOs, `application` for use cases and service orchestration, `domain` for rules and invariants, and `persistence` for repository implementations and JPA mappings where those boundaries are needed. Share infrastructure only when more than one feature uses it.

| Capability                    | Intended responsibility                                         |
| ----------------------------- | --------------------------------------------------------------- |
| Learner accounts              | Authenticated identity and ownership policies                   |
| Lesson progress               | Lesson runs, attempts and explicit completion                   |
| Reading progress              | Story position, chapter marks and comprehension sessions        |
| Game sessions                 | Completed sessions and game-specific outcomes                   |
| Practical English             | Completed simulations and recorded response evidence            |
| Vocabulary and favorites      | Stable content references, saved items and personal annotations |
| Flashcard reviews             | Review sessions and learner-reported recall                     |
| Learner preferences           | Account-scoped settings                                         |
| Migration and synchronization | Versioned imports, conflict handling and retry semantics        |
| Shared infrastructure         | Cross-cutting configuration and integration adapters            |

Static educational definitions and learner records have separate lifecycles. Preserve the stable identifiers in the [backend readiness inventory](backend-readiness.md) as those boundaries are implemented.

## Configuration and local database

Use the `dev` profile after sourcing a shell-compatible copy of `.env.example`. Compose reads `backend/.env` automatically when invoked from that directory. It sets the database name, role, password and host port from the `MELLOW_DB_*` values. The Java process uses the same values after export. Compose binds only to `127.0.0.1` and defaults to host port `55432`, forwarding to container port `5432`. Its health check uses `pg_isready` over TCP. The named data volume survives stopping or recreating the service without volume removal. The official image reads initialization credentials only on first creation of that volume.

The default Spring profile expects `MELLOW_DB_URL`, `MELLOW_DB_USER` and `MELLOW_DB_PASSWORD`. The dev profile derives the URL from `MELLOW_DB_HOST`, `MELLOW_DB_PORT` and `MELLOW_DB_NAME`, with a local role default. The password always comes from the environment. The checked-in configuration binds to `127.0.0.1` in both profiles. `MELLOW_HTTP_PORT` defaults to 8080 and `MELLOW_LOG_LEVEL` controls the log level. Configuration outside development should supply secrets from its environment, use a protected database connection and restricted network access, and provision appropriate database privileges and backups. Plan separate application and migration roles before deployment. Example local credentials are for the development database.

## Flyway and HTTP conventions

`V1__create_application_schema.sql` creates the `mellow` namespace for future domain objects. Flyway stores its checksums and execution history in `public.flyway_schema_history`. Auto-baselining and clean are disabled. Hibernate validates mapped entities against the `mellow` schema, with open-in-view and Spring SQL initialization disabled. A failed migration prevents application startup. Once applied, preserve migration checksums and use a new versioned SQL file for each change. V2 installs the learner-owned relational model under `mellow`. V3 adds validated session catalog revisions, request digests and supplemental evidence. V4 adds conditional revisions and removal states for personal resources. V5 adds import receipts and provenance for retained legacy evidence. V6 adds account and email verification state without claiming any existing learner. V7 adds password recovery tokens and a revision for account-wide session revocation. See [Database design](database-design.md) for tables and constraints.

- `GET /api/v1/status` responds with HTTP 200 and `{"status":"UP","apiVersion":"v1"}` when the application is serving requests.
- `GET /api/v1/security/csrf` returns a masked token for the current browser session. See the [authentication architecture](authentication-architecture.md).
- `GET /actuator/health` reports operational health, including the datasource. Healthy responses are HTTP 200 with `{"status":"UP"}`. Spring Boot reports an unavailable health check as HTTP 503 for a down datasource. Health component details and other management endpoints are disabled.

Version future public routes under `/api/v1` and use explicit request and response DTOs for application features. Bean Validation is available for request DTOs. Spring MVC uses Problem Details for framework-handled exceptions. The fallback error response suppresses messages, exceptions, binding details and stack traces. The React application currently uses its local repositories. Future API integration should add a narrow adapter and define trusted data ownership and allowed origins or a same-origin proxy before enabling requests.

## Testing and current limits

Run `./mvnw test` for isolated controller response tests. `./mvnw verify` runs those tests and starts an isolated PostgreSQL 17.12 container using Testcontainers and Failsafe. The integration suite starts the Spring application on an ephemeral HTTP port, queries PostgreSQL through JDBC, verifies the fresh V1–V7 and staged V6-to-V7 migration paths, including retained V4 learner data, and Flyway history, and tests status, health and safe errors. If Docker is unavailable, the integration stage fails explicitly. See the [README](../README.md#backend-local) for macOS Docker socket setup and local smoke-test commands.

Lesson and reading snapshots have transactional services under their capability packages. The shared session service uses the three existing module repositories and each module's validation rules. Every write locks the trusted learner row before looking up its stable identifier. Session history uses scalar projections, while full details use the existing relational children and supplemental evidence. Repeat submissions compare the normalized request digest before consulting the current educational catalog. [Lesson progress](api/lesson-progress.md) and [Reading progress](api/reading-progress.md) remain mutable snapshot contracts with ETags. Completed sessions are immutable. See [Game sessions](api/game-sessions.md), [Simulation sessions](api/simulation-sessions.md) and [Flashcard sessions](api/flashcard-sessions.md).

The Spring Security chain and shared request boundary resolve a verified principal to the explicit trusted learner context. The resolver requires a matching verified account and learner pair. Registration and confirmation leave the session anonymous. Verified accounts can sign in to a rotated server-managed session through the [authentication API](api/authentication.md). The [recovery API](api/password-recovery.md) can reset credentials and reject sessions issued at an earlier revision. [Account registration API](api/account-registration.md). The HTTP integration suite opens synthetic sessions only in its test context. The generated catalogs under `backend/src/main/resources/catalog/` are private application resources. The session catalog contains only metadata necessary for validation, including published configuration, vocabulary references, sentence grading rules and simulation transitions. Run `node backend/tools/export-progress-catalog.mjs --check` from the repository root to detect drift. Client synchronization, catalog archive retention and server analytics remain future stages.

The [favorites](api/favorites.md), [annotations](api/vocabulary-annotations.md) and [preferences](api/preferences.md) services use the same learner lock. They apply conditional writes to individual resources. Favorite and annotation deletions retain only the state needed to reject stale writes. Catalog validation resolves vocabulary metadata from the existing private session catalog. The preference contract is limited to the reader's font size and translation visibility. The application redacts annotation DTOs in logs and suppresses server error details in the PostgreSQL JDBC client.

The [legacy import module](data-migration.md) validates raw browser values, compares normalized domain records and exposes a dry run. Applying a plan locks the learner, recomputes its precondition and writes eligible records and receipt atomically. A dedicated write path preserves legacy observations instead of applying current grading rules. The backend stores only a redacted receipt and necessary domain data. The browser helper exports raw learning keys only when explicitly invoked.

Maven defaults to `backend/target/`. If an editor shares that output directory, set `-Dmellow.build.directory` to a freshly created absolute path and run the wrapper from `backend/`. This uses the same repository sources without incorporating editor-built classes or cleaning shared output. Keep frontend validation separate. See the [audit and reproducibility instructions](backend-finalization.md#reproducible-builds-and-production-gates) and the [planned authentication and integration sequence](frontend-integration-plan.md).
