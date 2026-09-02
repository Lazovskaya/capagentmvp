---
agent: sad-assembly
namespace: "@epam/sap"

category: "SAP Activate / Realize"
sdlc-stage: in-progress
use-case: ["Technical SAD assembly"]

distribution-class: client-shippable

source: internal
source-repo: [TBD]

verdict-shape: [domain_ticket_ref, domain_name, status, conflict_flags]
human-confirms: true

assistant: [TBD]
---

## Notes
Peer agent, not an orchestrator above the nine domain-strategy agents (`EPMCSAPAI-275`, `-281`
through `-289`) — it requests their output and composes it, but has no authority to decide their
content or to resolve a disagreement between two domains itself (see `## Procedure` step 4:
cross-domain conflicts are surfaced `NEEDS_ARCHITECT_REVIEW`, never auto-resolved).
`human-confirms: true` reflects that every conflict and every missing-domain gap is left for a human
architect to close, not silently accepted as final.

Designed around a fact discovered while investigating `EPMCSAPAI-290`'s Blocked status: none of its
nine domain inputs exist as built agents in this repo yet, and Jira's own link graph records this
ticket as `blocks` all nine (with them `is_blocked_by` it) — backwards from the ticket's own
description, which says it *consumes* their output. Rather than treat that as a real blocker, this
agent is built to satisfy its own stated acceptance criterion ("ingests available domain outputs...
runs with whatever is available and reports gaps") — every run today is a legitimate all-`MISSING`
skeleton, not a broken agent waiting on upstream work. Sections key by domain ticket ID
(`EPMCSAPAI-275`/`-281`..`-289`), the same stable-ID discipline as [[objects-list]] /
[[objects-mapping]] / [[migration-code-development]] (pattern 1 in
`docs/skill-design-conventions.md`), so wiring up a real domain agent later needs no change to this
agent's assembly keying.

Excludes the business part of the SAD by design (scope/timeline/commercial) — technical composition
only, per the ticket's own "Notes/Source" field.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| agent | EPMCSAPAI-275 Solution Landscape architecture strategy | consumes | domain input, not yet built |
| agent | EPMCSAPAI-281 Release & Transport Management architecture strategy | consumes | domain input, not yet built |
| agent | EPMCSAPAI-282 Security architecture strategy | consumes | domain input, not yet built |
| agent | EPMCSAPAI-283 Integration architecture strategy | consumes | domain input, not yet built |
| agent | EPMCSAPAI-284 Extensibility architecture strategy (Clean Core) | consumes | domain input, not yet built |
| agent | EPMCSAPAI-285 Data architecture strategy | consumes | domain input, not yet built |
| agent | EPMCSAPAI-286 Output Management & UX architecture strategy | consumes | domain input, not yet built |
| agent | EPMCSAPAI-287 Operations & Continuity architecture strategy | consumes | domain input, not yet built |
| agent | EPMCSAPAI-288 Infrastructure architecture strategy | consumes | domain input, not yet built |
| agent | EPMCSAPAI-289 Project Toolchain & Standards architecture strategy | consumes | domain input, not yet built |
| artifact | technical-sad | produces | versioned, section-per-domain, cross-domain conflicts consolidated |
| activity | EPMCSAPAI-251 Strategies generation | relates-to | sibling non-technical track, no data dependency |
