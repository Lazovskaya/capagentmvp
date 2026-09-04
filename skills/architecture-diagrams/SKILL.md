---
name: architecture-diagrams
description: Create, merge, or adapt SAP architecture diagrams in native .drawio (draw.io/diagrams.net) format, grounded in SAP's official Reference Architecture catalog (~30 architectures, ~144 diagrams) from architecture.learning.sap.com / github.com/SAP/architecture-center, with SAP's real color palette, icon style, and layout conventions. Use whenever the user wants an SAP solution/landscape/integration diagram that should look native to SAP's style rather than generic — covers integration, event-driven architecture, S/4HANA, BTP, Joule, Agentic AI, multitenant SaaS/CAP, Edge Integration Cell, multi-region resiliency, and security/ops topics. Also covers custom diagrams of non-SAP systems integrated with SAP (e.g. ServiceNow, Jira) when no exact official reference architecture exists.
---

# Architecture diagrams (draw.io)

Ported from `sap-ai-architecture-generator`'s `sap-architecture-diagrams` skill (real,
engagement-tested content; `own` posture). Creates, merges, and adapts SAP architecture diagrams
in native `.drawio` (mxGraph XML) format, grounded in SAP's official Reference Architecture
catalog, with a bundled icon library and visual-polish conventions for diagrams built from
scratch. The deliverable is always the `.drawio` file itself — correct, valid, and opening cleanly
in draw.io/diagrams.net. There's no in-chat visual preview by default (see Step 5) — get the XML
right, verify it internally when icons are involved, and let the user see the real result in
draw.io.

*Design conventions this skill follows are in `../../docs/skill-design-conventions.md`.*

## Why this skill exists

architecture.learning.sap.com (and its source repo, github.com/SAP/architecture-center) publishes
~30 official SAP Reference Architectures, each with a downloadable `.drawio` solution diagram,
covering integration, AI, data, app dev, and security/ops topics. This skill fetches those real
files, helps pick the right one(s), and gives you tools to adapt or combine them into something
specific to the user's landscape — instead of building a generic box-and-arrow diagram from
scratch.

**Important constraint:** the `.drawio` files hosted directly on `architecture.learning.sap.com`
cannot be fetched by automated tools (its robots.txt disallows it). The reliable path is GitHub:
the same files live in `github.com/SAP/architecture-center` under
`docs/ref-arch/RAxxxx/.../drawio/*.drawio`, fetchable via `raw.githubusercontent.com`. Always use
the GitHub raw URLs in `references/catalog.json`, not the architecture.learning.sap.com download
links.

## When to use

Explore/Realize phase, whenever an SAP-native-looking architecture diagram is needed — a solution
diagram, an integration landscape, an adapted/merged reference architecture, or a custom diagram
involving SAP + non-SAP systems.

## Inputs (contract)

Ask for anything missing before running.
- **Required:** the operation — adapt, merge, or create from scratch.
- **Required:** the topic/scope — which SAP domain or reference architecture, or a description of
  the custom landscape if nothing official fits.
- **Required:** the specifics — what should change from the standard version (systems to rename,
  components to add/remove, hyperscaler, non-SAP systems to include, etc.), or (for a merge) which
  files to combine and in which mode (`pages` or `canvas`).
- **Optional:** the user's own existing `.drawio` file, when merging against it.

## Steps

### Step 1: Figure out which reference architecture(s) are relevant

Check `references/catalog.json` first — a bundled, pre-built index of all reference architectures,
so there's no need to re-crawl GitHub just to browse. Use the helper script:

```bash
python3 scripts/catalog_lookup.py search "joule"
python3 scripts/catalog_lookup.py search "integration"
python3 scripts/catalog_lookup.py get RA0024
python3 scripts/catalog_lookup.py list-domains
```

Each catalog entry has an `id` (RAxxxx), `title`, `description`, `tags`, the official doc `url`,
and a `diagrams` list — each with a ready-to-fetch GitHub `raw_url`, plus a
`sub_title`/`sub_description` when a reference architecture has multiple diagrams. If the user's
ask doesn't map cleanly to anything in the catalog, briefly describe the 1-3 best matching
candidates and ask the user to confirm rather than guessing silently.

If the catalog feels stale or the user explicitly wants the latest list, re-fetch the live index
from GitHub directly (`https://api.github.com/repos/SAP/architecture-center/contents/docs/ref-arch`
for the current top-level RA folder list) — unauthenticated GitHub API calls are rate-limited, so
don't do this by default, only when there's a real reason to suspect the bundled catalog is
missing something.

### Step 2: Fetch the actual diagram file(s)

Use the `raw_url` from the catalog entry (a `raw.githubusercontent.com` URL) via whichever web-
fetch or HTTP tool this tool environment provides. Save fetched files into the working directory
before editing.

