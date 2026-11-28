# Learner preferences API

| Method | Route                 | Successful response                       |
| ------ | --------------------- | ----------------------------------------- |
| GET    | `/api/v1/preferences` | `200` with current preferences and `ETag` |
| PATCH  | `/api/v1/preferences` | `200` with updated preferences and `ETag` |

The [shared ownership and conditional write rules](favorites.md#ownership-and-conditional-writes) apply. These settings belong to the trusted learner account and apply to story reading. The frontend still stores them locally. Speech synthesis voices and browser capabilities remain device-specific and are outside this contract.

| Field          | Accepted values                        | Default    |
| -------------- | -------------------------------------- | ---------- |
| `fontSize`     | `"normal"`, `"large"`, `"extra-large"` | `"normal"` |
| `translations` | Boolean `true` or `false`              | `false`    |

Before a write, GET returns both defaults, `updatedAt: null` and `ETag: "missing"`. PATCH requires at least one supported field. Omitted fields stay as they are. Explicit null resets that field to its default. Empty strings, unsupported values, numeric substitutes and unknown preferences receive `400`. For example, `{"fontSize":null,"translations":null}` resets both preferences while retaining the server revision.

The server records `updatedAt` on the first successful write or a change to stored values. Concurrent PATCH requests using the same revision cannot silently overwrite each other. After a `412`, retrieve the latest state before applying the intended fields. Existing database rows retain their stored values and timestamps. Browser-local preferences have no individual modification timestamp, which a future migration should account for in its reconciliation policy.

### Example

```http
PATCH /api/v1/preferences
Content-Type: application/json
If-Match: "missing"

{"fontSize":"large"}
```

```json
{
  "fontSize": "large",
  "translations": false,
  "updatedAt": "2026-11-27T14:42:00Z"
}
```
