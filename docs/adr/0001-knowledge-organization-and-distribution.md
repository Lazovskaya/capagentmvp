# ADR 0001: Knowledge organization, storage and distribution for agents/skills

**Status:** Draft
**Jira:** [EPMCSAPAI-302](https://jiraeu.epam.com/browse/EPMCSAPAI-302)
**Relates to:** EPMCSAPAI-291 (sidecar metadata & dependency linter), EPMCSAPAI-209 (skill
organization pattern), EPMCSAPAI-293 (clone-and-filter packaging pipeline), EPMCSAPAI-239
(legal feasibility of ingesting SAP knowledge)

> **MVP status (2026-09-09).** Not implemented. `knowledge-template-MVP.md` v0.3 forbids
> distribution classification on the sidecar, so the gate described below in *Distribution and
> filtering* has no field to read. The Consequences clause's fail-closed default
> (`epam-internal-only` until reviewed) is **not adopted** -- it would block the shipping the
> factory currently depends on: all knowledge under `knowledge/` ships with the factory into
> client environments today, because the agents and skills need it to work. Revisit this ADR's
> Decision once knowledge management supports selective shipping. See
> `knowledge/README.md`'s own Distribution note for the interim position.

## Context

This factory's skills and agents need domain knowledge to work well: SAP Clean Core rules,
BAPI/CDS catalogs, ABAP style guides, migration rules, order-to-cash troubleshooting trees, and
so on. EPMCSAPAI-302 asks us to decide, explicitly, how that knowledge is organized, stored, and
distributed, so that:

- it's maintainable at the factory level without drowning any one skill's context,
- only the knowledge a client engagement actually needs travels to that client's project, and
- nothing that shouldn't leave EPAM's or SAP's boundary does.

**What already exists and is validated**, not a starting point still to design (a file sidecar):

- A `knowledge/<bucket>/` layout in this repo (eleven buckets: `clean-core`, `config`,
  `custom-code`, `data`, `domain-packs`, `extensibility`, `methodology`, `operations`, `process`,
  `standards`, `testing`), several with real content (`domain-packs/order-to-cash`'s ten troubleshooting
  trees, `testing`'s templates).
- Skills reference the buckets they need by relative path in their own `SKILL.md` prose.
- `tools/adapter_common.py`'s `referenced_names()` scans an installed skill set for those
  references and `seed_reference_dir()` copies each referenced bucket into the client project —
  **once**. A later run never re-syncs an already-seeded bucket, because a project is meant to
  edit its own copy from that point on.
- Validated end to end on a real pilot (a live ABAP-MCP CRM demo project): skills plus their
  referenced knowledge buckets landed in the client project with no server, no embeddings, no API
  key — plain files, read directly by the coding agent.

**Where it breaks down** (raised during this ADR's drafting, not yet handled by the mechanism
above):

1. Some knowledge doesn't live in this repo at all and is too large to duplicate into every
   client project on every engagement — e.g. a large SAP architecture/best-practices corpus, if
   one existed. Copying it wholesale means N stale copies instead of one current source.
2. Some knowledge is EPAM's own valuable IP that a skill may need to consult while working, but
   that must never reach the client's delivered project. Point-in-time file copying doesn't
   distinguish this from ordinary client-shippable content — anything sitting in a referenced
   `knowledge/<bucket>/` is copied by the same mechanism, which is actively unsafe for this case.

## Options considered

1. **File sidecars** (current mechanism, above). Plain markdown/JSON/YAML, co-located with the
   factory's own directory layout, copied verbatim into the client project by the adapter.
   - *Pros:* zero infrastructure, no embedding provider or vector-DB dependency, the client
     project stays fully self-contained and offline-readable, already built and validated.
   - *Cons:* doesn't scale to large external corpora (whole-file duplication), and has no notion
     of "this must never leave EPAM" — everything referenced gets copied.

2. **Centralized knowledge repository**, referenced live rather than copied per client.
   - *Pros:* one place to update; no per-client drift.
   - *Cons:* the client's delivered project becomes dependent on live access to a central
     EPAM-side service at runtime, which breaks the "self-contained delivered project" model this
     factory otherwise keeps; also the wrong shape for confidential content, since a shared
     store touching multiple clients' derived work raises cross-client leakage risk unless
     carefully partitioned per engagement.

3. **Vector database / RAG retrieval.** Researched via CrewAI's `Knowledge` feature as a concrete
   reference implementation (ChromaDB by default, Qdrant supported; agent-level and crew-level
   knowledge, each its own collection; content chunked and embedded, retrieved by a
   query-rewritten semantic search rather than read whole).
   - *Pros:* scales to large corpora without blowing any one skill's context window; retrieval
     doesn't require the agent to already know which file/heading to open.
   - *Cons:* needs an embedding provider and a vector-store service the client project must run or
     reach (CrewAI itself defaults to OpenAI embeddings even when the agent's own LLM is Claude —
     a real operational footgun to inherit); adds infrastructure a client project running plain
     Claude Code/Cursor doesn't otherwise need; semantic retrieval can surface a subtly wrong or
     stale chunk, and doing so is harder to audit than "which file did the agent read."

4. **Dynamic MCP knowledge servers** — a live, queryable service (the same shape as this
   factory's `abap-mcp`/`jira` connectors), returning knowledge on demand instead of storing it.
   - *Pros:* always current, no duplication or staleness; the natural fit for facts that live in
     a system anyway (e.g. a BAPI signature read live via ADT beats a cached copy that can drift
     from the real system); the only shape that keeps EPAM-confidential knowledge off the client
     project's disk entirely, since nothing is ever written there.
   - *Cons:* needs the serving system reachable at runtime, which isn't true in every phase (a
     Discover-phase skill may run before any system access exists); doesn't help with knowledge
     that isn't naturally "in a system" to query, like a written style guide.

None of these four is a strict winner across every knowledge type this factory has. The two
problems raised above are exactly the cases where option 1 fails and options 3/4 exist for a
reason — the decision below routes by knowledge type instead of picking one mechanism for
everything.

## Decision

Add a **distribution class**, orthogonal to the agent/skill/global scope taxonomy (EPMCSAPAI-209),
to every knowledge asset: **`client-shippable`**, **`epam-internal-only`**, or
**`public-external`**. The mechanism is chosen by distribution class first, then by
size/volatility:

- **`client-shippable` and bounded in size** (the large majority of what exists today — testing
  templates, domain packs, process/config knowledge that's meant to become the client's own):
  **file sidecars**, unchanged from the validated mechanism above. This stays the MVP default.
- **`epam-internal-only`**: the *content* never enters the clone-and-filter pipeline
  (EPMCSAPAI-293) as a file — no `knowledge/<bucket>/` or artifact tagged this way is ever copied
  into a client project, regardless of size. This is a hard gate on distribution class, not a
  business/technical domain preference.
  Live *access* to such knowledge is a different matter from shipping its content: a
  connector-shaped channel (e.g. a git-MCP pointed at an internal EPAM knowledge repo,
  credentials via the same per-user session-file pattern `jira`/`abap-mcp` already use) may ship
  as ordinary wiring through the standard `--connectors` flow. The wiring itself carries no
  secret, and a party with no EPAM credentials has no way to use it even knowing it exists — the
  client seeing that the channel exists is an acceptable, deliberate trade, not a leak. The gate
  is on content, never on the mere existence of a channel.
- **`public-external`** (a third distribution class): knowledge sourced from a public third-party
  repository (e.g. a public GitHub repo) rather than authored by EPAM or licensed from SAP.
  Legally distinct from the SAP case in EPMCSAPAI-239 — cloning a public git repo over the git
  protocol isn't the bulk-scraping SAP's terms of use forbid, that's what public repos are for —
  but redistributing (vendoring) its content to a client still has to respect that repo's own
  license: MIT/Apache/BSD-style licenses vendor cleanly, GPL-style licenses carry redistribution
  obligations, and a public repo with no `LICENSE` file at all is all-rights-reserved by default
  despite being publicly visible, and must not be vendored without checking. Two mechanisms, both
  already precedented in this factory:
  - **Vendored and pinned** — the same pattern `skills/index.yaml` already uses for adopt-posture
    skills (name, source, pinned ref, note), generalized to knowledge: record the source repo,
    the exact commit/tag pinned, and the license under which it's vendored. Ships as an ordinary
    `client-shippable` file sidecar once pinned.
  - **Live public connector** — a git-MCP needing no credentials (the repo is public), for
    content that changes too often or is too large to vendor. Unlike the `epam-internal-only`
    connector above, nothing gates who can invoke it: if it's wired into the project's shared
    `.mcp.json`, the client can call it too. Decide that deliberately per case; don't let it
    default in as a side effect of adding the connector.
- **Large external or fast-changing knowledge** (a big reference corpus, or system facts that go
  stale quickly): **dynamic MCP knowledge server** (option 4) if it's naturally systemic (comes
  from a real system), otherwise **RAG** (option 3) only if the corpus is genuinely too large to
  read as files — this is a deliberately higher bar than "would be nice to search semantically."
  Neither is an MVP requirement; both stay documented options for a specific future case, not
  general infrastructure to build now.
  If option 4 is ever built for `epam-internal-only` content specifically: the likely shape is one
  generic, parameterized connector (a credential-gated gateway into EPAM's internal sources, with
  no real hostname hardcoded — resolved from the consultant's own session file, same pattern as
  `jira`/`abap-mcp`) plus separate per-source pointer entries cataloging what's reachable through
  it. This sketch is deliberately non-normative — open questions like whether a pointer entry
  defaults to `client-shippable` or `epam-internal-only`, and whether it needs a new connector
  shape at all versus reusing the existing `connectors/<name>/` convention as-is, are unresolved
  until a real use case forces the decision.

This also settles the SAP-content question from EPMCSAPAI-239: since SAP's own terms of use
prohibit bulk extraction (explicitly naming MCP and agent frameworks), no storage mechanism above
makes bulk-copied SAP content legal. If SAP knowledge is ever legally licensed in
(e.g. through J4C or an equivalent), it arrives through option 4's live-query shape by
construction, not as a corpus to embed or copy — the legal constraint and the size constraint
point at the same mechanism.

## Taxonomy

Two independent axes on every knowledge asset:

- **Scope** (per EPMCSAPAI-209): agent-level, skill-level, or global/framework-level — what
  determines *who* reads it.
- **Distribution class** (this ADR): `client-shippable`, `epam-internal-only`, or
  `public-external` — whether it may leave EPAM's boundary, and if it came from outside EPAM,
  what obligations (license, pinned source) attach to it.

A knowledge asset's directory layout is unchanged by this ADR (`knowledge/<bucket>/` for global,
skill-referenced paths for skill-scoped); the distribution class is declared in the asset's own
sidecar metadata (EPMCSAPAI-291's `.meta.md` schema), not inferred from its location.

## Distribution and filtering

The clone-and-filter pipeline (EPMCSAPAI-293) must filter on distribution class before any other
tag, but only for file content. Concretely: any `knowledge/<bucket>/` or artifact file tagged
`epam-internal-only` is dropped before the business/technical domain/risk filtering step runs,
not after — so a misconfigured scope filter can never accidentally let one through. This is a
stronger requirement than 293's current acceptance criteria ("internal-only files... are cleanly
stripped"), which names `**.meta.md` specifically; it must also cover the knowledge content the
metadata describes, not just the metadata file itself.

Connectors are a separate path, not subject to this file-content gate: an `epam-internal-only`
connector's wiring may ship normally, since credentials (not the filter) gate actual use, and a
`public-external` connector's wiring may too — but the latter ships the ability for *anyone*
holding the client project to invoke it, since a public repo needs no credentials. That's a
deliberate per-connector call, not something 293's filter decides for you.

## Context budgeting

A skill only pulls in the knowledge buckets it actually references (already true today via
`referenced_names()`); this ADR doesn't change that mechanism, only adds the distribution-class
gate before a bucket is eligible to be copied at all. Buckets sized for RAG (option 3) are exempt
from whole-file loading by construction — that's the point of choosing that mechanism for them.

## Consequences

- Every knowledge asset needs its distribution class recorded once EPMCSAPAI-291's sidecar schema
  lands; until then, treat anything not already reviewed as `epam-internal-only` by default
  (fail closed, not open).
- The file-sidecar mechanism does not need to change to ship this decision — it already does the
  right thing for the majority case. The new work is the distribution-class field, the hard gate
  in 293's pipeline, and documenting when options 3/4 actually apply (not building them now).
- RAG and dynamic knowledge servers stay explicitly out of MVP scope; revisit if a real engagement
  produces a knowledge asset that's actually too large for file sidecars, rather than building
  either preemptively.
- Vendoring `public-external` knowledge needs a source/pinned-ref/license field on the sidecar
  too — generalize `skills/index.yaml`'s existing adopt-posture record rather than inventing a
  separate schema for it.
