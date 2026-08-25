#!/usr/bin/env python3
"""Download BPMN 2.0 diagrams from SAP Signavio and parse them into structured process flow.

Adds a `bpmn_flow` block to each scope-item JSON alongside the existing `hierarchy` data:

  bpmn_flow.steps        — tasks/callActivities in topological execution order, with role
                           (from swimlane) and optional flag (from "(Optional)" in name)
  bpmn_flow.gateways     — parallel/exclusive/inclusive gateways with their seq position
  bpmn_flow.dependencies — other scope items called as subprocesses (callActivity)

This is the data that agents like test-case-design and solution-design need for sequenced
reasoning — the existing L4_steps from the Fiori App Library export is an unordered bag of
apps/roles/components from a different source and is left untouched.

Usage — single scope item:
    python3 tools/fetch_bpmn_signavio.py \\
        --env-file ~/.config/signavio/sessions/default.env \\
        --scope-item BD9

Usage — all scope items that already have signavio_model_id in their JSON:
    python3 tools/fetch_bpmn_signavio.py \\
        --env-file ~/.config/signavio/sessions/default.env \\
        --all

Usage — all scope items, navigate folder tree for any that lack a model_id:
    python3 tools/fetch_bpmn_signavio.py \\
        --env-file ~/.config/signavio/sessions/default.env \\
        --all --navigate

Dry-run (parse but don't write JSON):
    python3 tools/fetch_bpmn_signavio.py --env-file ... --scope-item BD9 --dry-run
"""

import argparse
import http.cookiejar
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import date
from pathlib import Path

DEFAULT_SCOPE_ITEMS_DIR = (
    Path(__file__).resolve().parent.parent
    / "knowledge"
    / "domain-packs"
    / "sap-best-practices"
    / "scope-items"
)

REFERENCE_PATH = [
    "Shared documents",
    "Copy from SAP Signavio Process Explorer",
    "SAP Product Portfolio",
    "SAP S/4HANA",
    "Solution Process",
]

SCOPE_ITEM_NAME_RE = re.compile(r"^(?P<title>.+)\s\((?P<code>[A-Z0-9]{2,6})\)$")

# Extract a scope item code from a callActivity name.
# Two patterns cover the SAP naming conventions observed in the wild:
#   "(BD6)"  — code in parens after a process name
#   "BD6 - " or "1JW - " — code at the start before a dash
_CODE_IN_PARENS = re.compile(r"\(([A-Z0-9]{2,6})\)")
_CODE_AT_START = re.compile(r"^([A-Z0-9]{2,6})\s*[-\u2013]")

BPMN_NS = "http://www.omg.org/spec/BPMN/20100524/MODEL"
NS = {"bpmn": BPMN_NS}

TASK_TAGS = {
    "userTask", "serviceTask", "scriptTask", "manualTask",
    "businessRuleTask", "sendTask", "receiveTask",
}
# Both callActivity and subProcess represent calls to external scope items in SAP's BPMNs.
# Older/manual diagrams use callActivity; newer auto-generated ones use subProcess.
SUBPROCESS_TAGS = {"callActivity", "subProcess"}
GATEWAY_TAGS = {
    "parallelGateway", "exclusiveGateway", "inclusiveGateway", "eventBasedGateway",
}
EVENT_TAGS = {"startEvent", "endEvent", "intermediateCatchEvent", "intermediateThrowEvent"}

REQUEST_TIMEOUT = 30
RETRY_COUNT = 3
RETRY_BACKOFF = 2


def load_env(path):
    env = {}
    for line in Path(path).read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        env[k.strip()] = v.strip()
    return env


# ---------------------------------------------------------------------------
# Signavio HTTP client (stdlib only, same pattern as enrich script)
# ---------------------------------------------------------------------------

