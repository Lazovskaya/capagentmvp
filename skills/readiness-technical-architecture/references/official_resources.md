# Official Resources — Technical Architecture

Stable, top-level SAP resource entry points only. Specific deep-linked articles cannot be verified
as live from this environment and must never be fabricated — per this factory's standing rule (see
`knowledge/methodology/brownfield-conversion/confluence-publication-structure.md`'s cross-linking
convention). Cite a specific SAP Note/KBA number as plain text; only turn it into a hyperlink when
the extracted report data itself contains a real URL.

## Stable entry points (safe to link as-is)

- [SAP Help Portal](https://help.sap.com) — SUM (Software Update Manager), DMO, and conversion
  guide documentation.
- [SAP Support Portal / Notes & KBA search](https://support.sap.com/en/my-support/knowledge-base.html) —
  look up SAP Note 2214409 (Compatible Add-ons), 2011192 (De-installation of Add-ons), 2269324
  (Compatibility Scope Matrix), and the downtime-related SUM/DMO notes here.
- [SAP Community](https://community.sap.com) — practitioner blog posts and case studies on
  downtime-optimization techniques (nZDM, DoDMO, NZDT).
- [SAP Readiness Check portal](https://me.sap.com/readinesscheck) — the source tool itself; cite a
  specific analysis deep link only when it appears verbatim in the extracted report data.

## TODO — curate per-engagement

- [ ] Add the release-specific "Compatible Add-ons" Note attachment link for this engagement's
  target release (verify the exact KBA number, e.g. per-release KBAs like 3320264/3493442, against
  the client's actual target release before citing).
- [ ] Add a link to the RISE/Cloud contracting documentation if the client is a RISE customer, to
  ground the NZDT Additional Service question.
- [ ] Add any partner/third-party downtime-tool vendor documentation actually being evaluated for
  this engagement (e.g. SNP CrystalBridge), once confirmed in scope.
