# ADR log methodology

Ported from `sap-ai-architecture-generator`'s `sap-adr-log` skill (commit `2ae0396`), adapted for
this factory's own skill names and phase model. How to run a single, cumulative Architecture
Decision Record log across an entire engagement — raised into by every upstream skill as they run,
updated by new evidence as it arrives, and always available as its own artifact rather than
reconstructed once at the end when a SAD gets drafted.

## 1. Why this exists as its own skill, not a step inside SAD drafting

Several skills across this factory already surface real, gating decisions — an Instance Strategy
topology, a Dual Maintenance/Retrofit tooling choice, a CVI completion gate, an Add-On licensing
gate, a downtime-tier choice, a scoping row flagged as a "Business Decision." Without a dedicated
log, each skill's own guidance says some version of "this should become an ADR entry" — true, but
it leaves the actual log to be reconstructed from scratch whenever the SAD gets drafted, usually
much later, by which point context and rationale have faded. This skill makes the log itself the
artifact, maintained continuously, so:

- An architect can hand someone the ADR log **today**, mid-engagement, without waiting for a full
  SAD draft.
- A decision proposed in week 2 and actually decided in week 6 (after a client workshop) keeps its
  full history — who proposed it, on what basis, and what changed when it closed.
- New evidence (a call transcript, a presentation) updates the log directly, instead of requiring
  someone to re-read every prior skill's output to figure out what's now resolved.

## 2. The entry lifecycle

- **Proposed** — a real decision point has been identified, but isn't resolved yet. Most findings
  from Discover/Explore-phase skills should land here first, not as "Decided" — those skills
  identify *that* a decision is needed, not necessarily what the client will actually choose.
- **Decided** — the decision has been made, with a named rationale and owner. Only mark something
  Decided when there's a real basis for it (an explicit client statement, a workshop outcome, a
  documented business rule) — not because a default/likely answer seems obvious.
- **Deprecated** — the decision stopped being relevant on its own (the scope it applied to was
  dropped, a precondition became moot) and **nothing replaces it**. Different from Superseded,
  where a later decision explicitly takes its place — don't mark something Superseded just because
  it no longer matters; that's Deprecated.
- **Superseded** — a later decision replaces this one. Keep the original entry (don't delete it),
  set its `superseded_by` field to the new entry's id, and set the new entry's `supersedes` field
  to the old entry's id — this is a structured cross-reference, not just prose in
  `evidence`/`context`, so the log's decision graph can be walked by id rather than re-read. The
  history of *why* a decision changed still belongs in `rationale`/`evidence`, but the *link
  itself* belongs in these two fields.
- **Rejected** — considered and explicitly declined, not just left open. Different from Superseded
  (nothing replaced it; it was actively ruled out) and different from simply never having been
  proposed.
- **Reopened** — a previously **Decided** entry whose basis broke (new, unrelated evidence
  contradicts the reasoning it was decided on), but no replacement decision exists yet. Use this
  instead of quietly resetting the entry back to `Proposed` — that would erase that it was
  previously decided and why it's now being revisited, exactly the "no reopen path" trap a status
  enum can fall into. Explain what broke the original basis in `rationale`, and re-decide it later
  the normal way (`status` → `Decided` again once a new basis exists). Different from `Superseded`,
  where a replacement decision already exists — `Reopened` is for the gap in between.

## 2a. The `caveats` field — separate from `status`

`status` is a coarse field; it can't carry a specific unresolved or qualified claim buried inside
an otherwise-good entry — especially a decision that's real but incomplete (e.g. "redesign
decided, but not yet cost-estimated") or one built on inconclusive source data (e.g. an ST03N-gap
finding from `readiness-analysis`). Put that claim in `caveats`, not buried in free-text
`rationale` where a reader skimming the status column would miss it entirely. Leave it empty when
there's genuinely nothing to flag — most entries won't need one.

## 3. What makes something worth an ADR entry

