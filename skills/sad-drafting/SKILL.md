---
name: sad-drafting
description: Draft or review EPAM's Solution Architecture Document (SAD) for a SAP engagement — Rollout, S/4HANA Conversion (Greenfield/Bluefield/Brownfield), or another SAP solution implementation (e.g. BPC-to-GRDC migration). Fills EPAM's real SAP SAD .docx template, tailored to the specific engagement type, with real Instance Strategy, Sizing Strategy, RICEFW/Clean Core, Data Migration Architecture, and Dual Maintenance/Retrofit decision matrices. Use whenever the user mentions a Solution Architecture Document, SAD, SAP architecture documentation, or S/4HANA conversion/rollout/migration documentation — even without the exact term "SAD" (e.g. "write up the architecture for this SAP project", "document our S/4HANA conversion approach").
---

# SAD drafting

Ported from `sap-ai-architecture-generator`'s `sap-sad` skill (real, engagement-tested content;
`own` posture) — the single largest port from that repo, and its 5 decision matrices are the
highest-value content for filling this factory's own stalled Technical Architecture track (see
"Relationship to `sad-assembly`" below).

Act as an experienced SAP Solution Architect drafting a Solution Architecture Document for a real
engagement. Two things make this different from writing generic prose into a template: (1) the
SAD's value comes from precise, decision-grade content — vague filler is worse than an honest "TBD,
pending X" — and (2) the *right* content depends heavily on what kind of SAP engagement this is. A
rollout SAD and a greenfield-conversion SAD should not look alike even though they share a
template.

*Design conventions this skill follows (ID schemes, status enums, role naming, etc.) are in
`../../docs/skill-design-conventions.md` — check it before modifying this skill's templates.*

## When to use

Explore/Realize phase, whenever a SAD needs drafting or reviewing for a Rollout, Conversion
(Greenfield/Bluefield/Brownfield), or generic/other SAP solution implementation.

## Inputs (contract)

Ask for anything missing before running.
- **Required:** which engagement type applies — Rollout / Conversion (disambiguate
  Greenfield/Bluefield/Brownfield per `playbooks/conversion.md`) / Generic. Read the matching
  playbook now (`playbooks/rollout.md`, `playbooks/conversion.md`, or `playbooks/generic.md`) — it
  lists which SAD sections carry the most weight for that type, what to ask, and its pitfalls.
  Don't skip this; the playbook is what keeps the output from being a generic template dump.
- **Optional:** the `leanix` connector, to confirm the current application/technology landscape for
  the Solution Landscape and System Architecture sections. Read-only; if unavailable, work from the
  client-supplied inventory instead and mark the gap rather than inventing one.
- **If a Readiness Check report exists**, process it with `readiness-analysis` before interviewing
  the user — expected for most Brownfield/Bluefield engagements. Its findings brief pre-answers
  sizing (Section 2.1, feeds `references/sizing_strategy_decision_matrix.md`), custom code
  volume/Clean Core targets (Section 6), CVI/data quality and the transition-path decision (Section
  7.1 — see `references/data_migration_architecture.md`), integration impact (Section 5), and the
  planned downtime estimate (Section 9). If no Readiness Check exists yet for a Brownfield/Bluefield
  engagement, say so explicitly and flag that Sections 2, 6, and 7 stay provisional — don't silently
  draft them from assumptions.
- **If a Business Process Scope exists** (or can be built via `conversion-scoping`),
  use its output directly for IV.I (Business Goals/Capabilities), Section 6 (Extensibility/Clean
  Core scope), and Section 5 (Integration, when an Application Map was cross-referenced). Any row
  flagged as a "Business Decision" or otherwise gating must be raised into `adr-log` immediately,
  not left to be remembered at Section 13 drafting time.
- **For Conversion engagements**, use `references/conversion_intake_matrix.md`'s section-by-section
  document/artifact request list plus fallback questions — generate one consolidated checklist,
  filtered to the playbook's High/Medium-priority sections and to whatever the Readiness Check
  didn't already resolve, and send it up front.

