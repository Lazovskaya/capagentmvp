#!/usr/bin/env python3
"""Fail the pipeline unless an eligible approver has approved this merge request.

GitLab Free doesn't support native "required approvers" merge-request rules (Premium/Ultimate
only), so this script substitutes for it in CI: it checks the MR's current approvals against a
list of usernames (from the MR_REQUIRED_APPROVERS CI/CD variable, comma-separated) and fails if
none of them (other than the MR author) has approved.

GitLab Free also has no setting to block self-approval (merge_requests_author_approval is
Premium/Ultimate-only), so the author's own approval is explicitly excluded here rather than
relied on GitLab to filter out.
"""

import json
import os
import sys
import urllib.error
import urllib.request


def api_get(server_url, token, path):
    url = f"{server_url}/api/v4{path}"
    request = urllib.request.Request(url, headers={"PRIVATE-TOKEN": token})
    try:
        with urllib.request.urlopen(request) as response:
            return json.load(response)
    except urllib.error.HTTPError as e:
        print(f"GitLab API request to {path} failed: {e.code} {e.reason}", file=sys.stderr)
        sys.exit(1)


def main():
    server_url = os.environ["CI_SERVER_URL"]
    project_id = os.environ["CI_PROJECT_ID"]
    mr_iid = os.environ["CI_MERGE_REQUEST_IID"]
    token = os.environ.get("MR_APPROVAL_CHECK_TOKEN")

    if not token:
        print(
            "MR_APPROVAL_CHECK_TOKEN is not set. Add it as a masked, protected CI/CD variable "
            "holding a token with read_api scope.",
            file=sys.stderr,
        )
        sys.exit(1)

    required_approvers = [u.strip() for u in os.environ.get("MR_REQUIRED_APPROVERS", "").split(",") if u.strip()]
    if not required_approvers:
        print(
            "MR_REQUIRED_APPROVERS is not set (or empty). Add it as a project CI/CD variable "
            "holding a comma-separated list of required-approver GitLab usernames.",
            file=sys.stderr,
        )
        sys.exit(1)

    mr_path = f"/projects/{project_id}/merge_requests/{mr_iid}"
    mr = api_get(server_url, token, mr_path)
    author_username = mr["author"]["username"].lower()

    approvals = api_get(server_url, token, f"{mr_path}/approvals")
    approved_by = {entry["user"]["username"].lower() for entry in approvals.get("approved_by", [])}

    self_approved_only = author_username in approved_by
    approved_by.discard(author_username)

    required_approvers_lower = {u.lower() for u in required_approvers}
    eligible_approvals = approved_by & required_approvers_lower
    if eligible_approvals:
        print(f"Approved by required approver(s): {', '.join(sorted(eligible_approvals))}")
        sys.exit(0)

    missing = ", ".join(required_approvers)
    print(f"No required approver has approved this merge request. Required (any one of): {missing}", file=sys.stderr)
    if self_approved_only:
        print(
            f"Note: the only approval on record is the author's own ({author_username}); "
            "self-approval does not count.",
            file=sys.stderr,
        )
    sys.exit(1)


if __name__ == "__main__":
    main()
