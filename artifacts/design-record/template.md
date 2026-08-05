# Design record — solution-design

One of these per delta. Written so `backlog-drafting` can size and write acceptance criteria without
re-interviewing the business owner — if it can't, the design-record is incomplete, not the workshop.

- **Decision-log Row ID:** <the exact Row ID from the fit-to-standard decision log this design
  originates from, e.g. `FTS-2026-08-04-credit-block-handling-row-02` — copy the key verbatim, don't
  re-describe the session. **If this design was assembled via compose/maintain mode instead** (see
  "Source synthesis" below) because no single decision-log row cleanly covered it, say so here and
  cite the Source Register instead.>
- **Delta summary (one line):** <restate the requirement from the decision log — this is a pointer for
  the reader, not a re-negotiation of what was already decided>
- **Target design:**
  - What changes:
  - Where it lives (system/component — informed by, but not a substitute for, the extensibility-record's
    tier decision):
  - Data/objects touched:
  - Integration points, if any:
- **Test approach:** <what "correct" looks like for this design — this is what backlog-drafting turns
  into acceptance criteria; if you can't state a test for it, the design isn't concrete enough yet>
- **Open questions / dependencies:** <anything unresolved — an empty design-record section here is a
  claim that nothing is unresolved, so don't leave it blank by default>

## Source synthesis (only when compose/maintain mode was used)

Skip this section when the design came straight from a fit-to-standard Delta row — most do. Fill it
in when the target design had to be assembled from scattered sources (emails, decks, specs, meeting
transcripts) per `../../knowledge/standards/source-synthesis.md`, because no single decision-log row
covered it cleanly.

- **Source Register:** `S-id · type · title · date · author · reliability` — one row per source.
- **Citations:** every claim in "Target design" above should carry a `[S-id]` (or list of ids), or be
  marked `TBC` if uncovered — do not state a synthesized fact with no citation.
- **⚠ Conflicts:** any sources that disagreed, with both sides shown and a proposed resolution for the
  consultant to confirm — never silently picked. While a conflict is open, the field it affects above
  must read `TBC — ⚠ see Conflict`, not a picked side.
- **Change log (maintain mode only):** version bump, what changed, which new source drove it — a
  targeted delta, not a rewrite of untouched fields.

## Handoff

This record travels with its paired `extensibility-record` (same Row ID) into `backlog-drafting`.
Neither is sufficient alone — the design-record says *what* changes, the extensibility-record says
*where it's allowed to live and why*.
