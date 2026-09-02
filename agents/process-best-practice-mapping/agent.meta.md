---
agent: process-best-practice-mapping
namespace: "@epam/sap"

category: "SAP Activate / Discover"
sdlc-stage: in-progress
use-case: ["Greenfield process-to-best-practice mapping"]

distribution-class: client-shippable

source: internal
source-repo: [TBD]

verdict-shape: [process_id, process_name, status, scope_item_candidates, confidence, match_basis]
human-confirms: true

assistant: [TBD]
---

## Notes
Greenfield-scenario Discover agent for `EPMCSAPAI-241`. Was blocked 2026-08-19 on a wrong
diagnosis (citing `knowledge/process` = notstarted); corrected and unblocked 2026-09-02 once
`knowledge/domain-packs/sap-best-practices/` was confirmed to hold real, usable reference content
(732 scope items, committed 2026-08-24) — see the Jira comment history on `EPMCSAPAI-241`. Reuses
the same `confidence`/`match_basis` pairing as [[objects-mapping]] and `fiori-app-mapping` rather
than inventing a new vocabulary (pattern already established across this factory's mapping-shaped
agents/skills). `human-confirms: true` because `UNMAPPED` and any L1-gap note are surfaced for
review, never silently resolved — matches "does not decide Standard-versus-Delta" in `agent.md`.

Known caveat carried forward rather than hidden: the domain pack's own README states L1 value
stream is "still null everywhere" as a known gap; a spot-check on 2026-09-02 found this overstated
(591 of 732 scope items do carry `L1_value_stream`, 141 are still null) — Procedure step 1 says to
verify against the current file set rather than trust either number as fixed, since the pack is
expected to keep gaining coverage.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| knowledge | domain-packs | consumes | `sap-best-practices/scope-items/*.json` — 732 scope items, structural taxonomy layer only |
| artifact | process-best-practice-mapping | produces | 1:many process-to-scope-item mapping with confidence/match_basis and explicit gaps |
| skill | fit-to-standard | feeds | `MATCHED` rows are candidate standard processes, not a Standard/Delta decision |
| skill | fiori-app-mapping | relates-to | sibling agent/skill, same process-list input shape and confidence pairing, different reference source |
