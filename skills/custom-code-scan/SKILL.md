---
name: custom-code-scan
description: Run ATC's S4HANA_READINESS check variant against the target release, join the findings to real usage data (SCMON/UPL), and turn a raw finding count into a prioritized remediation inventory that separates "retire" from "remediate." Use in Prepare, once a target release is known, before Realize development work is scoped.
---

# Custom Code Scan

New content, not ported (no `sap-ai-cons`/`sap-ai-framework` equivalent existed). Grounded in SAP's
own published custom-code migration method — see Sources below; these are SAP Community/product
guidance, not a verbatim reproduction, and should be checked against the client's actual SAP_BASIS
release for exact transaction/report names.

*Design conventions this skill follows (ID schemes, status enums, role naming, etc.) are in
`../../../docs/skill-design-conventions.md` — check it before modifying this skill's templates.*

## Purpose

A raw ATC run against a large custom-code base produces a finding count in the thousands — not
something anyone can act on directly. This skill's whole value is turning that into a short,
prioritized inventory by doing the one thing a naive ATC run doesn't: checking each finding against
whether the object is actually used. **Unused code is the cheapest code to fix — retire it before
remediating it.**

## When to use

Prepare phase, once a target S/4HANA release is known, to baseline the custom-code landscape before
Realize development work is scoped. Matches this factory's `custom-code-scan` activity (Custom code
evaluation).

## Inputs (contract)

Ask for anything missing before running.
- **Required:** an ATC run against the `S4HANA_READINESS` check variant (Code Inspector, using the
  Simplification Database) for the target release — either a fresh run via the `abap-mcp` connector
  or a prior export.
- **Required:** usage data for the same landscape — **SCMON** (current tool) or **UPL** (its
  predecessor, still seen on older systems) — covering a representative period, not a single day.
  **If no usage data is available, say so explicitly and do not silently treat every object as
  "in use"** — an unjoined ATC run is a finding list, not a remediation inventory.
- **Optional:** a prior remediation inventory (for a repeat run), business-criticality hints per
  object/application area.

## Knowledge this skill orchestrates

- `knowledge/custom-code/` — this activity's own bucket: inventory, usage data and remediation
  history, the target this skill writes to.
- `knowledge/clean-core/` — the released-API and upgrade-safety criteria a remediation approach
  must satisfy; still a stub in this factory (see that bucket's own README), so this skill should
  flag when a remediation call actually needed clean-core guidance that wasn't there yet, rather
  than silently improvising it.

## Steps

1. **Validate inputs.** If usage data is missing or covers too short a period to be representative
   (a rule of thumb, not a hard cutoff: less than a full business cycle — e.g. a period that misses
   month-end or quarter-end processing — undercounts usage), say so and flag the inventory as
   provisional rather than final.
2. **Load the ATC findings** from the `S4HANA_READINESS` variant run: object, finding category
   (syntax error / simplification-item hit / performance / obsolete-object reference), severity.
3. **Join to usage data.** For every flagged object, check whether it actually executed in the
   observed period. An object with ATC findings but **zero observed executions** is a retirement
   candidate, not a remediation candidate — confirm it's genuinely dead (not a rarely-run
   period-end job) before recommending retirement.
4. **Classify each object:** `retire` (unused, confirm and drop), `remediate` (used, ATC finding
   must be fixed before go-live), `remediate — low priority` (used, but the finding is cosmetic /
   non-blocking for the target release), `investigate` (usage data ambiguous or absent for this
   object — don't default this to either retire or remediate).
5. **Prioritize the remediate list** by a combination of severity and business criticality, not by
   raw ATC finding count — ten trivial findings in a low-use report don't outrank one blocking
   finding in a high-volume interface.
6. **Write the inventory**, and state the retirement rate achieved (objects retired ÷ total
   flagged) as a headline number — this is the metric that shows the join-to-usage-data step
   actually happened, not just an ATC dump.

## Output

- A prioritized remediation inventory in `knowledge/custom-code/`: per object, ATC finding,
  usage-confirmed status, classification (retire/remediate/investigate), priority, owner.
- Feeds the `prepare→explore` Q-gate ("custom-code baseline taken") and `abap-development`'s later
  work (Realize) — a `remediate`-classified object here is what that activity actually builds
  against.

## Judgment calls worth stating out loud

- **Zero observed executions is evidence, not proof, of "unused."** A rarely-run period-end or
  year-end job can look dead in a short observation window — check the usage-data period covers a
  full business cycle before calling something dead.
- **Don't remediate an object just because ATC flagged it, if it's actually unused** — that's the
  single most expensive mistake this skill exists to prevent (fixing code that should have been
  deleted).
- **A finding with no usage data available is `investigate`, never a silent default to either
  extreme.** Guessing "probably fine" on an unverified object defeats the point of joining to usage
  data at all.
- **Raw ATC finding count is not a priority signal** — business criticality of the object weighs
  more than how many findings it has.

## Driver

Main driver: developer. Owner role per factory-data.json: **developer**.

## Status

Progress. New content grounded in SAP's published ATC/usage-data method (see Sources); not yet
dry-run tested against a real ATC export.

## Sources

SAP Community and product guidance — representative of the standard method, not verbatim SAP
documentation. Verify exact transaction/report names against the client's SAP_BASIS release.

- [S/4HANA Custom Code Impact Analysis Using ATC — SAP Community](https://community.sap.com/t5/enterprise-resource-planning-blog-posts-by-members/s-4hana-custom-code-impact-analysis-using-atc/ba-p/13566164)
- [Technical Guide: Using ABAP Test Cockpit for SAP S/4HANA Transition — SAPinsider](https://sapinsider.org/articles/technical-guide-using-abap-test-cockpit-for-sap-s-4hana-transition/)
- [Custom code adaptation for SAP S/4HANA — FAQ — SAP Community](https://community.sap.com/t5/enterprise-resource-planning-blog-posts-by-sap/custom-code-adaptation-for-sap-s-4hana-faq/ba-p/13418880)
