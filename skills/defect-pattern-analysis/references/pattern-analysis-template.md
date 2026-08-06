# Defect pattern analysis — template

One file per analysis run. Replace angle-bracket placeholders. Keep SAP references as pointers
(Note/KBA numbers, transactions, tables) — never paste SAP text. Client data stays in `workspace/`.

---

# Defect pattern analysis — \<period\>

| Field | Value |
|-------|--------|
| Period analysed | \<from – to\> |
| Source | \<export file / connector\> |
| Defects in scope | \<count\> |
| Domain | \<e.g. O2C\> |
| Resolution notes available | \<all / partial / none\> |
| Connector | \<pulled live / ⚠ file mode, no write-back\> |

## Summary

- Clusters found: \<n\> (\<n\> actionable, \<n\> candidate / unclear mechanism)
- Non-defect share (`user` / how-to): \<n\> (\<%\>)
- Top recommendation: \<one line\>

## Distribution

| Sub-process | Tickets | S1 | S2 | S3 | Dominant layer |
|-------------|---------|----|----|----|----------------|
| | | | | | |

## Clusters (ranked)

### C1 — \<name\>
| Field | Value |
|-------|--------|
| Class | same cause key / cause family / trigger event / actor group / recurring / non-defect |
| Mechanism | \<stated mechanism, or `unclear-mechanism`\> |
| Cause key | \<failing object\> |
| Tickets | \<ids\> |
| Severity mix | S1 \<n\> / S2 \<n\> / S3 \<n\> |
| Business weight | critical / high / medium / low |
| Recurrence | first seen / repeat after fix \<ref\> |
| Trend | rising / flat / decaying |
| Evidence strength | observed / suspected |

**Permanent fix proposal**

| Rung | Action | Owner | Needs CR? | Expected effect |
|------|--------|-------|-----------|-----------------|
| eliminate / prevent / detect / absorb | | | yes/no | |

**Regression note:** \<adjacency row to use when the structural fix is implemented\>

### C2 — \<name\>
\<same structure\>

## Candidates (insufficient evidence)

| ID | Pattern | What is missing to confirm |
|----|---------|----------------------------|
| | | |

## Knowledge feedback

| Target | Proposed addition |
|--------|-------------------|
| Signal catalog | \<new phrase / disambiguation rule\> |
| Troubleshooting tree | \<tree + new branch\> |
| Known-issues KB | \<entry\> |

## Caveats
- \<sample size, missing notes, period effects (month-end, cutover), anything that limits the read\>
