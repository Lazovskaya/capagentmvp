# AC quality check — backlog-drafting

Run **after** reading the design-record / extensibility-record and **before** drafting the
work item into Jira/Cloud ALM (or the paste-ready document).

## What "good enough AC" means here

Backlog AC is still **coarse** (one-sentence / Given-When-Then level) — `test-case-design`
expands coverage later. But coarse ≠ vague. A tester or builder must be able to disagree with
"done" without a workshop replay.

**Fail (halt or clarify):** "as discussed", "works correctly", "per design", empty AC, AC that
only restates the title.

**Pass:** each criterion names an observable outcome (document/status/message/field/posting/
block reason) grounded in `design-record.target_design` + `test_approach`.

## Verdicts

| Verdict | Action |
|---------|--------|
| `clear` | Draft the work item(s). |
| `thin` | Ask **2–3 clarifying questions in one batch** (product-owner pattern), grounded in the design-record gaps — not a fishing expedition. Or route back to `solution-design` if the target design itself is the gap. |
| `blocked` | Do not draft. Missing upstream decision → refuse (existing rule). Missing measurable seed in design-record → send back to `solution-design`, do not invent AC from workshop memory. |

## Clarifying-question budget

When `thin`, ask at most three questions, all at once, for example:
1. What observable outcome means "done" for the builder?
2. What is explicitly out of scope for this work item?
3. Which system object / transaction / app is the change expected in?

Do not ask technical stack questions the design-record should already own. Do not exceed three
before either drafting with Caveats or routing upstream.

## Output

Write `ac-quality.md` in the run folder and append `ac_quality.completed` to `events.jsonl`.
