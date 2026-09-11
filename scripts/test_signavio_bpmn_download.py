#!/usr/bin/env python3
"""One-shot probe: can we download BPMN 2.0 XML for a scope item via the Signavio API?

Tries three endpoint patterns for BD9 (or any scope item you pass) and prints what each
returns. Run this once to confirm which path works before wiring it into the main pipeline.

Usage:
    python3 tools/test_signavio_bpmn_download.py \
        --env-file /Users/Vitaly_Malyshev/Library/CloudStorage/OneDrive-EPAM/VScode/.vscode/.env \
        --scope-item BD9
"""

import argparse
import http.cookiejar
import json
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

REFERENCE_PATH = [
    "Shared documents",
    "Copy from SAP Signavio Process Explorer",
    "SAP Product Portfolio",
    "SAP S/4HANA",
    "Solution Process",
]

REQUEST_TIMEOUT = 30


def load_env(path):
    env = {}
    for line in Path(path).read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        env[k.strip()] = v.strip()
    return env


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
            raise RuntimeError("Login failed")
        print(f"[login] OK, token={token[:12]}...")
        return token

    def get(self, url, accept="application/json"):
        req = urllib.request.Request(
            url, headers={"x-signavio-id": self.token, "Accept": accept}
        )
        try:
            with self.opener.open(req, timeout=REQUEST_TIMEOUT) as r:
                status = r.status
                body = r.read()
            return status, body
        except urllib.error.HTTPError as e:
            return e.code, e.read()

    def get_json(self, path):
        status, body = self.get(f"{self.host}/p{path}", accept="application/json")
        if not body:
            return None
        try:
            return json.loads(body)
        except json.JSONDecodeError:
            return None


def find_child_dir(client, dir_id, name):
    entries = client.get_json(f"/directory/{dir_id}") or []
    match = next(
        (e for e in entries if e["rel"] == "dir" and e["rep"]["name"] == name), None
    )
    if match is None:
        available = sorted(e["rep"]["name"] for e in entries if e["rel"] == "dir")
        raise RuntimeError(f"folder '{name}' not found. Available: {available[:10]}")
    return match["href"].split("/directory/")[1]


def find_scope_item_model(client, code):
    """Walk the standard reference path and return (model_id, revision_id) for scope item."""
    root = client.get_json("/directory") or []
    root_entry = next(
        (e for e in root if e["rep"].get("name") == REFERENCE_PATH[0]), None
    )
    if root_entry is None:
        raise RuntimeError(f"Root folder '{REFERENCE_PATH[0]}' not found")
    dir_id = root_entry["href"].split("/directory/")[1]

    for name in REFERENCE_PATH[1:]:
        dir_id = find_child_dir(client, dir_id, name)

    entries = client.get_json(f"/directory/{dir_id}") or []
    folder = next(
        (
            e
            for e in entries
            if e["rel"] == "dir" and f"({code})" in e["rep"]["name"]
        ),
        None,
    )
    if folder is None:
        raise RuntimeError(f"Scope item folder for '{code}' not found")

    folder_id = folder["href"].split("/directory/")[1]
    print(f"[found] folder: {folder['rep']['name']}  id={folder_id}")

    items = client.get_json(f"/directory/{folder_id}") or []
    models = [e for e in items if e["rel"] == "mod"]
    if not models:
        raise RuntimeError("No models in folder")

    model_id = models[0]["href"].split("/model/")[1]
    print(f"[found] model_id={model_id}")

    info = client.get_json(f"/model/{model_id}/info")
    revision_id = info["revision"].split("/revision/")[1] if info else None
    print(f"[found] revision_id={revision_id}")

    return model_id, revision_id


def probe(client, label, url, accept):
    print(f"\n--- {label} ---")
    print(f"    URL: {url}")
    status, body = client.get(url, accept=accept)
    preview = body[:300].decode("utf-8", errors="replace") if body else "(empty)"
    print(f"    HTTP {status}")
    print(f"    Body preview: {preview[:200]}")
    return status, body


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--env-file", type=Path, required=True)
    parser.add_argument("--scope-item", default="BD9")
    parser.add_argument("--save", type=Path, help="Save successful BPMN XML to this file")
    args = parser.parse_args()

    env = load_env(args.env_file)
    client = SignavioClient(
        env["SIGNAVIO_HOST"],
        env["SIGNAVIO_TENANT_ID"],
        env["SIGNAVIO_USER"],
        env["SIGNAVIO_PASSWORD"],
    )

    model_id, revision_id = find_scope_item_model(client, args.scope_item)
    host = client.host

    # Three candidate endpoint patterns to probe
    candidates = [
        (
            "Pattern A: /p/model/{id}/bpmn2_0_xml (legacy /p/ API)",
            f"{host}/p/model/{model_id}/bpmn2_0_xml",
            "application/xml",
        ),
        (
            "Pattern B: /spm/v1/model/{id}/bpmn2_0_xml (Import/Export API)",
            f"{host}/spm/v1/model/{model_id}/bpmn2_0_xml",
            "application/xml",
        ),
    ]
    if revision_id:
        candidates += [
            (
                "Pattern C: /p/revision/{id}/bpmn2_0_xml (revision-specific)",
                f"{host}/p/revision/{revision_id}/bpmn2_0_xml",
                "application/xml",
            ),
            (
                "Pattern D: /spm/v1/revision/{id}/bpmn2_0_xml",
                f"{host}/spm/v1/revision/{revision_id}/bpmn2_0_xml",
                "application/xml",
            ),
        ]

    success = None
    for label, url, accept in candidates:
        status, body = probe(client, label, url, accept)
        if status == 200 and body and b"<definitions" in body[:500]:
            print(f"    *** SUCCESS — valid BPMN 2.0 XML ***")
            success = (label, body)
            break

    if success and args.save:
        args.save.write_bytes(success[1])
        print(f"\n[saved] {args.save} ({len(success[1])} bytes)")
    elif success:
        print(f"\n[result] Working pattern: {success[0]}")
    else:
        print("\n[result] None of the patterns returned valid BPMN. Check output above.")
        sys.exit(1)


if __name__ == "__main__":
    main()
