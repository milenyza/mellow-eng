# Game sessions API

Use these routes for completed Word Match, Sentence Builder and Memory Game sessions.

| Method | Route                         | Response                                                        |
| ------ | ----------------------------- | --------------------------------------------------------------- |
| GET    | `/api/v1/game-sessions`       | Paged history summaries and the current catalog revision header |
| GET    | `/api/v1/game-sessions/{ref}` | One completed game with its ordered observations and study days |
| PUT    | `/api/v1/game-sessions/{ref}` | The created or previously recorded completed game               |

## Shared session contract

These conventions also apply to [simulation sessions](simulation-sessions.md) and [flashcard sessions](flashcard-sessions.md).

A configured server-side identity resolver is required. The controller scopes every operation to the resolved learner. Learner IDs sent in bodies, query strings or arbitrary headers cannot grant access. The default application has no production resolver and responds with `401`, including in the dev profile. The HTTP tests use a controlled resolver only in the test context. Session responses use `Cache-Control: no-store`.

- The path identifies the session with a 1–160 character string of ASCII letters, digits, underscores or hyphens. The first successful PUT returns `201 Created` and a `Location` header. Identical retries return `200 OK` with the retained representation. An intentional replay uses a new identifier. The same identifier can exist for different learners or resource families.
- All writes require the lowercase SHA-256 `catalogRevision` advertised in the `Mellow-Catalog-Revision` response header of the authenticated history GET. A client should capture it when starting a session with the matching content release. The hash identifies the bytes of the private, generated session validation catalog. Run `node backend/tools/export-progress-catalog.mjs --check` to detect drift with published frontend content. The public status endpoint exposes neither this metadata nor answer keys.
- Idempotency compares the SHA-256 of the parsed DTO serialized with recursively sorted object keys. Insignificant JSON whitespace, property order and equivalent serializations of an instant have the same meaning. Ordered arrays, references, selected answers, boolean choices, revision and captured configuration are significant. Omitted and explicit null values of optional configuration fields are equivalent. The search term itself is outside the contract.
- The write transaction locks the learner row, checks for an existing result and writes the session and child records atomically. A different valid request shape for the same identifier returns `409 Conflict`. V2 rows without a validated request digest remain readable and reserve their identifiers. An identical retry of a V3 session returns its retained response before consulting the current catalog or favorites, including after educational references are retired. Completed resources use no ETag preconditions.
- A new submission with a retired revision returns `409`. Preserve an unfinished draft locally and offer to start a new session with matching current content. Changing only the revision of a draft would misrepresent which content the learner used. Each deployment keeps one active session catalog. Repository snapshots preserve validated observations and revision identifiers, while archived validation bundles and revision-pinned in-progress lesson and reading snapshots remain future work.
- `timing.startedAt` and `timing.completedAt` are known ISO-8601 instants, ordered, non-future and precise to milliseconds. `activeMs` is a non-negative whole number of milliseconds bounded by elapsed time. `studyDays` maps date-only local calendar keys to durations summing to `activeMs`. A maximum of 32 dates is accepted, within the session's UTC calendar span plus a one-day offset at each end to allow local time zones. Zero-duration sessions may use an empty map. Session dates and study days are different fields. The session rows and their day buckets represent the same duration and do not add to the shared lesson and reading daily ledger. V2 requires absolute timestamps for these session tables. A future importer must preserve missing or date-only historical timestamps as such and skip or retain those records separately until a suitable storage contract exists.
- History returns `{items, page, size, hasNext}`. `page` is zero-based from 0 through 1000. `size` defaults to 20 and accepts 1–100. `from` and `through` are optional inclusive UTC completion dates in `YYYY-MM-DD` format. Results sort newest first by completion instant, then by database UUID ascending for stable ordering of ties. Completion dates use UTC, while recorded study-day buckets are learner-local. Keep these two contexts separate. See the [integration calendar strategy](../backend-finalization.md#calendar-scope-and-activity-accounting). The UUID is internal. With offset pagination, recording a new session between requests may shift page boundaries. Historical filtering works even when content references are no longer in the catalog.
- Detail DTOs contain a `session` object with `sessionRef`, `catalogRevision` and `timing`. A session with `legacyImported: true` came from browser history and stores the original reported observations, with a null `catalogRevision`. V2 records can also have a null revision. Game and simulation `evidence` is null when the row lacks the newer interactive evidence. Flashcard details store their observations directly. Collections preserve their recorded order. List queries project scalar summaries and omit child records and detailed session evidence.

| Status | Meaning                                                                            |
| ------ | ---------------------------------------------------------------------------------- |
| 400    | Invalid JSON, identifiers, enum values, filters, results or educational references |
| 401    | No trusted server-side identity                                                    |
| 403    | Trusted identity has no learner record                                             |
| 404    | The session does not exist for the trusted learner                                 |
| 409    | Conflicting completed session or unavailable catalog revision for a new write      |
| 413    | Request body above 256 KiB                                                         |
| 415    | Unsupported request media type                                                     |
| 500    | The operation could not be processed. A failed write leaves no partial session.    |

Errors use Problem Details. JSON rejects unknown and duplicate fields, invalid field types and unsupported enums. References to vocabulary can include slash-separated stable segments and have a 240-character limit. A game or simulation accepts up to 512 recorded attempts. These limits protect the request boundary without changing the educational requirements.

## Game-specific request and response fields

Filter history by `kind` (`WORD_MATCH`, `SENTENCE_BUILDER` or `MEMORY_GAME`) and/or `difficulty` (`EASY`, `MEDIUM`, `HARD`, or legacy `BASIC`/`INTERMEDIATE`). History items include the game kind and difficulty. Other module fields in the shared summary are null. For example, `GET /api/v1/game-sessions?kind=MEMORY_GAME&difficulty=EASY&from=2025-01-02&through=2025-01-02&size=10`.

A PUT contains `catalogRevision`, `timing`, `level`, `difficulty` and a discriminated `result`. The current catalog supports A1 for all three games. The detail response adds `kind`, `level`, `difficulty`, `answeredCount`, `correctCount`, applicable type-specific counters and configuration, `vocabulary`, `challenges` and `evidence`. The service derives counters from individual responses. Client-supplied counter fields are rejected.

- **Word Match** uses `{kind: "WORD_MATCH", source, rounds}`. Each round supplies its ordered `vocabularyRefs` and ordered `attempts` of `{englishRef, portugueseRef}`. The published game has three rounds of 4, 6 or 8 pairs. A round finishes only when each pair has matched once. A pair counts as correct on the first attempt if neither side referenced that pair earlier in the round. The response includes `firstAttemptCorrect`, `roundsCompleted`, the unique vocabulary references and their optional zero-based `reviewPosition` in the order mismatches were observed. `evidence.rounds` retains the individual attempts.
- **Sentence Builder** uses `{kind: "SENTENCE_BUILDER", topic, challenges}`. A challenge is `{challengeRef, reviewed, hintUsed, responses}`, where `responses` is an ordered array of tile-ID arrays. Topics are `MIXED`, `INTRODUCTIONS`, `PRONOUNS`, `TO_BE`, `ORIGINS`, `AFFIRMATIVE`, `NEGATIVE` and `QUESTIONS`. The catalog currently requires 5, 8 or 10 distinct challenges for the selected difficulty. Shared answer evaluation recognizes authored alternatives. The last response must be independently correct, or the learner must explicitly review the correction after an incorrect response. Reviewed challenges do not contribute to correct or first-attempt counts. The detail includes incorrect sentences assembled from submitted tiles and `evidence.challenges` with the learner's submissions, flags and corresponding `evidence.contentReferences`. Authored solution sets are private.
- **Memory Game** uses `{kind: "MEMORY_GAME", source, vocabularyRefs, attempts}`. Each attempt contains `first` and `second` cards identified by `{vocabularyRef, language}`, where language is `EN` or `PT_BR`. The board contains 4, 6 or 8 distinct pairs. A successful match consumes both cards in the pair. A same-language selection of two different cards is an allowed mismatch. The response includes `totalPairs`, `incorrectAttempts` and ordered selections in `evidence.attempts`. These records describe a spatial matching activity.

The vocabulary source is `LESSONS`, `STORIES`, `SAVED` or `MIXED`. The server checks published content references, level, distinct and unambiguous matching pairs, and source compatibility. Saved-only sessions require the learner's own favorites. Mixed sessions accept lesson or story vocabulary and eligible saved standalone entries.

### Example

This JavaScript constructs a complete Word Match request. Set `revision` to the version of the content used to play, as advertised by the trusted history response. This example shows a perfect round repeated three times.

```js
const prefix = 'english-for-pt-br/en-a1-introductions-hello/'
const vocabularyRefs = [
  'greetings/good-morning',
  'greetings/good-afternoon',
  'greetings/goodbye',
  'names/my-name-is',
].map((ref) => prefix + ref)
const round = {
  vocabularyRefs,
  attempts: vocabularyRefs.map((ref) => ({
    englishRef: ref,
    portugueseRef: ref,
  })),
}
const request = {
  catalogRevision: revision,
  timing: {
    startedAt: '2025-01-02T14:00:00Z',
    completedAt: '2025-01-02T14:01:00Z',
    activeMs: 1000,
    studyDays: { '2025-01-02': 1000 },
  },
  level: 'A1',
  difficulty: 'EASY',
  result: {
    kind: 'WORD_MATCH',
    source: 'LESSONS',
    rounds: [round, round, round],
  },
}
```

`PUT /api/v1/game-sessions/match-001` with this body returns a detail whose `kind` is `WORD_MATCH`, `session.sessionRef` is `match-001`, and `answeredCount`, `correctCount`, `firstAttemptCorrect` and `roundsCompleted` are 12, 12, 12 and 3. The response also returns the four vocabulary references and the three recorded rounds. A history request filtered to this game can return:

```json
{
  "items": [
    {
      "sessionRef": "match-001",
      "catalogRevision": "<recorded revision>",
      "completedAt": "2025-01-02T14:01:00Z",
      "activeMs": 1000,
      "gameKind": "WORD_MATCH",
      "difficulty": "EASY",
      "situationRef": null,
      "scenarioRef": null,
      "direction": null
    }
  ],
  "page": 0,
  "size": 20,
  "hasNext": false
}
```
