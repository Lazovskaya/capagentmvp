# Tests

A `pytest` suite (1500+ parametrized cases) that checks this repo's structural conventions and
its own `tools/` scripts — not a test suite for a running application (there isn't one; see the
repo's own `CLAUDE.md`). Run the whole suite from the repo root:

```bash
python3 -m pytest -q
```

Run one file the same way, e.g. `python3 -m pytest -q tests/test_factory_integrity.py`.

## What each file checks

- **`test_factory_integrity.py`** — every reference in `factory-data.json` resolves to a real file
  on disk (forward refs), and every component file on disk is referenced somewhere in
  `factory-data.json` (reverse refs, catches orphans). Overlaps in intent with
  `validators/validate_factory.py` (a standalone CLI script doing a similar referential check plus
  connector-JSON/generated-file drift checks) — the two aren't merged; `tests/` is the
  finer-grained, CI-friendly (one named failure per broken item) version, `validators/` is the
  broader one-shot repo health check. Prefer running both if you're unsure which catches what.
- **`test_activity_completeness.py`** — semantic quality of each `activities[]` entry (valid
  owner/status/engagement-code), complementing the referential checks above.
- **`test_gate_sequence.py`** — SAP Activate's phase order (Discover→Prepare→Explore→Realize→
  Deploy→Run) is respected: gate arrow notation, no forward/backward gate jumps, every phase has
  at least one activity carrying its exit gate.
- **`test_artifact_schema.py`** — every `artifacts/<name>/` has a valid `schema.json` (required
  fields all defined in `properties`) and a `template.md` that actually mentions every top-level
  required field.
- **`test_skill_conventions.py`** — own-posture `skills/*/SKILL.md` follow
  `docs/skill-design-conventions.md` (stable IDs, status-enum reopen paths, valid knowledge-bucket
  references, etc.) — mechanical presence checks, not a prose-quality judgment.
- **`test_generate_factory_data.py`**, **`test_apply_use_case_tags.py`**,
  **`test_lint_dependencies.py`**, **`test_adapter_common.py`**, **`test_pilot_context.py`**,
  **`test_package_client_artifacts.py`** — unit tests for the matching script under `tools/`.
- **`test_simplification_items_to_processes.py`** — end-to-end dry-run of
  `tools/simplification_items_to_processes.py` against a synthetic SAP Transition Database export
  (`fixtures/simplification_catalog/`), validating its output against
  `artifacts/business-process-impact-list/schema.json`.

## `fixtures/`

Synthetic input files real enough to exercise a script's actual parsing logic without a real
client export: `simplification_catalog/` (header.xml, sdb_transition_db_item.xml, sdb_check_new.xml,
sdb_target_release.xml) plus `simplification_catalog_taxonomy.json`, shaped like SAP's real
Transition Database catalog export for `test_simplification_items_to_processes.py`.

## When to add here vs. `validators/`

`validators/validate_factory.py` is meant as the single pre-push/CI gate a human or pipeline runs
once. A new **structural convention** that should hold for every skill/artifact/activity going
forward (the kind `test_skill_conventions.py` or `test_artifact_schema.py` already enforce) belongs
here as a new parametrized test, not as an ad hoc script — it gets a named failure per offending
component for free. A new **tool script** under `tools/` should get its own `test_<name>.py` here,
mirroring the existing ones.
