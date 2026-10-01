# Source synthesis — method (agnostic)

How to build (and keep current) a structured, source-traced document from scattered, heterogeneous
inputs — emails, decks, specs, meeting transcripts. Tool-blind. Generalized from the `business-blueprint` skill methodology ("fill the Business
Blueprint template") to "fill whichever target document the calling skill owns" —
in this factory, that's `solution-design`'s `design-record`, when a delta's target design isn't
cleanly available from a single fit-to-standard decision-log row alone. Real, tested content, not a
stub — see `../../skills/solution-design/references/` for the two worked examples it came with.

## Principles (non-negotiable)

1. **Provenance over fluency.** Every material statement (decision, requirement, scope, design
   choice) cites its source(s) `[S-id]`. An uncited claim is either removed or marked `TBC`.
2. **Never invent to fill a gap.** Missing information becomes an **open point (`TBC`)** in the log,
   not plausible-sounding text.
3. **Surface conflicts, don't resolve them silently.** When sources disagree, record all sides with
   sources + dates in a **⚠ Conflict** callout and propose a likely resolution for the consultant to
   confirm. Do not merge conflicting facts into a false consensus.
   - **Open-conflict rule (main body):** while a ⚠ Conflict is open, the target document must **not**
     state one side as decided. Write `TBC — ⚠ see Conflict [Sx vs Sy]` or list both cited values.
     Only **maintain mode**, on a source that resolves it, may write the decided value. (A proposed
     resolution is a suggestion for the consultant, not a decision — it does not license stating it
     as fact in the document.)
4. **Draft, consultant owns.** Output is always a draft pending consultant sign-off; synthesized
   content is never presented as authoritative without provenance + review.
5. **No client data beyond what the target document needs.** Summarize; don't dump raw PII/attachments.

## Source handling

- **Accepted inputs:** text-bearing sources — emails, decks, specs (docx/pdf/pptx), notes, and
  **meeting transcripts**. Raw audio/video is **out of scope** — transcription happens upstream (a
  connector or manual step); this method consumes the transcript.
- **Register every source** in a Source Register: id, type, title, date, author, and a
  **reliability** tag (e.g. signed spec / workshop decision = high; informal email = low).
- A single source usually feeds **multiple** sections of the target document.

## Authority & recency (how to weight sources)

- **Formal > informal:** signed specs and recorded workshop decisions outrank emails and hallway notes.
- **Newer > older** for the same topic — but the superseded fact stays visible in a Conflict/So-far
  note until the consultant confirms the supersession.
- When authority and recency disagree (a newer informal email vs an older signed decision), **flag
  it** — do not auto-pick.
- **Signed-artefact supersession:** a later informal-or-governance source (e.g. steering minutes)
  that contradicts a **signed spec** does not silently supersede it. Flag the need for a scope
  amendment / change request; treat the point as resolved only once an amendment/CR source exists.

## Compose mode (first build)

1. Register all sources.
2. Extract statements and **map each to the target document's sections**.
3. Synthesize each section with inline `[S-id]` citations; apply authority/recency.
4. Emit **⚠ Conflict** callouts where sources disagree.
5. Mark every uncovered required area `TBC` and add it to the **Open Points Log**.
6. Produce the target document + Source Register + Open Points Log at version 0.1 / Draft.

## Maintain mode (keep current from new sources)

1. Register the new source(s).
2. Run a **delta pass** vs the current baseline: identify **new** info, **changed** info, **newly
   contradicted** info, and the **sections affected**.
3. Propose **targeted, reviewable changes** — show what changes and why (which source drives it).
   Never silently rewrite the whole document.
4. Update conflicts (resolve or add), refresh the Open Points Log (close answered points, add new).
5. Bump the version, append to the Change Log with the driving source(s).

## Anti-patterns

- Hallucinating to make a section look complete → use `TBC`.
- Dropping citations for a smoother read.
- Silently choosing between conflicting sources.
- Rewriting the whole target document on a minor new input instead of a targeted delta.
- Treating a meeting transcript as fact without weighting it against formal decisions.
