# Security — Chapter Interpretation (no dedicated chapter)

**Important scoping note, stated up front**: the SAP Readiness Check for SAP S/4HANA Conversion
report has **no dedicated security or GRC chapter**. Nothing in
`knowledge/methodology/brownfield-conversion/readiness-check-interpretation.md` (the cross-topic
superset reference) covers this topic, because there is nothing there to extract. This file is
original guidance for this skill, not an extraction.

## The core principle (applies to every topic, restated briefly)

**Absence of findings is not absence of risk** — and this topic is the clearest possible
illustration of that principle. The Readiness Check's silence on security is not a clean result;
it's simply outside what the report was ever designed to check.

## What to look for instead

Auth-adjacent Simplification Items scattered across other chapters, none of which amount to a real
security assessment on their own:

- **New Default Security Settings** — a generic S/4HANA conversion item; requires reviewing which
  new defaults apply to the client's landscape.
- **Workflow authorization/user-jobs changes** — part of the generic technical conversion
  checklist (Chapter 3 activities).
- **Authorization Objects in QM** — Quality Management-specific authorization object changes.
- **Authorization Concept for Supplier Invoice** — part of the Invoice-to-Pay Simplification Item
  set (see `readiness-business-architecture`).
- **Business User Management** — tied to the Business Partner Approach item.
- **SSCR license key** — commonly one of the ST03N-gap items (relevance not yet determined) — see
  `readiness-business-architecture`'s `references/simplification_items_guide.md` §3.

None of these amount to a role redesign, segregation-of-duties (SoD) analysis, or GRC Access
Control / Process Control review.

## What's missing, and what to recommend

- No authorization/role redesign assessment.
- No segregation-of-duties analysis.
- No GRC tooling review (Access Control, Process Control, Risk Management) or its S/4HANA
  compatibility.
- No audit/compliance requirement mapping specific to the client's industry or regulatory
  footprint.

Recommend scoping a dedicated security & authorization assessment as its own Explore-phase
activity — do not treat the Readiness Check's silence on this topic as a clean result. This maps
to the SAD's own "Security and Authorization" section, which is a stub (`*TBC*`) in this factory's
`brownfield-sad` template until a real assessment happens.

## Mapping into the SAP SAD

| Source | Feeds SAD section | Also feeds |
|---|---|---|
| Scattered auth-adjacent Simplification Items (no dedicated chapter) | 10. Security and Authorization (currently a stub) | 13. ADR, once a security assessment approach is agreed |
