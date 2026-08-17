# Knowledge: process

Client-specific business process scope, variants, roles, controls and
fit-to-standard outcomes.

## Entry schema

Store one entry per process fact, variant, decision or control. Every entry must
have:

| Field | Required content |
|---|---|
| `id` | Stable ID, e.g. `PROC-OTC-CREDIT-001` |
| `type` | `process`, `variant`, `role`, `control`, `fts-decision`, `kpi` or `gap` |
| `title` | Short human-readable name |
| `statement` | One testable fact or decision; no mixed topics |
| `scope` | Process area, company code, region and release |
| `source` | Source path/ID, source type, author/owner and date |
| `authority` | `client-approved`, `client-provided`, `SAP-reference` or `inferred` |
| `confidence` | `high`, `medium` or `low` |
| `status` | `validated`, `in-review`, `inferred`, `reopened` or `superseded` |
| `owner` | Process owner and person/role responsible for validation |
| `review_date` | Next review or expiry date |
| `related_ids` | Requirement, FTS Row, design, sign-off or backlog IDs |

For an `fts-decision`, `related_ids` must include the exact decision-log Row ID.
For a `gap`, record the missing evidence and action owner instead of inventing a
process fact.

## Validation rules

- Separate Standard, Delta and rejected decisions; do not store a Workaround as a final outcome.
- Client process facts require client authority before they become `validated`.
- A source-synthesis claim needs a source citation or `TBC` marker.
- Changed signed decisions become `reopened` and retain the superseded reference.

## Candidate content

Review and port only after validation: fit-to-standard conversion methodology,
project charter, solution design background, simplification items, integration
adaptation and Fiori adoption.

**Status:** Schema defined; content remains engagement-specific until validated.