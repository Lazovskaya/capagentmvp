# Bucket validation log — knowledge-discovery

One row per client-specific bucket (eight rows for a full initial pass: process, config, custom-code,
extensibility, data, testing, operations, standards — `clean-core` is tracked separately below since
it's confirmed, not authored). A bucket is not "done" until its row reaches `Validated`.

| Bucket | Source(s) scanned | Inferred summary (one line) | Status | Reviewer (name, or `Unassigned`) | Corrections made | Client-specific "why" added | Open findings? (Y/N + pointer) | Caveats (specific claims not yet independently verified, even if Status is Validated) | Reopen history (if Status is `Reopened`) | Validation date |
|---|---|---|---|---|---|---|---|---|---|---|
| process | | | Inferred — not yet validated | Unassigned | | | | | | |
| config | | | Inferred — not yet validated | Unassigned | | | | | | |
| custom-code | | | Inferred — not yet validated | Unassigned | | | | | | |
| extensibility | | | Inferred — not yet validated | Unassigned | | | | | | |
| data | | | Inferred — not yet validated | Unassigned | | | | | | |
| testing | | | Inferred — not yet validated | Unassigned | | | | | | |
| operations | | | Inferred — not yet validated | Unassigned | | | | | | |
| standards | | | Inferred — not yet validated | Unassigned | | | | | | |

## clean-core (tracked separately — confirmed, not authored)

- **Adopted version/date confirmed current:**
- **Confirmed by:**
- **Confirmation date:**

## Rules for filling this in

- **Status has exactly four values:** `Inferred — not yet validated`, `In review`, `Validated`,
  `Reopened — prior validation didn't hold`. Don't invent intermediate states — a bucket the reviewer
  has started but not finished is `In review`, not a percentage.
- **`Reopened` is not the same as `Inferred`, even though both mean "not currently safe to trust."**
  `Inferred` means nobody has validated this yet; `Reopened` means someone did, and it turned out to be
  wrong — that history matters and must not be erased by resetting the row to `Inferred` or silently
  overwriting the previous reviewer's name. When a bucket is reopened (typically because a downstream
  consumer — e.g. `onboarding-guide`'s end-to-end ticket test — found the validated content didn't
  hold up), record in **Reopen history**: what triggered the reopen (which activity/session, what was
  found), who validated it originally and when, and who is now re-reviewing. The row moves through
  `Reopened` → `In review` → `Validated` again like a fresh pass, but the Reopen history column keeps
  the fact that this bucket has failed once, which is itself useful context for however many times it
  happens.
- **Reviewer is `Unassigned` until someone is actually working the row.** Don't leave the cell blank —
  a blank cell is ambiguous between "nobody's looking at this yet" and "forgot to fill it in";
  `Unassigned` states the former on purpose. Once a name is entered, the row must be at least
  `In review`, not still `Inferred — not yet validated`.
- **A row cannot become `Validated` with an empty "Client-specific why added" cell**, unless the
  reviewer explicitly notes there was nothing to add beyond the scan (rare — state it, don't just leave
  it blank).
- **"Corrections made" being empty is not suspicious by itself** — a scan can be accurate. But paired
  with an empty "why" cell on a brownfield client's `custom-code` or `operations` row, it's worth a
  second look (see SKILL.md's note on suspiciously tidy scans).
- **Caveats exist because a Status cell alone is too coarse for some claims.** Use it for a *specific*
  assertion inside the bucket that shouldn't be taken at face value regardless of the row's overall
  Status — especially negative claims ("no other extensions found," "no other customizations touch
  this step") inside an `Inferred` bucket, which are exactly the kind of claim a scan is least reliable
  at and a reader is most likely to take on faith. A downstream consumer should be able to read
  Caveats even when they only glance at Status and get the "don't fully trust this specific thing"
  signal Status alone can't carry.
- **`Validated` does not mean "no open questions."** It means the reviewer has done their job on the
  bucket's *content*, including surfacing anything they found — an open finding (e.g. an undocumented
  existing customization) can and should sit inside a `Validated` row. That is exactly why the
  **"Open findings?"** column exists as its own field, separate from Status: a consumer reading only the
  Status column would otherwise misread `Validated` as "nothing outstanding here." Set it to `Y` plus a
  one-line pointer to where the finding is described (in the bucket content or the "why" cell) whenever
  validation surfaced something downstream activities need to act on.
- **Partial validation is reported bucket-by-bucket, never as one aggregate "knowledge base ready"
  flag.** The `prepare→explore` Q-gate and every downstream skill needs to know which specific buckets
  are safe to trust, not a single yes/no for the whole set.

## Handoff

- **This log's status must travel with the bucket content itself, not live only here.** Each bucket
  file should carry a short header (status, reviewer, date, open-findings flag) mirroring its row in
  this log — a consumer who opens the bucket file directly (without first finding this log) should
  still see it's `Inferred` or see the open-findings flag, not have to cross-reference a separate
  document to know whether to trust what they're reading.
- Every skill downstream that lists a knowledge bucket as an input (e.g. `fit-to-standard` reads
  `process`/`standards`, `solution-design` reads `extensibility`/`clean-core`) should check this log's
  status **and open-findings column** for that bucket before treating its content as reliable, and flag
  it explicitly if working from an `Inferred` or `In review` bucket, or one with an unresolved open
  finding, rather than silently proceeding.