class SignavioClient:
    def __init__(self, host, tenant, user, password):
        self.host = host.rstrip("/")
        self.cookiejar = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(
            urllib.request.HTTPCookieProcessor(self.cookiejar)
        )
        self.token = self._login(tenant, user, password)

    def _login(self, tenant, user, password):
        data = urllib.parse.urlencode(
            {"tokenonly": "true", "name": user, "password": password, "tenant": tenant}
        ).encode()
        req = urllib.request.Request(f"{self.host}/p/login", data=data, method="POST")
        with self.opener.open(req, timeout=REQUEST_TIMEOUT) as r:
            token = r.read().decode("utf-8").strip()
        if not token or "<html" in token.lower():
            raise RuntimeError("Login failed — check SIGNAVIO_USER/PASSWORD/TENANT_ID")
        return token

    def get_json(self, path):
        url = f"{self.host}/p{path}"
        last_error = None
        for attempt in range(1, RETRY_COUNT + 1):
            try:
                req = urllib.request.Request(
                    url, headers={"x-signavio-id": self.token, "Accept": "application/json"}
                )
                with self.opener.open(req, timeout=REQUEST_TIMEOUT) as r:
                    body = r.read().decode("utf-8")
                return json.loads(body) if body.strip() else None
            except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError) as e:
                last_error = e
                if attempt < RETRY_COUNT:
                    time.sleep(RETRY_BACKOFF * attempt)
        raise RuntimeError(f"GET {path} failed after {RETRY_COUNT} attempts: {last_error}")

    def get_bytes(self, path):
        """GET with no Accept override, return raw bytes (for BPMN XML download)."""
        url = f"{self.host}/p{path}"
        last_error = None
        for attempt in range(1, RETRY_COUNT + 1):
            try:
                req = urllib.request.Request(
                    url, headers={"x-signavio-id": self.token}
                )
                with self.opener.open(req, timeout=REQUEST_TIMEOUT) as r:
                    return r.read()
            except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as e:
                last_error = e
                if attempt < RETRY_COUNT:
                    time.sleep(RETRY_BACKOFF * attempt)
        raise RuntimeError(f"GET {path} (bytes) failed after {RETRY_COUNT} attempts: {last_error}")


# ---------------------------------------------------------------------------
# Folder navigation (reused from enrich script)
# ---------------------------------------------------------------------------

def _find_child_dir(client, dir_id, name):
    entries = client.get_json(f"/directory/{dir_id}") or []
    match = next((e for e in entries if e["rel"] == "dir" and e["rep"]["name"] == name), None)
    if match is None:
        available = sorted(e["rep"]["name"] for e in entries if e["rel"] == "dir")
        raise RuntimeError(f"folder '{name}' not found under {dir_id}. Available: {available[:10]}")
    return match["href"].split("/directory/")[1]


def _resolve_solution_process_dir(client):
    root = client.get_json("/directory") or []
    root_entry = next((e for e in root if e["rep"].get("name") == REFERENCE_PATH[0]), None)
    if root_entry is None:
        raise RuntimeError(f"Root folder '{REFERENCE_PATH[0]}' not found")
    dir_id = root_entry["href"].split("/directory/")[1]
    for name in REFERENCE_PATH[1:]:
        dir_id = _find_child_dir(client, dir_id, name)
    return dir_id


_VARIANT_NUM_RE = re.compile(r"^[A-Z0-9]+ - (\d+) -")
_COUNTRY_SUFFIX_RE = re.compile(r"\(S/4HANA[^)]*\)\s*$")


def _pick_main_model(models, code):
    """From a list of model entries in a scope item folder, prefer the base variant.

    SAP names models as "{CODE} - 01 - {title}" (main) and "{CODE} - 02 - {title} (EDI)"
    etc. We want the lowest-numbered variant whose name has no country/deployment suffix.
    Falls back to lowest-numbered, then first in list.
    """
    def sort_key(e):
        name = e["rep"]["name"]
        has_suffix = bool(_COUNTRY_SUFFIX_RE.search(name))
        m = _VARIANT_NUM_RE.match(name)
        num = int(m.group(1)) if m else 999
        return (has_suffix, num)

    return sorted(models, key=sort_key)[0]


def _find_model_id_for_code(client, solution_dir_id, code):
    """Return model_id for a scope item code by walking its folder in Signavio."""
    entries = client.get_json(f"/directory/{solution_dir_id}") or []
    folder = next(
        (e for e in entries if e["rel"] == "dir" and f"({code})" in e["rep"]["name"]),
        None,
    )
    if folder is None:
        raise RuntimeError(f"Scope item folder for '{code}' not found")
    folder_id = folder["href"].split("/directory/")[1]
    items = client.get_json(f"/directory/{folder_id}") or []
    models = [e for e in items if e["rel"] == "mod"]
    if not models:
        raise RuntimeError(f"No models in folder for '{code}'")
    best = _pick_main_model(models, code)
    return best["href"].split("/model/")[1]


# ---------------------------------------------------------------------------
# BPMN download
# ---------------------------------------------------------------------------

def download_bpmn(client, model_id):
    """Download BPMN 2.0 XML for a model. Returns raw bytes."""
    data = client.get_bytes(f"/model/{model_id}/bpmn2_0_xml")
    if not data or b"<definitions" not in data[:500]:
        raise RuntimeError(f"Response for model {model_id} is not valid BPMN 2.0 XML")
    return data


