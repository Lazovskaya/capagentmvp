# Operations: hypercare playbook template

## Metadata

| Field | Value |
|---|---|
| ID | `OPS-HYPERCARE-<scope>-<version>` |
| Owner | |
| Service owner | |
| On-call path | |
| Hypercare window | |
| Source/handoff ref | `run-exit-record` or Deploy→Run handoff |
| Status | `in-review` / `validated` / `reopened` |
| Review date | |

## Entry criteria

- Handoff status is `READY` or `READY_WITH_EXCEPTIONS`.
- Go-live and conversion evidence are linked.
- Rollback owner and escalation path are named.
- Monitoring baseline and thresholds are present.

## Incident loop

```text
intake -> classify -> severity -> diagnose -> mitigate -> verify -> communicate -> harvest
```

| Severity | Initial response | Escalation owner | Communication channel |
|---|---|---|---|
| S1 | | | |
| S2 | | | |
| S3 | | | |

## Exit criteria

- Open incidents have one of the run-exit dispositions.
- Recurring patterns are sent to `defect-pattern-analysis`.
- Reusable resolutions are proposed to `knowledge-harvest`.
- Closing `run-exit-record` cites the closing harvest cycle.
