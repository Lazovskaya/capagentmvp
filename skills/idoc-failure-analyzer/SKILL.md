---
name: idoc-failure-analyzer
description: Categorize failing IDocs by direction, message type and status code, split them into technical / mapping / application layers, correlate across groups, and propose fixes + a safe reprocess path. Domain-neutral engine — plugs in a domain message catalog (order-to-cash ORDERS/INVOIC is the current pack).
---

# IDoc Failure Analyzer

Ported from `sap-ai-cons`'s `skills/run/bugfix/idoc-failure-analyzer` — real, tested content, not a
stub.

*Design conventions this skill follows (ID schemes, status enums, role naming, etc.) are in
`../../docs/skill-design-conventions.md` — check it before modifying this skill's templates.*

Take a set of failing IDocs and turn it into grouped, layer-tagged root causes with fixes and a safe
reprocess recommendation. The key move — separating **technical/ALE** and **mapping** failures
(route to Basis/integration) from **application (status 51)** failures (the consultant's functional
work) — is **module-agnostic**; IDocs run across every module. The domain only supplies the message
catalog.

## When to use

Diagnose stage, when SAP integration fails — inbound documents not creating, or outbound documents
not going out (order-to-cash: ORDERS not creating orders; ORDRSP/DESADV/INVOIC not dispatching).

## Inputs (contract)

Ask for anything missing before running.
- **Required:** an IDoc error set — an export file (e.g. from WE02/WE05/BD87) by default, or a live
  connector pull. Each record needs at least: IDoc number, direction, message/basic type, partner,
  status code, and the status text.
- **Optional:** volume behind each partner/flow (to weight priority); which domain catalog applies.

## Knowledge this skill orchestrates

- `references/idoc-processing.md` — generic engine knowledge: status codes (incl. 00/39/41/52), the
  technical/mapping/application layer split, status nuances (30/68/40), the error-category →
  transaction reference, known SAP Notes/KBAs (pointers), discovering custom-code hooks, operational
  (non-defect) checks, correlation, and reprocess.
- **Domain message catalog** —
  `../../knowledge/domain-packs/order-to-cash/idoc-orders-invoic.md` (flows, application-51
  catalogs, an order-to-cash-specific Note, and the exit/BAdI table for ORDERS inbound / ORDRSP
  outbound / INVOIC outbound).
- For status-51 application errors that mirror online failures, hand off to
  `../../knowledge/domain-packs/order-to-cash/troubleshooting/`.

## Connectivity (agnostic + graceful degradation)

- Default: operate on an IDoc list export the consultant holds.
- If an IDoc/interface reader is wired, pull statuses/segments live for richer diagnosis.
- If none is connected: work from the export and state "⚠ no interface connector — analysis based on
  the provided IDoc export only; reprocess to be done manually."

## Steps

1. **Load** the IDoc error set.
2. **Group** by direction + message type + status code.
3. **Check for an operational (non-defect) cause first** on a `64` backlog — an unscheduled
   background job explains a whole batch at once; don't diagnose each IDoc individually until ruled
   out.
4. **Assign a layer** to each remaining group (technical/mapping/application) per the generic split.
5. **Diagnose using the transaction reference:** partner profile (WE20) · syntax/structure
   (WE30/WE60/WE12) · mapping/conversion (BD55/BD62/BD79) · RFC/comms (SM58/SM59/IDX1/WE21) · ALE
   distribution model (BD64) → route technical/mapping to Basis/integration, naming the artefact to
   fix; application (51) → map to the domain catalog, and for determination/pricing symptoms hand
   off to the domain's troubleshooting tree. Suspected custom code → first identify the likely
   exit/BAdI family from the domain pack's exit table (direction-specific), then use the
   SE37/BD87/SM50 debug procedure. Don't set a blind breakpoint.
6. **Correlate across groups** on the same partner/port — a mapping `26` and a stuck `30` on one
   partner are often one incident, not two.
7. **Recommend the reprocess path** matched to status (BD87/RBDAPP01 inbound · RSEOUT00 outbound ·
   WE19 single · `68` = decide reprocess vs legitimate reject). Never advise editing IDoc data to
   force a post without fixing the root cause.
8. **Check known SAP Notes/KBAs** before closing out — cite a Note only if it's in the generic
   file's list or independently confirmed; never fabricate a Note number.
9. **Write** results to `workspace/bugfix/idoc-analysis-<date>.md` (gitignored).

## Output

Grouped IDoc errors → per group: layer, likely root cause, fix owner, fix, and reprocess
recommendation, with same-partner/port correlations flagged. Application-layer groups link to the
relevant diagnostic tree. Feeds `fix-doc-and-regression` and `defect-pattern-analysis`.

## Judgment calls worth stating out loud

- **Check for an operational (non-defect) cause before diagnosing individually** — a stuck batch
  job explains a whole `64` backlog at once.
- **Never advise editing IDoc data to force a post** — fix the root cause, then reprocess.
- **Never fabricate a SAP Note number** — cite only from the known list or an independently
  confirmed source.

## Driver

Main driver: test. Owner role per factory-data.json: **test**.

## Status

Progress. Real, tested logic ported from sap-ai-cons; not yet re-verified as part of this factory's
own pipeline wiring.
