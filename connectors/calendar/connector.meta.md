---
connector: calendar
namespace: "@epam/sap"
version: 0.1.0
owner: katsiaryna_ustsinava@epam.com
project_types: [greenfield, brownfield, bluefield, ams, product-development, discovery, consulting, enterprise-architecture]
sdlc_phases: [prepare, explore]
integration_boundary:
  system: microsoft-365
  environments: []
  access_path:                         # Microsoft 365 in the ported version — connector.md does not spell out the exact auth flow
authentication_model: [oauth]
data_classification: confidential
connector_type: api
permission_scope: read-write
readiness: in-progress
provenance:
  source: internal
  source_repo:
verified_live: "unspecified-date — connector.md states this was live-tested as part of the ported fit-to-standard skill, but not yet independently re-verified inside this repo, and records no ISO date"
---

## Notes
Finds real attendee availability and drafts (never sends) meeting invites —
Microsoft 365 in the ported version. This connector was missing from the
data model even though `skills/fit-to-standard` already depended on it for
its scheduling step; this entry closes that gap. Graceful degradation is
already handled at the skill level: if not wired, `fit-to-standard` still
produces the workshop pack and marks scheduling "not connected, fill
manually" rather than blocking.

## Dependency graph
Empty — a connector reaches out to its external system and calls nothing
else in the factory. Callers are never listed here: `skills/fit-to-standard`
calls this connector, and records it as `| connector | calendar | requires |`
on its own `skill.meta.md` rather than duplicating the edge here.
| Type | Ref | Relation | Notes |
|---|---|---|---|
| *(none)* | | | |
