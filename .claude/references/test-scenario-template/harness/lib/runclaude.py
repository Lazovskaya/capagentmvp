"""Invoke the nested `claude -p` process (headless) and capture its transcript."""
import shutil
import subprocess


def resolve_claude_bin():
    exe = shutil.which("claude")
    if exe:
        return exe
    # Windows fallback: the native installer's location.
    import pathlib
    cand = pathlib.Path.home() / ".local" / "bin" / "claude.exe"
    if cand.exists():
        return str(cand)
    raise FileNotFoundError("could not locate the `claude` executable on PATH")


def run(prompt, work, cfg_env, transcript_path, allowed_tools=None,
        permission_mode="acceptEdits", disallowed_tools=None, timeout=900,
        model=None):
    """Run claude -p in `work`, streaming JSON to `transcript_path`.

    `model` -- optional model id/alias forwarded as `--model`; omitted, the
    process uses whatever the account/managed settings default to.

    Returns dict: {returncode, stderr, timed_out}.
    """
    claude = resolve_claude_bin()
    cmd = [
        claude, "-p", prompt,
        "--output-format", "stream-json", "--verbose",
        "--permission-mode", permission_mode,
        "--setting-sources", "user",
    ]
    if allowed_tools:
        cmd += ["--allowedTools", allowed_tools]
    if disallowed_tools:
        cmd += ["--disallowedTools", disallowed_tools]
    if model:
        cmd += ["--model", model]

    timed_out = False
    stderr = ""
    with open(transcript_path, "w", encoding="utf-8") as out:
        try:
            proc = subprocess.run(
                cmd, cwd=str(work), env=cfg_env,
                stdout=out, stderr=subprocess.PIPE, text=True, timeout=timeout,
            )
            rc = proc.returncode
            stderr = proc.stderr or ""
        except subprocess.TimeoutExpired as exc:
            timed_out = True
            rc = -1
            stderr = f"timeout after {timeout}s: {exc}"
    return {"returncode": rc, "stderr": stderr, "timed_out": timed_out}
