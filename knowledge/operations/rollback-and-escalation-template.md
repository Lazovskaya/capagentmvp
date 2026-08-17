# Operations: rollback and escalation template

## Metadata

| Field | Value |
|---|---|
| ID | `OPS-ROLLBACK-<scope>-<version>` |
| Owner | |
| System/environment | |
| Rollback owner | |
| Approval authority | |
| Status | `in-review` / `validated` / `reopened` |
| Review date | |
| Related IDs | cutover, conversion, incident, run-exit |

## Decision table

| Trigger | Evidence threshold | Decision owner | Action | Communication |
|---|---|---|---|---|
| | | | | |

## Procedure

1. Declare incident and record timestamp.
2. Freeze non-essential changes.
3. Confirm rollback authority and impact.
4. Execute reversible rollback steps.
5. Verify service and data integrity against baseline.
6. Communicate result and open follow-up actions.
7. Record evidence and route recurring causes to knowledge harvest.

No rollback is considered complete without verification evidence and named
acceptance of the resulting state.
