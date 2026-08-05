# Extensibility ladder — tier rubric, red flags, worked examples

Walk top-down. Record why every tier above the chosen one was rejected — that record, not the final
tier alone, is what a future upgrade project reads.

## Tier 1 — Standard configuration

- **What it is:** customizing (IMG/SSCUI), no code.
- **Try this first, always**, even for requirements that feel code-shaped at first glance — a
  surprising number of "we need custom logic" asks collapse into a configuration switch once
  reframed against the actual requirement (see `fit-to-standard`'s reframing step).
- **Red flag pushing to tier 2+:** the requirement needs a rule/condition that customizing tables have
  no field for, not just "the current config doesn't happen to do this."

## Tier 2 — Key-user extension (in-app)

- **What it is:** Custom Fields, Custom Logic, Custom Business Objects, Fiori key-user tools — built
  through released extension points, no ABAP required.
- **Upgrade-safe** as long as the extension stays inside the tool's guardrails.
- **Red flag pushing to tier 3+:** the logic needs to call an external system, needs performance/scale
  the key-user tools don't support, or needs a data model the custom-object tools can't express.

## Tier 3 — Side-by-side (BTP)

- **What it is:** CAP or RAP built outside the core system on BTP, integrating via released APIs.
- **Benefit:** fully decouples the extension's release cycle from the core's upgrade cycle.
- **Cost to weigh honestly:** integration complexity, additional runtime to operate, latency, and a
  second codebase to maintain — this tier is not "free" just because it's clean-core compliant.
- **Red flag pushing to tier 4+:** the extension genuinely needs to run inside the core transaction
  (e.g. tight coupling to a document's save sequence) such that side-by-side introduces unacceptable
  latency or consistency risk.

## Tier 4 — Developer extensibility (in-app, ABAP Cloud)

- **What it is:** custom ABAP Cloud code inside the system, constrained to released APIs and cloud
  extension points (BAdIs, enhancement spots that are part of the released contract).
- **Upgrade-safe only if the constraint holds** — code that calls a released API today can still
  become a modification in spirit if it reaches for a workaround the moment the released API doesn't
  quite do what's needed.
- **Red flag pushing to tier 5:** the requirement needs an API, table, or transaction that has no
  released equivalent — this is the actual boundary, not a matter of developer preference.

## Tier 5 — Classic modification (last resort)

- **What it is:** direct object modification, access to non-released APIs/tables, SAP GUI transaction
  changes.
- **This tier should be rare.** Seeing it should trigger re-examining the delta itself in
  fit-to-standard, not just accepting it as a routing outcome — "we have to modify a released object"
  is frequently a sign the requirement, not the tier ladder, needs another look.
- **Mandatory:** an escalation sign-off separate from the standard design-record sign-off, naming who
  accepted the upgrade-cost consequence.

## Worked examples

| Requirement | Naive first instinct | Correct tier after ladder walk | Why |
|---|---|---|---|
| Extra approval step for orders above a threshold | "Need custom code" | Tier 1 (config) | Standard workflow customizing usually has a threshold-based approval step already |
| A calculated field combining two custom attributes | "Need ABAP" | Tier 2 (Custom Logic) | Key-user Custom Fields & Logic covers simple calculated/derived fields |
| Real-time credit scoring from a 3rd-party service | "Modify the credit check user-exit" | Tier 3 (side-by-side) | External call, no core transaction coupling required — side-by-side avoids touching the core exit at all |
| A pricing condition too complex for condition technique, needs to run inline in document save | "Build it side-by-side" | Tier 4 (developer extensibility) | Genuine in-transaction coupling; if a released BAdI exists at that point, this is the right tier |
| A legally required field only exposed via a non-released table | "Add a Z-table via classic enhancement" | Tier 5 — but escalate first | Check for a newer released API before accepting this; SAP frequently releases equivalents over time |

## Anti-patterns

- Jumping straight to the tier the assigned developer is most comfortable building
- Accepting "the API is basically the same as what we need" as equivalent to "the API is released for
  this use"
- Treating tier 5 as routine once a project has used it once — each instance should re-trigger scrutiny
