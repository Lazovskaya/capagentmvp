# Defect pattern analysis — method (agnostic, module-neutral)

Generic method for finding **systemic** causes behind a defect backlog and converting repeated point
fixes into permanent ones. Orchestrated by `defect-pattern-analysis`, which plugs in a **domain
taxonomy** (+ signal catalog and adjacency map when the domain pack has them). Method only, no client
data.

Difference from triage: `incident-triage` dedupes **today's inflow** to make a worklist;
pattern analysis looks **backwards across a period** (a sprint, a month, hypercare-to-date) to ask
"why does this keep happening?".

Output shape: `knowledge/templates/pattern-analysis.md`.

## Inputs
- A **backlog / resolved set** of defects for a defined period. Ideally each with: id, created date,
  short text, sub-process (if already triaged), layer, severity, resolution note, effort if tracked.
- Which **domain** applies (for taxonomy / signal catalog / adjacency).
- Optional: volume hints (same schema as triage), release/transport dates, go-live or cutover dates.

Resolution notes are the single most valuable field — without them, clustering degrades to symptom
clustering and the "permanent fix" column becomes a guess. Say so explicitly when they are missing.

## Step 1 — normalize

Re-classify (or trust prior triage for) each defect: **sub-process**, **layer**, **severity**. Use
the domain signal catalog so the same phrase maps to the same code across months. Record when a
ticket cannot be classified rather than dropping it.

Normalize the **cause key** from resolution notes where possible — the concrete failing object:
condition record / key combination, VKOA combination, partner profile, checking rule, credit segment,
user-exit name, master-data field. The cause key is what clustering should key on.

## Step 2 — cluster by cause, not by symptom

| Cluster class | Rule | Typical permanent fix direction |
|---------------|------|--------------------------------|
| **Same cause key** | Identical failing object across tickets | Fix the object once; check why it was wrong (process or config gap) |
| **Same cause family** | Different objects, same mechanism (e.g. many missing condition records) | Master-data governance / creation process, not more records |
| **Same trigger event** | Cluster starts at a transport, release, cutover, period close, new partner onboarding | Change control / regression gap / onboarding checklist |
| **Same actor group** | Concentrated in one plant, sales org, country, partner, user group | Training, local process, or org-specific config |
| **Recurring known issue** | Same defect already fixed before, returns | Regression gap or transport lost / re-imported; feed known-issues KB |
| **Non-defect load** | `user` / how-to / expected-behavior tickets | Enablement, documentation, self-service |

A cluster needs a **stated mechanism** ("account assignment group blank on materials created after
X"), not just a shared label. If the mechanism cannot be stated, keep it as a candidate and mark it
`unclear-mechanism`.

## Step 3 — quantify

Per cluster, capture what makes it worth acting on:

| Measure | How |
|---------|-----|
| **Ticket count** | Raw count in the period |
| **Business weight** | Volume class of the affected area (triage volume-hint schema) |
| **Severity mix** | Count of S1 / S2 / S3 |
| **Recurrence** | Appears in more than one period / after a prior fix |
| **Effort spent** | Sum of effort if tracked, else count × typical handling time |
| **Trend** | Rising / flat / decaying (decaying clusters may need no action) |

Rank by **business weight × severity mix × recurrence**, not ticket count alone. Ten how-to tickets
rank below two S1 billing blocks.

## Step 4 — propose the permanent fix (ladder)

Prefer the highest rung that actually removes the cause:

1. **Eliminate** — remove the failure mode (config change, correct determination, retire the custom
   object, automate the missing step).
2. **Prevent** — governance/process: master-data creation checklist, mandatory field, validation,
   approval, onboarding step for new partners.
3. **Detect early** — monitoring/report/job alert so the failure surfaces before the business feels
   it (e.g. daily check of stuck IDocs, unposted billing).
4. **Absorb** — accept and make cheap: known-issues KB entry, macro/runbook, user enablement.

Each proposal states: rung, owner, expected effect on the cluster, and whether it needs a change
request. Never propose custom code as the first rung when config or governance closes the cause.

## Step 5 — regression & knowledge follow-through

- Any structural fix goes through `fix-doc-and-regression` — use the domain **adjacency map** to
  scope regression for the permanent change (it is usually wider than the original point fix).
- Generalize and anonymize confirmed patterns back into the domain pack: new signal-catalog phrases,
  new troubleshooting-tree branches, known-issues entries. This is the compounding asset.
- Feed the reverse direction too: if a cluster shows triage mis-classified repeatedly, fix the signal
  catalog's disambiguation rules.

## Honesty rules
- State the period and the sample size; a month of 20 tickets does not support "systemic".
- Distinguish **observed** clusters from **suspected** ones (thin resolution notes).
- Do not merge clusters to make a bigger headline number.
- Report the non-defect share separately — it changes the staffing conversation, not the fix backlog.
