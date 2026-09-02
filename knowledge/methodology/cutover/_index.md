# Cutover methodology — index

Curated from three SAP Activate accelerator source files in `workspace/cutover/` (gitignored;
`.pptx`/`.xlsx`, not committed):

| File | Source | What it covers |
|---|---|---|
| [cutover-strategy-framework.md](cutover-strategy-framework.md) | `FP_45 Cutover Strategy.pptx` | The strategy-level decisions a Cutover strategy document must make: timing/sequencing, org & responsibilities, schedule discipline, communications, contingency, hypercare handoff. |
| [remote-cutover-playbook.md](remote-cutover-playbook.md) | `S4H_747 How to Approach Remote Cutover.pptx` | Readiness-assessment dimensions and execution proven-practices specific to a cutover run (partly or fully) without on-site presence. |
| [cutover-checklist-template.md](cutover-checklist-template.md) | `S4H_403 Cutover Template.xlsx` | The actual task-checklist shape (columns + a representative task tree) a real cutover schedule is built from. |

## Who consumes this

- `agents/strategies-generation` — grounds its Cutover-area decisions in `cutover-strategy-framework.md`'s decision points rather than inventing them; consults `remote-cutover-playbook.md` when the engagement's delivery model is remote/hybrid.
- The cutover dependency-check agent (`EPMCSAPAI-265`) — checks a project's actual cutover plan against `cutover-checklist-template.md`'s task tree and dependency shape for missing/out-of-order prerequisites.

## Status

Progress. Curated from real SAP Activate accelerator content 2026-09-02. Not yet a full
verbatim port — condensed to the decision points and checklist shape actually needed by the
two agents above, not the full slide deck.
