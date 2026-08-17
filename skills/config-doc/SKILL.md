---
name: config-doc
description: Document a functional customizing change and its rationale, check it against config guidelines, and attach its transport — as one unit rather than three tasks that drift apart. Use for Realize-phase configuration adaptation.
---

# Config & Documentation

Contract merged from two independently-sketched stubs (this factory's own, and `sap-ai-cons`'s
`realize/config-documentation`) — neither side had implemented logic. `sap-ai-cons`'s stub added one
concrete detail this factory's own stub didn't have: checking the change against
`knowledge/standards/config-guidelines.md` explicitly, rather than just documenting it. Folded in
below; the transport-attachment half stays this factory's own contribution, since `sap-ai-cons` had
no equivalent (transports aren't its bugfix track's concern).

*Design conventions this skill follows (ID schemes, status enums, role naming, etc.) are in
`../../../docs/skill-design-conventions.md` — check it before modifying this skill's templates.*

## When to use

Realize phase, whenever a functional customizing change is made. Matches this factory's
`config-doc` activity (Configuration & documentation).

## Inputs (contract)

Ask for anything missing before running.
- **Required:** the config change made or planned (transaction/IMG node, object, setting).
- **Required:** the rationale — which upstream decision this implements. A config change with no
  traceable rationale is a finding this skill surfaces, not a gap it papers over.
- **Optional:** the transport ID, if already released.

## Knowledge this skill orchestrates

- `knowledge/config/` — this activity's own bucket, the target for the written-up record.
- `knowledge/process/` — to find the upstream Row ID (fit-to-standard) or design-record
  (solution-design) the change is supposed to implement.
- `knowledge/standards/` — specifically `config-guidelines.md`, checked against every change.

## Steps

1. **Validate inputs.** If no upstream Row ID or design-record is named, ask for it before
   documenting the change as if it were self-justifying.
2. **Trace the rationale.** Cite the fit-to-standard decision-log Row ID or the solution-design
   design-record verbatim — don't re-describe the decision in prose, cite it, same discipline as
   every other traceability-chain artifact in this factory.
3. **Check against `knowledge/standards/config-guidelines.md`.** If the change deviates, record the
   deviation explicitly with its reason — a silent deviation is indistinguishable from an oversight
   the first time someone else reviews this config.
4. **Write the config record** — see `../../../artifacts/config-record/template.md`.
5. **Attach the transport.** If the transport already exists, record its ID and contents by
   construction (read from the actual transport), not from memory — see
   `../../../artifacts/transport-record/template.md`. If it doesn't exist yet, mark the config record
   "transport pending" rather than leaving the field blank with no explanation.

## Output

- **`config-record` artifact** (`../../../artifacts/config-record/template.md`): what changed, why
  (citing the upstream Row ID/design-record), guideline-check result, who, when.
- **`transport-record` artifact** (`../../../artifacts/transport-record/template.md`): transport ID,
  contents, which config-record(s) it carries.
- Both feed the `realize→deploy` Q-gate together — a config change with a record but no transport,
  or a transport with no record, is an incomplete pair for gate purposes.

## Judgment calls worth stating out loud

- **"We always configure it this way" is not a rationale** — same discipline as fit-to-standard's
  reframing test: if there's no Row ID or design-record behind a change, that's a gap to flag, not a
  historical habit to accept.
- **A guideline deviation isn't automatically wrong** — but it must be named as a deviation with its
  reason, not silently absorbed into the record as if it were standard practice.
- **Don't record a transport ID from memory.** If the actual transport can't be read at
  documentation time, mark the record as pending rather than guessing at the ID.

## Driver

Main driver: functional. Owner role per factory-data.json: **functional**.

## Status

Progress. Contract and workflow written and merged from both stubs' scoping, including the
config-guidelines check; not yet dry-run tested end to end.
