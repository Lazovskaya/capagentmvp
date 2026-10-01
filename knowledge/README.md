# Knowledge

Eleven buckets split into two fundamentally different kinds.

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
| `methodology/` | SAP Activate roadmap task lists per product/scenario (`activate-s4hc-pe/`, generated from Roadmap Viewer XML exports); `cutover/` — curated Cutover strategy decision framework, remote-cutover playbook, and checklist task shape; `brownfield-conversion/` — Readiness Check interpretation guidance; `north-star/` — EPAM's SAP North Star delivery methodology (architecture-vision, strategy, business-architecture, and application/data-architecture modules), plus SAP-sourced reference-architecture material under `02-rba-and-rsa/` (see its `knowledge.meta.md` for a distribution caveat) |
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

## Governed Knowledge Sources

Each **Shared reusable** directory above (plus its content-bearing children, where a bucket holds
more than one) is a governed Knowledge Source: a `knowledge.meta.md` sidecar declares its stable
ID, one named owner, applicability, provenance, and a non-empty index, per
`knowledge-template-MVP.md` v0.3. Consumers refer to the stable ID, never to a path.

| Directory | `knowledge_source` | `project_types` | `sdlc_phases` |
|---|---|---|---|
| `clean-core/` | `clean-core` | greenfield, brownfield, bluefield, ams | explore, realize, run |
| `operations/` | `operations` | greenfield, brownfield, bluefield, ams | deploy, run |
| `standards/` | `standards` | all eight | all six |
| `testing/` | `testing` | greenfield, brownfield, bluefield, ams | realize, deploy, run |
| `methodology/activate-s4hc-pe/` | `activate-roadmaps` | greenfield, brownfield, bluefield | all six |
| `methodology/cutover/` | `cutover-methodology` | greenfield, brownfield, bluefield | realize, deploy |
| `methodology/brownfield-conversion/` | `readiness-check-interpretation` | brownfield | discover, explore |
| `methodology/north-star/` | `north-star-methodology` | greenfield, brownfield, bluefield, ams, discovery, consulting, enterprise-architecture | discover, prepare, explore |
| `domain-packs/order-to-cash/` | `order-to-cash-domain-pack` | greenfield, brownfield, bluefield, ams | explore, realize, run |
| `domain-packs/sap-best-practices/` | `sap-best-practices-taxonomy` | greenfield, brownfield, bluefield, ams, discovery, consulting, enterprise-architecture | discover, prepare, explore |

`methodology/` and `domain-packs/` are themselves pure containers with no sidecar of their own —
each of their content-bearing children is the governed source, at a finer grain than the bucket.

**The 5 Engagement schema buckets (`config/`, `custom-code/`, `data/`, `extensibility/`,
`process/`) are deliberately not Knowledge Sources.** A Knowledge Source indexes reusable content
committed with the Factory; these buckets commit only a schema, and their actual content is
written to `workspace/<bucket>/` per engagement, never to `knowledge/<bucket>/` — there is nothing
committed here to index. They stay listed above as engagement schemas, not governed sources.

**Distribution.** All knowledge under `knowledge/` ships with the factory into client
environments, because the agents and skills need it to work. Restricting what ships is a future
capability: once a more proficient way to manage knowledge exists, we expect to be able to hold
back selected sources. Until then, shipping is the deliberate default and no distribution class is
recorded on the sidecars -- see the MVP status note in
`docs/adr/0001-knowledge-organization-and-distribution.md`.

---

## What's missing (priority order)

1. Expert content layer for `domain-packs/sap-best-practices/` — troubleshooting trees, failure modes, config gotchas per scope item (needs resolved tickets or consultant input as source)
2. Second hand-curated domain pack (Source to Pay or Finance and Accounting — see `domain-packs/README.md`)