Not every finding needs one — reserve this for decisions that are **expensive to reverse, affect
multiple stakeholders, or gate downstream work**. Concrete examples this factory already produces
or will produce as the rest of the port lands:

- Instance Strategy topology, Dual Maintenance/Retrofit tooling choice (from the ported SAD
  drafting skill's decision matrices, once landed)
- Sizing methodology and the resulting target numbers, when materially disputed or commercially
  significant (from the ported sizing skill, once landed)
- CVI completion gate, Add-On licensing/Entitlement-Required items, downtime-tier choice (from
  `readiness-analysis`'s deep-dive guides, once its own port from `sap-readiness-check` lands)
- Any row flagged as a "Business Decision" activity in a conversion-scoping output (e.g. Business
  Partner Approach, Dual Stack landscape redesign), once that skill is ported
- Any `not-Clean-Core` extensibility tier decision from `fit-gap-analysis`/`solution-design`

A routine technical finding with an obvious, low-stakes fix does **not** need an entry — that's
what each skill's own findings brief is for. If unsure, ask: "would a new architect joining this
project in month 4 need to know this was debated, and why it landed where it did?" If yes, it's an
ADR entry.

## 4. Raising and updating entries

Any skill or agent in this factory (or the architect directly) can call this skill. Build the JSON
update per `scripts/update_adr_log.py`'s documented shape and run:

```
python3 scripts/update_adr_log.py <current_log.xlsx_or_'new'> <updates.json> <output.xlsx>
```

- **First time in an engagement**: pass `new` as the existing-log argument — a fresh log is
  created.
- **Every subsequent call**: pass the most recent `.xlsx` back in as the existing log, so entries
  accumulate rather than reset. Track and reuse the current log's file path for the engagement —
  don't let each stage create a separate, disconnected log.
- **Referencing an existing entry**: include its `id` (e.g. `"ADR-004"`) to update it rather than
  create a duplicate. If unsure whether an entry already exists for this decision, read the current
  log first (open it, check titles/context) rather than guessing — a duplicate entry for the same
  decision is worse than a missed update.
- **New entries**: omit `id` and the script assigns the next `ADR-NNN`.

The script never overwrites `options_considered`, `evidence`, `supersedes`, or `superseded_by` — it
unions them, since a later update usually *adds* to what's known rather than invalidating it.
Scalar fields (`decision`, `rationale`, `status`, etc.) do overwrite, since those should reflect the
current, best-known state.

## 5. Processing an attached transcript or presentation

When the architect attaches a call transcript, workshop recording transcript, or presentation as
new evidence:

1. **Read the current ADR log first** (if one exists for this engagement) to know what's already
   Proposed and open.
2. **Extract decision-relevant statements** from the new material — a client confirming a choice,
   a stated constraint, a rejected option, a named owner or date. Don't extract routine discussion
   that doesn't resolve or add to an existing decision point.
3. **Match extracted statements to existing Proposed entries where they clearly apply** — update
   those to Decided (or Rejected, if the material shows an option was ruled out), with the
   transcript/presentation named in `evidence` and the actual quote or paraphrase in `rationale`.
4. **Raise new entries for anything the material surfaces that wasn't already tracked** — new
   material often introduces decisions nobody had flagged yet.
5. **Don't force a match** — if the material is ambiguous about which existing entry (if any) it
   resolves, say so explicitly rather than guessing at a status change. A wrongly-closed decision
   is worse than one that stays open a little longer.

If the attached material is raw audio/video rather than a text transcript, this skill doesn't
include a transcription step — ask for a transcript first.

## 6. Presenting the log

The `.xlsx` this skill produces is a standalone deliverable — hand it to the user directly whenever
it's updated, not only when a SAD gets drafted. When the ported SAD-drafting skill eventually
drafts its own Architecture Decision Log section, it should import this log directly rather than
re-deriving decision entries from scratch — the log *is* that section's source of truth, formatted
for the SAD template's own needs at that point, not a separate parallel record.
