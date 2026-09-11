#!/usr/bin/env python3
"""Enrich the SAP Best Practices domain pack's scope-item cache with L2 process-group
data pulled live from a real SAP Signavio Process Manager tenant (Method 2 of the
EPMCSAPAI-197 taxonomy ingestion strategy, adjusted after two dead ends: the classic
Fiori Apps Library's public OData feed is retired, and SAP Cloud ALM's Process Authoring
API turned out to carry no L1/L2 hierarchy at all in the tenant this factory has access
to -- see knowledge/domain-packs/sap-best-practices/README.md for the full trail).

What this script actually does, confirmed empirically against a real tenant
(2026-08-24, no bulk-export API for any of this exists -- SAP's own docs describe only
per-diagram BPMN export in the UI):

1. Logs in via Signavio's `/p/login` endpoint (username/password + tenant ID -- there is
   no OAuth2/service-key flow for this API, unlike Cloud ALM).
2. Walks the tenant's read-only "Copy from SAP Signavio Process Explorer" folder tree down
   to "SAP Product Portfolio / SAP S/4HANA / Solution Process" -- a flat folder-per-scope-item
   registry (602 scope items observed), which is the actual authoritative, unmodified
   source; NOT the client-project folders that sit alongside it in the same workspace
   (Syngenta, ARBA, ACINO, etc. -- never touch those).
3. For each scope item's BPMN model, follows model -> revision -> `linkedBy` (Signavio's
   reverse-reference list of every OTHER diagram that calls this one as a subprocess) to
   find its L2 process group(s), e.g. BD9 (Sell from Stock) is called by "Order and
   Contract Management" diagrams across several country/deployment variants.
4. Merges `hierarchy.L2_core_process` into the existing per-scope-item JSON already
   produced by tools/ingest_sap_best_practices.py -- this is an enrichment pass, not a
   replacement; L4 steps/apps from the Fiori export are left untouched.

L1 (value stream) is deliberately NOT attempted here: linkedBy's one hop up lands on a
flat L2 registry folder, not a further nested value-stream diagram, so there is no third
hop to automate. L1 is a small, stable, publicly documented set of ~10 value streams per
line of business -- worth curating once by hand as a static L2 -> L1 lookup table, not
worth chasing through more API calls. Every generated file's `note` says so explicitly.

Confirmed on a 20-scope-item sample (2026-08-24) before being written up as this reusable
script; NOT yet run against the full 602-item registry -- do that deliberately, since it's
~2 API calls per scope item (roughly 1200+ requests) and this script has no built-in rate
limiting beyond simple per-request retries.
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
from pathlib import Path

DEFAULT_SCOPE_ITEMS_DIR = Path(__file__).resolve().parent.parent / "knowledge" / "domain-packs" / "sap-best-practices" / "scope-items"

# The read-only reference path inside the tenant this was built against. Folder IDs are
# tenant-specific, so this walks by NAME from the workspace root rather than hardcoding
# IDs -- portable to any tenant with the same standard SAP-seeded folder structure.
REFERENCE_PATH = ["Shared documents", "Copy from SAP Signavio Process Explorer", "SAP Product Portfolio", "SAP S/4HANA", "Solution Process"]

SCOPE_ITEM_NAME_RE = re.compile(r"^(?P<title>.+)\s\((?P<code>[A-Z0-9]{2,6})\)$")
VARIANT_SUFFIX_RE = re.compile(r"\s*\(S/4HANA[^)]*\)\s*$")

REQUEST_TIMEOUT = 30
RETRY_COUNT = 3
RETRY_BACKOFF_SECONDS = 2


def load_env_file(path):
    """Parses a `.env` file ourselves rather than shelling out to `source` -- Signavio
    passwords/tokens routinely contain `$`, `|`, `#` etc. that a shell would mangle (hit
    this exact bug earlier in this project with a Cloud ALM client_id containing '|')."""
    env = {}
    for line in Path(path).read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env[key.strip()] = value.strip()
    return env


class SignavioClient:
    """Minimal stdlib-only client for the parts of the Signavio Process Manager REST API
    this script needs. No `requests` dependency -- this repo's tools stay stdlib-only."""

    def __init__(self, host, tenant, user, password):
        self.host = host.rstrip("/")
        self.cookiejar = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.cookiejar))
        self.token = self._login(tenant, user, password)

    def _login(self, tenant, user, password):
        data = urllib.parse.urlencode({"tokenonly": "true", "name": user, "password": password, "tenant": tenant}).encode()
        request = urllib.request.Request(f"{self.host}/p/login", data=data, method="POST")
        with self.opener.open(request, timeout=REQUEST_TIMEOUT) as response:
            token = response.read().decode("utf-8").strip()
        if not token or "<html" in token.lower():
            raise RuntimeError("Signavio login did not return a token -- check SIGNAVIO_USER/PASSWORD/TENANT_ID")
        return token

    def get_json(self, path):
        """GET https://<host>/p<path>, returning parsed JSON or None on a non-JSON/empty
        response (Signavio returns an empty-body HTML shell for some 404-equivalent cases
        instead of a real HTTP error)."""
        url = f"{self.host}/p{path}"
        last_error = None
        for attempt in range(1, RETRY_COUNT + 1):
            try:
                request = urllib.request.Request(url, headers={"x-signavio-id": self.token, "Accept": "application/json"})
                with self.opener.open(request, timeout=REQUEST_TIMEOUT) as response:
                    body = response.read().decode("utf-8")
                if not body.strip():
                    return None
                return json.loads(body)
            except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError) as error:
                last_error = error
                if attempt < RETRY_COUNT:
                    time.sleep(RETRY_BACKOFF_SECONDS * attempt)
        raise RuntimeError(f"GET {path} failed after {RETRY_COUNT} attempts: {last_error}")


