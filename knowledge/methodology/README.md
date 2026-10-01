# Knowledge: methodology

SAP Activate methodology content, shared reusable, split into two governed Knowledge Sources at
finer grain than this bucket itself. `methodology/` has no content of its own -- it is a pure
container.

## What lives here

- `activate-s4hc-pe/` (`knowledge_source: activate-roadmaps`) -- SAP Activate roadmap task lists
 per product/scenario, generated from SAP Roadmap Viewer XML exports. See its own `_index.md` for
 the roadmap-selection table and regeneration command.

- `cutover/` (`knowledge_source: cutover-methodology`) -- curated Cutover strategy decision
 framework, remote-cutover playbook, and checklist task shape. See its own `_index.md` for
 source provenance and consumers.

## Who reads these files

- `activate-roadmaps` -- roadmap-aware planning skills that need a product/scenario's real
 Activate task sequence.
- `cutover-methodology` -- `agents/strategies-generation` and the cutover dependency-check agent; see `cutover/_index.md`'s own "Who consumes this" section.

## What is NOT here

Engagement-specific cutover schedules, roadmap selections, or task-completion state -- those are
per-project records, not reusable methodology.

