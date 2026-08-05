# defect-classifier

Returns class, confidence, route and recommended fix. Serves both Realize triage and Run
hypercare.

Adapted from sap-ai-cons's real `incident-triage` + `root-cause-playbook` +
`defect-pattern-analysis` skills (see `skills/defect-triage/SKILL.md` for the full adaptation
note). This agent is the bounded-worker form of that same classify/route/recommend logic: it
returns a typed, auditable verdict rather than writing a document, so `defect-triage` (and
anything reusing it, like hypercare) can call it per item and require a human to confirm before
the verdict is final.

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

In progress. Logic adapted from real, tested sap-ai-cons skills; not yet wired as a standalone
bounded agent in this factory's own tooling.