def find_child_dir(client, dir_id, name):
    entries = client.get_json(f"/directory/{dir_id}") or []
    match = next((e for e in entries if e["rel"] == "dir" and e["rep"]["name"] == name), None)
    if match is None:
        available = sorted(e["rep"]["name"] for e in entries if e["rel"] == "dir")
        raise RuntimeError(f"folder '{name}' not found under directory {dir_id}. Found: {available}")
    return match["href"].split("/directory/")[1]


def resolve_reference_directory(client):
    """Walks REFERENCE_PATH by name from the workspace root, returning the "Solution
    Process" folder's directory ID. Fails loudly if any segment is missing rather than
    guessing -- a renamed or reorganized workspace should surface as an error here, not a
    silently empty scope-item list."""
    root = client.get_json("/directory") or []
    root_entry = next((e for e in root if e["rep"].get("name") == REFERENCE_PATH[0]), None)
    if root_entry is None:
        raise RuntimeError(f"root folder '{REFERENCE_PATH[0]}' not found in this workspace")
    dir_id = root_entry["href"].split("/directory/")[1]
    for name in REFERENCE_PATH[1:]:
        dir_id = find_child_dir(client, dir_id, name)
    return dir_id


def list_scope_item_folders(client, solution_process_dir_id):
    """Returns [(code, title, folder_dir_id), ...] for every "<title> (<CODE>)" folder
    directly under the Solution Process registry."""
    entries = client.get_json(f"/directory/{solution_process_dir_id}") or []
    items = []
    for e in entries:
        if e["rel"] != "dir":
            continue
        name = e["rep"]["name"]
        match = SCOPE_ITEM_NAME_RE.match(name)
        if not match:
            continue
        folder_id = e["href"].split("/directory/")[1]
        items.append((match.group("code"), match.group("title"), folder_id))
    return items


def fetch_l2_process_groups(client, folder_id):
    """Picks one representative BPMN model from a scope item's folder, follows
    model -> revision -> linkedBy, and returns the deduped set of L2 process-group names
    that call this scope item as a subprocess (country/deployment-variant suffixes like
    "(S/4HANA Cloud, Germany)" stripped so e.g. 4 country variants collapse to one name)."""
    entries = client.get_json(f"/directory/{folder_id}") or []
    models = [e for e in entries if e["rel"] == "mod"]
    if not models:
        return set(), None
    model_id = models[0]["href"].split("/model/")[1]
    info = client.get_json(f"/model/{model_id}/info")
    if not info or "revision" not in info:
        return set(), model_id
    revision_id = info["revision"].split("/revision/")[1]
    revision = client.get_json(f"/revision/{revision_id}")
    if revision is None:
        return set(), model_id
    linked_by = next((e for e in revision if e["rel"] == "linkedBy"), None)
    if not linked_by:
        return set(), model_id
    groups = {VARIANT_SUFFIX_RE.sub("", e["rep"].get("name", "")).strip() for e in linked_by["rep"]}
    groups.discard("")
    return groups, model_id


