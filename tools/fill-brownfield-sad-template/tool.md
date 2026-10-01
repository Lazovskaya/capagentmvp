# Tool: fill-brownfield-sad-template

Fills the Brownfield SAD template (`artifacts/brownfield-sad/template.md`) from confirmed
evidence artifacts and decision matrix outputs. Produces a structured markdown SAD document
with inline source citations and an Open Topics section for every unresolved gap.

**Script:** `tools/fill-brownfield-sad-template/scripts/fill_sad_template.py`

---

## Inputs

| Flag | Required | Description |
|---|---|---|
| `--engagement-id` | Yes | Stable engagement identifier |
| `--readiness` | Yes | Path to `simplification-impact-report` JSON or markdown staging file |
| `--sizing` | Yes | Path to `sizing-recommendation` JSON or markdown staging file |
| `--scoping` | Yes | Path to `business-process-scope` JSON or markdown staging file |
| `--adr-log` | Yes | Path to `adr-log.json` |
| `--decisions` | Yes | Path to `sad-decisions.json` — confirmed decisions from the five matrices (written by `sad-drafting` skill's step 2) |
| `--template` | No | Template path (default: `artifacts/brownfield-sad/template.md`) |
| `--out` | No | Output path (default: `workspace/<engagement_id>/brownfield-sad/staged/06-brownfield-sad.md`) |
| `--schema` | No | Schema path for output validation (default: `artifacts/brownfield-sad/schema.json`) |

---

## What the tool does

1. **Loads all inputs** — reads each artifact file; fails immediately if any required file is
   missing or not valid JSON/markdown.
2. **Resolves template placeholders** — `{{decisions.*}}` tokens are replaced with confirmed
   decision values from `sad-decisions.json`.
3. **Populates evidence sections** — `<!-- fill_sad_template: section=X source=Y -->` markers
   are expanded with content from the named source artifacts, with `[S-id]` citations.
4. **Collects open topics** — any item marked `TBC` in the source artifacts or any gap in
   the decisions is added to the Open Topics section with a sequential `OT-N` ID.
5. **Writes the output** — the filled document is written to `--out`. If the file already
   exists, the script writes to a `.new` temp file first, then renames atomically.
6. **Validates the output** — re-reads the written file and checks that all required
   `{{decisions.*}}` tokens have been resolved (no unresolved `{{` remaining), and that
   the word count is > 500.

---

## Output

- The filled SAD markdown at `--out` path.
- Summary printed to stdout: section list, word count, open topic count, any unresolved tokens.
- Exit code 0 on success, 1 on any error.

---

## Usage

```bash
# Standard invocation from sad-drafting skill step 3
python3 tools/fill-brownfield-sad-template/scripts/fill_sad_template.py \
    --engagement-id acme-brownfield-2026 \
    --readiness  workspace/acme-brownfield-2026/brownfield-sad/staged/01-readiness-assessment.md \
    --sizing     workspace/acme-brownfield-2026/brownfield-sad/staged/02-sizing-recommendation.md \
    --scoping    workspace/acme-brownfield-2026/brownfield-sad/staged/03-business-process-scope.md \
    --adr-log    workspace/acme-brownfield-2026/brownfield-sad/adr-log.json \
    --decisions  workspace/acme-brownfield-2026/brownfield-sad/sad-decisions.json

# Custom output path
python3 tools/fill-brownfield-sad-template/scripts/fill_sad_template.py \
    --engagement-id acme-brownfield-2026 \
    --readiness ... --sizing ... --scoping ... --adr-log ... --decisions ... \
    --out /tmp/sad-draft-review.md
```

---

## Error handling

| Error | What the tool reports |
|---|---|
| Required input file missing | Exit 1; names the missing path |
| `sad-decisions.json` invalid or missing required decision | Exit 1; names the missing decision key |
| Unresolved `{{...}}` tokens after filling | Exit 1; lists the unresolved tokens |
| Word count < 500 | Exit 1 with warning (likely a near-empty template fill) |
| Output directory does not exist | Exit 1; names the path to create |

---

## Status

Implemented. No live-run verification against a real engagement yet — testable outcome: run
against the sample inputs in `tests/fixtures/sad-drafting/` (once created) and confirm output
validates against `artifacts/brownfield-sad/schema.json`.
