---
name: confluence-document-publishing
description: Publish an approved Brownfield SAD engagement document to Confluence with a mandatory preview-and-approval gate, then re-read the page to confirm publication.
tags: [brownfield, confluence, documentation, publishing]
---

# Skill: Confluence Document Publishing

Publishes a single approved engagement document to Confluence. Enforces a strict
preview-then-approve cycle: the exact page title, parent page, space key, and rendered
content are shown before any write. A live MCP write happens only when you pass
`--apply`. After writing, the page is immediately re-read to verify version, URL, and
content round-trip. The result is recorded in the engagement's
`brownfield-sad-authoring-state` artifact.

Uses three Python tools (no MCP server required):
- `search-confluence-pages` — duplicate detection
- `read-confluence-page` — pre-write version read and post-write verification
- `upsert-confluence-page` — create or update (dry-run by default, `--apply` required)

All three share the same credentials file
(`~/.config/mcp-atlassian/sessions/<destination>.env`). If Confluence is unreachable or
credentials are missing, fall back to the "Confluence unavailable" path documented in
`brownfield-sad-authoring-agent`'s agent.md -- work locally, mark the document as
`not_published`, do not block the engagement.



---

## When to use

Invoked by `brownfield-sad-authoring-agent` after the user has approved a document's
content locally. One call per document. Suitable documents:

- Per-topic readiness findings, one from each of `readiness-business-architecture`,
  `readiness-technical-architecture`, `readiness-extensibility`, `readiness-integration`,
  `readiness-security`, `readiness-data-master-data` -- see "Publishing a section hierarchy" below
  and `knowledge/methodology/brownfield-conversion/confluence-publication-structure.md` for the
  6-folder taxonomy these map onto.
- `02 Sizing Recommendation` (from `sizing-analysis`)
- `03 Business Process Scope` (from `conversion-scoping`)
- `04 SAD` (from `sad-drafting`)

## Publishing a section hierarchy

This Skill always publishes one page per invocation -- that contract doesn't change. But when a
consultant wants readiness/sizing/scoping findings organized as a browsable multi-page site
instead of one flat document per artifact, call this Skill once per page, in this order:

1. **Parents before children.** A child page's CREATE call needs the parent's page ID, so publish
 the parent (folder landing page) first, then its children.
2. **Follow the taxonomy in `knowledge/methodology/brownfield-conversion/confluence-publication-structure.md`**
 for the standard 6-folder-plus-ADR-log structure (Business Architecture, Technical Architecture,
 Extensibility, Integration, Security, Data & Master Data Management, Architecture Decision Log)
 -- it also documents the "Related ADRs" cross-linking convention every content page follows and
 the exact Page Properties / Page Properties Report macro markup for the ADR log, verified
 working against kb.epam.com Confluence Server/DC.
3. **Existing pages can be retitled but never moved.** `upsert-confluence-page` only accepts
 `--parent-id` on create; there's no reparent-on-update, and `move`/`delete` are forbidden
 operations (`connectors/confluence/connector.md`). Reorganizing an already-published flat
 structure into this taxonomy means retitling pages in place to become folder landings, and
 recreating any content that needs a *different* parent as a fresh child page -- the old page is
 then rewritten as a short "superseded — see `<link>`" stub, never deleted.
4. **Never batch multiple publish calls in one backgrounded shell command.** A single background
 loop calling `upsert-confluence-page` in sequence has hung indefinitely with no output in
 practice; call it once per page, in the foreground, verifying each write before moving to the
 next.

Do not call this Skill to publish internal artifacts (`brownfield-sad-authoring-state`,
ADR log) -- those are engagement-private, not canonical deliverables.

---

## Inputs

Provide all of these before starting:

```yaml
document_path:
 description: Path to the local staged markdown or HTML file to publish.
 example: workspace/<engagement_id>/brownfield-sad/staged/01-readiness-assessment.md

space_key:
 description: Confluence space key (e.g. "EPMC", "PROJECTX").

parent_page_id:
 description: >
 Numeric Confluence page ID of the parent page under which this document
 should live (e.g. the engagement's root page). Obtain from the URL or ask
 the engagement lead.

title:
 description: >
 Exact page title to create or update. Use the canonical SAD section titles
 (e.g. "01 Readiness Assessment -- <EngagementName>"). Must be unique within
 the space for create; must match exactly for update.

existing_page_id:
 description: >
 Optional. If provided, update this page instead of creating a new one.
 Obtain from the URL of the existing page or from the engagement's
 brownfield-sad-authoring-state artifact.
 required: false
```

