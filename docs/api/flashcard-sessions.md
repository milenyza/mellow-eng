# Flashcard review sessions API

| Method | Route                              | Response                                                 |
| ------ | ---------------------------------- | -------------------------------------------------------- |
| GET    | `/api/v1/flashcard-sessions`       | Paged history summaries and the catalog revision header  |
| GET    | `/api/v1/flashcard-sessions/{ref}` | One completed vocabulary review session                  |
| PUT    | `/api/v1/flashcard-sessions/{ref}` | The new or previously recorded vocabulary review session |

See the [shared session contract](game-sessions.md#shared-session-contract) for identity, immutable retries, errors, pagination, timestamps and catalog revisions. History accepts `direction=EN_PT|PT_EN|MIXED` and the shared `from`, `through`, `page` and `size` filters. For example, `GET /api/v1/flashcard-sessions?direction=MIXED&size=20` returns summaries of sessions configured in mixed mode.

## Recording a completed review

The PUT DTO contains `catalogRevision`, `timing`, `configuration` and ordered `recalls`. Each recall contains its `vocabularyRef`, individual `direction` (`EN_PT` or `PT_EN`) and `rating` (`FORGOT`, `EFFORT` or `EASY`). These are self-assessments. They do not generate mastery, verified accuracy or familiarity changes.

The configuration contains a session `direction`, a `scope` (`SAVED`, `DIFFICULT`, `HISTORY` or `RECOMMENDED`), `usedSearch` and optional values:

- `requestedLength` is 5, 10 or 20, and must equal the number of recalls. Null represents all eligible cards chosen by the client. A completed review has 1–512 recalls.
- `filterSource` is `LESSON`, `STORY`, `PRACTICAL` or `DAILY`.
- `filterType` is `WORD`, `EXPRESSION` or `PHRASE`.
- `filterLevel` accepts CEFR levels `A1` through `C2`.
- `filterFamiliarity` is `LEARNING`, `REVIEWING`, `FAMILIAR` or `UNCLASSIFIED`.

Single-direction reviews use that direction for every card. In mixed mode, the two direction counts can differ by at most one. New interactive sessions require currently published vocabulary saved by the trusted learner. Source, type and level filters must agree with that content. Scope, search usage and familiarity describe how the client assembled the review. The endpoint does not recompute a historical recommendation or accept the search text. Each reference may occur once. The same English spelling in two distinct contextual records remains two distinct references.

The response detail contains `session`, `configuration` and `recalls`. Retrieving or retrying a completed review does not require the vocabulary to remain in favorites or the catalog. New writes never create favorites or change learner annotations.

### Example

Send this body to `PUT /api/v1/flashcard-sessions/review-001` after substituting the actual catalog revision. Both vocabulary references must already be saved for the trusted learner.

```json
{
  "catalogRevision": "<current revision>",
  "timing": {
    "startedAt": "2025-01-02T14:00:00Z",
    "completedAt": "2025-01-02T14:01:00Z",
    "activeMs": 1000,
    "studyDays": { "2025-01-02": 1000 }
  },
  "configuration": {
    "direction": "MIXED",
    "scope": "SAVED",
    "filterSource": "LESSON",
    "usedSearch": false
  },
  "recalls": [
    {
      "vocabularyRef": "english-for-pt-br/en-a1-introductions-hello/greetings/good-morning",
      "direction": "EN_PT",
      "rating": "FORGOT"
    },
    {
      "vocabularyRef": "english-for-pt-br/en-a1-introductions-hello/greetings/good-afternoon",
      "direction": "PT_EN",
      "rating": "EFFORT"
    }
  ]
}
```

The response returns `session.sessionRef: "review-001"`, the recorded revision and timing, the normalized configuration with null values for unset filters, and the same two recalls in the same order.
