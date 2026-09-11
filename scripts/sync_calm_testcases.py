#!/usr/bin/env python3
"""Push test scripts from a test-case-design run folder to SAP Cloud ALM Test Management.

Script pattern — direct OAuth2 calls, no MCP layer.
Reads every TS-*.md file in <run-folder>/scripts/ (or --scripts-subdir),
parses the markdown tables into CALM_TM payloads, and creates:
  1. POST /ManualTestCases           — the test case record
  2. POST /Activities                — one Activity per test case (step container)
  3. POST /Actions (N times)         — one Action per script table row

On success writes sync-receipt.json into <run-folder> — the same file
test-case-design's step 12 expects.

Dry run by default.  Pass --apply to actually write to Cloud ALM.

Usage:
    python3 tools/sync_calm_testcases.py \\
        --run-folder workspace/test-case-design/2026-09-01-credit-mgmt \\
        --project-id  <calm-project-uuid> \\
        --scope-id    <calm-scope-uuid> \\
        --env-file    ~/.config/cloud-alm/sessions/default.env \\
        [--priority-code 30] \\
        [--apply]

Finding --project-id and --scope-id:
    project-id : Cloud ALM project UUID — from the project URL
                 (https://<tenant>/shell/projects/<uuid>/...)
                 or via GET /api/calm-projects/v1/projects
    scope-id   : solution scope UUID for the project — from any existing
                 test case in that project:
                 GET /api/calm-testmanagement/v1/ManualTestCases?$filter=projectId eq <uuid>
                 and read the "scopeId" field.

Credentials (env-file keys — same format as .env.example):
    CLOUD_ALM_TOKEN_URL     — OAuth2 token endpoint
    CLOUD_ALM_CLIENT_ID     — client id from BTP service key
    CLOUD_ALM_CLIENT_SECRET — client secret
    CLOUD_ALM_API_URL       — https://<tenant>.<region>.alm.cloud.sap

Alternatively: pass --config /path/to/config.json to read directly from
the sap-cloud-alm-odata-mcp config.json format
(fields: tenant, region, auth_region, client_id, client_secret).

Exit codes: 0 = ok (or dry-run ok), 1 = auth/parse error, 2 = partial push failure.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path


# ---------------------------------------------------------------------------
# Credential loading
# ---------------------------------------------------------------------------

def load_env_file(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        key, _, value = line.partition("=")
        env[key.strip()] = value.strip()
    return env


def load_config_json(path: Path) -> dict[str, str]:
    """Load credentials from sap-cloud-alm-odata-mcp config.json format."""
    cfg = json.loads(path.read_text(encoding="utf-8"))
    tenant      = cfg["tenant"]
    region      = cfg["region"]
    auth_region = cfg.get("auth_region", cfg["region"].split("-")[0])  # eu10-004 → eu10
    return {
        "CLOUD_ALM_TOKEN_URL":     f"https://{tenant}.authentication.{auth_region}.hana.ondemand.com/oauth/token",
        "CLOUD_ALM_CLIENT_ID":     cfg["client_id"],
        "CLOUD_ALM_CLIENT_SECRET": cfg["client_secret"],
        "CLOUD_ALM_API_URL":       f"https://{tenant}.{region}.alm.cloud.sap",
    }


def get_token(token_url: str, client_id: str, client_secret: str) -> str:
    import urllib.parse
    import urllib.request

    payload = urllib.parse.urlencode({
        "grant_type": "client_credentials",
        "client_id": client_id,
        "client_secret": client_secret,
    }).encode()
    req = urllib.request.Request(
        token_url,
        data=payload,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:  # noqa: S310
        body = json.loads(resp.read())
    token = body.get("access_token")
    if not token:
        raise RuntimeError(f"Token response has no access_token: {body}")
    return token


# ---------------------------------------------------------------------------
# Markdown parsing
# ---------------------------------------------------------------------------

def _table_rows(text: str, start_marker: str) -> list[list[str]]:
    idx = text.find(start_marker)
    if idx == -1:
        return []
    block = text[idx:]
    rows: list[list[str]] = []
    in_table = False
    for line in block.splitlines():
        stripped = line.strip()
        if not stripped.startswith("|"):
            if in_table:
                break
            continue
        cells = [c.strip() for c in stripped.strip("|").split("|")]
        if all(re.fullmatch(r"[-: ]+", c) for c in cells):
            in_table = True
            continue
        if in_table or not rows:
            in_table = True
            rows.append(cells)
    return rows


def _header_field(text: str, field: str) -> str:
    pattern = re.compile(
        r"\|\s*" + re.escape(field) + r"\s*\|\s*(`[^`]+`|[^|\n]+)\s*\|",
        re.IGNORECASE,
    )
    m = pattern.search(text)
    return m.group(1).strip().strip("`") if m else ""


def parse_test_script(path: Path) -> dict:
    """Parse a TS-*.md file into a dict suitable for the CALM_TM 3-call push."""
    text = path.read_text(encoding="utf-8")

    test_case_id  = (_header_field(text, "Test case ID") or path.stem).strip("`")
    scenario_name = _header_field(text, "Scenario name")
    traceability  = _header_field(text, "Traceability")
    technique     = _header_field(text, "Technique(s) used")
    depth         = _header_field(text, "Depth")
    executor_role = _header_field(text, "Executor role")
    prereq        = _header_field(text, "Prerequisite data")

    desc_parts = []
    if traceability:
        desc_parts.append(f"Traceability: {traceability}")
    if technique:
        desc_parts.append(f"Technique: {technique}")
    if depth:
        desc_parts.append(f"Depth: {depth}")
    if executor_role:
        desc_parts.append(f"Executor role: {executor_role}")
    if prereq:
        desc_parts.append(f"Prerequisite data: {prereq}")

    # ## Script table: Step | Action (tcode/app) | Expected result | Actual result | Status
    script_rows = _table_rows(text, "## Script")
    steps: list[dict] = []
    for i, row in enumerate(script_rows):
        if not row:
            continue
        action   = row[1] if len(row) > 1 else ""
        expected = row[2] if len(row) > 2 else ""
        if not action:
            continue
        steps.append({
            "title":          f"Step {i + 1}",
            "description":    action,
            "expectedResult": expected,
            "sequence":       i + 1,
        })

    return {
        "_source_file":  str(path),
        "externalId":    test_case_id,
        "title":         scenario_name or test_case_id,
        "description":   "\n".join(desc_parts),
        "steps":         steps,
    }


# ---------------------------------------------------------------------------
# CALM_TM API calls
# ---------------------------------------------------------------------------

def _post(base_url: str, path: str, token: str, payload: dict) -> dict:
    import urllib.request

    url  = base_url.rstrip("/") + "/api/calm-testmanagement/v1" + path
    data = json.dumps(payload).encode()
    req  = urllib.request.Request(
        url, data=data,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type":  "application/json",
            "Accept":        "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:  # noqa: S310
        return json.loads(resp.read())


def push_one_testcase(base_url: str, token: str, tc: dict,
                      project_id: str, scope_id: str, priority_code: int) -> dict:
    """Three-step push: ManualTestCase → Activity → N Actions. Returns receipt dict."""
    # 1 — create test case
    tc_resp = _post(base_url, "/ManualTestCases", token, {
        "title":        tc["title"],
        "projectId":    project_id,
        "scopeId":      scope_id,
        "priorityCode": priority_code,
    })
    tc_uuid = tc_resp.get("uuid") or tc_resp.get("id")
    if not tc_uuid:
        raise RuntimeError(f"create_testcase returned no uuid: {tc_resp}")

    result: dict = {
        "externalId":   tc["externalId"],
        "calmUuid":     tc_uuid,
        "displayId":    tc_resp.get("displayId"),
        "activityUuid": None,
        "actionUuids":  [],
    }

    # 2 — create activity (step group)
    if tc["steps"]:
        act_resp = _post(base_url, "/Activities", token, {
            "title":     "Test Steps",
            "parent_ID": tc_uuid,
            "sequence":  1,
        })
        act_uuid = act_resp.get("uuid")
        result["activityUuid"] = act_uuid

        # 3 — create actions
        for step in tc["steps"]:
            action_resp = _post(base_url, "/Actions", token, {
                "title":          step["title"],
                "parent_ID":      act_uuid,
                "description":    step["description"],
                "expectedResult": step["expectedResult"],
                "sequence":       step["sequence"],
            })
            result["actionUuids"].append(action_resp.get("uuid"))

    return result


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--run-folder",     required=True)
    p.add_argument("--project-id",     required=True,
                   help="Cloud ALM project UUID")
    p.add_argument("--scope-id",       required=True,
                   help="Solution scope UUID for the project (from any existing test case's scopeId)")
    p.add_argument("--priority-code",  type=int, default=30,
                   help="Priority code (default 30 = Low)")
    p.add_argument("--env-file",       default=None,
                   help="Credentials env-file (CLOUD_ALM_TOKEN_URL / CLIENT_ID / CLIENT_SECRET / API_URL)")
    p.add_argument("--config",         default=None,
                   help="sap-cloud-alm-odata-mcp config.json (alternative to --env-file)")
    p.add_argument("--apply",          action="store_true", default=False)
    p.add_argument("--scripts-subdir", default="scripts")
    return p.parse_args()


def main() -> int:
    args = parse_args()

    run_folder  = Path(args.run_folder)
    scripts_dir = run_folder / args.scripts_subdir

    if not scripts_dir.is_dir():
        print(f"ERROR: scripts directory not found: {scripts_dir}", file=sys.stderr)
        return 1

    script_files = sorted(scripts_dir.glob("TS-*.md"))
    if not script_files:
        print(f"ERROR: no TS-*.md files found in {scripts_dir}", file=sys.stderr)
        return 1

    # Resolve credentials
    creds: dict[str, str] | None = None
    if args.config:
        cfg_path = Path(args.config).expanduser()
        if not cfg_path.is_file():
            print(f"ERROR: config not found: {cfg_path}", file=sys.stderr)
            return 1
        creds = load_config_json(cfg_path)
    elif args.env_file:
        env_path = Path(args.env_file).expanduser()
        if not env_path.is_file():
            print(f"ERROR: env-file not found: {env_path}", file=sys.stderr)
            return 1
        creds = load_env_file(env_path)
    else:
        print("ERROR: provide --env-file or --config", file=sys.stderr)
        return 1

    required = ["CLOUD_ALM_TOKEN_URL", "CLOUD_ALM_CLIENT_ID", "CLOUD_ALM_CLIENT_SECRET", "CLOUD_ALM_API_URL"]
    missing  = [k for k in required if not creds.get(k)]
    if missing:
        print(f"ERROR: missing credentials: {', '.join(missing)}", file=sys.stderr)
        return 1

    # Parse scripts
    parsed: list[dict] = []
    for f in script_files:
        try:
            parsed.append(parse_test_script(f))
        except Exception as exc:
            print(f"Parse error {f.name}: {exc}", file=sys.stderr)
            return 1

    # Dry-run
    if not args.apply:
        print(f"DRY RUN — {len(parsed)} test case(s) → project {args.project_id} / scope {args.scope_id}")
        for tc in parsed:
            print(f"  {tc['externalId']:30s}  steps={len(tc['steps']):2d}  {tc['title'][:60]}")
        print("\nRe-run with --apply to push.")
        return 0

    # Auth
    print(f"Authenticating …", flush=True)
    try:
        token = get_token(creds["CLOUD_ALM_TOKEN_URL"], creds["CLOUD_ALM_CLIENT_ID"], creds["CLOUD_ALM_CLIENT_SECRET"])
    except Exception as exc:
        print(f"ERROR: auth failed — {exc}", file=sys.stderr)
        return 1

    base_url = creds["CLOUD_ALM_API_URL"]
    receipt: list[dict] = []
    failures = 0

    for tc in parsed:
        print(f"  {tc['externalId']} … ", end="", flush=True)
        try:
            r = push_one_testcase(base_url, token, tc, args.project_id, args.scope_id, args.priority_code)
            r["status"] = "pushed"
            receipt.append(r)
            print(f"OK  uuid={r['calmUuid']}  displayId={r['displayId']}  actions={len(r['actionUuids'])}")
        except Exception as exc:
            receipt.append({"externalId": tc["externalId"], "status": "failed", "error": str(exc)})
            print(f"FAILED — {exc}")
            failures += 1

    receipt_data = {
        "tool":          "sync_calm_testcases.py",
        "projectId":     args.project_id,
        "scopeId":       args.scope_id,
        "baseUrl":       base_url,
        "pushedAt":      datetime.now(timezone.utc).isoformat(),
        "totalScripts":  len(parsed),
        "pushed":        len(parsed) - failures,
        "failed":        failures,
        "items":         receipt,
    }
    receipt_path = run_folder / "sync-receipt.json"
    receipt_path.write_text(json.dumps(receipt_data, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nReceipt written: {receipt_path}")

    if failures:
        print(f"{failures} of {len(parsed)} failed.")
        return 2

    print(f"{len(parsed)} test case(s) pushed successfully.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
