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

## Returns

- `class`: bug | spec-flaw | non-defect
- `confidence`: low | medium | high
- `route`: owning role/stream
- `recommended_fix`: a fix direction, never invented code for `custom`-layer items, those get
  scoped for a developer instead
- `evidence`: what was checked to reach the verdict

## Human-in-the-loop

The classification is commercial (bug fixed under the delivery fee vs. spec flaw is a change
request), so a named human always confirms before the verdict is final. The `triage-verdict`
artifact records who.

## Status

In progress. Logic adapted from real, tested sap-ai-cons skills, which are now themselves real
ported skills in this factory too; this agent itself is not yet wired as a standalone bounded
agent.
