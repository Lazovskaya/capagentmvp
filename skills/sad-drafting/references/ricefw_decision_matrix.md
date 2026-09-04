# RICEFW / Clean Core Extensibility Decision Matrix

For SAD Section 6 (Extensibility / Clean Core). Grounded in EPAM's own
standard RICEFW governance and Clean Core extensibility framework (used
across real EPAM S/4HANA proposals) plus SAP's public Clean Core/ABAP
Cloud extensibility model and standard ATC (ABAP Test Cockpit) priority
semantics. Use this whenever Section 6 needs to say something more
concrete than "we will follow Clean Core principles" — that sentence
alone is exactly the kind of generic filler the rubric marks down.

## 1. Why this needs its own decision framework, not a paragraph

Every RICEFW object (Report, Interface, Conversion, Enhancement, Form,
Workflow) needs an explicit, individually-justified extensibility
decision — not a single blanket policy for the whole engagement. Two
objects in the same engagement can legitimately land on different tiers.
Section 6 should show the *decision rule*, not just the *aspiration*.

This matters more, not less, on a shared/group-wide template landscape
(a common Brownfield/rollout scenario): uncontrolled customization on one
entity's build carries risk for every other entity on the same instance,
including ones not yet onboarded. Clean Core discipline is a **governance
requirement** in that setup, not just a technical preference — say this
explicitly in Section 6 when the Instance Strategy decision
(`instance_strategy_decision_matrix.md`) produced a shared/consolidated
landscape.

## 2. The Extensibility Decision Record (EDR) — tag every RICEFW object

Every RICEFW item gets tagged with exactly one of three tiers, evaluated
in this order (don't jump straight to on-stack or side-by-side without
ruling out the earlier, cleaner options first):

1. **Standard / configuration** — the need is met by SAP standard
   functionality or configuration alone. No EDR needed; this is the
   default to actively rule out first, not an afterthought.
2. **In-App (Key User) Extensibility** — Custom Fields & Logic app, CDS
   view extensions, UI adaptation via the Flexibility (CFL) layer. Clean
   Core by construction (uses only SAP-released, upgrade-stable extension
   points). This is where most Simple-complexity RICEFW items should land.
3. **On-stack (ABAP Cloud) Extensibility** — developer extensibility using
   only SAP-released APIs/extension points (released BAdIs, Enhancement
   Spots, RAP-based custom business objects). Still Clean Core, but needs
   a developer, not just a key user. **Only justified when no side-by-side
   or standard alternative exists** — this is the actual decision
   discipline, not a stylistic preference; if a side-by-side option
   fulfills the need, prefer it, since it fully decouples custom logic
   from the SAP system's own upgrade cycle.
4. **Side-by-Side Extensibility (SAP BTP)** — the object runs entirely
   outside the S/4HANA system (BTP-hosted app, CAP/RAP-based service,
   BTP-based workflow), consuming only released APIs. Preferred over
   on-stack whenever real-time transactional consistency with S/4 isn't
   required, or when the requirement doesn't fit the S/4 data model at
   all (e.g. cross-system data, non-SAP audience, native mobile).
5. **Classical extension / not Clean Core** — a genuinely necessary
   modification that doesn't fit any of the above (e.g. no released API
   exists yet and there's no acceptable workaround). This tier must be
   named explicitly as "not Clean Core" in the EDR and requires an
   explicit sign-off path (see §5) — never leave it unlabeled as if it
   were equivalent to tier 2 or 3.

**"High Core Dependency" flag** — an object should be flagged for tier 3
(on-stack) rather than tier 4 (side-by-side) when it genuinely needs one
or more of: real-time transactional consistency with S/4 data, very high
data granularity/volume unsuitable for API-based access, or no
requirement for flexible datacenter/scalability/downtime independence
from the S/4 instance. Don't default everything to on-stack out of
convenience — side-by-side should be the default whenever these
conditions don't hold, since it fully protects the upgrade path.

Record the EDR tag, the APIs/extension points used, and the Clean Core
rationale for each object — this record is what Section 6 (and the
`adr-log` entry, if the object is genuinely gating) should cite, not
a restated policy statement.

## 3. The five Clean Core golden rules

State these in Section 6 as the governing principles, not boilerplate —
they're the actual criteria a Design Authority Board uses to approve or
reject an EDR:

1. **Standard First** — rule out standard/configuration before any
   extensibility tier.
2. **No Uncontrolled Modifications** — no direct object modification;
   every change goes through a released extension point.
3. **Pragmatic Application** — Clean Core is a discipline, not dogma;
   the tier-5 "not Clean Core" escape exists for real cases, but it must
   be named and approved, not silently taken.
4. **Extensibility by Design** — plan the extension point/API need during
   design, not discovered mid-build.
5. **Traceability & Accountability** — every object's EDR, APIs used, and
   approval are recorded and attributable.

Clean Core governance is **not a one-time gate** — it repeats every SAP
Activate phase (Discover through Run), with an updated activity list and
Clean Core report at each stage. Say this explicitly in Section 6 rather
than implying a single upfront review covers the whole engagement.

## 4. ATC/SCI severity → remediation-type mapping

