# Personal vocabulary annotations API

| Method | Route                                       | Successful response                         |
| ------ | ------------------------------------------- | ------------------------------------------- |
| GET    | `/api/v1/vocabulary-annotations`            | `200` with a page of retained metadata      |
| GET    | `/api/v1/vocabulary-annotations/item?ref=…` | `200` with personal metadata and its `ETag` |
| PATCH  | `/api/v1/vocabulary-annotations/item?ref=…` | `200` with updated metadata and its `ETag`  |
| DELETE | `/api/v1/vocabulary-annotations/item?ref=…` | `204` with the resulting annotation `ETag`  |

Use the exact URL-encoded vocabulary reference. The [shared ownership and conditional write rules](favorites.md#ownership-and-conditional-writes) apply. The list uses the same pagination and vocabulary-reference ordering as favorites. It includes personal metadata associated with removed favorites or unavailable references.

## Partial updates and familiarity

Send a JSON object with at least one supported field. An omitted field keeps its current value. Explicit null clears a field. `note` and `personalExample` also clear when the value is empty or contains only whitespace according to JavaScript's `trim()`. All other text keeps its original spacing, line breaks, punctuation and accents. The values are plain text. Notes allow 1,200 UTF-16 code units and examples allow 400, matching JavaScript's `String.length`. A supplementary character such as 😀 counts as two. NUL and unpaired surrogates are invalid. Personal examples are stored as written.

`familiarity` accepts `"learning"`, `"reviewing"` and `"familiar"`. Null represents the browser's unset or unclassified state. Other strings, including `""` and `"unclassified"`, are invalid. Familiarity is assigned by the learner. Exercises, games, dialogue practice, time and recall ratings never change it.

A new annotation may be created for currently published vocabulary. Existing metadata for a retired reference remains editable. Favorite membership is independent from annotation availability. Updates use the exact current annotation revision. Simultaneous editors using the same revision can produce one successful change and one `412`. The client can fetch fresh data and present both versions before retrying.

## Clearing and deletion

Clearing all three fields removes the annotation from the list. DELETE explicitly clears all fields without changing favorite membership, authored vocabulary, or study history. Both retain a revision marker with no personal text or familiarity, so edits based on a prior revision cannot restore deleted text. The individual GET then returns null metadata and timestamps. A later creation on an eligible reference starts a new annotation and receives a new revision. Favorite removal leaves the entire annotation untouched.

### Example

```http
PATCH /api/v1/vocabulary-annotations/item?ref=en-a-little
Content-Type: application/json
If-Match: "missing"

{
  "note": "Uso na cafeteria.\nPosso pedir uma pequena quantidade.",
  "personalExample": "A little milk, please.",
  "familiarity": "learning"
}
```

```json
{
  "vocabularyRef": "en-a-little",
  "available": true,
  "note": "Uso na cafeteria.\nPosso pedir uma pequena quantidade.",
  "personalExample": "A little milk, please.",
  "familiarity": "learning",
  "createdAt": "2026-11-27T14:41:00Z",
  "updatedAt": "2026-11-27T14:41:00Z"
}
```

To clear only the personal example, send `{"personalExample":null}` with the returned revision. The response retains the note and familiarity. The application avoids logging request bodies and suppresses PostgreSQL error details in the JDBC client. Database-server log configuration is independent.
