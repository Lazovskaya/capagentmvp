# Knowledge: extensibility

Scope-level and per-delta extensibility decisions, released API evidence,
modification register and clean-core exceptions.

## Entry schema

| Field | Required content |
|---|---|
| `id` | Stable ID, e.g. `EXT-OTC-CREDIT-007` |
| `type` | `tier-decision`, `api`, `extension-point`, `modification`, `exception` or `gap` |
| `statement` | One decision or guardrail |
| `chosen_tier` | `1` Standard config, `2` key-user, `3` BTP, `4` ABAP Cloud, `5` classic modification |
| `tier_ladder_evidence` | Reason each cheaper tier was rejected |
| `api_refs` | Released API/extension-point references and release |
| `source` | Design record, SAP reference, assessor verdict or client decision |
| `authority` | `client-approved`, `SAP-reference`, `assessed` or `inferred` |
| `confidence` | `high`, `medium` or `low` |
| `status` | `validated`, `in-review`, `inferred`, `reopened` or `superseded` |
| `owner` | Architect and approval owner |
| `review_date` | Next API/release review date |
| `related_ids` | FTS Row, design, backlog, object, test or sign-off IDs |

## Validation rules

- One Delta has one current extensibility record and one stable Row ID.
- Every chosen tier records why lower tiers cannot carry the requirement.
- Tier 5 requires escalation addendum, approver and review condition.
- An API is not considered released from a memory-based claim; cite the source and release.
- An approved upstream design change reopens the affected extensibility entry.

**Status:** Schema defined; per-delta entries are produced by `solution-design`.