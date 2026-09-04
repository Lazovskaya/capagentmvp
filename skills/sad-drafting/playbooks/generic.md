# Playbook: Generic Implementation (fallback)

Use this playbook when the engagement doesn't cleanly match Rollout or
Conversion (Greenfield/Bluefield/Brownfield) — e.g. presales/pre-contract
work, a fast-track discovery engagement, a solution implementation that isn't
an S/4HANA move at all (e.g. a standalone BTP/CPI integration project, a
GRC/GRDC implementation, a Fiori/UX modernization project without a
conversion behind it), or any case where the user can't yet say which
approach applies.

Also route here — and say so explicitly to the user — when the project is a
recognizable SAP solution implementation that isn't S/4HANA-conversion-shaped
at all, such as **migrating from SAP BPC to Group Reporting Data Collection
(GRDC)**. Don't force-fit it into the Greenfield/Bluefield/Brownfield
vocabulary (those terms are specific to S/4HANA transition approaches and
will confuse reviewers if misapplied to a planning/consolidation tool
migration). Instead:
- Treat it like a scoped solution implementation: Section 7 (Data
  Architecture) carries the data model mapping from BPC to Group Reporting
  data models; Section 6 (Extensibility) covers any custom BPC scripts/BADIs
  that need a GRDC-native equivalent; Section 1.3/1.4 should scope explicitly
  to the consolidation/reporting capability rather than the whole S/4HANA
  landscape.
- Flag to the user if you don't have enough EPAM/SAP-specific reference
  material on this migration path bundled in this skill — say so rather than
  inventing GRDC specifics from general knowledge alone, and suggest they
  supply EPAM's BPC-to-GRDC methodology docs if one exists, so a dedicated
  playbook can be added later.

## Approach

Because the engagement type is unclear or non-standard, don't force depth
everywhere. Lean on the EPAM_Generic_SAD_Rubric.xml importance flags
(Mandatory/Recommended/Conditional/Optional) rather than the SAP-specific
weighting used in the other playbooks:

1. Always fill Mandatory sections properly: Requirements (IV), Key Quality
   Attributes (V), Target Architecture (VII, especially VII.II Logical View).
2. For Conditional sections, apply the stated condition literally — if the
   condition doesn't clearly hold (e.g. "if this is a brownfield project"),
   leave it out rather than guessing, and note in Scope (II.II) why it was
   excluded.
3. Keep Executive Summary (I) light until the rest of the document is
   drafted — it should summarize, not lead, the real content.
4. Be explicit in Scope (1.3/1.4 in the SAP docx, II.II in the generic rubric)
   about what kind of engagement this is and why the standard playbooks
   didn't apply — this is useful signal for whoever picks up the document
   later, and prevents them from expecting Rollout- or Conversion-specific
   content that was deliberately never in scope.

## Questions to ask the user

1. What's actually being delivered — is there an SAP product/module at the
   center (e.g. Group Reporting, BTP integration, Fiori), or is this genuinely
   presales-stage and the scope itself is still being defined?
2. Is there an existing SAP landscape this plugs into, or is it standalone?
3. Who is this SAD for — final sign-off audience, or an internal working
   draft to support a proposal/estimate? (This changes how much rigor Section
   V Key Quality Attributes and the Architecture Decision Log actually need
   right now.)
4. Is there any EPAM methodology/reference material specific to this
   engagement type that should inform the draft, beyond this skill's bundled
   references?

## Common pitfalls

- Padding out sections that don't apply just to "fill the template" —
  an honest "out of scope for this engagement, see Section II.II" is more
  useful than invented content.
- Silently reframing a non-S/4HANA engagement (like a BPC→GRDC migration) into
  Greenfield/Bluefield/Brownfield language just because those terms are
  familiar — that mislabels the actual risk profile of the project.
