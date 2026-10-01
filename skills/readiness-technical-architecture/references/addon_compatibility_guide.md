# Chapter 2 Deep-Dive — Add-On Compatibility & Active Business Functions

Grounded in SAP's own governing Notes/KBAs and real-world practitioner
guidance. Read this alongside `../../../../knowledge/methodology/brownfield-conversion/readiness-check-interpretation.md`'s
Chapter 2 section — this file goes deeper on the two sub-checks there,
since they're two structurally different problems wearing the same
"Chapter 2" label: one is a software-logistics question, the other is a
business-process question, and treating them the same way is the most
common way this chapter gets under-analyzed.

## 1. Two different mechanisms, not one

- **Add-Ons** are separately installed software components — their own
  SAINT/SPAM package, own namespace, own transport layer. The check is a
  software-logistics comparison: is this exact component/version on SAP's
  compatibility list for the target release.
- **Active Business Functions** are switches inside the *existing*
  SAP_APPL core, turned on/off via the Switch Framework (transaction
  `SFW5`). Nothing is separately installed — activating a business
  function just turns on dormant functionality (BAdIs, screens, menu
  entries) already shipped inside the core.

Consequence for how you read the report: **Add-On findings are primarily
a Basis/technical remediation backlog** (upgrade, uninstall, license).
**Active Business Function findings are primarily a business-process
question** — "does this specific switch combination still exist, and if
not, does the process it enabled still work the same way" — and belong
with a process owner, not just Basis.

## 2. Add-On Compatibility status categories, precisely

The master source is **SAP Note 2214409 ("SAP S/4HANA: Compatible
Add-ons")** — release-specific attachments (separate lists per target,
e.g. 2022, 2023) — cross-referenced by auto-generated per-system KBAs
(e.g. KBA 3320264 for S/4HANA 2022, KBA 3493442 for 2023) titled "The
technical system &lt;SID&gt; contains the following add-ons that are not
compatible with SAP S/4HANA 20XX." How to read each status:

- **Incompatible**: SAP (or the vendor, for partner products) has
  explicitly determined there's no compatible release of this add-on
  version for the target. **Hard blocker** — remove, upgrade, or replace
  with a successor/Compatibility Pack equivalent before conversion.
- **Incompatible (Uninstallable)**: a subset of Incompatible where SAP
  has published de-installation packages (per **SAP Note 2011192,
  "De-installation of SAP Add-ons"**). SUM/SAINT can pull the deletion
  files into the conversion stack — genuinely "won't block conversion,"
  but review promptly, since uninstall still requires SAINT's
  "Uninstallable components" tab, a usage/objects-used-outside-add-on
  check (KBA 2573169), and — critically — validation that no custom code
  depends on the add-on's objects (see §4). **This is usually the
  cheapest real win in the whole chapter**: schedule it as pre-conversion
  cleanup, well before the technical conversion project itself, to shrink
  what SUM has to process later.
- **Unknown**: almost always a third-party/partner add-on SAP has no
  compatibility data for at all (SAP doesn't hold third-party compatibility
  data centrally). **This is typically the single most common status on
  a real report** — most niche ISV bolt-ons (beverage distribution,
  EWM add-ons, regional tax/logistics tools) simply aren't in SAP's
  master data. Treat every "Unknown" row as a vendor-RFI action item
  opened in **week 1** of the project, not revisited near go-live — large
  S/4HANA-ready ISVs often answer in days, smaller/regional vendors can
  take months, and an "Unknown" that turns out incompatible is exactly as
  blocking as a confirmed one, just discovered later if you wait.
- **Compatible (Software Entitlement Required)**: see §3 — this is a
  licensing gate, not a technical one, and needs its own workstream.
- **Certified Third-Party Software / Certified Third-Party Software
  Available**: reflects SAP's ICC (Integration and Certification Center)
  partner registry, a separate mechanism from Note 2214409. "Available"
  usually means a certified successor exists but isn't installed/active
  yet on this system — that's a migration/switch decision, not a
  compatibility fix.

## 3. "Software Entitlement Required" — commercial, not technical

A compatible version of the add-on exists, but **it isn't entitled under
this customer's contract.** This will block conversion exactly like a
technical incompatibility — the fix is purely commercial: **the SAP
Account Executive conversation must start immediately**, not after the
technical backlog is worked through. This often shows up for add-ons that
moved from a bundled/legacy ECC licensing model into a separately-licensed
S/4HANA add-on, or components governed by the **Compatibility Scope
Matrix (SAP Note 2269324)** — the mechanism that governs which classic
ERP functionality remains usable under a Compatibility Pack, and until
when (RISE customers currently through 2030).

**Sizing implication**: AE/procurement/legal cycles are very often the
single longest lead-time item in the whole Chapter 2 backlog — weeks to
months, and outside engineering's control entirely. Track this as its own
parallel workstream from day one, never sequenced after the technical
remediation items; a project plan that only starts the licensing
conversation once the technical items are "done" has silently added that
lead time onto the critical path.

