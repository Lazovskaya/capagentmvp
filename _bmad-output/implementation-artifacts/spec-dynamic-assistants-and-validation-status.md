---
title: 'Generating assistant layers and validation status'
type: 'feature'
created: '2026-09-03T13:57:56+03:00'
status: 'done'
baseline_commit: '7759868a8706cfcb35d1aa779ba1079f3aa4ae41'
context:
  - /Users/Vitaly_Malyshev/Library/CloudStorage/OneDrive-EPAM/VScode/sap-ai-factory/CONTRIBUTING.md
  - /Users/Vitaly_Malyshev/Library/CloudStorage/OneDrive-EPAM/VScode/sap-ai-factory/tests/test_generate_factory_data.py
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `generate_factory_data.py` derives the component registry from repository metadata but omits the repository's four assistants. The component map therefore cannot show the Assistant → Agent/Skill routing layer. It also collapses the existing `sdlc-stage: in-test` evidence into `progress`, hiding the meaningful state between implementation and end-to-end readiness.

**Approach:** Derive Assistant components dynamically from `assistants/*/assistant.meta.md` and render them as a distinct component-map row. Preserve `in-test` as a first-class factory status, with its existing repository meaning: authored and tested/evaluated, but not yet accepted as `ready`.

## Boundaries & Constraints

**Always:** `factory-data.json` remains canonical; assistant entries and status values must be reproducible from repository files; generated `factory-data.js` and the inline HTML data must be regenerated through existing build tooling; existing filters, counts, activity status handling, posture semantics, and legacy components must continue to work.

**Ask First:** None. The repository already defines `in-test` in metadata and documents `ready` as end-to-end dry-run tested, so no new maturity concept is needed.

**Never:** Do not hand-maintain assistant entries in `factory-data.json`; do not infer assistant readiness from prose alone; do not rename existing statuses or alter unrelated component metadata; do not make assistants activity owners or connectors.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Assistant discovery | A valid `assistants/<name>/assistant.meta.md` and `assistant.md` exist | One `Assistant` component is generated with name, posture, status, `phase: all`, and description | Missing sidecar is not generated; existing legacy entries remain preserved |
| Tested component | Any component metadata has `sdlc-stage: in-test` | Generated status is `in-test`; map exposes and filters it independently | Unknown stages retain the existing `notstarted` fallback |
| Empty assistant set | No assistant metadata exists in a temporary repository | No assistant row tiles are produced, without affecting other rows | No crash or fabricated assistant |
| Generated output | Canonical JSON changes | `python3 build.py` synchronizes JS and inline HTML | Existing build error is surfaced |

</frozen-after-approval>

## Code Map

- `tools/generate_factory_data.py` -- discover assistant metadata, derive descriptions/phases, and preserve `in-test`.
- `factory-data.json` -- canonical status vocabulary and dynamically generated Assistant row/components.
- `index.html` -- map kind lookup and visual status styling/filter behavior.
- `tests/test_generate_factory_data.py` -- unit coverage for assistant discovery and status mapping.
- `tests/test_factory_integrity.py` -- component-to-disk integrity coverage for the new kind.
- `build.py` -- regenerate derived browser data.

## Tasks & Acceptance

**Execution:**
- [x] `tools/generate_factory_data.py` -- add Assistant discovery and explicit `in-test` mapping; derive a concise assistant description from repository content without changing existing fallback behavior.
- [x] `factory-data.json` and `index.html` -- add the Assistant row/status vocabulary and regenerate all derived data through `build.py`.
- [x] `tests/test_generate_factory_data.py` -- test assistant metadata discovery, description fallback, `all` phase, and distinct `in-test` status.
- [x] `tests/test_factory_integrity.py` -- validate Assistant component files and ensure no assistant directory is orphaned.

**Acceptance Criteria:**
- Given the repository's current `assistants/` directory, when generation runs, then all four assistants appear exactly once as `kind: "Assistant"` entries and are shown in a separate map layer.
- Given metadata with `sdlc-stage: in-test`, when generation runs, then the component status is `in-test` and the UI exposes a separate “In test” filter between “In progress” and “Ready”.
- Given an assistant with no explicit category, when generation runs, then its phase is `all` and its description is non-empty when `assistant.md` contains an introductory paragraph.
- Given the existing regression suite, when targeted and full tests run, then all previously passing behavior remains passing and generated files are synchronized.

## Design Notes

`in-test` is not equivalent to `ready`: `CONTRIBUTING.md` requires end-to-end dry-run evidence plus conventions and schema checks before `ready`. Assistants are cross-phase role entry points, so `phase: all` keeps them visible in a dedicated full-width row rather than incorrectly placing them in one Activate phase.

## Verification

**Commands:**
- `python3 tools/generate_factory_data.py --check` -- expected: generated components match canonical JSON.
- `python3 build.py` -- expected: `factory-data.js` and inline HTML data are regenerated successfully.
- `python3 -m pytest tests/test_generate_factory_data.py tests/test_factory_integrity.py tests/test_activity_completeness.py` -- expected: targeted tests pass.
- `python3 -m pytest tests/` -- expected: full regression suite passes.

## Suggested Review Order

**Generator and canonical model**

- Assistant discovery and status mapping define the reproducible source of truth.
  [`generate_factory_data.py:60`](../../tools/generate_factory_data.py#L60)

- Canonical rows and components show the new layer and intermediate status.
  [`factory-data.json:48`](../../factory-data.json#L48)

**Map rendering**

- Generated UI data exposes Assistant kind, row placement, and status filter.
  [`index.html:204`](../../index.html#L204)

- Kind routing and tile treatment keep assistants visually separate.
  [`index.html:2960`](../../index.html#L2960)

**Regression coverage**

- Synthetic metadata proves assistant description, phase, posture, and `in-test`.
  [`test_generate_factory_data.py:132`](../../tests/test_generate_factory_data.py#L132)

- Disk integrity checks enforce one component per assistant directory.
  [`test_factory_integrity.py:260`](../../tests/test_factory_integrity.py#L260)
