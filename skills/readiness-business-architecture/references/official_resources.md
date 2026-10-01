# Official Resources — Business Architecture

Stable, top-level SAP resource entry points only. Specific deep-linked articles (a particular
`help.sap.com` guide page, a particular SAP Note's content) cannot be verified as live from this
environment and must never be fabricated — per this factory's standing rule (see
`knowledge/methodology/brownfield-conversion/confluence-publication-structure.md`'s cross-linking
convention). Cite a specific SAP Note/KBA number as plain text; only turn it into a hyperlink when
the extracted report data itself contains a real URL.

## Stable entry points (safe to link as-is)

- [SAP Help Portal](https://help.sap.com) — official product documentation, including S/4HANA
  Simplification Item documentation sets.
- [SAP Support Portal / Notes & KBA search](https://support.sap.com/en/my-support/knowledge-base.html) —
  look up a specific SAP Note or KBA number cited in a finding (e.g. SAP Note 2913617) here.
- [SAP Community](https://community.sap.com) — practitioner discussion, blog posts on
  Simplification Item remediation patterns.
- [SAP Readiness Check portal](https://me.sap.com/readinesscheck) — the source tool itself; a
  specific analysis's deep link (e.g. `me.sap.com/readinesscheck/Analysis('<id>')`) is safe to
  cite only when it appears verbatim in the extracted report data for that engagement.

## TODO — curate per-engagement

- [ ] Add the specific S4TWL / Simplification Item Catalog app link for this engagement's target
  release (SAP ONE Support Launchpad or embedded Fiori app, S/4HANA 1709+).
- [ ] Add links to any client-specific SAP Notes referenced in the engagement's actual findings
  (only after confirming the exact Note number and content against SAP Support Portal directly).
- [ ] Add a link to the RBA/RSA catalog reference material used by `conversion-scoping`, if the
  client has a specific version/edition.