## 4. The most under-estimated cost: custom code coupled to an add-on

Add-ons frequently carry customer enhancements or modifications layered
on top of the add-on's *own* namespace — objects the standard custom-code
scope (usually scoped to the customer's Y/Z namespace) does not
automatically cover. Real project post-mortems consistently flag the same
failure mode: a project scopes "remove/replace this add-on" as a
Basis-only task, schedules the uninstall, and only discovers in
Realization that dozens of Z-programs call the add-on's function modules
or BAdIs directly — triggering a second, unplanned custom-code
remediation cycle late in the project.

**Do this before finalizing the project timeline, not after the uninstall
is scheduled**: run a where-used/ATC scan against the add-on's own
namespace, not just the customer's Z-namespace, whenever an add-on is
being uninstalled or replaced. If `sap-conversion-scoping` is also being
used for this engagement, feed this coupling risk into its custom-code
volume input — it's real remediation effort the standard ATC scope can
silently miss.

## 5. Active Business Functions — the three categories, and why they need a business owner

- **Compatible**: the function (or an equivalent capability) persists in
  S/4HANA — routine, no special action beyond normal simplification-item
  review.
- **Will be deleted**: the function itself is retired. The mapping from a
  legacy ERP business function to S/4HANA functionality is **not always
  1:1** — capability may be absorbed into always-on core functionality, a
  different Fiori-based capability, or genuinely dropped. SAP's own
  guidance when this is business-critical: **open a support case against
  the specific application component that owns the business function**
  to get an authoritative successor mapping — this is a real functional
  question the Readiness Check itself cannot answer, not something to
  infer from the status label alone.
- **Incompatible**: a harder conflict — deleted with no clean successor,
  or customizing/config tied to it will actively break post-conversion.
  Needs a process-owner decision before functional design can be signed
  off: accept the gap, adopt an S/4HANA-native alternative, or (rarely)
  retain via a Compatibility Pack.

**Sequencing matters here**: run a joint IT/business workshop per flagged
business function during Explore/Prepare, using the Readiness Check's
adjacent Business Scenario Recommendations tile as a starting point for
what the S/4HANA-native replacement looks like. Deferring this to
Realization/integration testing is a documented recurring failure mode —
by then, redesigning around a lost capability is far more expensive than
it would have been earlier.

## 6. Triage order for a real project (recommended)

1. **Software Entitlement Required** items — open the AE conversation in
   week 1; longest lead time, least engineering control.
2. **Unknown** add-ons — vendor RFI opened in week 1; treat every one as
   a live action item with an owner and a follow-up date, not a line to
   revisit later.
3. **Incompatible (Uninstallable)** add-ons — schedule as pre-conversion
   cleanup; cheap, well-understood, shrinks later SUM scope.
4. **Incompatible** add-ons (no uninstall package) and **Will be
   deleted** business functions — need a joint technical/business
   workshop each, run during Explore/Prepare, not deferred.
5. Custom-code-to-add-on coupling scan (§4) — run in parallel with 1-2,
   before the project timeline treats any add-on removal as "just a
   Basis task."

## 7. When this chapter comes back as a data-collection gap

This chapter fails to populate more often than most — SAP's own KBAs
document this as a recurring, known failure mode (not a client
misconfiguration to chase blindly): **KBA 2847830** (Add-On Compatibility/
Active Business Functions tiles empty) and **KBA 3616152** (Readiness
Check shows both as "blocked"). The fix in both cases is a support case
under component **SV-SCS-S4R** for a manual re-run/data-fix from SAP —
not something resolvable client-side. The same failure pattern (and the
same component) also affects the adjacent Recommended Fiori Apps tile
(KBA 3346997) and App Availability (KBA 3425520) — if one of these tiles
is empty, check whether its siblings are too; it's often the same
underlying data-collection issue, not four unrelated gaps.

## 8. Feeding this into the rest of the pipeline

- **Section 3.6 (S/4HANA Upgrade Strategy)** — Incompatible/Entitlement-
  Required add-ons are go/no-go gates for the conversion timeline; state
  them as such, not as generic risk-register lines.
- **Section 13 (ADR)** — the Entitlement-Required licensing decision and
  any "Will be deleted"/"Incompatible" business function resolution are
  real architectural decisions with named owners and dates; raise each one
  into `sap-adr-log` as soon as it's identified, mirroring how other
  gating findings (CVI, Instance Strategy) are already handled — don't
  wait for `sap-sad` to draft Section 13 before it's tracked anywhere.
- **`sap-conversion-scoping`** — an add-on being removed/replaced touches
  whichever business processes it supported; route it into that skill's
  Changed list, and flag the custom-code coupling risk (§4) as a
  complexity driver, not a routine technical line item.
