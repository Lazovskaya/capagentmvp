# Knowledge: operations

Runbooks, cutover history, support patterns, incident resolutions, performance
baselines and operational ownership.

## Entry schema

| Field | Required content |
|---|---|
| `id` | Stable ID, e.g. `OPS-CUTOVER-001` |
| `type` | `runbook`, `cutover-step`, `known-issue`, `incident-pattern`, `baseline`, `slo`, `owner` or `gap` |
| `title` | Short operational name |
| `statement` | One executable instruction, observed pattern or decision |
| `system` | System/tenant/environment |
| `trigger` | Event, schedule or symptom that activates the entry |
| `source` | Run log, Cloud ALM/Jira reference, monitoring evidence or owner confirmation |
| `authority` | `measured`, `client-approved`, `client-provided` or `inferred` |
| `confidence` | `high`, `medium` or `low` |
| `status` | `validated`, `in-review`, `inferred`, `reopened` or `superseded` |
| `owner` | Runbook owner and escalation owner |
| `review_date` | Next rehearsal/review date |
| `related_ids` | Incident, defect, cutover, sign-off, transport or knowledge-harvest IDs |

## Validation rules

- A runbook includes preconditions, steps, expected result, rollback and escalation path.
- A known issue records symptom, confirmed cause, resolution, originating reference and applicability.
- A baseline includes measurement window, metric, threshold and source system.
- A production change is not marked reusable until it has evidence from a real run or explicit owner review.
- Reopened entries retain the old version and identify the changed operational assumption.

## Candidates

Review and port hypercare, production-conversion, SUM/DMO, HANA performance and
sizing/deployment material only after release and client applicability are stated.

## Current reusable templates

- `cutover-runbook-template.md` — sequenced actions, rehearsal evidence, deviations and rollback.
- `production-conversion-runbook-template.md` — timestamps, logs, retries, final disposition and handoff.
- `hypercare-playbook-template.md` — entry/exit criteria, severity path and incident loop.
- `rollback-and-escalation-template.md` — trigger thresholds, decision authority and verification.
- `slo-baseline-template.md` — metric, threshold, source, measurement window and owner.
- `known-issues-template.md` — confirmed cause, applicability, mitigation and reusable resolution.
- `run-loop-contract.md` — incident → triage → pattern analysis → harvest → operations update → run-exit handoff.

These are reusable schemas/templates, not client-specific production evidence.
Populate them per engagement and promote entries only after owner validation and
source review.

**Status:** In progress. Operational schemas and reusable templates exist; real
engagement content and incident-to-knowledge closure remain to be validated.