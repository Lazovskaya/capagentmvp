"""
Build an isolated run environment: a fresh working directory + a throwaway
CLAUDE_CONFIG_DIR seeded with ONLY the credentials file.

This is the "lightweight" isolation from the design chapter (§2.6):
- CLAUDE_CONFIG_DIR points at a throwaway dir, so personal ~/.claude settings,
  memory, history, plugins and MCP config do NOT leak into the run.
- We copy only `.credentials.json` into it, so the nested `claude -p` is
  authenticated without dragging in anything else.
- The working directory contains only the bundle under test + the fixtures.
- Managed/enterprise settings (OS-level) still apply by design; true escape from
  those needs a container (see GUIDE.md).
"""
import os
import pathlib
import shutil


def real_config_dir():
    env = os.environ.get("CLAUDE_CONFIG_DIR")
    if env:
        return pathlib.Path(env)
    return pathlib.Path.home() / ".claude"


def credentials_path():
    return real_config_dir() / ".credentials.json"


def prepare(run_dir, bundle_dir, fixture_files, with_bundle=True):
    """Create <run_dir>/work and <run_dir>/cfg. Returns (work, cfg).

    fixture_files: list of (src_path, dest_name) tuples to copy into work.
    with_bundle: if False, the bundle (.claude/, tools/, CLAUDE.md) is NOT copied
                 -- the "without-bundle" baseline condition.
    """
    run_dir = pathlib.Path(run_dir)
    work = run_dir / "work"
    cfg = run_dir / "cfg"
    work.mkdir(parents=True, exist_ok=True)
    cfg.mkdir(parents=True, exist_ok=True)

    # Seed only credentials into the isolated config dir.
    creds = credentials_path()
    if not creds.exists():
        raise FileNotFoundError(
            f"credentials not found at {creds}. Run `claude` once to log in, "
            f"or set CLAUDE_CONFIG_DIR to a logged-in config dir."
        )
    shutil.copy2(creds, cfg / ".credentials.json")

    if with_bundle:
        bundle_dir = pathlib.Path(bundle_dir)
        # Runtime pieces only (governance sidecars under components/ are not shipped).
        for rel in [".claude", "tools", "CLAUDE.md"]:
            src = bundle_dir / rel
            if not src.exists():
                continue
            dst = work / rel
            if src.is_dir():
                shutil.copytree(src, dst, dirs_exist_ok=True)
            else:
                shutil.copy2(src, dst)

    for src, dest_name in fixture_files:
        shutil.copy2(src, work / dest_name)

    return work, cfg


def child_env(cfg):
    """Environment for the nested claude process: isolated config dir."""
    env = os.environ.copy()
    env["CLAUDE_CONFIG_DIR"] = str(pathlib.Path(cfg).resolve())
    # Do not let a parent Claude Code session's markers confuse the child.
    for noisy in ("CLAUDE_CODE_SSE_PORT", "CLAUDE_CODE_SESSION_ID"):
        env.pop(noisy, None)
    return env