## Knowledge this skill orchestrates

- `playbooks/{rollout,conversion,generic}.md` — engagement-specific guidance; read exactly one per
  SAD drafted.
- `references/conversion_intake_matrix.md` — Conversion-only client document/artifact checklist.
- `references/instance_strategy_decision_matrix.md` — how many production instances the target
  landscape has (Section 2.1); mandatory to confirm explicitly for Bluefield, worth running for
  Greenfield/Brownfield too. Raise the outcome into `adr-log` as soon as it's decided.
- `references/dual_maintenance_retrofit.md` — for Brownfield/Bluefield: how legacy-system changes
  made during the conversion window get a defined retrofit path (ChaRM/Cloud ALM/gCTS/no dedicated
  tool). Interacts directly with the instance strategy decision — read together when both are open.
- `references/sizing_strategy_decision_matrix.md` — sizing methodology choice for Section 2.1/10;
  hands off to `sizing-analysis` for the actual growth-adjusted calculation.
- `references/system_architecture_components.md` — Section 2.2 (Application Server/Connectivity
  Components); flags which components are a real engagement decision vs. operated under the RISE
  SLA.
- `references/data_migration_architecture.md` — Section 7.1: SAP's three transition paths, the
  eight-question decision walk (including the SUM-eligibility technical gate), tool decision,
  CVI-completion prerequisite tied to `readiness-analysis`'s own CVI findings.
- `references/ricefw_decision_matrix.md` — Section 6: Extensibility Decision Record tiers, Clean
  Core golden rules, ATC/SCI Priority 1-4 remediation mapping from `readiness-analysis`'s Chapter 5
  output. Any not-Clean-Core object is an `adr-log` candidate, not just an EDR entry.
- `references/EPAM_Generic_SAD_Rubric.xml` — EPAM's universal SAD quality rubric (60 chapters,
  0-4 scale, Mandatory/Recommended/Conditional/Optional), used as a quality sanity-check, not as
  the document structure.

## Steps

1. **Identify the engagement type** and read the matching playbook (see Inputs above).
2. **Process a Readiness Check report first**, if one exists, via `readiness-analysis` — this skill
   assumes that skill is available; if it isn't installed, say so and ask the user to add it rather
   than silently hand-reading the report yourself (the extraction script and interpretation guide
   handle the heading-repetition issue and data-collection-gap phrasing that hand-reading misses).
3. **Process a Business Process Scope**, if one exists, via `conversion-scoping` —
   same principle: say so explicitly if that skill isn't installed rather than drafting Section
   6/IV.I from generic Simplification Item counts alone.
4. **Interview the user** using the playbook's question list plus whatever the template's own
   bracketed placeholders still need, not already answered by steps 2-3. Reasonable assumptions are
   fine where the user doesn't know yet — state them explicitly in the document's Assumptions
   section rather than presenting a guess as confirmed fact.
5. **Extract the template's placeholders:**
   ```
   python3 scripts/docx_fill.py extract assets/EPAM_SAP_SAD_Template.docx /tmp/placeholders.json
   ```
   Reads the template (already containing EPAM best-practice boilerplate in every section — only
   bracketed `[...]` spots are gaps) and writes every placeholder's id, nearest heading, and (for
   table cells) row/header context. Read that JSON to see the full list — don't guess placeholder
   locations from the docx text.
6. **Decide, per placeholder, using the playbook's priority table**: real project-specific content
   now, an explicit "N/A for this engagement — see Section [x]," or a clearly-marked "TBD — pending
   [specific missing input]." All three are legitimate; silently inventing specifics for a
   high-priority section is not. Ground content in real, publicly documented SAP terminology and
   mechanics (SAP Activate, RISE with SAP, Clean Core/ABAP Cloud, BTP, Fiori/UI5, CPI/Integration
   Suite) — don't hedge on well-established facts, but flag genuinely customer-specific unknowns.
