#!/usr/bin/env python3
"""Fail the pipeline unless an eligible approver has approved this merge request.

GitLab Free doesn't support native "required approvers" merge-request rules (Premium/Ultimate
only), so this script substitutes for it in CI: it checks the MR's current approvals against a
list of usernames (from the MR_REQUIRED_APPROVERS CI/CD variable, comma-separated) and fails if
none of them (other than the MR author) has approved.

GitLab Free also has no setting to block self-approval (merge_requests_author_approval is
Premium/Ultimate-only), so the author's own approval is explicitly excluded here rather than
relied on GitLab to filter out.

Targeting `main` keeps that single behavior: any one of MR_REQUIRED_APPROVERS suffices.

Targeting anything else (e.g. `feature/architecture-assistant`, where an SME's factory
contribution actually lands) additionally requires every distinct owner of a touched
skill/agent/assistant/tool component to have approved -- see required_owners()/
check_owner_approvals() below. This is deliberately stricter than "any one owner": an MR that
touches two different people's components needs both, so an SME's edit to someone else's
component never merges without that owner seeing it. Fails closed (blocks the MR) if a touched
component has no owner: at all, or an owner's email doesn't resolve to a GitLab account --
a missing owner is a reason to stop, not a reason to silently waive the check.

Exception: an MR that targets anything other than `main` AND was opened by one of
MR_REQUIRED_APPROVERS themselves (a maintainer opening it directly, not the sync-open-mr bot or
an SME) skips approval entirely -- a maintainer acting on their own contribution to a non-main
branch doesn't need to wait on their own or an owner's sign-off. This exception does not apply to
MRs targeting `main`, which always need a required approver regardless of who opened it.

The pure logic (touched_components, required_owners, check_owner_approvals) takes no network
input, so it's unit-tested directly in tests/test_check_mr_approvals.py without hitting GitLab;
only get_changed_paths()/resolve_username()/main() touch the API.
"""

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

FACTORY_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(FACTORY_ROOT / "scripts"))
import adapter_common as common  # noqa: E402

META_FILENAME = {
    "skill": "skill.meta.md", "agent": "agent.meta.md",
    "assistant": "assistant.meta.md", "tool": "tool.meta.md",
}
COMPONENT_DIR_KIND = {"skills": "skill", "agents": "agent", "assistants": "assistant", "tools": "tool"}

# ---------- pure logic (unit-testable without the network) ----------

def derive_gitlab_username(email):
    """Derives an EPAM GitLab username from a company email's local part, per the observed
    convention: each underscore-separated segment title-cased, joined by underscores --
    katsiaryna_ustsinava@epam.com -> Katsiaryna_Ustsinava. This exists because GitLab's own
    GET /users?search=<email> only matches a *public* email, username, or display name -- it
    won't find an account by a private company email unless the searcher holds admin rights,
    which MR_APPROVAL_CHECK_TOKEN deliberately doesn't (read_api scope only); confirmed for real
    against katsiaryna_ustsinava@epam.com. Deriving from the known naming convention sidesteps
    that entirely. resolve_username() still confirms the derived name is a real account via
    GitLab's exact-match ?username= filter (unlike ?search=, not restricted by email privacy) --
    if that ever fails for a real owner, the fix is refining this pattern, not hardcoding an
    exception for one person."""
    local = email.split("@", 1)[0]
    return "_".join(part.capitalize() for part in local.split("_"))

def touched_components(changed_paths):
    """Maps each changed path to its owning component (kind, name), e.g.
    'skills/adr-log/SKILL.md' -> ('skill', 'adr-log'). A path outside skills/agents/assistants/
    tools/ (scripts/, tests/, gates/, knowledge/, ...) isn't owned by any component and
    contributes no approval requirement -- only actual component content needs its owner's
    sign-off. Returns a sorted, deduped list."""
    out = set()
    for path in changed_paths:
        parts = path.split("/")
        if len(parts) >= 2 and parts[0] in COMPONENT_DIR_KIND:
            out.add((COMPONENT_DIR_KIND[parts[0]], parts[1]))
    return sorted(out)


def component_owner(kind, name, factory_root=FACTORY_ROOT):
    """Reads owner: straight off the component's own *.meta.md sidecar (already present on
    every sidecar today). None if the sidecar or the field is missing -- the caller's job to
    fail closed on that, not this function's."""
    meta_path = factory_root / f"{kind}s" / name / META_FILENAME[kind]
    return common.read_frontmatter_fields(meta_path).get("owner")


def required_owners(changed_paths, factory_root=FACTORY_ROOT):
    """Returns (owners: set[str] of emails, missing: list[(kind, name)] with no owner: at all)."""
    owners, missing = set(), []
    for kind, name in touched_components(changed_paths):
        owner = component_owner(kind, name, factory_root)
        if owner:
            owners.add(owner)
        else:
            missing.append((kind, name))
    return owners, missing


