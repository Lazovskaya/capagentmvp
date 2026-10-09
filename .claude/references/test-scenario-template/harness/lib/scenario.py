"""Load a scenario's config from scenario.config.md.

Two sources are merged into one dict:
  1. the YAML frontmatter at the top  -> the scenario id (`test_scenario`)
  2. the ```yaml block under "## Settings" -> technical parameters the harness needs
     (runs_required, pass_threshold, judge_*, harness{...}, grading{...})

Lifecycle tags live nowhere: this is a local contributor config, not a delivered artifact.
"""
import pathlib
import re

import yaml


_METRICS_BLOCK = re.compile(
    r"##\s+Settings\b.*?```yaml\s*(.*?)```", re.DOTALL | re.IGNORECASE)


def load_meta(scenario_dir):
    """Return frontmatter merged with the Settings block as a single dict."""
    p = pathlib.Path(scenario_dir) / "scenario.config.md"
    text = p.read_text(encoding="utf-8")
    if not text.lstrip().startswith("---"):
        raise ValueError(f"{p}: no YAML frontmatter found")

    parts = text.split("---", 2)  # ['', frontmatter, body]
    if len(parts) < 3:
        raise ValueError(f"{p}: malformed frontmatter")
    meta = yaml.safe_load(parts[1]) or {}

    body = parts[2]
    m = _METRICS_BLOCK.search(body)
    if m:
        metrics = yaml.safe_load(m.group(1)) or {}
        meta.update(metrics)
    else:
        raise ValueError(f"{p}: no '## Settings' YAML block found")

    return meta
