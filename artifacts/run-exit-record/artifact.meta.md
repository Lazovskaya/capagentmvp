---
artifact: run-exit-record
namespace: "@epam/sap"

category: "SAP Activate / Run"        # primary phase; also referenced by Deploy's production-conversion activity — see Notes
sdlc-stage: in-progress

distribution-class: client-shippable

source: internal
source-repo: [TBD]

q-gate: [run-exit]
---

## Notes
The whole mechanism, not just the evidence — SAP doesn't define this gate,
so nothing outside this record backs up the claim that a Run period closed
cleanly. **Its own `template.md` header names the producer as `run-exit`
(the gate itself), not a skill** — unlike every other artifact in this
factory. This is a deliberate exception matching `run-exit`'s own `gate.md`
framing ("this gate owns both the mechanism and the evidence, not just the
evidence"): the record is **compiled at closure by the gate**, not authored
end-to-end by any one skill.

Two skills nonetheless declare `produces` toward it —
`fix-doc-and-regression` ("closes the loop toward the hypercare run-exit
disposition") and `production-conversion` ("feeds the eventual run-exit
disposition"). Both are mirrored below so the graph stays symmetric, but
read them as *contributes a section to*, not *authors*: neither owns the
record, and the gate is what assembles and closes it. See
`gates/run-exit/gate.meta.md` for the gate-side view.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| skill | fix-doc-and-regression | produced-by | TMP — contributes toward the closing disposition, does not author the record; mirrors this skill's own `produces` row |
| skill | production-conversion | produced-by | TMP — contributes toward the closing disposition, does not author the record; mirrors this skill's own `produces` row |
| artifact | triage-verdict | consumes | every open item from `defect-triage`'s log for the closing period, sorted into one of four dispositions |
| skill | knowledge-harvest | related | a closing harvest cycle must have run (not `Skipped`) before this record can be considered complete |
| q-gate | run-exit | gates-at | this record is both the mechanism and the evidence for this gate |
