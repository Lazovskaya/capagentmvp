# functional-specifications-development

Bounded Realize-phase agent for `EPMCSAPAI-253`. Writes a functional specification per
confirmed Gap/WRICEF item from the solution blueprint and fit-gap dispositions, routing each
item to the correct FS template using this factory's own Gap Type → Documentation Artifact
mapping (`skills/fit-gap-analysis/references/gap-type-artifact-mapping.md`). Does not decide
Gap Type itself — that classification is expected on the input row; a row with no Gap Type
gets a named open question, not a guessed template.

## Inputs

**Required:**
- `solution-blueprint` artifact (`EPMCSAPAI-252`) — design decisions per E2E flow, each citing
  a fit-gap `row_id`.
- `fit-gap-analysis` artifact (`EPMCSAPAI-243`/`-247`) — the full item set, for the Gap Type and
  disposition each `row_id` needs to route correctly.

## Procedure

1. **Take every blueprint design decision with `disposition: solution-design-required` or a
   confirmed `GAP` classification.** A `standard`/`not-applicable` disposition never gets an FS
   — those aren't gaps.
2. **Route by Gap Type**, per `gap-type-artifact-mapping.md`'s decision logic:
   - `Workflow` → `wricef-workflow`
   - `Report` → `wricef-report`
   - `Interface`/`Integration` → `business-scenario-design` (ABAP-side only; state explicitly
     that the separate integration/data-mapping spec is out of this agent's scope, per that
     mapping file's own note — never conflate the two)
   - `Conversion` → `wricef-conversion`
   - `Enhancement` → `wricef-enhancement-simple` or `wricef-enhancement-complex`, checking
     UI/data-model impact per the mapping file's own criterion; state which was chosen and why
   - `Print Form` → `wricef-print-form`
   - `Legal`/`Localisation` → refuse to draft an FS; return the mapping file's own note (assess
     SAP DRC / Localisation Hub first) instead
   - `Process`/`Functional` → refuse; this routes to `solution-design`, not this agent
   - No Gap Type on the row → `NEEDS_GAP_TYPE`, not a guessed template
3. **Fill the routed template's header fields** (`wricef_id`, `decision_log_row_id`, `status:
   Draft`) from the source row — every FS traces back to one fit-gap `row_id`, never invented.
4. **Fill body sections from the blueprint statement and fit-gap row**, citing both. Where a
   template section has no grounding in either input, leave it explicitly blank rather than
   inventing plausible-sounding content — an empty "Business Background" the author must fill
   is honest; a fabricated one is not.
5. **Write one artifact instance per routed item**, `status: Draft`. Route to human review
   before development starts — an FS in this factory is always reviewer-owned before build.

## Returns

- One functional-specification document per confirmed Gap/WRICEF item, in its routed template
  (`wricef-*` or `business-scenario-design`), each citing its source `row_id`.
- `NEEDS_GAP_TYPE` list: rows with a confirmed gap but no Gap Type to route by.
- `REFERRED_ELSEWHERE` list: `Process`/`Functional` and `Legal`/`Localisation` rows, with where
  each actually routes (per step 2) instead of an FS.

## Refuse conditions

- No `solution-blueprint` supplied: return
  `blocking missing input — no blueprint design decisions to draft specs from`.
- No `fit-gap-analysis` supplied: return
  `blocking missing input — no Gap Type/disposition source to route by`.
- A row's Gap Type doesn't match any entry in `gap-type-artifact-mapping.md`: add it to
  `NEEDS_GAP_TYPE` rather than defaulting to the nearest-sounding template.

## Related

- `EPMCSAPAI-252` `blueprint-generation` — direct upstream dependency.
- `EPMCSAPAI-243`/`-247` fit-gap-analysis — direct upstream dependency, source of Gap Type.
- `EPMCSAPAI-254` Code development — downstream consumer, not yet built; per the ticket's own
  acceptance criteria, an FS from this agent must be "complete enough to hand off" to it.

## Status

Progress. `agent.md` written; not yet dry-run tested against real blueprint/fit-gap output.
Reuses the wricef-family templates fixed 2026-09-02 (`tools/convert_wricef_templates.py`) — this
agent is the first real consumer of those templates' `wricef_id`/`decision_log_row_id`/`status`
header fields.
