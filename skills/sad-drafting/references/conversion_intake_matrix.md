# Conversion Intake Matrix — document & information requests, section by section

This file exists because a Conversion SAD written from a five-question
interview is thin no matter how well it's worded — the difference between a
"Rudimentary" and a "Fully Developed" section (per
`references/EPAM_Generic_SAD_Rubric.xml`'s quality scale) is almost always
*specificity that only exists in a real artifact the client already has*:
a network diagram, a Readiness Check report, an IAM policy document. This
matrix exists so the skill asks for the right artifact once, up front, per
section — instead of discovering mid-draft that a section can't go past
"Partially Developed" without information nobody asked for.

## How to use this matrix

1. Read the **playbook's priority table** first (`playbooks/conversion.md`) to
   know which sections are High/Medium/Conditional/Lower for the identified
   sub-type (Greenfield/Bluefield/Brownfield). Spend intake effort where the
   playbook says the section is High priority — the same document request for
   a Lower-priority section is a courtesy question ("do you have this?"),
   not a blocker.
2. Before interviewing, generate one consolidated **document/information
   request list** for the user from the "Ask the client for" rows below,
   filtered to what's High/Medium priority for their sub-type. Send it as a
   single checklist — this respects the user's time far better than
   trickling questions in one at a time as you draft each section, and lets
   them go collect artifacts from colleagues in parallel while you start
   drafting the sections that don't need them.
3. Whatever isn't available, fall back to the **"If unavailable, ask"**
   questions — these get you enough to write an honest, appropriately-scoped
   section (including a stated assumption or a flagged TBD) rather than a
   blocked one.
4. GF/BF/BW-specific notes below only appear where the sub-type materially
   changes what "detailed" means for that section — where a row doesn't call
   out a sub-type, treat the guidance as common to all three.

---

## 1. Introduction

**Ask the client for:** the programme business case / charter, the SOW or
statement of work defining contractual scope, an existing stakeholder/org
chart for the programme, and (if one exists) the RAID log.

**If unavailable, ask:** What triggered this programme (ECC end-of-maintenance
2027, M&A, a specific business pain point)? Who is the executive sponsor, and
who are the working-level owners for each of the ten architecture domains in
1.3 (they don't need to be finalized, but name a placeholder owner rather
than leaving it blank)? What's explicitly declared out of scope, and why?

**Sub-type notes:**
- *Greenfield*: expect the business case to reference process redesign KPIs,
  not just a technical migration — if it doesn't, flag this as a gap; a
  greenfield without articulated redesign goals often turns into an
  unplanned brownfield mid-project.
- *Bluefield*: get the list of **all source systems** being consolidated
  now, in 1.3/1.4 — an incomplete source-system list here quietly corrupts
  scope in every later section (data, integration, security all need to
  enumerate per-source-system state).

## 2. Solution Landscape

**Before anything else in this section**: how many *production instances*
the target landscape will have is itself a decision, not a given — run it
through `references/instance_strategy_decision_matrix.md` rather than
defaulting to "one instance" or copying whatever the current landscape
happens to have. This is especially non-optional for Bluefield (landscape
consolidation is literally an instance-count decision) and worth at least
confirming explicitly for Greenfield and Brownfield too.

**Sizing methodology is a related, equally non-optional decision** — see
`references/sizing_strategy_decision_matrix.md` for which method (Quick
Sizer, HANA Sizing Report, Expert Sizing, RISE Standard/Tailored) fits this
engagement, and note that a `readiness-analysis` analysis (if one exists)
already contains the HANA Sizing Report output — reuse it rather than
re-running the check.

**Ask the client for:** current SAP Sizing Report / SAP Readiness Check
output (gives HANA DB RAM sizing and system count), any existing instance
strategy decision paper or Design Authority/KDD minutes if this decision has
already been made, any existing BTP global account structure export
(subaccounts/directories/entitlements), the target client/company code list,
and the current end-user device/OS inventory if workstation requirements
(2.6) are in scope.

**If unavailable, ask:** How many systems in the target landscape (standard
EPAM recommendation is 5: DEV/QA/TEST/PRE-PROD/PROD — confirm deviations and
why)? Which SAP BTP services are actually planned for use (don't assume the
full catalog — ask which of Integration Suite, Build Apps, Document
Management, etc. are contracted)? Is RISE with SAP the deployment model, and
if so has the RISE service order/scope document been shared?

**Sub-type notes:**
- *Brownfield*: request the **current production landscape topology**
  (existing SIDs, current release/SP level, current sizing) — the target
  landscape here is largely a lift, not a redesign, so accuracy about the
  *current* state matters more than for the other two sub-types.
- *Bluefield*: request the landscape topology for **every source system**
  being consolidated, not just the primary one.

## 3. Release & Transport Management

**If the legacy ECC system keeps running during the project** (the normal
case for Brownfield/Bluefield): work through
`references/dual_maintenance_retrofit.md` before drafting this section —
dual maintenance/retrofit approach (SolMan, Cloud ALM, gCTS, or manual
tracking) is a real decision this section needs to state, not an assumed
detail. It also directly depends on the instance strategy decision (§2) —
resolve that first where both are open questions.

**Ask the client for:** the existing Transport Domain/Controller
configuration (if a landscape already exists), any documented transport
governance rules or release calendar, and the current SAP release/support
package level (for Brownfield/Bluefield, this is often available directly
from the Readiness Check).

**If unavailable, ask:** Is this landscape joining an existing shared
transport domain (e.g., other countries/entities already live), or is it
standalone? What's the target S/4HANA release and Feature Pack Stack, and
has this been confirmed with the SAP TAM? Is there an existing DevSecOps
pipeline (CI/CD tool, static code scanning) that needs to be preserved or
replaced?

**Sub-type notes:**
- *Brownfield*: this section is High priority per the playbook — push for
  the actual **DMO (Database Migration Option) approach** decision
  (with/without system move, one-step vs. multi-step) and the confirmed
  target release; these are usually already decided by the time a SAD is
  being written and should be stated as fact, not left open.
- *Greenfield*: lower stakes here since there's no legacy transport history
  to reconcile — a standard release/transport setup is usually sufficient
  detail.

## 4. Security Architecture

**Ask the client for:** the existing enterprise IAM/IdP architecture
document (Azure AD/Entra ID, Okta, ADFS, etc.), current SAP role/
authorization design if one exists (role matrix, PFCG role list), any SoD
(Segregation of Duties) rule set or GRC tool configuration (e.g. SAP Access
Control ruleset export), and the enterprise network security policy /
segmentation standard.

**If unavailable, ask:** What's the enterprise identity provider, and is
federation to the new SAP landscape already planned (protocol: SAML/OIDC)?
Who currently owns Firefighter/emergency access processes, and does that
carry forward unchanged? Is there a GRC tool in place today, or is this
project introducing one? Are there specific compliance regimes (SOX, GDPR,
industry-specific) that drive SoD or audit requirements?

**Sub-type notes:**
- *Greenfield*: this is a real design exercise — push for role design
  principles (business-role-derived vs. technical-role-derived), not just
  "TBD, to be designed in Realize phase" — that phrasing in a SAD signals an
  undone design, which the rubric would score as Rudimentary.
- *Brownfield/Bluefield*: request the **current** role list/SoD ruleset
  explicitly — the SAD should state what's inherited unchanged vs. what
  needs rework (e.g. new S/4HANA-specific authorization objects that didn't
  exist in ECC).

## 5. Integration Architecture

**Ask the client for:** an existing interface inventory/catalogue (list of
point-to-point and platform-mediated integrations with source/target,
protocol, frequency), current PI/PO or middleware landscape documentation if
one exists, and any integration platform contract/entitlement info (CPI
tenant size, Integration Suite license scope).

**If unavailable, ask:** How many external/third-party systems does this
landscape need to talk to, and which are must-have for go-live vs.
nice-to-have? Is there an existing PI/PO installation that needs a migration
plan to CPI, or is this a clean integration build? What's the volume/
frequency profile for the highest-traffic interfaces (this drives the
platform sizing conversation later)?

**Sub-type notes:**
- *Brownfield*: request the **current interface inventory** as the anchor
  document — Section 5.6 (Integration Technical Debt Register) only works
  if you know what exists today and can flag what's deprecated/redundant.
- *Bluefield*: request the interface inventory **per source system** —
  consolidation usually reveals duplicate integrations to the same
  third-party (e.g. two ECC systems both calling the same bank) that should
  be rationalized to one, and that rationalization decision belongs in this
  section.
- *Greenfield*: fewer legacy artifacts to request; focus questions on
  target integration patterns and platform choice instead.

## 6. Extensibility Architecture (Clean Core)

**Ask the client for:** SAP Readiness Check output specifically for **custom
code** (or a Custom Code Migration app export), a list of currently used
BAdIs/user-exits/enhancement spots if no automated report exists, and any
existing extensibility governance policy (who can build what, on which
platform — BTP ABAP Environment, Kyma, CAP, etc.).

**If unavailable, ask:** Roughly how much custom code (Z-objects, count or
LOC) exists in the current system, and is any of it known to be
business-critical vs. dead code? Is there an existing Clean Core policy or
target Clean Core Level the client has already committed to, or is that
still to be decided? What's the client's appetite for retiring vs.
re-platforming existing customizations onto BTP-based extensions?

**Sub-type notes:**
- *Brownfield*: this is High priority — the Custom Code Migration app / SAP
  Readiness Check custom-code output is close to mandatory for a real
  section here; without it, be explicit that the remediation effort is
  currently unsized (a real risk, not just a documentation gap — say so in
  Section 12/VIII.XI Risks too).
- *Greenfield*: no legacy code to remediate — push instead for the
  **decision framework** (6.2) itself: what criteria decide "extend on BTP"
  vs. "in-app extensibility" vs. "don't extend, adopt standard" for this
  specific programme.
- *Bluefield*: request custom code inventories **per source system** —
  remediation scope and Clean Core target may reasonably differ by source
  system if they're being consolidated at different maturity levels.

## 7. Data Architecture

**Ask the client for:** current data volumes by key object (customers,
vendors, materials, open items, historical documents — usually available
from Basis/DBA teams or a sizing report), any existing data governance/MDM
policy document, data residency/sovereignty requirements (especially for
multi-country landscapes), and the current archiving policy/retention
schedule if one exists.

**If unavailable, ask:** How much historical transactional data actually
needs to migrate vs. stay accessible via read-only archive/reporting? Is
there a Master Data Management tool in place today (SAP MDG or otherwise),
or is this in scope to introduce? Are there specific data residency
constraints (e.g. GDPR, data must stay in-region) that constrain hosting or
replication choices made elsewhere in the document (Section 10)?

**Sub-type notes:**
- *Bluefield*: this is the High-priority center of gravity for this
  sub-type — explicitly request (or ask about) the **selective transition
  tool** being used (e.g. SNP Bluefield, SAP LT), and what the
  cutoff/selection criteria are (e.g. "last 2 fiscal years of open items
  migrate; older data stays in a decommissioned system with read access").
  Without naming the tool and the selection rule, this section cannot
  legitimately score above "Partially Developed."
- *Greenfield*: request confirmation of the **migration scope decision**
  (typically master + org data + opening balances only) — ask explicitly
  whether any historical transactional data is being carried over, since
  "true" greenfield sometimes still needs some financial history for
  audit/comparison reasons.
- *Brownfield*: less of a design section — the data effectively moves as-is;
  focus questions on any DB/technology-level changes (e.g. any non-HANA DB
  today needs migration to HANA regardless of DMO path).

## 8. Output Management & User Experience

**Ask the client for:** current outbound/inbound email (SMTP) configuration
if one exists, current print infrastructure inventory (printer types,
locations, driver requirements — relevant for warehouse/plant printing),
and any existing Fiori launchpad configuration or UX standards document.

**If unavailable, ask:** Are there business-critical print scenarios
(shipping labels, checks, shop-floor documents) with specific hardware
dependencies that must be preserved? Is there an existing corporate email
relay/gateway the SAP system needs to integrate with for outbound
notifications? Any accessibility or localization (language/locale) UX
requirements beyond SAP standard?

**Sub-type notes:** Sub-type has limited impact on this section for any of
the three approaches — treat it as Medium priority generally, higher only if
the client has unusually specific print/output hardware dependencies (common
in manufacturing/logistics).

## 9. Operations & Continuity

**Ask the client for:** the signed RISE with SAP service order/SLA
(defines incident priority levels, availability commitments, DR RPO/RTO by
contract), current monitoring tool inventory, and existing job scheduling
inventory/calendar if migrating an existing scheduler.

**If unavailable, ask:** Is RISE with SAP confirmed, and if so which SLA
tier? What are the actual business-driven RPO/RTO requirements (don't just
default to whatever SAP's standard SLA offers — ask if the business needs
tighter continuity than the contract provides, which would require
additional architecture, e.g. a secondary DR region)? What's the current job
scheduling tool, and does it need to be replaced or does it integrate with
the target landscape?

**Sub-type notes:**
- *Brownfield*: High priority — the existing ops model (current SLAs,
  current DR setup) is the baseline this section measures change against;
  request it explicitly rather than describing only the target state.

## 10. Infrastructure

**Ask the client for:** current network topology diagram, firewall rule
export or port requirement list if integrating with existing on-prem
systems, current DNS zone configuration, and any hosting contract details
(hyperscaler, region, existing landing zone).

**If unavailable, ask:** Which hyperscaler/region hosts (or will host) the
target landscape, and is this dictated by the RISE contract or a separate
customer-managed decision? Are there specific network security zones
(DMZ, internal-only, partner-facing) the new landscape must respect? Who
owns infrastructure changes operationally post go-live (this feeds directly
into the 10.7 RACI matrix — don't leave that RACI as a placeholder table)?

**Sub-type notes:**
- *Brownfield*: usually largely inherited — request the **current**
  infrastructure details and be explicit about what's reused vs.
  re-platformed (e.g. moving from on-prem to RISE hyperscaler hosting is
  itself a major infrastructure change even in an otherwise "as-is"
  technical conversion).

## 11. Project Toolchain & Standards

**Ask the client for:** existing naming convention standards (SID, transport
request, role, user ID conventions) if this landscape joins an existing
estate, and current test automation / security scanning tool licenses
(Tricentis Tosca, Onapsis, or equivalents) if already contracted.

**If unavailable, ask:** Does this programme need to conform to an existing
naming convention (common in Rollout and Bluefield-consolidation cases), or
is this a fresh landscape free to define its own? What test automation and
security scanning tooling is already licensed/mandated by the customer's
enterprise standards?

**Sub-type notes:** Generally Lower priority for all three sub-types unless
naming conventions must align with an existing estate (then treat as
Medium — inconsistent naming across a shared transport domain or shared
BTP global account causes real operational pain later).

## 12. Non-Functional Requirements

**Ask the client for:** any existing NFR document/SLA target sheet, and — if
available — a Quality Attribute Workshop (QAW) output. If none exists,
this section (and the generic rubric's parallel Section V, which is
Mandatory) needs to be built from a live workshop with stakeholders, not
inferred.

**If unavailable, ask:** run (or recommend the client run) a lightweight
QAW: which 5-7 quality attributes matter most for this programme (see the
attribute list and metric examples in
`references/EPAM_Generic_SAD_Rubric.xml`, chapter V), and what are the
measurable targets for each? Avoid letting this section default to generic
attributes like "Performance" and "Security" with no metric — that's exactly
what the rubric scores as Rudimentary.

**Sub-type notes:** Brownfield conversions often have an easy source of real
NFR targets: **current production performance/availability metrics** are a
legitimate baseline ("must not regress below current p95 response time of
X ms") — ask for them explicitly rather than starting from a blank sheet.

## 13. Architecture Decision Log

**Ask the client for:** minutes or outputs from any architecture governance
board / design authority meetings already held, and any prior decision log
if this programme has been running for a while before the SAD was
commissioned.

**If unavailable, ask:** What are the 3-5 decisions so far that were hardest
to reach agreement on, or that a stakeholder pushed back on? Those are
almost always the ones worth logging with rationale — a decision log full of
uncontroversial defaults adds bulk without adding traceability value. Who
has decision authority for changes to this log going forward?

**Sub-type notes:** Section 13.3 (Migration-Approach Decisions) exists
specifically to capture why *this* sub-type (GF/BF/BW) was chosen over the
alternatives — always fill this even if the decision predates the SAD;
reconstructing the rationale after the fact is still valuable and often
revealing about what constraints actually drove the choice.

## 14. Appendices

**Ask the client for:** any existing glossary/terminology standard the
organization already uses (to avoid inventing conflicting definitions), and
a list of reference documents already cited informally elsewhere in
conversations (SOW, Readiness Check reports, RISE contract, etc. — this
section should end up as the consolidated index of everything requested
above).

**If unavailable, ask:** nothing new — this section is a byproduct of
everything gathered for sections 1-13; populate it last.
