---
name: adr-log
description: Maintain one cumulative Architecture Decision Record log across an entire SAP engagement, raised into by every phase as gating decisions are identified, and updated whenever new evidence (a call transcript, a workshop outcome, a presentation) resolves or adds to an open decision. Always available as its own .xlsx artifact, not reconstructed once at final SAD drafting. Use whenever an expensive-to-reverse, multi-stakeholder, or gating decision is identified in any phase, whenever the user wants the current decision log, or whenever new evidence should update existing open decisions.
---

# ADR log

Ported from `sap-ai-architecture-generator`'s `sap-adr-log` skill (real, engagement-tested content;
`own` posture). This isn't one phase's skill — it's a companion every other skill/agent writes
into. The point is that a real architectural decision gets tracked from the moment it's first
identified, not reconstructed from memory when someone finally drafts the SAD's decision-log
section, potentially months later with the original context faded.

*Design conventions this skill follows (ID schemes, status enums, role naming, etc.) are in
`../../docs/skill-design-conventions.md` — check it before modifying this skill's templates.*

**Read `references/adr_log_methodology.md` before raising or updating any entry.** It covers the
entry lifecycle (`Proposed` → `Decided` / `Deprecated` / `Superseded` / `Rejected`), what actually
deserves an entry, and exactly how to process an attached transcript or presentation against the
existing log.

## When to use

Any phase, as soon as a real, gating decision is identified — not held back for SAD drafting.
Also whenever the user wants to see the current decision log, or has new evidence (a transcript,
workshop notes, a presentation) that should update existing open decisions.

## Inputs (contract)

Ask for anything missing before running.
- **Required:** the decision(s) to raise or update, as structured entries — see
  `scripts/update_adr_log.py`'s docstring for the exact JSON shape.
- **Required if updating:** the current log's `.xlsx` (or `new` if this is the engagement's first
  entry) — never hand-edit the `.xlsx` directly; always go through the script so history and the
  union-not-overwrite merge behavior stay correct.
- **Optional:** an attached call transcript, workshop notes, or presentation to process as new
  evidence against the existing log (see methodology §5).

## Knowledge this skill orchestrates

- `references/adr_log_methodology.md` — entry lifecycle, what deserves an entry, and how to
  process attached evidence against the existing log.
- `knowledge/standards/` — delivery conventions this log's write-up follows.

## Steps

1. **Find or start the log for this engagement.** If one already exists, use it as the starting
   point. If this is the first decision raised for this engagement, start fresh with `new`.
2. **Build the update as structured JSON** — one entry per decision, per
   `scripts/update_adr_log.py`'s documented shape. Include the entry's `id` if updating something
   already in the log — check the current log first if unsure whether one exists, don't guess and
   risk a duplicate.
3. **Run the merge:**
   ```
   python3 scripts/update_adr_log.py <current_log.xlsx_or_'new'> <updates.json> <output.xlsx>
   ```
   This never overwrites `options_considered`/`evidence`/`supersedes`/`superseded_by` — new
   information is unioned in, not replacing what was already known — and logs every status change
   to a `History` sheet automatically.
4. **Marking a decision Superseded is a two-sided update:** set the old entry's `status` to
   `Superseded` and `superseded_by` to the new entry's id, and set the new entry's `supersedes` to
   the old entry's id — in the same JSON update if both entries are known at once, or as a
   follow-up update to the old entry once the new one's id is assigned. Use `Deprecated` instead of
   `Superseded` when a decision simply stops applying (dropped scope) with nothing replacing it.
5. **Hand the updated log back as its own artifact**, every time it changes — don't wait for a full
   SAD draft to surface it. State what changed (new entries, status transitions) in plain language
   alongside the file.
6. **If new evidence was attached**, follow `references/adr_log_methodology.md` §5 — read the
   current log first, extract only decision-relevant statements, match them to existing `Proposed`
   entries where they clearly resolve one, and raise new entries for anything not already tracked.
   Don't force a match when the material is ambiguous about which entry it resolves.

## Working with the rest of the factory

Every skill/agent that surfaces a gating decision should raise into this log rather than just
mentioning it in its own output — e.g. `readiness-analysis`'s CVI/licensing/downtime-tier findings,
`fit-gap-analysis`/`solution-design`'s `not-Clean-Core` extensibility-tier decisions, and (once
ported) `sizing-analysis`'s methodology choice and `conversion-scoping`'s "Business Decision" rows.
When the (not yet ported) SAD-drafting skill eventually drafts its own decision-log section, it
should import this log directly as the source of truth rather than re-deriving entries.

If a skill identifies a decision-worthy finding and this skill isn't available, say so explicitly
rather than letting the decision go untracked until someone remembers it later.

## Output

- **`adr-log` artifact** (`../../artifacts/adr-log/`): an `.xlsx` with an ADR Log sheet (one row
  per decision: id, title, status, raised by, dates, context, options considered, decision,
  rationale, owner, SAD section, evidence, supersedes/superseded-by) and a History sheet tracking
  every status change.
- A plain-language summary of what changed on this update.

## Judgment calls worth stating out loud

- **Not every finding belongs here** — only decisions expensive to reverse, affecting multiple
  stakeholders, or gating downstream work. Routine findings stay in each skill's own findings
  brief.
- **Matching new evidence to existing open decisions is semantic judgment, not an exact join** —
  ambiguous matches are left open rather than forced closed.
- **A wrongly-closed decision is worse than one left open a little longer.**

## Driver

Main driver: architect. Owner role per factory-data.json: **architect**.

## Status

Progress. Ported from `sap-ai-architecture-generator`'s `sap-adr-log` (real, engagement-tested
script and methodology); not yet dry-run tested as part of this factory's own pipeline wiring
(this repo's artifact/skill names).
