# Reading progress API

The base path is `/api/v1/reading-progress`. `GET /api/v1/reading-progress` lists story progress and `GET /{storyRef}` returns a story with lifetime read chapter marks, retained reading attempts and duration. `PUT /{storyRef}/attempts/{runRef}` writes a reading snapshot. This uses the same trusted learner boundary, preconditions, retry semantics and Problem Details as [Lesson progress](lesson-progress.md). Ordinary unauthenticated requests receive 401. The lesson snapshot limits also apply, including the 2 MiB body cap and 64-level parser cap.

```json
{
  "startedAt": "2026-11-27T12:00:00Z",
  "chapterRef": "rain-at-the-window",
  "activeMs": 12000,
  "chapters": {
    "rain-at-the-window": {
      "paragraphRef": "morning-rain",
      "read": true,
      "practice": null
    }
  }
}
```

Chapter and paragraph identifiers must belong to the published story. The example applies to `PUT /api/v1/reading-progress/a-rainy-morning/attempts/read-01`. Optional `practice` contains `index` (zero-based exercise position), `finished` and `exercises` using the lesson snapshot format and `PRACTICE` submissions. The result contains `storyRef`, `lifetimeActiveMs`, `readChapters` (with nullable `readOn`), and `attempts`. Each attempt includes `runRef`, `current`, `firstCompletion`, nullable `completedAt` and `completedOn`, its snapshot, and each chapter's nullable `readAt`.

A true `read` is an explicit chapter completion, timed by the server on the first mark of that run. A mark cannot be cleared. Reading every chapter in the same run records the story's first milestone. Lifetime read chapter IDs deduplicate repeat reads; historical marks with unknown dates remain valid. Comprehension is optional, including after the first milestone. The current run remains editable for position and optional comprehension, preserving the first milestone and prior marks. A superseded run is immutable. At most one run is current.

An update replaces the run's cumulative `activeMs` estimate; only the increase contributes to `lifetimeActiveMs`. Neither progress API writes the historical combined daily ledger, because a run snapshot has no reliable dates for allocating that time. Unknown historical dates and inactive historical content remain readable and are left as recorded.

## Example response

```json
{
  "storyRef": "a-rainy-morning",
  "lifetimeActiveMs": 12000,
  "readChapters": [{ "chapterRef": "rain-at-the-window", "readOn": null }],
  "attempts": [
    {
      "runRef": "read-01",
      "current": true,
      "firstCompletion": false,
      "startedAt": "2026-11-27T12:00:00Z",
      "completedAt": null,
      "completedOn": null,
      "chapterRef": "rain-at-the-window",
      "activeMs": 12000,
      "chapters": {
        "rain-at-the-window": {
          "paragraphRef": "morning-rain",
          "read": true,
          "readAt": "2026-11-27T12:01:00Z",
          "practice": null
        }
      }
    }
  ]
}
```

`readOn` stores legacy date-only evidence. A new exact read mark is available from its attempt's `readAt`. A null date in the lifetime record does not substitute for that instant. The first completion marker and its timestamp remain stable when comprehension or position is updated afterwards. The V2 row represents the evolving current reading state together with that milestone. Interactive runs keep the milestone and evolving state in the same row. Imported browser data may additionally contain `legacyFirstCompletionSnapshot` when the source preserved distinct states under the same run ID. This supplemental snapshot represents the same milestone and does not add to reading duration. History for superseded runs and date-only legacy evidence remains available.
