---
name: defect-triage
description: Classify each item in the defect or incident queue as bug versus functional spec flaw, route it, and recommend a fix. A commercial call, so a human confirms the verdict. Reused by Realize-phase defect triage and Run-phase hypercare.
---

# Defect Triage

Adapted from sap-ai-cons's real, Jira-integrated bugfix track. **Updated:** the intake/diagnose
pipeline this file used to describe informally (load, classify, dedupe, route) is now its own set
of real, ported skills — `incident-triage` (intake), `root-cause-playbook` /
`pricing-diagnostic` / `billing-ar-error-analyzer` / `idoc-failure-analyzer` (diagnose),
`fix-doc-and-regression` (fix/verify) — sharing the `order-to-cash` domain pack under
`knowledge/domain-packs/`. This skill no longer duplicates their steps; it picks up **after**
`incident-triage` has already classified/deduped/routed the item, and does the one thing those
skills don't: the **commercial** bug-vs-spec-flaw call.

## When to use

Realize-phase defect triage (this factory's `defect-triage` activity) and Run-phase hypercare
(`hypercare-triage` activity), which reuses this same skill with a different intake source
(incidents from live users rather than defects from test cycles). Both activities run the full
pipeline (`incident-triage` → diagnose → `defect-triage` → `fix-doc-and-regression`); this skill is
one stage in that pipeline, not the whole thing.

## Inputs (contract)

Ask for anything missing before running.
- **Required:** the item, already technically classified by `incident-triage` (sub-process, layer,
  severity, dedup status) — see step 1 below for what happens if it isn't.
- **Required:** the traceability chain, if this is a Realize-phase item with a fit-to-standard
  decision log to check against (a `Row ID`, its Standard/Delta classification, and the paired
  design-record/extensibility-record for Delta rows). Hypercare items from Run may not always have
  one — see step 3.
- **Optional:** a `defect-classifier`-style agent's recommendation, if wired.

## Knowledge this skill orchestrates

- `../../knowledge/testing/` (defect history and prior spec-flaw classifications).
- `../../knowledge/process/` and `../../knowledge/config/` (what the process and config are supposed
  to do, needed to tell a bug from a spec flaw).
- `../../knowledge/custom-code/` (whether the affected object is custom, which shapes routing).
- `../../knowledge/domain-packs/order-to-cash/` — via `incident-triage`'s upstream classification; this
  skill doesn't read the domain pack directly, it trusts the classification that already used it.

## Steps

1. **Confirm the item is technically classified before triaging it commercially.** If sub-process,
   layer, severity and dedup status aren't already on the item (i.e. `incident-triage` hasn't run
   on it yet), route it back to intake rather than reasoning through a commercial verdict on an
   unclassified item.
2. **Find the traceability anchor**, if one exists: the fit-to-standard decision-log Row ID this
   item's affected process step maps to.
3. **Compare reported behavior against what was recorded**, when a Row ID exists: Row ID says
   Standard and the system deviates → bug; Row ID says Standard and the system follows it but the
   ask is for something standard doesn't do → spec flaw; Row ID says Delta and the system deviates
   from the design-record → bug; Row ID says Delta and the system matches the design-record but the
   ask goes beyond it → spec flaw. **If no Row ID exists for the affected step** (common for
   hypercare items with no Explore-phase equivalent), mark it `untraceable — traceability gap`
   rather than guessing — this is a distinct outcome, not a forced bug/spec-flaw call. **If the
   engagement has no fit-to-standard decision log at all** (e.g. a fresh AMS/Run-only engagement
   with no Explore phase of its own), every item will land here — that is the correct, honest
   output for that engagement shape, not a sign the skill "isn't working." Say so explicitly in the
   first run's summary rather than letting a wall of `untraceable` verdicts look like a malfunction.
4. **Consult a `defect-classifier`-style agent's recommendation, if wired**, and state explicitly
   whether this triage agrees or diverges.
5. **Human confirmation.** A named human confirms every verdict — this is a commercial call with
   money attached, not one an agent closes alone. The `triage-verdict` artifact records who.
6. **Route the confirmed verdict:** bug → the fix workstream (`fix-doc-and-regression`); spec flaw →
   a CR referral; untraceable → the traceability-gap queue, tracked separately as a health signal
   for the upstream chain, not routed into either fix path.

## Output

One `triage-verdict` artifact per item: classification (bug / spec flaw / untraceable), the Row
ID(s) checked (if any), confidence, route, recommended fix, and the human who confirmed it.

## Status

Progress. The commercial-classification logic is real, adapted from sap-ai-cons; the domain pack
and pipeline it used to informally assume are now real, ported skills in this factory
(`incident-triage` and siblings, see above) rather than an open dependency.
