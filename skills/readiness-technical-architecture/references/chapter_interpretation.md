# Technical Architecture — Chapter Interpretation (Ch. 2, 9.5)

Extracted from `knowledge/methodology/brownfield-conversion/readiness-check-interpretation.md`
(the cross-topic superset reference) for this skill's own chapters only.

## The core principle (applies to every topic, restated briefly)

SAP's own Readiness Check export does **not** synthesize a recommendation for you. **Absence of
findings is not absence of risk**: a chapter can come back empty because the analysis was never
run, not because there's nothing to find. Report every gap phrase as its own finding, separate
from a genuinely clean result.

## 2. Minimum System and Landscape Requirements

Add-On Compatibility and Active Business Functions. If populated: any add-on flagged incompatible
is a **hard blocker** for conversion until resolved — treat as go/no-go, not routine housekeeping.
If this chapter reports "could not be performed" for either check, say so explicitly and recommend
re-running the underlying data collection (support case, component SV-SCS-S4R) before finalizing a
conversion project plan.

**Read `references/addon_compatibility_guide.md` for this chapter's real depth** — Add-Ons are a
software-logistics/Basis question via SAINT/SPAM; Active Business Functions are a business-process
question via the Switch Framework. The full category breakdown (Incompatible / Uninstallable /
Unknown / Entitlement-Required / Certified Third-Party), the licensing-gate nature of "Entitlement
Required," and the commonly under-estimated custom-code-coupled-to-an-add-on risk all live there.

## 9.5. Planned Downtime Calculator

Gives a concrete estimated total technical downtime. This number is a direct, load-bearing input
to Section 9 (Operations & Continuity) cutover planning and Section V/NFR availability targets —
if the business's tolerance for a cutover window is smaller than this estimate, that's a real
conflict to surface now, not discover during cutover rehearsal.

**Read `references/planned_downtime_guide.md` when this number needs to be negotiated down** — it
covers the real tiers between "accept the raw estimate" and "buy the full NZDT service" (nZDM,
DoDMO, third-party tools, in-house builds), which phases each one actually shrinks, real
cost-per-hour-of-downtime benchmarks, and the RISE-specific contracting trap (NZDT for conversion
is an Additional Service, not included by default).

## 9.1-9.2. Recommended Fiori Apps / App Availability (minor note)

Not this skill's main focus, but reported here as a minor note per
`knowledge/methodology/brownfield-conversion/confluence-publication-structure.md`'s chapter
mapping: **9.1 Recommended Fiori Apps** (role-ranked app counts) is change-management/training
scope, not a technical risk. **9.2 App Availability** (apps Deprecated/Unavailable/"Available with
Successor" in the target release) requires 12+ months of usage data and is client-dependent -- if
it comes back empty, check whether that's a genuine clean result or a usage-data-window gap before
reporting "no impacted apps."

## Mapping into the SAP SAD

| Chapter | Feeds SAD section | Also feeds |
|---|---|---|
| 2. Add-On/Business Functions blockers | 3.6 S/4HANA Upgrade Strategy | 13. ADR (go/no-go gate) |
| 9.1/9.2 Fiori & App Availability | 8.4 SAP Fiori Architecture | — |
| 9.5 Planned Downtime Calculator | 9. Operations & Continuity (cutover) | V. Key Quality Attributes (Availability target) |

If this analysis feeds a `sad-drafting` engagement, say so explicitly and route each finding per
this table.
