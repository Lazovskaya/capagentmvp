"""Tests for artifact JSON schema validity using brownfield-sad/schema.json."""
import json
from pathlib import Path

import pytest

jsonschema = pytest.importorskip("jsonschema", reason="jsonschema not installed")

FACTORY_ROOT = Path(__file__).resolve().parent.parent
FIXTURES = Path(__file__).resolve().parent / "fixtures"

SAD_SCHEMA = FACTORY_ROOT / "artifacts/brownfield-sad/schema.json"


@pytest.fixture(scope="module")
def sad_schema():
    return json.loads(SAD_SCHEMA.read_text(encoding="utf-8"))


@pytest.fixture(scope="module")
def valid_sad_instance():
    return json.loads((FIXTURES / "brownfield-sad-valid.json").read_text(encoding="utf-8"))


def test_valid_instance_passes(sad_schema, valid_sad_instance):
    """A well-formed SAD instance validates against the schema."""
    jsonschema.validate(instance=valid_sad_instance, schema=sad_schema)


def test_missing_engagement_id_fails(sad_schema, valid_sad_instance):
    """An instance missing engagement_id fails validation."""
    bad = dict(valid_sad_instance)
    del bad["engagement_id"]
    with pytest.raises(jsonschema.ValidationError):
        jsonschema.validate(instance=bad, schema=sad_schema)


def test_invalid_review_status_fails(sad_schema, valid_sad_instance):
    """An instance with an invalid review_status enum value fails validation."""
    bad = {**valid_sad_instance, "review_status": "dunno"}
    with pytest.raises(jsonschema.ValidationError):
        jsonschema.validate(instance=bad, schema=sad_schema)


def test_invalid_open_topic_id_fails(sad_schema, valid_sad_instance):
    """An open_topic with an id not matching 'OT-N' pattern fails validation."""
    bad = json.loads(json.dumps(valid_sad_instance))
    bad["open_topics"] = [
        {
            "id": "TOPIC-1",  # wrong pattern, should be OT-N
            "title": "Some topic",
            "source_stage": "readiness",
            "owner": "TBC",
        }
    ]
    with pytest.raises(jsonschema.ValidationError):
        jsonschema.validate(instance=bad, schema=sad_schema)


def test_invalid_infrastructure_approach_fails(sad_schema, valid_sad_instance):
    """An invalid infrastructure_approach enum value in sizing_strategy fails."""
    bad = json.loads(json.dumps(valid_sad_instance))
    bad["decisions"]["sizing_strategy"]["infrastructure_approach"] = "cloud-magic"
    with pytest.raises(jsonschema.ValidationError):
        jsonschema.validate(instance=bad, schema=sad_schema)
