# Knowledge: data

Migration objects, data ownership, cleansing rules, mapping decisions and
reconciliation baselines.

## Entry schema

| Field | Required content |
|---|---|
| `id` | Stable ID, e.g. `DATA-CUSTOMER-001` |
| `type` | `object`, `mapping`, `cleansing-rule`, `owner`, `baseline`, `tolerance`, `gap` or `decision` |
| `object_ref` | Migration object, table, entity or source/target field |
| `statement` | One mapping, rule, baseline or decision |
| `source_system` / `target_system` | Systems and clients/tenants |
| `source` | Profiling result, mapping workshop, migration file or approval |
| `authority` | `measured`, `client-approved`, `client-provided` or `inferred` |
| `confidence` | `high`, `medium` or `low` |
| `status` | `validated`, `in-review`, `inferred`, `reopened` or `superseded` |
| `owner` | Data owner and validation owner |
| `review_date` | Next review date |
| `related_ids` | Requirement, migration object, reconciliation, defect or sign-off IDs |

## Validation rules

- Every reconciliation baseline has a measurement date, source query/export and tolerance.
- A cleansing rule identifies the data owner, population, rule and exception handling.
- Mapping decisions distinguish source values, target values and transformation logic.
- Never report a migration result as accepted without a `reconciliation-report` or named exception.

**Status:** Schema defined; migration-specific entries are created by `reconciliation` and data activities.