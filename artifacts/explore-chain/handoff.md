# Explore chain handoffs

Contracts between Explore skills. Stable IDs copy **verbatim** (see
`docs/skill-design-conventions.md`). Machine map:
[`artifact-model.yaml`](artifact-model.yaml).

## Chain

```text
requirements-intake
        │  requirements-record / requirements.md
        ▼
fit-to-standard
        │  decision-log Row IDs + sign-off-record (Live)
        ▼
solution-design
        │  design-record (status) + extensibility-record
        ▼
backlog-drafting
        │  work items with full backlink chain
        ▼
Realize (config-doc / abap-dev)  — only if design-record status == APPROVED
```

---

## requirements-to-fts

**From:** `requirements-intake`  
**To:** `fit-to-standard` (or `solution-design` Mode B as a cited source)

| Must pass | Rule |
|-----------|------|
| `requirements.md` / requirements-record | Goal stated; AC only if present in source; open questions explicit |
| No invented AC | Gaps stay as questions, not fake criteria |
| Source register | Enough for FTS workshop prep |

**Refuse:** sending a raw email pile straight to `backlog-drafting`.

---

## fts-to-design

**From:** `fit-to-standard`  
**To:** `solution-design`

| Must pass | Rule |
|-----------|------|
| Delta rows | Each has Row ID, requirement, justification, Delta owner |
| Row ID scheme | `FTS-<date>-<process-slug>-row-NN` fixed for the workshop |
| Sign-off | Named signer; Session status **Live** for gate credit |
| Reframing test | Every Delta has a recorded why-not-standard |

**Refuse:** designing from Standard rows, or from Draft session phrased as Live outcomes.

---

## design-to-backlog

**From:** `solution-design`  
**To:** `backlog-drafting`

| Must pass | Rule |
|-----------|------|
| design-record | Cites FTS Row ID verbatim; `test_approach` is a real correctness statement |
| extensibility-record | Same Row ID; cheaper tiers rejected in writing |
| **status** | Must be `APPROVED` before backlog create / Realize build. `DRAFT` / `IN_REVIEW` = local draft only |
| Reopen | If wrong after approve → `REOPENED` (keep history), not silent downgrade |

**Refuse:** drafting Jira items from an unapproved design-record.

---

## backlog-to-realize

**From:** `backlog-drafting`  
**To:** `config-doc` / `abap-dev` / `test-case-design`

| Must pass | Rule |
|-----------|------|
| Backlink chain | Row ID → design-record → extensibility-record → work item |
| AC quality | Measurable enough per `backlog-drafting` references |
| Gate | Incomplete backlinks **block** `explore→realize`, not a follow-up task |

**Refuse:** Realize build work that cannot name the approved design-record for its Row ID.

---

## Status gate (PDAD-style)

Same idea as ai-sdlc's PDAD `APPROVED` before eng:

1. Produce design-record as `DRAFT`.
2. Review → `IN_REVIEW`.
3. Named approver → `APPROVED`.
4. Only then: backlog push (with `--apply` for Jira) and Realize build skills.

MCP / tracker writes stay **dry-run** unless the user passes `--apply`.
