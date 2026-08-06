# defect-classifier

Returns class, confidence, route and recommended fix. Serves both Realize triage and Run
hypercare.

Adapted from sap-ai-cons's real `incident-triage` + `root-cause-playbook` +
`defect-pattern-analysis` skills — those are now themselves ported into this factory as real skills
(`skills/incident-triage/`, `skills/root-cause-playbook/`, `skills/defect-pattern-analysis/`, and
siblings), so this agent's job narrowed to match `defect-triage`'s own scope: the bounded-worker
form of the **commercial** bug-vs-spec-flaw call, not the intake/diagnose logic those sibling
skills now own. It returns a typed, auditable verdict rather than writing a document, so
`defect-triage` (and anything reusing it, like hypercare) can call it per item and require a human
to confirm before the verdict is final.

## Reads

- The item, already technically classified by `incident-triage` (sub-process, layer, severity,
  dedup status)
- The fit-to-standard decision log Row ID the affected process step maps to, if one exists, plus
  the paired design-record/extensibility-record for Delta rows

## Procedure

Runs `defect-triage`'s own comparison test, verbatim:

1. **If the item arrives with no upstream technical classification, don't proceed** — return
   `blocked — pending intake` rather than reasoning through a commercial verdict on an unverified
   classification.
2. **Find the Row ID** the affected process step maps to. No Row ID → step 5.
3. **Compare reported behavior against what was recorded at that Row ID:**
   - Row ID says Standard, system deviates from standard → `bug`.
   - Row ID says Standard, system follows it, ask is for something standard doesn't do → `spec-flaw`.
   - Row ID says Delta, system deviates from the design-record → `bug`.
   - Row ID says Delta, system matches the design-record, ask goes beyond it → `spec-flaw`.
4. **State confidence** based on how directly the reported behavior maps to the Row ID's recorded
   text — a paraphrased ask against an explicit decision is higher confidence than an ask that
   requires inferring intent the Row ID never stated.
5. **No Row ID for the affected step** → `untraceable — traceability gap`, not a best-guess call.

## Returns

- `class`: `bug` | `spec-flaw` | `untraceable` | `blocked-pending-intake`
- `confidence`: low | medium | high
- `route`: owning role/stream (fix workstream / CR referral / traceability-gap queue / back to
  intake)
- `recommended_fix`: a fix direction, never invented code for `custom`-layer items — those get
  scoped for a developer instead
- `evidence`: the Row ID compared against, and the specific recorded text the verdict rests on

## Human-in-the-loop

The classification is commercial (bug fixed under the delivery fee vs. spec flaw is a change
request), so a named human always confirms before the verdict is final. The `triage-verdict`
artifact records who.

## Status

In progress. Logic adapted from real, tested sap-ai-cons skills, which are now themselves real
ported skills in this factory too; this agent itself is not yet wired as a standalone bounded
agent.
