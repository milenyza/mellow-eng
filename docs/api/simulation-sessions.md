# Practical English simulation sessions API

| Method | Route                               | Response                                                |
| ------ | ----------------------------------- | ------------------------------------------------------- |
| GET    | `/api/v1/simulation-sessions`       | Paged history summaries and the catalog revision header |
| GET    | `/api/v1/simulation-sessions/{ref}` | One completed branching conversation                    |
| PUT    | `/api/v1/simulation-sessions/{ref}` | The new or previously recorded conversation             |

See the [shared session contract](game-sessions.md#shared-session-contract) for identity, immutable retries, errors, pagination, timestamps and catalog revisions. History filters support `situation` and `scenario` stable references in addition to `from`, `through`, `page` and `size`. For example, `GET /api/v1/simulation-sessions?situation=at-the-airport&scenario=flight-check-in`.

## Recording a completed conversation

The PUT DTO contains `catalogRevision`, `timing`, `situationRef`, `scenarioRef`, `terminalNodeRef` and ordered `decisions`. Every decision contains `nodeRef`, `choiceRef`, `reviewed`, `hintUsed` and one or more ordered `attemptedChoiceRefs`. Scenario identity is scoped by its situation.

The server walks the private graph from its authored starting node. Each decision must belong to the current node and advance through an appropriate response to the graph's next node. The last decision must lead to the declared success node. Alternative successful choices and branching paths can have different lengths. The selected response must be the final attempted choice for an independent decision. A reviewed decision must have at least one inappropriate attempt and chooses an appropriate response during explicit correction review. Browsing a hint is valid only at nodes with an authored hint.

The response contains the recorded session header, situation, scenario, counts of decisions and reviewed corrections, and ordered `attempts` with server-derived `fit`. `APPROPRIATE`, `CONTEXT` and `LANGUAGE` report how the authored simulation classifies each submitted response. Contextual mismatches and language-use issues keep their independent meanings. The response's `evidence` stores the successful terminal reference, first-attempt appropriate count, and the selected decision path with hint and review flags. Private graph transitions and unselected choices are absent from the response. Historical rows can have a null `evidence` field.

### Example

Send this body to `PUT /api/v1/simulation-sessions/airport-001` after substituting the actual catalog revision. The first decision advances after reviewing a contextual mismatch.

```json
{
  "catalogRevision": "<current revision>",
  "timing": {
    "startedAt": "2025-01-02T14:00:00Z",
    "completedAt": "2025-01-02T14:01:00Z",
    "activeMs": 1000,
    "studyDays": { "2025-01-02": 1000 }
  },
  "situationRef": "at-the-airport",
  "scenarioRef": "flight-check-in",
  "terminalNodeRef": "done",
  "decisions": [
    {
      "nodeRef": "documents",
      "choiceRef": "documents-passport",
      "reviewed": true,
      "hintUsed": true,
      "attemptedChoiceRefs": ["documents-hotel"]
    },
    {
      "nodeRef": "flight-number",
      "choiceRef": "flight-number-number",
      "reviewed": false,
      "hintUsed": false,
      "attemptedChoiceRefs": ["flight-number-number"]
    },
    {
      "nodeRef": "luggage",
      "choiceRef": "luggage-check",
      "reviewed": false,
      "hintUsed": false,
      "attemptedChoiceRefs": ["luggage-check"]
    },
    {
      "nodeRef": "gate",
      "choiceRef": "gate-confirm",
      "reviewed": false,
      "hintUsed": false,
      "attemptedChoiceRefs": ["gate-confirm"]
    }
  ]
}
```

The detail has `session.sessionRef: "airport-001"`, `decisionsCompleted: 4`, `reviewedCorrections: 1` and `evidence.firstAttemptAppropriate: 3`. The first retained attempt is:

```json
{ "nodeRef": "documents", "choiceRef": "documents-hotel", "fit": "CONTEXT" }
```
