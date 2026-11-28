# Vocabulary favorites API

| Method | Route                          | Successful response                        |
| ------ | ------------------------------ | ------------------------------------------ |
| GET    | `/api/v1/favorites`            | `200` with a page of currently saved items |
| GET    | `/api/v1/favorites/item?ref=…` | `200` with membership and its `ETag`       |
| PUT    | `/api/v1/favorites/item?ref=…` | `200` with saved membership and its `ETag` |
| DELETE | `/api/v1/favorites/item?ref=…` | `204` with the resulting membership `ETag` |

Use the exact vocabulary reference as a URL-encoded query value. This preserves the slashes in composite lesson IDs and other characters in historical references. References must be nonblank and at most 1,024 UTF-16 code units. The PUT and DELETE use the reference and conditional header alone.

## Ownership and conditional writes

These conventions also apply to [annotations](vocabulary-annotations.md) and [preferences](preferences.md). The trusted server-side identity selects the learner on every operation. Body values, query parameters and arbitrary headers cannot select an owner. Requests without a valid authenticated session receive `401`. See the [authentication API](authentication.md) for session establishment. Responses use `Cache-Control: no-store`, and authenticated mutations require the session CSRF token. See the [security contract](../authentication-architecture.md#http-failures-headers-and-origin) for Problem Details, session expiry and CSRF.

Read the resource's current `ETag` with GET. Send that exact quoted value as `If-Match` on a write. A resource with no stored revision returns `ETag: "missing"`. When a record is removed, its row retains a revision to keep stale writes from succeeding after the state cycles through absence. Revisions change when data changes. The learner row is locked for the duration of write validation and persistence. List results omit revision headers for individual items. Read the item before changing it. Use a single strong tag returned by this endpoint. The tag tracks mutable learner state. Availability and source labels follow the current catalog, so refresh them after a catalog release.

| Status | Meaning                                                                         |
| ------ | ------------------------------------------------------------------------------- |
| 400    | Invalid request fields, filters, educational reference or precondition syntax   |
| 401    | Missing trusted identity                                                        |
| 403    | No matching verified account and learner                                        |
| 404    | Unknown route                                                                   |
| 412    | The revision is stale. Retrieve current state before deciding whether to retry. |
| 413    | A JSON write to annotations or preferences exceeded 256 KiB                     |
| 415    | Unsupported content type for a JSON write                                       |
| 428    | Missing `If-Match`                                                              |
| 500    | The transaction failed and its changes rolled back                              |

Errors use Problem Details. An absent favorite or annotation is represented by an empty `200` item snapshot so clients can obtain a conditional write revision. Its shape is identical when the same reference belongs only to a different learner.

## Membership and educational references

Published lesson and story vocabulary, the word of the day and published Practical English expressions can be saved. Dialogues and cultural guidance use the exact same phrasebook IDs as the guide. One learner has one membership per exact reference. Distinct references retain their separate contexts even when the English text matches.

A historical favorite can be listed, retrieved, removed and restored even if its reference has left the current catalog. A previously unseen reference must be published before it can be saved. An unavailable item returns `available: false` with null source and type. A historical save can have a known `savedAt` ISO instant, a date-only `savedOn`, or both fields null. A new or restored membership uses the server time for `savedAt`. A repeated save of a still-saved item preserves its date. Removing membership clears the old saved date, as in the browser.

A saved membership remains distinct from a learner's [personal annotations](vocabulary-annotations.md). Removing a favorite leaves notes, examples, familiarity and past flashcard results accessible. Restoring membership exposes the same annotation in a future Notebook adapter.

## Retries and pagination

The current tag allows a requested change or an immediate no-op when its state already matches. A retry using the tag from immediately before the last transition also succeeds if it requests the state already recorded. This covers a lost response from a successful save or removal. Earlier or opposing stale requests return `412`. A first DELETE of an available reference records a revision even if the favorite was never saved, so a stale create cannot reverse it. DELETE of an unknown reference with no record and the correct absent tag is a no-op.

List filters use `source=LESSON|STORY|DAILY|PRACTICAL` and `type=WORD|EXPRESSION|PHRASE`. Retired references remain in the unfiltered list. Applying either filter restricts results to references with matching current catalog metadata. History sorts by vocabulary reference ascending. It returns `{items, page, size, hasNext}`, with a zero-based `page` of 0–1000 and `size` of 1–100 (default 20).

### Example

```http
PUT /api/v1/favorites/item?ref=english-for-pt-br%2Fen-a1-introductions-hello%2Fgreetings%2Fgood-morning
If-Match: "missing"
```

```json
{
  "vocabularyRef": "english-for-pt-br/en-a1-introductions-hello/greetings/good-morning",
  "saved": true,
  "savedAt": "2026-11-27T14:40:00Z",
  "savedOn": null,
  "available": true,
  "source": "LESSON",
  "type": "EXPRESSION"
}
```

The response includes a new `ETag` for a later conditional DELETE. Browser import is a separate operation. An eventual importer should preserve unknown dates and removed or unavailable references directly instead of replaying interactive PUT requests.
