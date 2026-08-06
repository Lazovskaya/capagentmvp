# IDoc processing — failure analysis (agnostic, module-neutral)

Generic IDoc troubleshooting knowledge, reusable across **any** module (SD/O2C, MM/P2P, FI, MDG,
HR…). The `idoc-failure-analyzer` engine orchestrates this plus a **domain message catalog** (e.g.
`knowledge/domain/order-to-cash/idoc-orders-invoic.md` for O2C). Method only — pointers to
transactions/tables, no client data, no copied SAP text.

## Status codes (read these first)

**Inbound:** `50` received · `64` ready to pass to application · `51` **application error** (post
failed) · `52`/`53` posted OK · `68` error, no further processing · `69` edited.
**Outbound:** `00` not yet processed · `01` created · `30` ready for dispatch (ALE) · `03` passed to
port · `12`/`16` dispatch OK · `26` **syntax error** · `02` error passing to port · `29` **error in
ALE service** (partner profile/port) · `39` transferred to target system (ALE, SAP-to-SAP) · `40`
target application document not created (error at receiving side) · `41` target application
document created OK.

> `39`/`40`/`41` matter mainly for **SAP-to-SAP ALE** (not third-party EDI): `39` confirms the
> receiving system got the IDoc; `40`/`41` are the **confirmation status reflected back** once the
> receiver's application layer tried to post — `40` means *their* posting failed, not a transport
> problem on your side.

The status **text** (WE02/WE05 status records, or BD87) names the actual error — always read it.

## The key split — which of three problems is it?

Decide the **layer** before diagnosing; the three are handled by different owners:

| Layer | Statuses | Typical cause | Owner |
|-------|----------|---------------|-------|
| **Technical / ALE** | `02`, `29`, `30` stuck, `03` stuck, `39` stuck | Partner profile (WE20) missing, port/RFC (WE21/SM59) down, distribution model (BD64) incomplete, subsystem | Basis / config |
| **Mapping / syntax / conversion** | `26` | Segment/field mapping, IDoc type/segment definition mismatch, conversion rules (BD55/BD62/BD79), middleware (PI/PO/Integration Suite/EDI subsystem), wrong basic type | Integration / middleware |
| **Application (functional)** | `51`, `68`, `40` (receiver-side) | Master data, determination, business rules — see the **domain** message catalog | Functional consultant |

> `51` means the IDoc arrived fine but the **business document couldn't be created** — effectively
> the same errors as the equivalent online transaction. Route the functional root cause to the
> domain's troubleshooting trees. SAP's own status text is usually explicit in plain language (e.g.
> "customer X not found", "material Y does not exist in plant Z") — read it before drilling further.

## Status nuances (don't misread these)
- **`30` alone is inconclusive.** "Ready for dispatch" is *normal for seconds/minutes*. It is only an
  incident when it **persists** (hours/overnight). Correlate with the dispatch job (RSEOUT00 / SM37),
  port/queue age, and errors on the **same partner** (a prior `26`/`29` often blocks the queue).
- **`68` vs `51`.** `51` = application error, **reprocessable** after fixing the cause (BD87 /
  RBDAPP01). `68` = "no further processing": marked done/parked; it will **not** reprocess as-is.
  Fix cause → set reprocessable (or WE19 corrected copy), **or** confirm a legitimate reject. Never
  flip `68`→done to hide an unfixed cause.
- **`40` (error at receiving side).** The IDoc left SAP fine; the **partner/receiver** (or, for
  SAP-to-SAP ALE, the receiving system's application layer) rejected it. Confirm SAP content is
  correct, then treat as a **partner-side / receiver-application** issue — raise with the partner or
  the receiving-side functional team; do not "fix" by editing the SAP IDoc.
- **A backlog stuck at `64` (inbound) is often not a defect at all** — it usually means the periodic
  background job that processes ready IDocs (see Operational checks) isn't scheduled, not that any
  individual IDoc is broken. Check the job before diagnosing individual documents.

## Error-category → transaction reference (generic)

A concrete "what to open" map, layered onto the split above. Consultant scopes; Basis/integration
executes the technical/mapping fixes.

| Category | Layer | Key transactions | What to check |
|----------|-------|-------------------|----------------|
| Partner profile | technical | **WE20** (profile), WE02/WE05 (read error) | Inbound/outbound parameters: message type, process code, port assignment |
| Syntax / structure | mapping | **WE30** (IDoc type def.), WE60 (type documentation), WE12 (test inbound file), WE19 (edit/reprocess single IDoc) | Mandatory segments, field lengths/values vs the IDoc type definition |
| Data mapping / conversion | mapping | **BD55** (IDoc conversion), **BD62** (segment conversion rules), **BD79** (IDoc conversion rules) | Conversion-rule mismatch between SAP fields and the partner/external format — compare a failing IDoc against a known-good one of the same message type |
| Communication / RFC | technical | **SM58** (async RFC error log), **SM59** (RFC destinations), **IDX1** (port↔RFC destination, XI/PI), **WE21** (port definitions) | Port/client not assigned to an RFC destination; RFC destination broken (host, logon, authorization) |
| ALE distribution model | technical | **BD64** | Message type not assigned between the sender/receiver logical systems — a common cause of "IDoc never generated" that looks like a partner-profile issue but isn't |
| Outbound trigger/test | technical | **WE14** (test outbound processing), **BD87** (status monitor, bulk reprocess) | Confirm the IDoc is generated correctly before assuming a downstream failure |
| Custom code / enhancement | application/custom | **WE20** (find process code → function module), **SE37** (breakpoint on the FM), **BD87** (trigger, hits the breakpoint), **SM50** (process/work-process analysis), ST22 (dumps) | User-exit/BAdI logic error in the assigned function module — debug, don't guess |
| External middleware (PI/PO/Integration Suite) | mapping/technical | WE02 (status 39/40/41), the middleware's own message monitor, IDX1 | Distinguish a **middleware-layer** failure (message never reached the target) from an **application-layer** failure at the target (`40`) — check the middleware's monitor, not just SAP status |

## Known SAP Notes/KBAs (pointers — not exhaustive)

Cite by number only; look up the current text on the Support Portal (never copy Note text into this
repo — see the domain README fill policy). General/all-message-type references:

| Note | Topic |
|------|-------|
| 3776338 | ALE — IDoc status codes: reference for all status codes shown in WE02/WE05/BD87, inbound and outbound |
| 3485462 | Reports for re-processing failed IDocs (status 02 and 51), via report or batch job |
| 2543182 | Archiving IDocs in status 51 (application error) and 64 (ready to be processed) |
| 2155110 | IDocs in status 51 — identifying the correct support component when root cause isn't obvious |

**To find more (per message type):** search the SAP Notes/KBA tool with the message type + symptom
(e.g. "IDoc INVOIC error", "MATMAS inbound status 51"), filtered by component — `BC-MID-ALE` for
general IDoc/ALE, or the domain's own EDI component (e.g. `SD-EDI`, `MM-EDI`, `WM-EDI`). WE60 (IDoc
type documentation) sometimes links relevant Notes directly. SAP also publishes interactive **Guided
Answers** troubleshooting flows for some EDI scenarios — check whether one exists for the message
type/component in question before working from first principles.

