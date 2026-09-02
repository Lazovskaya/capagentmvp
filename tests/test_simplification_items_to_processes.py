"""End-to-end dry-run test for tools/simplification_items_to_processes.py (EPMCSAPAI-240).

Runs the real importer against a synthetic SAP Transition Database catalog export
(tests/fixtures/simplification_catalog/) shaped like the real files
(header.xml, sdb_transition_db_item.xml, sdb_check_new.xml, sdb_target_release.xml),
then validates the JSON output against artifacts/business-process-impact-list/schema.json --
the two things the 2026-08-27 Jira comment on EPMCSAPAI-240 flagged as still needed before
Resolve. (Its other flagged item -- verifying schema compatibility with EPMCSAPAI-246/-256 --
turned out not to apply: neither of those tickets consumes this artifact; readiness-analysis
does, per skills/readiness-analysis/skill.meta.md.)
"""
import csv
import json
import sys
from pathlib import Path

import jsonschema
import pytest

ROOT = Path(__file__).resolve().parent.parent
TOOLS_DIR = ROOT / "tools"
FIXTURES = ROOT / "tests" / "fixtures" / "simplification_catalog"
TAXONOMY = ROOT / "tests" / "fixtures" / "simplification_catalog_taxonomy.json"
SCHEMA = ROOT / "artifacts" / "business-process-impact-list" / "schema.json"

sys.path.insert(0, str(TOOLS_DIR))
import simplification_items_to_processes as sitp  # noqa: E402


@pytest.fixture
def payload(tmp_path):
    output_json = tmp_path / "business-process-impact-list.json"
    output_csv = tmp_path / "business-process-impact-list.csv"
    sys.argv = [
        "simplification_items_to_processes.py",
        "--catalog-dir", str(FIXTURES),
        "--target-release", "S/4HANA 2023 FPS02",
        "--source-release", "ECC 6.0 EHP8",
        "--taxonomy", str(TAXONOMY),
        "--output-json", str(output_json),
        "--output-csv", str(output_csv),
    ]
    sitp.main()
    return json.loads(output_json.read_text(encoding="utf-8")), output_csv


class TestSimplificationItemsToProcesses:
    def test_validates_against_artifact_schema(self, payload):
        data, _ = payload
        schema = json.loads(SCHEMA.read_text(encoding="utf-8"))
        jsonschema.validate(instance=data, schema=schema)

    def test_dedupes_on_guid_and_preserves_all_three_items(self, payload):
        data, _ = payload
        assert len(data["items"]) == 3
        guids = {item["item_guid"] for item in data["items"]}
        assert len(guids) == 3

    def test_item_id_taxonomy_match_is_high_confidence(self, payload):
        data, _ = payload
        item = next(i for i in data["items"] if i["item_id"] == "SI01: TEST_ITEM_ONE")
        assert item["process_mappings"][0]["business_process"] == "General ledger accounting"
        assert item["process_mappings"][0]["confidence"] == "high"
        assert item["process_mappings"][0]["candidate_transaction_codes"] == ["FB50", "FAGLL03"]

    def test_application_area_fallback_used_when_no_item_id_match(self, payload):
        data, _ = payload
        item = next(i for i in data["items"] if i["item_id"] == "SI02: TEST_ITEM_TWO")
        assert item["process_mappings"][0]["business_process"] == "Sales order management"
        assert item["process_mappings"][0]["confidence"] == "medium"

    def test_unmapped_item_flagged_for_review_not_dropped(self, payload):
        data, _ = payload
        item = next(i for i in data["items"] if i["item_id"] == "SI03: TEST_ITEM_THREE")
        assert item["process_mappings"] == []
        assert item["review_status"] == "DRAFT"

    def test_every_item_defaults_to_conditional_never_mandatory(self, payload):
        # tools/simplification_items_to_processes.py's own docstring: catalog metadata alone
        # never proves client-specific applicability -- see agent.md Refuse conditions too.
        data, _ = payload
        assert all(item["impact_classification"] == "conditional" for item in data["items"])

    def test_zero_note_sentinel_is_blanked_not_kept_as_a_fake_note(self, payload):
        data, _ = payload
        item = next(i for i in data["items"] if i["item_id"] == "SI02: TEST_ITEM_TWO")
        # sdb_check_new.xml's SAP_NOTE for this item is the "0000000000" no-note sentinel.
        assert item["evidence_refs"] == [
            "sdb_transition_db_item.xml#00000000-0000-0000-0000-000000000002",
            "sdb_check_new.xml#00000000-0000-0000-0000-000000000002",
        ]

    def test_target_release_category_only_attached_to_matching_item(self, payload):
        data, _ = payload
        with_category = [i for i in data["items"] if i["target_release_categories"]]
        assert [i["item_guid"] for i in with_category] == ["00000000-0000-0000-0000-000000000001"]
        assert with_category[0]["target_release_categories"][0]["category"] == "C"

    def test_csv_output_has_one_row_per_process_mapping(self, payload):
        _, output_csv = payload
        with output_csv.open(encoding="utf-8") as f:
            rows = list(csv.DictReader(f))
        # SI01 -> 1 mapping, SI02 -> 1 mapping, SI03 -> 0 mappings (still emits one blank row)
        assert len(rows) == 3

    def test_missing_required_catalog_file_fails_loudly(self, tmp_path):
        incomplete = tmp_path / "incomplete_catalog"
        incomplete.mkdir()
        (incomplete / "header.xml").write_text("<feed/>", encoding="utf-8")
        sys.argv = [
            "simplification_items_to_processes.py",
            "--catalog-dir", str(incomplete),
            "--target-release", "S/4HANA 2023 FPS02",
            "--output-json", str(tmp_path / "out.json"),
            "--output-csv", str(tmp_path / "out.csv"),
        ]
        with pytest.raises(SystemExit):
            sitp.main()
