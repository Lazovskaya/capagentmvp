# Onboarding record — team-onboarding

One of these per joiner. Person-readiness and knowledge-base-defects are tracked as separate
outcomes — a joiner can be `Ready` while defects were found and logged; neither status should be
inferred from the other.

- **Joiner:**
- **Role:** functional / developer / architect / delivery / basis / data / test
- **Facilitator:**
- **Session date(s):**

## Per-bucket walkthrough

Depth column reflects the role-priority table in SKILL.md (deep vs. light) — every bucket still gets a
row, even a light one.

| Bucket | Depth (deep/light) | Bucket status at time of walkthrough (Validated / In review / Inferred) | Open findings flag present? | Caveats carried over from the validation log (specific claims not to take at face value) | Understanding check result | Notes |
|---|---|---|---|---|---|---|
| process | | | | | | |
| config | | | | | | |
| custom-code | | | | | | |
| extensibility | | | | | | |
| data | | | | | | |
| testing | | | | | | |
| operations | | | | | | |
| standards | | | | | | |
| clean-core | | | | | | |

## Knowledge-base gaps found (log every one — this is the point of the exercise)

| # | Bucket | What was missing (bucket didn't answer, human had to explain) | Routed to (see SKILL.md's three cases) | Status |
|---|---|---|---|---|
| 1 | | | `knowledge-harvest` (case 2: content addition to a sound Validated bucket) / `knowledge-discovery` — reopen (case 1: a Validated bucket didn't hold up) / `knowledge-discovery` — first pass (case 3: bucket was Inferred/In review, never validated) | |

<If this table is empty after a real session, that's worth a second look — see SKILL.md's note on
suspiciously clean first onboardings.>

## End-to-end readiness test

- **Ticket used:** <real ticket reference, or state "synthetic — no connector wired">
- **Joiner's role in the test:** <what they were asked to work out unaided>
- **Result:** Pass (worked it out from the knowledge base alone) / Pass with gap (got there, but only
  after being told something not in the knowledge base — log that gap above) / Fail (could not
  determine next steps from the knowledge base)

## Verdicts (independent — do not infer one from the other)

- **Person readiness:** Ready / Not yet — <if not yet, what's still missing>
- **Confirmed by (named, typically onboarding buddy or delivery lead — not the joiner self-certifying):**
- **Confirmation date:**
- **Knowledge-base defect count this session:** <number — a running count across onboarding sessions
  is itself a knowledge-base health trend worth tracking>

## Validity checklist before this record is considered complete

- [ ] All nine buckets (eight client-specific plus clean-core) appear in the per-bucket table, even the
      light-depth ones
- [ ] Every point requiring verbal human explanation is logged as a gap, not silently resolved and
      forgotten
- [ ] The end-to-end ticket test was actually run, not skipped in favor of the bucket walkthrough alone
- [ ] Person readiness and knowledge-base defects are recorded as separate outcomes, not conflated
- [ ] A `Validated` bucket that failed its understanding check or the ticket test is routed to
      `knowledge-discovery` as a **reopen** (case 1), not logged as a harvest note and not conflated
      with a bucket that was merely never validated in the first place (case 3)
