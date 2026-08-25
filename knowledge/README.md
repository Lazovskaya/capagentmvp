# Knowledge

Ten buckets split into two fundamentally different kinds.

## Two kinds of buckets

| Kind | What lives here | Committed to repo? | Populated by |
|---|---|---|---|
| **Shared reusable** | Pre-built expertise used across engagements | Yes — the content itself | Human curation / generation scripts |
| **Engagement schema** | Format definition for per-project data | Yes — the schema only; actual content never committed | Skills at runtime, written to `workspace/` |

---

## Shared reusable — content is here

| Bucket | What's inside |
|---|---|
| `domain-packs/` | Swappable domain expertise: `order-to-cash/` (19 curated files — taxonomy, signal catalog, troubleshooting trees), `sap-best-practices/` (732 scope-item JSON + generated taxonomy/BPMN markdown) |
| `operations/` | Run-loop contract + 6 operational templates (cutover runbook, hypercare playbook, rollback/escalation, SLO baseline, known-issues, production conversion) |
| `testing/` | Defect-history register template + test-script template |
| `standards/` | `source-synthesis.md` (document-construction methodology), `sap-architecture-references.md` (curated SAP GitHub/resource index) |
| `clean-core/` | SAP clean-core guardrail rules — API release classification, upgrade-safety checklist, violation pattern catalog, in-app vs. side-by-side criteria |

---

## Engagement schema — only the format is here, data lives in `workspace/`

These buckets define *what fields a skill should record* when it discovers something on a project.
No client data is ever committed; the schema travels with the factory, the data stays per-engagement.

| Bucket | What gets recorded there |
|---|---|
| `config/` | Configuration decisions (object, statement, authority, confidence, status) |
| `custom-code/` | Custom-code inventory items (object, usage evidence, ATC findings, remediation path) |
| `data/` | Data migration objects, mappings, cleansing rules, decisions |
| `extensibility/` | Extensibility choices (chosen tier 1-5, tier-ladder evidence, API refs) |
| `process/` | Discovered process variants, deviations, client-specific process notes |

A skill that writes to one of these buckets creates files in `workspace/<bucket>/` at runtime —
never in `knowledge/<bucket>/`. The schema here tells it what fields are required and what the
validation rules are.

---

## What's missing (priority order)

1. Expert content layer for `domain-packs/sap-best-practices/` — troubleshooting trees, failure modes, config gotchas per scope item (needs resolved tickets or consultant input as source)
2. Second hand-curated domain pack (Source to Pay or Finance and Accounting — see `domain-packs/README.md`)
