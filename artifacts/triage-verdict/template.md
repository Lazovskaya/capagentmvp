# Triage verdict — defect-triage

One of these per item. The classification field is a commercial statement (who pays), not a technical
one — keep the technical classification (sub-process/layer/severity) as a separate, cited input, not
re-derived here.

- **Item reference:** <ticket ID / defect ID, and its source: Realize test-cycle or Run/hypercare
  incident queue>
- **Upstream technical classification present?** Y/N — <if N, **stop here**: set Classification below
  to `Blocked — pending intake`, leave the Traceability check and the rest of Verdict unfilled, and
  route the item back to intake. Do not reason through the traceability check on an item with no
  confirmed technical classification — see SKILL.md step 1.>
  - Sub-process:
  - Layer:
  - Severity:
  - Dedup status:

## Traceability check

<Skip this section entirely if Classification above is `Blocked — pending intake`.>

- **Affected process step:**
- **Decision-log Row ID:** <cite verbatim — or state `none found` if untraceable>
- **Row ID's decision:** Standard / Delta / `none found`
- **If Delta — design-record & extensibility-record reference:** <same Row ID>
- **Reported behavior vs. what was decided:** <matches / deviates — one line explaining which>

## Verdict

- **Classification:** Bug / Spec flaw (change request) / Untraceable — traceability gap /
  Blocked — pending intake
- **Reasoning (one line, citing the Row ID comparison, not the symptom alone):** <N/A if Blocked>
- **`defect-classifier` agent consulted?** Y/N. <If Y: its recommendation, and whether this verdict
  agrees or diverges, and why if it diverges. If N: say so explicitly. N/A if Blocked.>
- **Confidence:** <meaning depends on classification — don't reuse one scale unreflectingly:
  - Bug / Spec flaw: confidence that the Row ID comparison in this record is the correct read of the
    decision-log and design-record — i.e. confidence in the *classification*.
  - Untraceable: confidence that **no Row ID actually exists** for this process step — i.e. confidence
    that this is a genuine traceability gap, not a Row ID you simply failed to find. Low confidence
    here means "search again / ask the workshop facilitator" before adding it to the gap queue.
  - Blocked: N/A — no classification was attempted.>
- **Confirmed by (named human):** <N/A if Blocked — a blocked item has no verdict yet to confirm>
- **Confirmation date:**

## Routing

- **If Bug:** fix workstream / owner assigned:
- **If Spec flaw — CR referral (concrete re-entry, not just "send it back"):**
  - **CR referral ID:** `CR-<item reference>` — the stable key this referral is tracked under until it
    produces its own decision.
  - **One-line summary of the new ask:**
  - **Referral status:** Not yet scheduled / Scheduled for fit-to-standard follow-up / Session held,
    pending new Row ID / Resolved
  - **Resulting new decision-log Row ID (backfill once the follow-up session happens):** <this CR does
    not get a work item until a fit-to-standard/solution-design pass produces a *new* Row ID for it —
    a CR referral is not itself a design decision, only a scheduled request for one>
- **If Untraceable:** added to the traceability-gap queue — <not a fix path; this item stays open
  until the chain is repaired, e.g. via a retroactive fit-to-standard clarification>
- **If Blocked:** returned to intake with the missing fields named; re-submit to defect-triage only
  once technically classified

## Validity checklist before this verdict is considered complete

- [ ] Upstream technical classification is present, or the record stops at `Blocked — pending intake`
      with nothing beyond it filled in
- [ ] Classification is justified by the Row ID comparison — testing "was this specific behavior/ask
      part of the recorded decision," not the user's satisfaction with the outcome or how the
      complaint is phrased
- [ ] A named human confirmed the verdict — not left as the agent's recommendation alone (N/A if
      Blocked)
- [ ] If Untraceable, this was not forced into a best-guess Bug/Spec-flaw call, and Confidence reflects
      confidence in the *absence* of a Row ID, not confidence in a classification
- [ ] If Spec flaw, a CR referral ID was assigned — the item doesn't just get a vague "send to CR
      process" note
