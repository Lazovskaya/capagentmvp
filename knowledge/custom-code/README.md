# Knowledge: custom-code

Custom-code inventory, usage evidence, ATC findings, remediation decisions and
retirement history.

## Entry schema

| Field | Required content |
|---|---|
| `id` | Stable object/finding ID, e.g. `CODE-ZCL-CREDIT-001` |
| `type` | `object`, `usage`, `atc-finding`, `remediation`, `retirement`, `dependency` or `gap` |
| `object_ref` | Repository/object/program/class/CDS ID |
| `statement` | One finding or lifecycle decision |
| `release` | Source and target SAP release |
| `usage_evidence` | Usage source, observation window and last-used date |
| `source` | ATC run, usage export, code scan or owner confirmation |
| `authority` | `measured`, `client-confirmed`, `SAP-reference` or `inferred` |
| `confidence` | `high`, `medium` or `low` |
| `severity` | `critical`, `high`, `medium`, `low` or `none` |
| `status` | `open`, `validated`, `in-review`, `remediate`, `retire`, `retired`, `reopened` |
| `owner` | Technical owner and decision owner |
| `review_date` | Next review date |
| `related_ids` | Simplification item, requirement, design, backlog, transport or test IDs |

## Validation rules

- Never prioritize an ATC finding without usage, business criticality or explicit caveat.
- `retire` requires evidence that the object is unused or a named business confirmation.
- `remediate` requires target release, clean-core tier and acceptance/test reference.
- Preserve the original scan ID and observation date when refreshing a finding.

**Status:** Schema defined; inventory is populated per engagement by `custom-code-scan`.