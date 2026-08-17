# Knowledge: config

Client-specific configuration baseline, customizing decisions, dependencies and
configuration rationale.

## Entry schema

| Field | Required content |
|---|---|
| `id` | Stable ID, e.g. `CFG-SD-CREDIT-001` |
| `type` | `baseline`, `decision`, `customizing`, `dependency`, `parameter`, `gap` or `exception` |
| `title` | Short name |
| `statement` | What is configured or decided and why |
| `system` | System/tenant and client where applicable |
| `object_ref` | IMG path, configuration object, app or external ID |
| `source` | Ticket, workshop Row ID, SAP reference or transport evidence |
| `authority` | `client-approved`, `client-provided`, `SAP-reference` or `inferred` |
| `confidence` | `high`, `medium` or `low` |
| `status` | `validated`, `in-review`, `inferred`, `reopened` or `superseded` |
| `owner` | Functional owner and review owner |
| `review_date` | Next review date |
| `related_ids` | Requirement, design, extensibility, transport, test or defect IDs |

## Validation rules

- A configuration decision is not validated without system/release applicability and rationale.
- A configured object must link to a `config-record` and, when transported, a `transport-record`.
- Do not copy a global SAP recommendation into client config without recording client applicability.
- Exceptions need approver, reason, expiry/review condition and affected clean-core rule.

**Status:** Schema defined; no client baseline is populated in the factory repository.