## Discovering custom-code hooks (before debugging blind)

Before setting a breakpoint, find out **which** exit/BAdI family actually applies — don't guess.

- **WE57** — function modules / business objects / message & IDoc types for inbound ALE/EDI.
- **WE41** / **WE42** — outbound / inbound **process codes** and their function modules.
- **SMOD** (browse enhancements, F4 for the full list) → **CMOD** (create/activate a project) →
  double-click the exit component to open it in **SE37** and add code → **activate** the project
  (code only runs once active).
- **Naming pattern:** inbound function modules are `IDOC_INPUT_<MESSAGETYPE>` (e.g.
  `IDOC_INPUT_ORDERS`); outbound are `IDOC_OUTPUT_<MESSAGETYPE>`.
- **Module-neutral hooks:** `ALE00001` (`EXIT_SAPLBD11_001`) — IDoc version conversion during ALE
  processing; for outbound, a common pattern is copying the standard function module for the
  message type and adjusting it (a "customer function" of the standard FM) to fill custom segments.
- **Inbound exits must set `WORKFLOW_RESULT`, `IDOC_STATUS`, and `RETURN_VARIABLES` correctly** — a
  custom exit that skips these breaks error handling/workflow even if its own logic is correct.
- **The same message type can serve more than one business direction with different exit families.**
  `ORDERS`, for instance, creates a sales order in one flow (O2C) and updates a purchase order /
  confirmation in another (P2P) — each direction has its **own** exit/BAdI set. Use the **domain
  pack's** exit list for the direction you're actually diagnosing; don't assume a generic hit applies.
- Some industries carry their own additional BAdIs on top of the standard ones (e.g. automotive,
  chemicals) — if the standard exit list doesn't explain the behavior, check for an industry
  solution (IS-*) layer before concluding it's a one-off custom bug.

## Operational checks (not a document defect, but looks like one)
- **Inbound stuck at `64` in bulk:** the periodic background job (program that mass-processes
  ready IDocs, scheduled via SM36/monitored via SM37) likely isn't scheduled — schedule/verify it
  rather than treating each IDoc as a separate incident. (This exact pattern — IDocs not
  auto-continuing past status 64 because the periodic job isn't scheduled — is documented behavior,
  not a one-off bug; treat a whole batch at status 64 as one operational finding.)
- **WMS/Customizing-driven inbound errors (status 51) with a "blocking" message** (concurrent access
  to the same object): typically resolved by the periodic reprocessing job's auto-repost setting for
  blocking errors, not manual intervention per IDoc.
- **Logging:** SLG1 (application log) often carries more detail than the IDoc status text alone —
  check it before concluding a symptom is unexplained.

## Diagnostic flow (for the engine)
1. Group the error set by **direction + message type + status code**.
2. Assign each group a **layer** (technical / mapping / application) using the split above; consult
   the transaction reference table for the concrete artefact to check.
3. **Check for operational (non-defect) causes first** on inbound `64` backlogs — a scheduling gap
   explains a whole batch at once.
4. `technical`/`mapping` → name the artefact to fix (partner profile, port/RFC, distribution model,
   conversion rules) and route to Basis/integration; the consultant scopes, doesn't fix.
5. `application (51)` → map to the **domain message catalog**; for determination/pricing symptoms
   hand off to the domain's troubleshooting trees. For a suspected custom-code cause, point to the
   SE37/BD87/SM50 debug procedure rather than guessing.
6. **Correlate across groups** on the same partner/port — a mapping `26` and a stuck `30` on one
   partner are often one incident (syntax failure blocked the queue), not two.
7. Recommend the **reprocess path** matched to status: `51` → BD87 / RBDAPP01 (mass inbound);
   outbound → RSEOUT00; single → WE19; `68` → decide reprocess vs legitimate reject. **Never edit
   IDoc data to force a post without fixing the root cause.**
8. Before closing out, check the fix against the **Known SAP Notes/KBAs** section above (or search
   further per its guidance) — never fabricate a Note number that isn't in that list or confirmed live.
9. If a `custom` layer cause is suspected, use **Discovering custom-code hooks** above (and the
   domain pack's exit/BAdI list) to identify the specific exit family **before** debugging — don't
   set a blind breakpoint.