---

## Workflow

### Step 1 — Load and render the document

Read `document_path`. If the file is Markdown, convert to Confluence storage format
(XHTML-like): convert headings, bold, italic, bullet lists, tables. Do not convert code
blocks to Confluence macros -- render as `<pre>` only.

If the file is already HTML, use it as-is.

State the document word count and section count as a sanity check.

### Step 2 — Resolve the target page

**If `existing_page_id` is given:**
- Run `read-confluence-page <existing_page_id> --destination=<destination>` to confirm
 the title matches, record current version number, and note last modified / by whom.
- State: "Will **update** page `<id>` (current version N, last edited by X on Y)."

**If no `existing_page_id`:**
- Run `search-confluence-pages "<title>" --space=<space_key> --destination=<destination>`
 to check whether a page with this exact title already exists in the space.
 If one is found, treat it as an implicit `existing_page_id` (do not create a
 duplicate) and state: "Found existing page with this title (ID `<id>`);
 will **update** rather than create."
- If not found, state: "No existing page found; will **create** under parent `<parent_page_id>`."

### Step 3 — Preview

Print the full publication plan. Do not omit anything:

```
CONFLUENCE PUBLISH PREVIEW
--------------------------
Action: CREATE | UPDATE (page <id>, version N → N+1)
Space: <space_key>
Parent page: <parent_page_id>
Title: <title>
Content: <word_count> words, <section_count> top-level sections
First 300 chars of rendered content:
 <excerpt>

Pass --apply to publish. Pass nothing to cancel.
```

Wait for the user to reply. If the reply is anything other than `--apply`, stop and
report the publication as cancelled. Do not auto-proceed.

### Step 4 — Write (only after `--apply`)

Save the rendered content to a temporary local file (e.g. `/tmp/page-body.html`), then:

**Create:**
```
python3 tools/upsert-confluence-page/scripts/upsert_confluence_page.py \
 --space=<space_key> --parent-id=<parent_page_id> \
 --title="<title>" --body-file=/tmp/page-body.html \
 --destination=<destination> --apply
```

**Update:**
```
python3 tools/upsert-confluence-page/scripts/upsert_confluence_page.py \
 --page-id=<existing_page_id> --title="<title>" \
 --body-file=/tmp/page-body.html --version=<current_version + 1> \
 --destination=<destination> --apply
```

If the tool exits non-zero, report the error verbatim. Do not retry silently. Mark
publication state as `failed` in the artifact with the error detail.

### Step 5 — Verify

Immediately after a successful write, the tool already re-reads the page internally and
reports `verification.title_match`, `version_match`, and `content_length`. Check the
tool output JSON. If any value is unexpected, additionally run:

```
python3 tools/read-confluence-page/scripts/read_confluence_page.py <page_id> --destination=<destination>
```

Check:

- Title matches what was requested.
- Version is the expected post-write version (N+1 for update; typically 1 for create).
- Content length is plausible (within 10% of the pre-write rendered content length).

If any check fails, report the discrepancy and mark publication state as
`verification_failed` rather than `published`.

### Step 6 — Record in artifact

Update the engagement's `brownfield-sad-authoring-state` artifact with:

```yaml
confluence_publication:
 page_id: <id>
 title: <title>
 url: <canonical page URL>
 version: <confirmed post-write version>
 published_at: <ISO 8601 timestamp>
 status: published | failed | verification_failed | not_published
```

Never leave this field unset after an attempted publish, even on failure.

---

## If Confluence is unavailable

If the connector isn't wired, returns a network error, or returns HTTP 401/403:

1. Do not delete or discard the staged local file.
2. Set `confluence_publication.status: not_published -- Confluence unavailable` in the
 artifact, with a timestamp and the error detail.
3. Report to the user: "Confluence unavailable -- document staged locally at
 `<document_path>`. Re-run this Skill once the connector is wired to publish."
4. Do not block the engagement; other steps can proceed.

---

## Caveats

- Confluence storage format (XHTML) has subtleties that differ from Markdown. Complex
 tables, nested lists, and inline HTML may not round-trip perfectly. Always review the
 preview carefully.
- The `version` field in `confluence_update_page` must be exact (current + 1); if
 another editor saved the page between Step 2 and Step 4, the write will fail with a
 409 conflict. Re-run the Skill from Step 2 to pick up the new version.
- This Skill publishes one document per invocation. For a full SAD with multiple
 sections, the Agent calls it once per section in the canonical order.