# ---------------------------------------------------------------------------
# BPMN parser
# ---------------------------------------------------------------------------

def _extract_scope_item_code(name):
    """Return the scope item code embedded in a callActivity name, or None."""
    # Try "(BD6)" / "(1JW)" in the name — SAP uses this for optional sub-scope-items
    for m in _CODE_IN_PARENS.finditer(name):
        candidate = m.group(1)
        # Skip "(Optional)" and similar noise words
        if candidate.upper() != candidate or len(candidate) < 2:
            continue
        return candidate
    # Try "BD6 - " or "1JW – " at the very start
    m = _CODE_AT_START.match(name.strip())
    if m:
        return m.group(1)
    return None


def parse_bpmn(xml_bytes):
    """Parse BPMN 2.0 XML and return a structured process flow dict.

    Returns:
        {
          "steps": [{"seq": int, "name": str, "type": str, "role": str|None,
                     "optional": bool, "calls_scope_item": str|None}, ...],
          "gateways": [{"seq_position": int, "type": str, "direction": str|None}, ...],
          "dependencies": [{"scope_item_id": str, "name": str, "optional": bool}, ...]
        }
    """
    root = ET.fromstring(xml_bytes)
    process = root.find("bpmn:process", NS)
    if process is None:
        # Collaboration wrapper — find the process element one level down
        process = root.find(".//bpmn:process", NS)
    if process is None:
        raise ValueError("No <process> element found in BPMN")

    # 1. Lane → set of flowNodeRef IDs (for role assignment per node)
    node_to_lane = {}
    for lane in process.findall(".//bpmn:lane", NS):
        lane_name = lane.get("name", "").strip()
        for ref in lane.findall("bpmn:flowNodeRef", NS):
            if ref.text:
                node_to_lane[ref.text.strip()] = lane_name

    # 2. Collect all nodes indexed by id
    nodes = {}
    for tag in list(TASK_TAGS) + list(SUBPROCESS_TAGS) + list(GATEWAY_TAGS) + list(EVENT_TAGS):
        for el in process.findall(f"bpmn:{tag}", NS):
            nid = el.get("id")
            if not nid:
                continue
            name = (el.get("name") or "").strip()
            entry = {
                "id": nid,
                "name": name,
                "type": tag,
                "role": node_to_lane.get(nid),
                "optional": "(Optional)" in name or "(optional)" in name,
            }
            if tag in SUBPROCESS_TAGS:
                entry["calls_scope_item"] = _extract_scope_item_code(name)
            if tag in GATEWAY_TAGS:
                entry["direction"] = el.get("gatewayDirection")
            nodes[nid] = entry

    # 3. Sequence flows: source → [targets]
    successors = {}
    for sf in process.findall("bpmn:sequenceFlow", NS):
        src = sf.get("sourceRef")
        tgt = sf.get("targetRef")
        if src and tgt:
            successors.setdefault(src, []).append(tgt)

    # 4. Topological ordering via BFS from startEvent(s)
    starts = [n["id"] for n in nodes.values() if n["type"] == "startEvent"]
    if not starts:
        starts = list(nodes.keys())[:1]

    ordered_ids = []
    visited = set()
    queue = list(starts)
    while queue:
        nid = queue.pop(0)
        if nid in visited:
            continue
        visited.add(nid)
        if nid in nodes:
            ordered_ids.append(nid)
        for tgt in successors.get(nid, []):
            if tgt not in visited:
                queue.append(tgt)

    # 5. Build output lists
    steps = []
    gateways = []
    seen_deps = {}  # scope_item_id → index in dependencies list
    dependencies = []
    seq = 0

    for nid in ordered_ids:
        node = nodes[nid]
        ntype = node["type"]

        if ntype in EVENT_TAGS:
            continue

        if ntype in GATEWAY_TAGS:
            gateways.append({
                "seq_position": seq,
                "type": ntype,
                "direction": node.get("direction"),
            })
            continue

        seq += 1
        step = {
            "seq": seq,
            "name": node["name"],
            "type": ntype,
            "role": node["role"],
            "optional": node["optional"],
        }
        if ntype in SUBPROCESS_TAGS and node.get("calls_scope_item"):
            step["calls_scope_item"] = node["calls_scope_item"]
            code = node["calls_scope_item"]
            if code not in seen_deps:
                seen_deps[code] = len(dependencies)
                dependencies.append({
                    "scope_item_id": code,
                    "name": node["name"],
                    "optional": node["optional"],
                })
        steps.append(step)

    return {"steps": steps, "gateways": gateways, "dependencies": dependencies}