### Step 3: Decide the operation — create, merge, or adapt

**Adapt** (most common: take one reference diagram and customize it — renaming systems, swapping
a hyperscaler, adding/removing a component, scoping it down):
- Fetch the one matching `.drawio` file.
- Read `references/mxgraph-schema.md` for how to safely edit cells in place (find by `value`
  label or id, preserve ids referenced by edges, validate XML after editing).
- Edit using targeted text replacement for small changes, or write a short Python script using
  `xml.etree.ElementTree` (or `lxml`) for anything involving more than a couple of cells — regex
  edits on XML are fragile and easy to corrupt.

**Merge** (combine two or more reference diagrams, or a reference diagram with the user's own
existing `.drawio` file):
- Fetch/gather all source files first.
- Use `scripts/merge_drawio.py`:
  - `--mode pages`: keeps each source diagram as a separate tab/page, completely untouched —
    simplest and safest default when the user wants "all of these in one file" without truly
    combining them visually.
  - `--mode canvas`: flattens everything onto one shared canvas, with automatic ID prefixing
    (avoids collisions) and coordinate normalization, so each source diagram lands in its own
    horizontal lane without overlapping. A starting point, not a finished layout — tell the user
    the result will likely need manual repositioning/re-connecting in draw.io.
  - Ask the user which mode they want if ambiguous — "merge" can reasonably mean either.

**Create from scratch** (no single reference architecture fits, but the user wants the same
visual style — a custom landscape, or SAP integrated with a non-SAP system with no official
reference architecture):
- Don't fabricate a fake "official" reference architecture. Build fresh mxGraph XML using the
  patterns and exact color/style values in `references/sap-style-guide.md` and the cell/edge
  structure in `references/mxgraph-schema.md`.
- Ground the actual technical content in real documentation, not invention — e.g. for an
  integration flow, find and cite the real API/webhook/auth mechanics rather than guessing.
- It's often useful to still fetch one structurally-similar reference diagram first purely as a
  style/structure reference to copy patterns from, even if none of its actual content is reused.
- **Build it as a Python script that generates the XML programmatically**
  (`xml.etree.ElementTree`), not hand-typed XML — this makes validation, iteration, and fixing
  layout issues far less error-prone. Define reusable style-string constants and small helper
  functions (e.g. an `icon_box()` helper) rather than repeating full style strings inline.
- **Don't ship a text-only, icon-less diagram and call it done.** A first pass that only gets the
  color palette right but skips icons, drop shadows, and a proper header banner will not look like
  an official SAP diagram.

#### Visual polish: icons, shadows, and header bars

- **Use the bundled icon set** in `assets/icons/icon_data_uris.json` — pre-generated base64 SVG
  data URIs for common concepts (cloud/platform, monitoring, alert, API, mapping, destination,
  auth/lock, database, user, ticket/incident, rules/gear, callback loop, support agent, generic
  ITSM platform). Reference in a cell's style with
  `image={data_uri};imageWidth=30;imageHeight=30;imageAlign=left;imageVerticalAlign=middle;shape=label;`
  combined with `spacingLeft=46;` on the label. If a concept isn't covered, add a new one in
  `scripts/generate_icons.py` and re-run it to regenerate the JSON file.
- **Add drop shadows** (`shadow=1;`) — does a lot of work toward looking "designed."
- **Give zone/container boxes a colored header bar**, not just a thin outline.
- **Add a title banner** across the top of the whole diagram.
- **Tighten layout to content** — size containers to what's actually inside them.

#### Brand badges and logos — hard trademark policy

If the user asks for company logos (SAP, ServiceNow, or any other named company):

- **Never download, embed, or reproduce an actual logo file**, regardless of source — trademark
  status doesn't change based on how easy the file was to find. Both SAP's and ServiceNow's own
  brand guidelines restrict logo access to authorized accounts/partners and prohibit recreating the
  wordmark from a standard font.
- **What's acceptable instead**: research the company's real public brand color(s) (for SAP,
  `#1C64BE` blue; for ServiceNow, `#293E40` dark green with `#80B6A1` accent — already defined as
  constants in `scripts/generate_icons.py`), then build an original styled text badge or wordmark
  using that color — brand recognition through color and typographic convention, not the protected
  mark itself.
- **For a specific product's icon**, an original interpretation of the general visual concept
  (entirely new geometry, not traced or closely copied) is fine.
- **Always disclose this plainly to the user** — in the chat response and, ideally, as a small
  footer note inside the diagram itself — stating icons/badges are original schematic
  representations in the company's brand colors, not reproductions of official trademarked logos,
  and that official logo files require requesting them through each company's brand portal.

### Step 4: Validate — this is the quality bar

With no reliable visual check available, XML correctness is the entire quality bar. Before
considering any edit/merge/creation done:

1. Parse the result back with `xml.etree.ElementTree` (or `lxml`) and confirm it loads without
   errors.
