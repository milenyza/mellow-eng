# Legacy browser data import API

| Method | Route                             | Successful response                                  |
| ------ | --------------------------------- | ---------------------------------------------------- |
| POST   | `/api/v1/data-import/dry-run`     | `200` with a dry-run report and plan token           |
| PUT    | `/api/v1/data-import/{requestId}` | `200` with an applied report or the retained receipt |
| GET    | `/api/v1/data-import/{requestId}` | `200` with a retained receipt                        |

The trusted identity resolver chooses the learner independently of request data. Requests without a valid authenticated session receive `401`. See the [authentication API](authentication.md) for session establishment. A principal without a matching verified account and learner returns `403`. Both dry-run POST and apply PUT require the session CSRF token. Reports use `Cache-Control: no-store`. See the [security contract](../authentication-architecture.md#http-failures-headers-and-origin) for Problem Details, session expiry and CSRF. GET returns `404` when there is no receipt for that learner.

## Snapshot and execution

```json
{
  "formatVersion": 1,
  "requestId": "browser-export-001",
  "exportedAt": "2025-01-07T00:00:00Z",
  "storage": {
    "mellow:learner-progress": {
      "schemaVersion": 1,
      "raw": "{\"version\":1,\"data\":{\"lessons\":{},\"dailyStudyMs\":{\"2025-01-02\":700}}}"
    },
    "mellow:favorite-words": {
      "schemaVersion": null,
      "raw": "[\"en-a-little\"]"
    }
  }
}
```

`requestId` uses 1–160 ASCII letters, digits, underscores or hyphens. `exportedAt` is an optional ISO instant supplied by the caller. No timestamp is inserted when it is absent. The supported key names and versions are listed in the [storage inventory](../data-migration.md#storage-inventory). `schemaVersion` may be omitted or null. If supplied for a versioned key, it must equal the version detected in its raw value. Unversioned keys use null or omit it. Missing storage keys indicate absent local data.

PUT uses `{ "snapshot": <same snapshot>, "planToken": "<token from dry-run>", "acceptSkipped": false }`. The path ID and snapshot ID must agree. Use `acceptSkipped: true` to explicitly proceed without unresolved entries. Apply recomputes the plan; the token is an opaque consistency precondition, scoped to the learner, request ID, snapshot, export instant and relevant server state. A repeated PUT with the same ID and snapshot fingerprint returns the prior receipt even after later server changes. A repeated distinct request can report `previouslyImportedSnapshot: true` and still checks each record.

## Report

The report contains `requestId`, `status`, `snapshotFingerprint`, `planToken`, `previouslyImportedSnapshot`, optional `exportedAt` and `importedAt`, detected `storageVersions`, per-category `counts`, individual `entries` and `warnings`. The SHA-256 snapshot fingerprint is computed from canonical JSON of the format version and storage map, with recursively sorted object keys. It covers each original raw string and declared version, including raw whitespace, while excluding the export instant and request ID. Equivalent outer JSON serialization has the same fingerprint. Per-record deduplication additionally handles differently formatted and overlapping raw snapshots.

Individual entries contain a category, a hashed locator, a machine-readable outcome and a reason code. Outcomes are `ELIGIBLE`, `IDENTICAL`, `CONFLICT`, `INVALID`, `UNSUPPORTED`, or `IMPORTED`. A locator is the SHA-256 of the serialized array of category and reference, or a position for an invalid array entry. Summaries never include raw identifiers from untrusted record fields, notes, examples or answers. Raw storage is discarded after each request.

## Boundaries and errors

The body limit is 2 MiB and the outer parser depth cap is 64. Raw data may have at most 40 nesting levels, 60,000 nodes, 4,000 children in an individual collection and 2,500 reportable record entries. Only four recognized keys are accepted. Duplicate JSON properties and trailing content are rejected. Malformed JSON inside an allowed raw storage value produces an issue for that source when the outer envelope is usable.

- `400` indicates an invalid envelope, identifier, storage key or structural limit.
- `409` indicates a stale plan, a request ID collision, or skips that require acknowledgement.
- `413` indicates a request above the body limit. JSON requests require `application/json`.
- `500` indicates a failed transaction. No partial receipt or domain writes are committed.

Errors use Problem Details. The API does not expose database internals. See [migration rules](../data-migration.md#import-lifecycle-and-conflict-policy) for duplicate handling and date semantics.
