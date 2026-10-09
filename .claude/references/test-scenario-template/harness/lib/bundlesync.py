"""
Detect whether the component copied into the scenario's `bundle/` has drifted
from its original source folder, and refresh it on request.

Used by the run step: if the original artifact changed after it was copied into
the scenario, the user is asked whether to update the copy or keep the tested one.
"""
import pathlib
import shutil


def _index(root):
    """Map of relative-path -> file, skipping __pycache__ and .gitignore noise."""
    root = pathlib.Path(root)
    out = {}
    if not root.exists():
        return out
    for p in root.rglob("*"):
        if p.is_file() and "__pycache__" not in p.parts:
            out[p.relative_to(root).as_posix()] = p
    return out


def diff(source, dest):
    """Return a list of human-readable differences between source and dest dirs."""
    src = _index(source)
    dst = _index(dest)
    diffs = []
    for rel, sp in src.items():
        if rel not in dst:
            diffs.append(f"missing in bundle: {rel}")
        elif sp.read_bytes() != dst[rel].read_bytes():
            diffs.append(f"changed: {rel}")
    for rel in dst:
        if rel not in src:
            diffs.append(f"extra in bundle: {rel}")
    return diffs


def is_stale(source, dest):
    """True if the bundle copy differs from the original source folder."""
    source = pathlib.Path(source)
    if not source.exists():
        return False  # no source to compare against -> nothing to warn about
    return bool(diff(source, dest))


def refresh(source, dest):
    """Replace the bundle copy with a fresh copy of the source."""
    dest = pathlib.Path(dest)
    if dest.exists():
        shutil.rmtree(dest)
    shutil.copytree(source, dest, ignore=shutil.ignore_patterns("__pycache__"))
