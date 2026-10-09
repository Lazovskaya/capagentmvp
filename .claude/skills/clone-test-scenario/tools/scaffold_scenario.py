#!/usr/bin/env python3
"""
Tool: scaffold-test-scenario

Mechanical part of cloning a test scenario: copy `test-scenario-template` into a
target workspace, rename the placeholder scenario folder, and (optionally) copy the
component under test into `bundle/`. It does NOT fill in scenario content -- that is
the reasoning part done by the clone-test-scenario skill.

Usage:
  python scaffold_scenario.py --template <template-dir> --target <workspace-dir> \
      --scenario-id <id> [--bundle-source <path-to-original-component>]

Deterministic, side-effect-only. Existing files in the target (e.g. a populated
"User input/") are preserved (merge copy).
"""
import argparse
import pathlib
import shutil

IGNORE = shutil.ignore_patterns("__pycache__", "*.pyc")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--template", required=True, help="path to test-scenario-template")
    ap.add_argument("--target", required=True, help="target workspace directory")
    ap.add_argument("--scenario-id", required=True, help="scenario id, e.g. invoice-validation-01")
    ap.add_argument("--bundle-source", default=None,
                    help="path to the ORIGINAL component; copied into <target>/bundle/")
    a = ap.parse_args()

    tpl = pathlib.Path(a.template).resolve()
    tgt = pathlib.Path(a.target).resolve()
    if not tpl.exists():
        raise SystemExit(f"template not found: {tpl}")
    tgt.mkdir(parents=True, exist_ok=True)

    # 1. Merge-copy the template into the target (keeps a populated "User input/").
    shutil.copytree(tpl, tgt, dirs_exist_ok=True, ignore=IGNORE)

    # 2. Rename the placeholder scenario folder to the real id.
    old = tgt / "test-scenarios" / "TS-example-01"
    new = tgt / "test-scenarios" / f"TS-{a.scenario_id}"
    if old.exists() and not new.exists():
        old.rename(new)

    # 3. Optionally replace the placeholder bundle with the real component.
    if a.bundle_source:
        src = pathlib.Path(a.bundle_source).resolve()
        if not src.exists():
            raise SystemExit(f"bundle-source not found: {src}")
        bdir = tgt / "bundle"
        if bdir.exists():
            shutil.rmtree(bdir)
        shutil.copytree(src, bdir, ignore=IGNORE)

    print(f"scaffolded 'TS-{a.scenario_id}' at {tgt}")
    print("  scenario dir:", new)
    print("  bundle:", "copied from " + str(a.bundle_source) if a.bundle_source
          else "placeholder (fill manually or re-run with --bundle-source)")
    print("Next: fill scenario.config.md, scenario.md, expected/, fixtures/ (clone skill step).")


if __name__ == "__main__":
    main()
