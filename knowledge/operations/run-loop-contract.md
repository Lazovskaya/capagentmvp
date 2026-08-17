# Operations: Run loop contract

Reusable contract for AMS, hypercare and project Run phases:

```text
incident intake -> triage verdict -> defect pattern analysis
  -> prevention/fix proposal -> knowledge harvest
  -> operations knowledge update -> run-exit evidence
```

## Required handoffs

| Step | Input | Required output | Next owner |
|---|---|---|---|
| Incident triage | incident/ticket refs | classification, severity, route, evidence | Test/Functional |
| Pattern analysis | resolved incident set | clusters, recurrence, priority, ladder action | Tester |
| Knowledge harvest | clusters/candidates | harvest/reopen/reject disposition, Substance keys, sources | Architect |
| Operations update | accepted deltas | versioned runbook/known issue/baseline with owner/review date | Operations owner |
| Run exit | all period evidence | four-way dispositions and closing harvest reference | Named approver |

## Completion rules

- Every period has a triage reference, including a zero-incident period.
- Pattern analysis records clusters or an explicit zero-candidate result.
- Every knowledge candidate has source, authority, applicability, owner and review date.
- Accepted operations entries are versioned; rejected entries retain a reason.
- `run-exit-record` cannot be `COMPLETE` without triage, pattern, harvest and cycle references.
- Missing upstream evidence is `BLOCKED` or `COMPLETE_WITH_GAPS`, never silently treated as no work.