# Lesson progress API

The base path is `/api/v1/lesson-progress`. `GET /api/v1/lesson-progress` lists lesson progress and `GET /{lessonRef}` returns one aggregate with its current attempt, retained attempts and first completion marker. `PUT /{lessonRef}/attempts/{runRef}` creates or replaces the editable snapshot for that attempt and returns the aggregate. References keep their authored or existing stable IDs. Empty lists return HTTP 200. An absent or differently owned aggregate returns 404.

A trusted, server-verified learner context is required before request handling. The resolver uses a verified Spring Security session principal. Requests without a valid authenticated session receive `401`. See the [authentication API](authentication.md) for session establishment. A principal without a matching verified account and learner receives `403`. Request payloads, query parameters and headers cannot select the owner. Authenticated mutations require the session CSRF token. See the [security contract](../authentication-architecture.md#http-failures-headers-and-origin) for Problem Details, session expiry and CSRF.

## Snapshot

```json
{
  "startedAt": "2026-11-27T12:00:00Z",
  "blockRef": "introduction",
  "visitedBlockRefs": ["introduction"],
  "activeMs": 1500,
  "complete": false,
  "activities": {}
}
```

The request shows the first block of `en-a1-introductions-hello`. Send it to `PUT /api/v1/lesson-progress/en-a1-introductions-hello/attempts/run-01`. `activities` is keyed by block ID. Its values contain `activityRef` (current exercise), `finished`, `textActivityRefs`, `heardActivityRefs` and an `exercises` map keyed by exercise ID. Each exercise stores `draft` (nullable authored answer union), `status` (`EDITING`, `INCORRECT`, `CORRECT`, `REVIEWED`), `reviewedAt` (nullable) and ordered `submissions`. Submission objects include `answer`, `submittedAt` and `mode` (`PRACTICE`, `LISTENING`, `TEXT_ALTERNATIVE`, `NO_AUDIO`). The server evaluates submissions and returns their `correct` values. Clients cannot supply correctness. The response returns `lessonRef`, `attempts`, and per-attempt `runRef`, `current`, `completed`, `firstCompletion`, the positional and exercise fields, and nullable `finishedAt` and `finishedOn`.

New attempts require an explicit start instant. An identical retry is a no-op. The first successful write creates the current attempt. For an existing aggregate, changed writes require its latest strong `ETag` in `If-Match`. Use `If-None-Match: *` to create an absent aggregate. A different run ID starts a replay without deleting prior attempts. A stale precondition yields 412, a missing precondition yields 428, and incompatible rewrites of a finished/superseded attempt yield 409. An exact repeat returns the retained aggregate even with an old or absent precondition. The server compares the stored request fields and submission observations before consulting the catalog. For that reason, an exact repeat still works if the content is retired. Completed attempts remain immutable. Duration is a cumulative estimate for the attempt and may only increase.

The server checks that all required blocks have been visited and all required exercises have a correct answer or explicit review of an incorrect submission before completing a lesson. The first completion stays on the original attempt. Attempts preserve immutable submission prefixes, resolved results and earlier visited blocks. Server-generated completion instants are retained on retries. Submitted timestamps and review timestamps are client-observed instants checked for order and future values. Listening submissions must reference their reported audio or text evidence when applicable. The server cannot independently establish audible playback or that a learner heard it.

Malformed input, unknown fields or invalid content references receive 400. A contradictory transition receives 409. JSON bodies above 2 MiB receive 413, including requests without a Content-Length. The JSON parser allows at most 64 nested objects or arrays. NUL and unpaired UTF-16 surrogates in fill-in text receive 400. Responses use Problem Details without internal errors. The published catalog revision is documented with the backend content projection. Removed or unpublished historical references remain readable. No browser import or educational catalog writes are part of this API.

## Example response

Successful detail reads and writes return the aggregate with a strong `ETag` header. For the initial request, the response is:

```json
{
  "lessonRef": "en-a1-introductions-hello",
  "attempts": [
    {
      "runRef": "run-01",
      "current": true,
      "completed": false,
      "firstCompletion": false,
      "startedAt": "2026-11-27T12:00:00Z",
      "finishedAt": null,
      "finishedOn": null,
      "blockRef": "introduction",
      "visitedBlockRefs": ["introduction"],
      "activeMs": 1500,
      "activities": {}
    }
  ]
}
```

Read the detail resource for its current precondition after a conflict or stale write. List responses are arrays of the same aggregates, ordered by reference, and do not have an aggregate ETag. The server serializes lesson and reading writes for the resolved learner with a PostgreSQL row lock. All writes in a snapshot are committed or rolled back together. Inputs can include at most 200 blocks, activities or exercise entries per collection and 1,000 submissions per exercise.

## Educational metadata

The private classpath resource `catalog/progress-v1.json` is generated from the published TypeScript content. It contains references and grading rules, without page text, prompts, narration or database catalog rows. Generate it from the root with `node backend/tools/export-progress-catalog.mjs` and verify it with the same command plus `--check`. It is outside the public static asset directories and answer keys are never part of a progress response. Revision 1 is the only supported interactive grading revision. Pinning a grading revision across resumed lesson and reading attempts remains future work. Changes to a retained run still use the active catalog. An imported first-completion snapshot may appear as `legacyFirstCompletionSnapshot` when the old browser kept two distinct states under the same run ID. The [completed session APIs](game-sessions.md#shared-session-contract) pin the distinct session catalog and preserve past results separately. Visits and listening modes are learner observations. They do not measure actual attention or proficiency.
