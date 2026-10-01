# Architecture Decision Log

Append-only record of architectural decisions and material changes made during a Brownfield
S/4HANA conversion engagement. Produced and maintained by the `adr-log` Skill; published to
Confluence as `05 Architecture Decision Log` by `confluence-document-publishing`.

- **`id`** -- stable identifier `ADR-<engagement_id>-<seq>`, assigned at creation, never reused.
 `seq` increments monotonically per engagement; a superseded entry keeps its original ID.
- **`decision_type`** -- one of `conversion-approach`, `scope-boundary`, `sizing-assumption`,
 `integration-decision`, `risk-acceptance`, `deferral`, `business-decision`. Use
 `business-decision` for any decision that materially alters commercial scope, contract tier,
 or go-live date.
- **`status`** -- `active`, `superseded`, or `deferred`. A `superseded` entry must carry a
 `superseded_by` ID. A `deferred` entry must carry a `deferred_until` milestone (stage or date).
 Never delete an entry -- append a superseding one instead.
- **`raised_by`** -- person email, or the literal string `agent` when the decision was inferred
 automatically. Human-raised decisions take precedence over agent-raised ones if they conflict.
- **`reviewed_by`** / **`review_date`** -- required before an entry moves to `active` and the
 related SAD stage can advance to `ready`. Leave as `null` when not yet reviewed.

## Entries

| ID | Date | Stage | Type | Title | Status | Reviewed by |
|---|---|---|---|---|---|---|

*(Entries are appended here when published to Confluence. Local source of truth is
`workspace/<engagement_id>/brownfield-sad/adr-log.json`.)*

---

Entries superseded since last publish are listed below for traceability, not removed.