# ---------------------------------------------------------------------------
# JSON merge
# ---------------------------------------------------------------------------

def merge_bpmn_flow(scope_items_dir, code, model_id, flow, xml_bytes=None,
                    save_xml_dir=None, dry_run=False):
    path = scope_items_dir / f"{code}.json"
    if not path.exists():
        print(f"  [{code}] JSON file not found, skipping write", file=sys.stderr)
        return
    doc = json.loads(path.read_text(encoding="utf-8"))
    doc["signavio_model_id"] = model_id
    doc["bpmn_flow"] = {
        "source": "signavio",
        "model_id": model_id,
        "fetched": date.today().isoformat(),
        **flow,
    }
    summary = (f"{len(flow['steps'])} steps, {len(flow['gateways'])} gateways, "
               f"{len(flow['dependencies'])} call-activity deps")
    if dry_run:
        print(f"  [{code}] DRY RUN — {summary}")
        return
    path.write_text(json.dumps(doc, indent=2) + "\n", encoding="utf-8")
    if save_xml_dir is not None and xml_bytes:
        xml_path = save_xml_dir / f"{code}.bpmn"
        xml_path.write_bytes(xml_bytes)
        print(f"  [{code}] {summary}  →  {xml_path}")
    else:
        print(f"  [{code}] {summary}")


# ---------------------------------------------------------------------------
# XML-only mode: download + save .bpmn files, don't touch JSON
# ---------------------------------------------------------------------------

def run_xml_only(client, scope_items_dir, codes, save_xml_dir, navigate, skip_existing):
    solution_dir_id = None

    def get_solution_dir():
        nonlocal solution_dir_id
        if solution_dir_id is None:
            print("Resolving Signavio Solution Process directory...")
            solution_dir_id = _resolve_solution_process_dir(client)
        return solution_dir_id

    save_xml_dir.mkdir(parents=True, exist_ok=True)
    failures = []
    for code in codes:
        xml_path = save_xml_dir / f"{code}.bpmn"
        if skip_existing and xml_path.exists():
            continue

        model_id = None
        json_path = scope_items_dir / f"{code}.json"
        if json_path.exists():
            try:
                model_id = json.loads(json_path.read_text(encoding="utf-8")).get("signavio_model_id")
            except (json.JSONDecodeError, OSError):
                pass
        if not model_id:
            if not navigate:
                print(f"[{code}] no signavio_model_id, skipping (use --navigate)")
                failures.append(code)
                continue
            try:
                model_id = _find_model_id_for_code(client, get_solution_dir(), code)
            except RuntimeError as e:
                print(f"[{code}] navigation failed: {e}", file=sys.stderr)
                failures.append(code)
                continue

        try:
            xml_bytes = download_bpmn(client, model_id)
        except RuntimeError as e:
            print(f"[{code}] download failed: {e}", file=sys.stderr)
            failures.append(code)
            continue

        xml_path.write_bytes(xml_bytes)
        print(f"[{code}] saved {len(xml_bytes)//1024}KB → {xml_path.name}")

    print(f"\nDone: {len(codes) - len(failures)}/{len(codes)} XML files saved to {save_xml_dir}/")
    if failures:
        print(f"Failed/skipped: {', '.join(failures)}", file=sys.stderr)
    return 1 if failures else 0


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def run(client, scope_items_dir, codes, navigate, dry_run, save_xml_dir=None, skip_existing=False):
    solution_dir_id = None  # lazy-loaded only if needed

    def get_solution_dir():
        nonlocal solution_dir_id
        if solution_dir_id is None:
            print("Resolving Signavio Solution Process directory...")
            solution_dir_id = _resolve_solution_process_dir(client)
        return solution_dir_id

    failures = []
    for code in codes:
        print(f"[{code}]", end=" ", flush=True)
        path = scope_items_dir / f"{code}.json"

        # Resolve model_id: from JSON first (cheap), then folder navigation (expensive)
        model_id = None
        if path.exists():
            try:
                doc_existing = json.loads(path.read_text(encoding="utf-8"))
                if skip_existing and doc_existing.get("bpmn_flow"):
                    print(f"already has bpmn_flow, skipping")
                    continue
                model_id = doc_existing.get("signavio_model_id")
            except (json.JSONDecodeError, OSError):
                pass
        if not model_id:
            if not navigate:
                print(f"no signavio_model_id in JSON, skipping (use --navigate to resolve)")
                failures.append(code)
                continue
            try:
                model_id = _find_model_id_for_code(client, get_solution_dir(), code)
            except RuntimeError as e:
                print(f"navigation failed: {e}", file=sys.stderr)
                failures.append(code)
                continue

        print(f"model={model_id[:12]}...", end=" ", flush=True)

        try:
            xml_bytes = download_bpmn(client, model_id)
        except RuntimeError as e:
            print(f"download failed: {e}", file=sys.stderr)
            failures.append(code)
            continue

        try:
            flow = parse_bpmn(xml_bytes)
        except (ET.ParseError, ValueError) as e:
            print(f"parse failed: {e}", file=sys.stderr)
            failures.append(code)
            continue

        merge_bpmn_flow(scope_items_dir, code, model_id, flow,
                        xml_bytes=xml_bytes, save_xml_dir=save_xml_dir, dry_run=dry_run)

    print(f"\nDone: {len(codes) - len(failures)}/{len(codes)} scope items processed.")
    if failures:
        print(f"Failed/skipped: {', '.join(failures)}", file=sys.stderr)
    return 1 if failures else 0