Standard SAP ABAP Test Cockpit (ATC)/Code Inspector priority semantics —
use this to translate a `readiness-analysis` Chapter 5 (Custom Code)
finding-count breakdown into an actual remediation plan, not just a
number:

| ATC Priority | Meaning | Typical remediation | Quality-gate treatment |
|---|---|---|---|
| **Priority 1 (Error)** | Will not run / breaks on S/4HANA (e.g. use of a table/field removed by a Simplification Item, syntax error under the target release) | Must be fixed before the technical conversion can complete — often blocks the Custom Code Migration app's own release-readiness check | **Hard blocker** — zero tolerance, no exceptions |
| **Priority 2 (Warning — high)** | Runs, but behaves incorrectly or unsafely (e.g. deprecated API still functioning today but unsupported going forward, missing authorization check) | Should be fixed before go-live; if deferred, needs an explicit accepted-risk sign-off, not a silent skip | **Gating** — the RICEFW governance table's "No P1/P2 findings" rule applies here too |
| **Priority 3 (Warning — medium/low)** | Style, performance, or maintainability issue that doesn't block functionality | Fix opportunistically, e.g. bundled with an unrelated change to the same object | Tracked, not gating |
| **Priority 4 (Information)** | Informational only, no required action | No action required unless it correlates with a real defect | Not tracked as debt |

Feed this into Section 6 as: "of the N custom objects flagged by the
Readiness Check, X are Priority 1 (must-fix, blocking), Y are Priority 2
(gating, needs sign-off if deferred), Z are Priority 3/4 (backlog)" — a
concrete remediation plan, not a restated finding count.

## 5. RICEFW delivery governance — the operating rules to name in Section 6

State these as the rules EPAM applies to every RICEFW object on this
engagement (adapt tool names to what the client actually has — SAP Cloud
ALM vs. the client's existing ALM/ChaRM tool, per `dual_maintenance_retrofit.md`):

- **Traceability**: every RICEFW item tracked end-to-end — Requirement →
  Feature → Technical Design → Build Object → Test → Deployment →
  Monitoring.
- **Mandatory design artifacts**: Functional Spec, Technical Spec,
  Interface Spec (if applicable), Security Note, Performance Budget.
- **Quality gates**: ATC/SCI enforced — no Priority 1/2 findings (§4),
  unit test coverage ≥60% for logic, static checks for SQL performance,
  API allow-listing, and no hardcoded values/`SY-UNAME`.
- **Testing & evidence**: test cases, results, and defects tracked in the
  ALM tool; Definition of Done = all evidence linked, tests passed,
  defects closed.
- **Transports/CI-CD**: each transport references its tracking ID; a
  gCTS/CI pipeline (where in use) publishes build/test reports; retrofit
  sequencing rules apply (see `dual_maintenance_retrofit.md`).
- **Interfaces & data quality**: interfaces designed for idempotency,
  retry, and reprocessing; PII classification and payload versioning
  documented.
- **Operations handover**: a Run Book, monitoring KPIs/alerts, rollback
  plan, and support RACI/SLA delivered before go-live — not drafted
  retroactively during Hypercare.
- **A "Done" object** has all traceability links present, quality gates
  passed, monitoring active, and a run book delivered — anything short of
  that is not Done regardless of what the build status says.

## 6. Clean Core / extensibility KPI dashboard shape

If the client has (or will build) a monitoring dashboard for ongoing
extensibility governance, its typical shape is:

- **Technical Debt Score** — aggregate, trending over time, not a
  point-in-time count.
- **Business Modifications count** — genuinely non-Clean-Core objects
  (tier 5, §2), tracked as a number the program should be actively
  reducing, not accepting as a permanent baseline.
- **Unused Customer Objects** — a housekeeping signal; custom objects
  with no recent usage are decommission candidates, not dead weight to
  carry forward into the target system.
- **Clean Core Level A–D distribution** — a maturity classification
  across the custom-code landscape (A = fully Clean Core compliant,
  descending to D = significant non-compliant modification), useful as a
  single Section 6 exhibit showing where the program actually stands, not
  just where it intends to end up.

## 7. What to ask the user / feed into Section 6

1. Is there an existing Design Authority Board (or equivalent — client's
   own Design Board, Change Advisory Board) that will own EDR approvals,
   or does one need establishing for this engagement?
2. What ALM/tracking tool actually holds this traceability — SAP Cloud
   ALM, the client's existing tool, or something to be confirmed at
   Explore? Don't assume SAP Cloud ALM by default.
3. Does `readiness-analysis`'s Chapter 5 output exist yet? If so, pull
   its Priority 1/2/3/4 breakdown directly rather than asking the user to
   re-supply it (§4).
4. Does `conversion-scoping`'s output flag any Changed process whose
   driving Simplification Item forces a genuinely non-Clean-Core (tier 5)
   remediation? If so, that's an `adr-log` candidate — the EDR alone
   isn't enough sign-off for a tier-5 exception; it needs a proper
   decision entry.
5. Is this engagement on a shared/group-wide template landscape (per the
   Instance Strategy decision)? If so, say explicitly in Section 6 that
   Clean Core is a governance requirement across all entities on the
   instance, not just this engagement's own scope.
