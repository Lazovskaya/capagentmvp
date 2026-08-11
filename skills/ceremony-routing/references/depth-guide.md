# Depth guide — ceremony routing

Module-neutral. Domain packs supply diagnose handoffs; this file only scores **how deep**.

## Dimensions (each 1–5)

### 1. Blast radius

| Score | Meaning |
|------:|---------|
| 1 | Single document / single user |
| 2 | Small set of documents, one org |
| 3 | One process step for a plant/sales org |
| 4 | Whole channel or cash-critical path (billing/AR/EDI all partners) |
| 5 | Multi-company / multi-country / period-close impact |

### 2. Clarity

| Score | Meaning |
|------:|---------|
| 1 | Clear symptom + tcode/message/Note path obvious |
| 2 | Clear symptom, one clarifying detail missing |
| 3 | Core clear, several gaps ("sometimes", partial repro) |
| 4 | Vague or conflicting reports |
| 5 | Stakeholders disagree / discovery needed before any diagnose |

### 3. Layer risk

| Score | Meaning |
|------:|---------|
| 1 | `user` / how-to |
| 2 | `master-data` or simple `config`, easy rollback |
| 3 | Non-trivial `config` + transport |
| 4 | `custom` (Z) or `data` fix with reprocess risk |
| 5 | Classic modification / irreversible prod write / no clean rollback |

Use triage `layer` as the starting point; bump if prod + write.

### 4. System span

| Score | Meaning |
|------:|---------|
| 1 | One SAP system |
| 2 | Two (e.g. S/4 + BW) |
| 3 | SAP + one middleware/partner |
| 4 | Multi-hop interface (several partners or mapping layers) |
| 5 | Program-level cross-landscape change |

### 5. Data sensitivity

| Score | Meaning |
|------:|---------|
| 1 | Anonymized / QAS synthetic |
| 2 | Masked prod-like |
| 3 | Real business docs in non-prod |
| 4 | Real customer/PII or live amounts in evidence |
| 5 | Regulated / must not leave controlled workspace |

## Red flags (apply after base sum)

| Flag | Effect |
|------|--------|
| `prod-posting` | +2 total; if total then ≥ 16 → force at least `standard`; if ≥ 18 → `deep` |
| `period-close` | +2; force ≥ `standard` |
| `master-data-mass` | +2; force ≥ `standard` |
| `legal-tax` | +2; force `deep` |
| `cluster-ge-5` | +2; set `also_consider: ["defect-pattern-analysis"]`; prefer `deep` if total ≥ 14 |

Cap total at 25 after bumps.

## Bands → depth

| Total | Depth |
|------:|-------|
| 5–10 | `light` |
| 11–17 | `standard` |
| 18–25 | `deep` |

**Boundary bands** (re-check or ask once): totals **10–12** and **16–18**.

## Heuristic shortcuts (skip fine scoring when obvious)

Return immediately with noted shortcut:

| Signal | Depth |
|--------|-------|
| Single-doc pricing/msg clear, QAS, layer master-data/config, no red flags | `light` (record approx scores totaling ≤ 10) |
| Tracker text is how-to / training only, layer `user` | `light` |
| Same-root dup group size ≥ 5 | start from `deep` path (still score; apply `cluster-ge-5`) |
| `legal-tax` or irreversible prod posting unclear | `deep` |
| requirements-intake with AC "(none in source)" and multiple open questions | at least `standard` for next Explore skill |

## Ritual by depth (what callers should do)

### light
- Run matrix `diagnose_handoff` in narrow mode (specialist skill if any).
- Max 1–2 clarifying questions.
- Short fix-doc; adjacency regression optional unless S1.
- No `defect-pattern-analysis`.

### standard
- Full diagnostic tree / specialist skill as designed.
- Fix-doc + adjacency-driven regression (`fix-doc-and-regression`).
- HITL on commercial `defect-triage` only (existing rule).

### deep
- Everything in standard.
- HITL before accepting root cause and before fix scope / prod change.
- If `cluster-ge-5` or recurring cause family: schedule or run `defect-pattern-analysis`
  (also_consider) — do not replace the primary ticket's diagnostic unless user chooses a batch-only pass.

## Orthogonal to severity

Examples:
- S1 + clear Note + single failing interface partner + known reprocess → can still be `light`/`standard`.
- S3 + custom code in prod with unclear rollback → can be `deep`.