7. **Write the replacements and apply them:**
   ```
   python3 scripts/docx_fill.py fill assets/EPAM_SAP_SAD_Template.docx replacements.json <ClientName>_SAD_<YYYY-MM-DD>.docx
   ```
   `replacements.json` is `{"<id>": "<new text>", ...}` using the same ids `extract` produced.
   Anything left out stays as the original template text. The script preserves paragraph/cell
   formatting; it only swaps text. Never edit the template asset in place — always a new output
   file.
8. **Sanity-check quality** against `references/EPAM_Generic_SAD_Rubric.xml` before handing back —
   it doesn't map 1:1 onto the SAP docx's 14 sections, but its quality bar transfers: a
   Mandatory-equivalent section should read "Substantially Developed" or better, not generic.
9. **Tell the user what was filled, what was left N/A and why, and what's still TBD** — this
   summary is as important as the docx itself.

## Reviewing an existing SAD (not drafting one)

Same playbooks and rubric apply: identify the engagement type (ask if not stated), read the
matching playbook to know what should be present and prioritized, use the rubric's quality-scale
language in feedback (e.g. "Section 6 reads as Rudimentary — it names Clean Core but gives no
target level or component list"). Don't run the `fill` script in this mode — `extract`, if useful,
to enumerate unfilled placeholders, but the deliverable is feedback, not a new docx.

## Output

- A filled `.docx` following EPAM's SAP SAD template structure and formatting.
- A summary of what was filled with real content, what was explicitly marked N/A (and why), and
  what's left TBD pending missing information.
- Whenever this skill's own decision matrices (Instance Strategy, Dual Maintenance/Retrofit)
  produce a real decision, raise it into `adr-log` immediately — Section 13 (Architecture Decision
  Log) should be drafted **from** the current `adr-log` state, not derived from scratch.

## Relationship to `sad-assembly` / `technical-sad` (resolved: interim domain source)

This factory already has `agents/sad-assembly/` — a Realize-phase agent that composes a
`technical-sad` artifact from nine not-yet-built domain-strategy agents (`EPMCSAPAI-275`, `-281`
through `-289`: Solution Landscape, Release & Transport, Security, Integration, Extensibility,
Data, Output Mgmt/UX, Operations, Infrastructure, Toolchain). This ported skill covers a
substantial, overlapping slice of that same ground directly (Instance Strategy → Landscape,
Sizing → part of Infrastructure, RICEFW/Clean Core → Extensibility, Data Migration Architecture →
Data, System Architecture Components → part of Landscape/Infrastructure) in one real, tested skill
with a real EPAM template, rather than nine separate not-yet-built agents. **Resolved:**
`sad-assembly` now treats this skill's output as an interim `AVAILABLE` source for the domain rows
it covers (`-275`, `-285`, `-284`, part of `-288`), labeled `source: interim (sad-drafting)`, until
each domain's own dedicated agent is actually built — at which point `sad-assembly` prefers the
dedicated agent's output over this skill's for that domain. See `agents/sad-assembly/agent.md`'s
`## Inputs`/`## Procedure` step 1.

## Judgment calls worth stating out loud

- **A "TBD, pending X" is worth more than vague filler** — the rubric marks down generic phrasing
  as the single most common way a SAD ends up thin.
- **An assumption presented without saying so is a false-confidence claim** — always route through
  the Assumptions section.
- **Don't silently do a companion skill's job worse when it isn't installed** — say so explicitly
  (Readiness Check, Business Process Scope) rather than hand-deriving a weaker substitute.

## Driver

Main driver: architect. Owner role per factory-data.json: **architect**.

## Status

Progress. Ported from `sap-ai-architecture-generator`'s `sap-sad` (real, engagement-tested
playbooks, decision matrices, and docx-fill script); not yet dry-run tested against this factory's
own artifact/agent wiring. Its relationship to `sad-assembly`/`technical-sad` is resolved as interim
domain sourcing (see above).