def main():
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument(
        "--env-file", type=Path, required=True,
        help="Path to .env with SIGNAVIO_HOST/TENANT_ID/USER/PASSWORD",
    )
    parser.add_argument(
        "--scope-items-dir", type=Path, default=DEFAULT_SCOPE_ITEMS_DIR,
    )
    parser.add_argument(
        "--scope-item", action="append", dest="scope_items",
        help="Scope item code to process (repeatable). Mutually exclusive with --all.",
    )
    parser.add_argument(
        "--all", action="store_true",
        help="Process every JSON in --scope-items-dir that has a signavio_model_id.",
    )
    parser.add_argument(
        "--navigate", action="store_true",
        help="When model_id is missing from JSON, walk the Signavio folder tree to find it "
             "(adds ~5 API calls per scope item). Only useful with --all or when the "
             "enrichment script hasn't been run yet.",
    )
    parser.add_argument(
        "--save-xml", type=Path, default=None, metavar="DIR",
        help="Directory to save downloaded BPMN 2.0 XML files as {CODE}.bpmn "
             "(draw.io-compatible). Created if it does not exist.",
    )
    parser.add_argument(
        "--xml-only", action="store_true",
        help="Download and save BPMN XML files (--save-xml required) without touching JSON. "
             "Use this to get .bpmn files for scope items already processed in a prior run.",
    )
    parser.add_argument(
        "--skip-existing", action="store_true",
        help="Skip scope items whose JSON already has bpmn_flow (normal mode) or whose .bpmn "
             "file already exists (--xml-only mode). Safe for resuming interrupted runs.",
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Parse BPMN and print summary but do not write JSON files.",
    )
    args = parser.parse_args()

    if args.all and args.scope_items:
        parser.error("--all and --scope-item are mutually exclusive")
    if not args.all and not args.scope_items:
        parser.error("Specify --scope-item CODE (repeatable) or --all")

    env = load_env(args.env_file)
    missing = [k for k in ("SIGNAVIO_HOST", "SIGNAVIO_TENANT_ID", "SIGNAVIO_USER", "SIGNAVIO_PASSWORD") if k not in env]
    if missing:
        parser.error(f"{args.env_file} is missing: {', '.join(missing)}")

    client = SignavioClient(
        env["SIGNAVIO_HOST"], env["SIGNAVIO_TENANT_ID"],
        env["SIGNAVIO_USER"], env["SIGNAVIO_PASSWORD"],
    )

    save_xml_dir = None
    if args.save_xml:
        save_xml_dir = args.save_xml
        save_xml_dir.mkdir(parents=True, exist_ok=True)

    if args.all:
        codes = []
        for p in sorted(args.scope_items_dir.glob("*.json")):
            try:
                doc = json.loads(p.read_text(encoding="utf-8"))
            except (json.JSONDecodeError, OSError):
                continue
            if args.navigate or doc.get("signavio_model_id"):
                codes.append(doc.get("scope_item_id") or p.stem)
        print(f"Found {len(codes)} scope items to process.")
    else:
        codes = list(args.scope_items)

    if args.xml_only:
        if not save_xml_dir:
            parser.error("--xml-only requires --save-xml DIR")
        sys.exit(run_xml_only(client, args.scope_items_dir, codes, save_xml_dir,
                              args.navigate, args.skip_existing))

    sys.exit(run(client, args.scope_items_dir, codes, args.navigate, args.dry_run,
                 save_xml_dir=save_xml_dir, skip_existing=args.skip_existing))


if __name__ == "__main__":
    main()
