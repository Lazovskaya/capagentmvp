# Official Resources — Data & Master Data Management

Stable, top-level SAP resource entry points only. Specific deep-linked articles cannot be verified
as live from this environment and must never be fabricated — per this factory's standing rule (see
`knowledge/methodology/brownfield-conversion/confluence-publication-structure.md`'s cross-linking
convention). Cite a specific SAP Note/KBA number as plain text; only turn it into a hyperlink when
the extracted report data itself contains a real URL.

## Stable entry points (safe to link as-is)

- [SAP Help Portal](https://help.sap.com) — Customer Vendor Integration (CVI), HANA sizing, and
  Data Volume Management documentation.
- [SAP Support Portal / Notes & KBA search](https://support.sap.com/en/my-support/knowledge-base.html) —
  look up SAP Note 2743494 (Master Data Consistency Check) and any GL/Asset/Material Ledger
  inconsistency KBAs (e.g. 2714344) here.
- [SAP Community](https://community.sap.com) — practitioner guidance on CVI conversion projects
  and HANA sizing/archiving strategy.
- [SAP Readiness Check portal](https://me.sap.com/readinesscheck) — cite a specific analysis's CVI
  or Financial Data Quality deep link only when it appears verbatim in the extracted report data
  (e.g. `me.sap.com/readinesscheck/Analysis('<id>')/FDQ`).

## TODO — curate per-engagement

- [ ] Add the CVI Cockpit / CVI Pre-Check transaction documentation link for the client's source
  release.
- [ ] Add SAP Information Lifecycle Management (ILM) / Data Volume Management guide links once an
  archiving strategy is scoped.
- [ ] Add sizing benchmark/Quick Sizer links relevant to the target infrastructure choice (RISE
  vs. hyperscaler vs. on-prem), coordinating with `sizing-analysis`.