def enrich_scope_items_dir(scope_items_dir, code, l2_groups, model_id=None):
    """Merges L2 (and optionally model_id) into the existing per-scope-item JSON from
    ingest_sap_best_practices.py if present; creates a minimal new file if this scope item
    wasn't in the Fiori-derived cache. Never touches L4 steps/apps -- those come from the
    Fiori export, a different source this script doesn't re-derive."""
    path = scope_items_dir / f"{code}.json"
    doc = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {
        "scope_item_id": code,
        "title": None,
        "hierarchy": {"L1_value_stream": None, "L2_core_process": None, "L3_scope_item": None, "L4_steps": []},
        "note": "",
    }
    doc["hierarchy"]["L2_core_process"] = sorted(l2_groups) if l2_groups else doc["hierarchy"].get("L2_core_process")
    if model_id is not None:
        doc["signavio_model_id"] = model_id
    doc["note"] = (
        "L2 sourced from SAP Signavio linkedBy reverse-references (Method 2), confirmed live 2026-08-24. "
        "L1 value stream still not populated -- linkedBy's one hop up lands on a flat L2 registry, not a "
        "further value-stream diagram; needs a manually curated L2->L1 lookup table, not more API calls."
    )
    path.write_text(json.dumps(doc, indent=2) + "\n", encoding="utf-8")


def run(client, scope_items_dir, only_codes=None, limit=None):
    solution_process_dir_id = resolve_reference_directory(client)
    items = list_scope_item_folders(client, solution_process_dir_id)
    print(f"Found {len(items)} scope-item folders under Solution Process.")

    if only_codes:
        items = [i for i in items if i[0] in only_codes]
    if limit:
        items = items[:limit]

    failures = []
    for code, title, folder_id in items:
        print(f"  [{code}] {title}...")
        try:
            l2_groups, model_id = fetch_l2_process_groups(client, folder_id)
        except RuntimeError as error:
            print(f"    SKIPPED: {error}", file=sys.stderr)
            failures.append(code)
            continue
        enrich_scope_items_dir(scope_items_dir, code, l2_groups, model_id)

    print(f"\nEnriched {len(items) - len(failures)}/{len(items)} scope items in {scope_items_dir}/")
    if failures:
        print(f"Failed: {', '.join(failures)}", file=sys.stderr)
    return 1 if failures else 0


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--env-file", type=Path, required=True, help="Path to a .env file with SIGNAVIO_HOST, SIGNAVIO_TENANT_ID, SIGNAVIO_USER, SIGNAVIO_PASSWORD (keep this OUTSIDE the repo, e.g. ~/.config/signavio/sessions/<destination>.env)")
    parser.add_argument("--scope-items-dir", type=Path, default=DEFAULT_SCOPE_ITEMS_DIR, help="Directory of existing per-scope-item JSON files to enrich in place")
    parser.add_argument("--scope-item", action="append", dest="scope_items", help="Restrict to one scope item code (repeatable); default is every scope item found in Signavio")
    parser.add_argument("--limit", type=int, help="Cap how many scope items to process (useful for a smoke test before a full ~602-item run)")
    args = parser.parse_args()

    env = load_env_file(args.env_file)
    required = ["SIGNAVIO_HOST", "SIGNAVIO_TENANT_ID", "SIGNAVIO_USER", "SIGNAVIO_PASSWORD"]
    missing = [k for k in required if k not in env]
    if missing:
        parser.error(f"{args.env_file} is missing: {', '.join(missing)}")

    client = SignavioClient(env["SIGNAVIO_HOST"], env["SIGNAVIO_TENANT_ID"], env["SIGNAVIO_USER"], env["SIGNAVIO_PASSWORD"])
    args.scope_items_dir.mkdir(parents=True, exist_ok=True)
    sys.exit(run(client, args.scope_items_dir, set(args.scope_items) if args.scope_items else None, args.limit))


if __name__ == "__main__":
    main()