def resolve_usernames(owner_emails, email_to_username):
    """owner_emails: set of emails. email_to_username: {email: username or None}, already
    resolved by the caller (kept a plain dict here so this stays testable without the network).
    Returns (usernames: set[str], unresolved: list[str] of emails with no GitLab account)."""
    usernames, unresolved = set(), []
    for email in owner_emails:
        username = email_to_username.get(email)
        if username:
            usernames.add(username)
        else:
            unresolved.append(email)
    return usernames, unresolved


def check_owner_approvals(required_usernames, approved_by_lower):
    """required_usernames: usernames (any case) that must each have approved.
    approved_by_lower: lowercased usernames who approved, author already excluded by the caller.
    Returns (ok: bool, missing: set[str] of usernames, lowercased, that haven't approved)."""
    missing = {u.lower() for u in required_usernames if u.lower() not in approved_by_lower}
    return not missing, missing


def is_maintainer_direct_mr(target_branch, author_username_lower, required_approvers_lower):
    """True when this MR should skip approval entirely: it targets anything other than `main`
    AND its author is themselves one of MR_REQUIRED_APPROVERS (a maintainer opened it directly,
    not the sync-open-mr bot or an SME). Never true for `main`, regardless of author."""
    return target_branch != "main" and author_username_lower in required_approvers_lower


# ---------- GitLab API glue ----------

def api_get(server_url, token, path):
    url = f"{server_url}/api/v4{path}"
    request = urllib.request.Request(url, headers={"PRIVATE-TOKEN": token})
    try:
        with urllib.request.urlopen(request) as response:
            return json.load(response)
    except urllib.error.HTTPError as e:
        print(f"GitLab API request to {path} failed: {e.code} {e.reason}", file=sys.stderr)
        sys.exit(1)


def get_changed_paths(server_url, token, mr_path):
    changes = api_get(server_url, token, f"{mr_path}/changes")
    paths = set()
    for c in changes.get("changes", []):
        for key in ("new_path", "old_path"):
            if c.get(key):
                paths.add(c[key])
    return paths


def resolve_username(server_url, token, email):
    """Derives the candidate username from EPAM's own naming convention (derive_gitlab_username),
    then confirms it's a real account via GitLab's exact-match ?username= filter -- unlike
    ?search=, that one isn't restricted by email-privacy settings. None if the derived name
    doesn't correspond to a real account."""
    candidate = derive_gitlab_username(email)
    users = api_get(server_url, token, f"/users?username={urllib.parse.quote(candidate)}")
    return candidate if users else None


def main():
    server_url = os.environ["CI_SERVER_URL"]
    project_id = os.environ["CI_PROJECT_ID"]
    mr_iid = os.environ["CI_MERGE_REQUEST_IID"]
    target_branch = os.environ.get("CI_MERGE_REQUEST_TARGET_BRANCH_NAME", "")
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
    required_approvers_lower = {u.lower() for u in required_approvers}

    if is_maintainer_direct_mr(target_branch, author_username, required_approvers_lower):
        print(
            f"MR targets '{target_branch}' (not main) and was opened directly by a maintainer "
            f"({author_username}) -- approval not required."
        )
        return

    approvals = api_get(server_url, token, f"{mr_path}/approvals")
    approved_by = {entry["user"]["username"].lower() for entry in approvals.get("approved_by", [])}

    self_approved_only = author_username in approved_by
    approved_by.discard(author_username)

    maintainer_ok = bool(approved_by & required_approvers_lower)

    if not maintainer_ok:
        missing = ", ".join(required_approvers)
        print(f"No required approver has approved this merge request. Required (any one of): {missing}", file=sys.stderr)
        if self_approved_only:
            print(
                f"Note: the only approval on record is the author's own ({author_username}); "
                "self-approval does not count.",
                file=sys.stderr,
            )
        sys.exit(1)

    print(f"Approved by required approver(s): {', '.join(sorted(approved_by & required_approvers_lower))}")

    if target_branch == "main":
        return  # unchanged single-required-approver behavior

    # Targeting a feature branch: also require every distinct component owner among the
    # touched paths -- see required_owners()/check_owner_approvals() docstrings.
    changed_paths = get_changed_paths(server_url, token, mr_path)
    owner_emails, missing_owner_components = required_owners(changed_paths)
    if missing_owner_components:
        names = ", ".join(f"{kind} '{name}'" for kind, name in missing_owner_components)
        print(f"Touched component(s) with no owner: declared -- blocking: {names}", file=sys.stderr)
        sys.exit(1)

    email_to_username = {email: resolve_username(server_url, token, email) for email in owner_emails}
    owner_usernames, unresolved = resolve_usernames(owner_emails, email_to_username)
    if unresolved:
        print(f"Owner email(s) that don't resolve to a GitLab account -- blocking: {', '.join(unresolved)}", file=sys.stderr)
        sys.exit(1)

    ok, missing_owners = check_owner_approvals(owner_usernames, approved_by)
    if not ok:
        print(f"Missing approval from component owner(s): {', '.join(sorted(missing_owners))}", file=sys.stderr)
        sys.exit(1)

    print(f"Approved by all required component owner(s): {', '.join(sorted(owner_usernames))}")


if __name__ == "__main__":
    main()