2. Grep for every `source="..."`, `target="..."`, and `parent="..."` value and confirm a matching
   `id="..."` exists somewhere in the file. Dangling references are the most common way a
   hand-edited `.drawio` file silently breaks — it'll often still open in draw.io, just with
   missing or disconnected elements, worse than an outright error because it's easy to miss.
3. Confirm exactly one `mxCell id="0"` and one `id="1"` exist in each `<diagram>`'s `<root>` —
   duplicates (common after a careless merge) cause draw.io to behave unpredictably on open.
4. If a label changed or was added, re-check it with the tag-stripping approach in
   `references/mxgraph-schema.md` rather than assuming the edit landed cleanly.
5. If geometry changed, sanity-check that nested cells' `x`/`y` are still parent-relative, not
   absolute — the single easiest thing to get wrong when adapting or merging.

### Step 5: On previews — verify internally, don't show the user by default

Two renderer scripts exist, with different purposes:

- `scripts/render_drawio_svg.py` — the original icon-blind renderer (draws shapes/colors/labels,
  shows icons as dashed placeholder boxes). Kept only for a quick rough layout check when the user
  understands it won't show real icons.
- `scripts/verify_render_with_icons.py` — decodes and draws the actual embedded
  `image=data:image/svg+xml;base64,...` icons from each cell's style, plus drop shadows and
  dashed/solid edges. Meaningfully closer to the real thing for diagrams built with this skill's
  own icon set. **Requires `cairosvg` in addition to Pillow** — not verified available in every
  tool environment; if it isn't installed, fall back to Step 4's XML-correctness checks alone and
  say so rather than claiming a visual check ran.

**Neither is a substitute for opening the file in draw.io.** For diagrams adapted from an official
reference architecture (already containing SAP's real proprietary icons embedded as base64), don't
attempt to decode/redraw those with `verify_render_with_icons.py` either — trust Step 4's
validation and tell the user to open the file directly.

### Step 6: Deliver

Hand the final `.drawio` file to the user via this tool environment's normal file-delivery
mechanism. State in plain language: which reference architecture(s) it's based on, what was
changed/merged/created, and that they should open it in draw.io/diagrams.net to see and fine-tune
the actual result — there's no in-chat preview, for the reasons in Step 5.

## Reference files

- `references/catalog.json` — bundled index of ~30 SAP reference architectures and ~144
  individual diagram files, with GitHub raw URLs ready to fetch. Read first for any request that
  names or implies a specific SAP topic/domain.
- `references/sap-style-guide.md` — the exact color palette, fonts, shape styles, and layout
  conventions extracted from real SAP reference diagrams.
- `references/mxgraph-schema.md` — the mxGraph/draw.io XML format itself: cell structure,
  geometry/coordinate rules, edge anchoring, safe merge/edit practices.
- `assets/icons/icon_data_uris.json` — pre-generated base64 SVG data URIs for common diagram
  concepts.

## Scripts

- `scripts/catalog_lookup.py` — search/browse the bundled catalog by keyword, id, or domain.
- `scripts/merge_drawio.py` — combine 2+ `.drawio` files as separate pages or one normalized
  canvas, handling ID collisions and coordinate-origin differences.
- `scripts/generate_icons.py` — defines and regenerates the bundled icon set; holds the researched
  real brand-color constants for SAP and ServiceNow.
- `scripts/render_drawio_svg.py` — older, icon-blind rough layout preview.
- `scripts/verify_render_with_icons.py` — icon-aware internal verification renderer (needs
  `cairosvg`).

## Known limitations

- No in-chat visual preview by default — always tell the user to open the delivered `.drawio` file
  in draw.io/diagrams.net.
- Cannot add real company logos, regardless of source or how official it looks — see the brand
  badge policy above.
- Canvas-mode merges are a layout starting point, not a finished diagram.
- The catalog is a point-in-time snapshot; SAP adds new reference architectures periodically — if
  a topic seems clearly missing, say so rather than assuming the catalog is exhaustive.
- The bundled icon set isn't exhaustive — add a new concept to `generate_icons.py` (preferred) or
  use a plain labeled box rather than forcing a poor visual fit.
- `verify_render_with_icons.py` needs `cairosvg`, not confirmed available in every tool
  environment this factory installs into — degrade to XML-only validation and say so if missing.

## Driver

Main driver: architect. Owner role per factory-data.json: **architect**.

## Status

Progress. Ported from `sap-ai-architecture-generator`'s `sap-architecture-diagrams` (real,
engagement-tested content); tool-specific language (web-fetch mechanism, file-delivery mechanism)
generalized for this factory's tool-agnostic model. Not yet dry-run tested against this factory's
own wiring, and `verify_render_with_icons.py`'s `cairosvg` dependency is unverified in this
environment.
