"""Tests for scripts/check_mr_approvals.py's pure logic (touched_components, required_owners,
resolve_usernames, check_owner_approvals) -- everything that doesn't need a real GitLab API,
covering the compound owner-approval rule added for MRs that target a feature branch (see the
module docstring and staff/sme-contribution-roundtrip-plan.md's step 5)."""
from pathlib import Path

# conftest.py adds scripts/ to sys.path
import check_mr_approvals as cma


# ---------- touched_components ----------

def test_touched_components_maps_paths_to_owning_component():
    paths = {
        "skills/adr-log/SKILL.md", "skills/adr-log/skill.meta.md",
        "agents/brownfield-sad-authoring-agent/agent.md",
    }
    assert cma.touched_components(paths) == [
        ("agent", "brownfield-sad-authoring-agent"),
        ("skill", "adr-log"),
    ]


def test_touched_components_ignores_non_component_paths():
    """scripts/, tests/, gates/, knowledge/ aren't owned by any component and contribute no
    approval requirement."""
    paths = {"scripts/sync_back.py", "tests/test_foo.py", "gates/discover-prepare/gate.md", "knowledge/methodology/x.md"}
    assert cma.touched_components(paths) == []


def test_touched_components_dedupes_multiple_files_in_one_component():
    paths = {"tools/fill-brownfield-sad-template/tool.md", "tools/fill-brownfield-sad-template/scripts/run.py"}
    assert cma.touched_components(paths) == [("tool", "fill-brownfield-sad-template")]


# ---------- component_owner / required_owners ----------

def _write_meta(root, kind, name, owner=None):
    filename = cma.META_FILENAME[kind]
    meta_dir = root / f"{kind}s" / name
    meta_dir.mkdir(parents=True, exist_ok=True)
    body = f"---\n{kind}: {name}\n"
    if owner:
        body += f"owner: {owner}\n"
    body += "---\n"
    (meta_dir / filename).write_text(body, encoding="utf-8")


def test_component_owner_reads_sidecar(tmp_path):
    _write_meta(tmp_path, "skill", "adr-log", owner="alice@example.com")
    assert cma.component_owner("skill", "adr-log", factory_root=tmp_path) == "alice@example.com"


def test_component_owner_missing_sidecar_returns_none(tmp_path):
    assert cma.component_owner("skill", "ghost", factory_root=tmp_path) is None


def test_component_owner_sidecar_without_owner_field_returns_none(tmp_path):
    _write_meta(tmp_path, "skill", "no-owner")
    assert cma.component_owner("skill", "no-owner", factory_root=tmp_path) is None


def test_required_owners_two_distinct_owners(tmp_path):
    _write_meta(tmp_path, "skill", "adr-log", owner="alice@example.com")
    _write_meta(tmp_path, "agent", "brownfield-sad-authoring-agent", owner="bob@example.com")
    paths = {"skills/adr-log/SKILL.md", "agents/brownfield-sad-authoring-agent/agent.md"}
    owners, missing = cma.required_owners(paths, factory_root=tmp_path)
    assert owners == {"alice@example.com", "bob@example.com"}
    assert missing == []


def test_required_owners_same_owner_deduped(tmp_path):
    _write_meta(tmp_path, "skill", "readiness-analysis", owner="alice@example.com")
    _write_meta(tmp_path, "skill", "readiness-business-architecture", owner="alice@example.com")
    paths = {"skills/readiness-analysis/SKILL.md", "skills/readiness-business-architecture/SKILL.md"}
    owners, missing = cma.required_owners(paths, factory_root=tmp_path)
    assert owners == {"alice@example.com"}
    assert missing == []


def test_required_owners_fails_closed_on_missing_owner(tmp_path):
    """A touched component with no owner: at all must block, not be silently skipped."""
    _write_meta(tmp_path, "skill", "no-owner")
    owners, missing = cma.required_owners({"skills/no-owner/SKILL.md"}, factory_root=tmp_path)
    assert owners == set()
    assert missing == [("skill", "no-owner")]


# ---------- resolve_usernames ----------

def test_resolve_usernames_all_resolved():
    usernames, unresolved = cma.resolve_usernames(
        {"alice@example.com", "bob@example.com"},
        {"alice@example.com": "alice", "bob@example.com": "bob"},
    )
    assert usernames == {"alice", "bob"}
    assert unresolved == []


def test_resolve_usernames_fails_closed_on_unresolved_email():
    usernames, unresolved = cma.resolve_usernames(
        {"alice@example.com", "ghost@example.com"},
        {"alice@example.com": "alice", "ghost@example.com": None},
    )
    assert usernames == {"alice"}
    assert unresolved == ["ghost@example.com"]


# ---------- check_owner_approvals ----------

def test_check_owner_approvals_both_approved_passes():
    ok, missing = cma.check_owner_approvals({"alice", "bob"}, {"alice", "bob"})
    assert ok is True
    assert missing == set()


def test_check_owner_approvals_one_missing_fails():
    """Two distinct owners, only one approved -- must fail (not 'any one owner')."""
    ok, missing = cma.check_owner_approvals({"alice", "bob"}, {"alice"})
    assert ok is False
    assert missing == {"bob"}


def test_check_owner_approvals_is_case_insensitive():
    ok, missing = cma.check_owner_approvals({"Alice"}, {"alice"})
    assert ok is True
    assert missing == set()


def test_check_owner_approvals_single_owner_approved_passes():
    """Item 13's first half: one owner across every touched component, one owner approval plus
    (separately, at the maintainer check) one maintainer approval should suffice."""
    ok, missing = cma.check_owner_approvals({"katsiaryna_ustsinava"}, {"katsiaryna_ustsinava"})
    assert ok is True


# ---------- derive_gitlab_username ----------

def test_derive_gitlab_username_two_segments():
    """Confirmed for real: katsiaryna_ustsinava@epam.com -> @Katsiaryna_Ustsinava."""
    assert cma.derive_gitlab_username("katsiaryna_ustsinava@epam.com") == "Katsiaryna_Ustsinava"


def test_derive_gitlab_username_single_segment():
    assert cma.derive_gitlab_username("alice@epam.com") == "Alice"


def test_derive_gitlab_username_three_segments():
    assert cma.derive_gitlab_username("first_middle_last@epam.com") == "First_Middle_Last"


def test_derive_gitlab_username_normalizes_existing_case():
    """.capitalize() lowercases the rest of each segment, so an all-caps or mixed-case local
    part still normalizes to the same convention."""
    assert cma.derive_gitlab_username("ALICE_BOB@epam.com") == "Alice_Bob"


# ---------- is_maintainer_direct_mr ----------

def test_is_maintainer_direct_mr_true_for_non_main_maintainer_author():
    assert cma.is_maintainer_direct_mr("feature/architecture-assistant", "alice", {"alice", "bob"}) is True


def test_is_maintainer_direct_mr_false_for_main_even_if_maintainer_author():
    """The exception never applies to `main` -- a maintainer opening an MR into main still
    needs a required approver."""
    assert cma.is_maintainer_direct_mr("main", "alice", {"alice", "bob"}) is False


def test_is_maintainer_direct_mr_false_for_non_maintainer_author():
    """An SME's or the sync-open-mr bot's MR into a feature branch still needs approval."""
    assert cma.is_maintainer_direct_mr("feature/architecture-assistant", "some-sme", {"alice", "bob"}) is False
