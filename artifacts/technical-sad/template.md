# Technical SAD (Solution Architecture Document)

- **Assembled by:** sad-assembly (`EPMCSAPAI-290`)
- **Generated at (UTC):**
- **Version:**

Technical composition only — the business part (scope, timeline, commercial content) is explicitly
excluded, even where a domain output includes it.

## Domain sections

One row per domain-strategy agent, in this fixed order — never reordered based on which domains
have output this run.

| Domain (ticket) | Status | Summary | Open issues |
|---|---|---|---|
| Solution Landscape (EPMCSAPAI-275) | Available / Missing / Inconsistent | | |
| Release & Transport Management (EPMCSAPAI-281) | Available / Missing / Inconsistent | | |
| Security (EPMCSAPAI-282) | Available / Missing / Inconsistent | | |
| Integration (EPMCSAPAI-283) | Available / Missing / Inconsistent | | |
| Extensibility / Clean Core (EPMCSAPAI-284) | Available / Missing / Inconsistent | | |
| Data (EPMCSAPAI-285) | Available / Missing / Inconsistent | | |
| Output Management & UX (EPMCSAPAI-286) | Available / Missing / Inconsistent | | |
| Operations & Continuity (EPMCSAPAI-287) | Available / Missing / Inconsistent | | |
| Infrastructure (EPMCSAPAI-288) | Available / Missing / Inconsistent | | |
| Project Toolchain & Standards (EPMCSAPAI-289) | Available / Missing / Inconsistent | | |

A `Missing` row reads: "MISSING — no EPMCSAPAI-<n> output available." Do not delete or skip a row
for a domain with no output — the gap itself is required information for the reviewing architect.

## Cross-domain conflicts

Surfaced for architect review only — this document does not resolve them.

| Domains involved | Conflict description | Status |
|---|---|---|
| | | Needs architect review |

## Architecture views

Include a Mermaid C4 diagram (`C4Context` or `C4Container`, per
`docs/skill-design-conventions.md` #9) here once at least two domains with topology-relevant output
(e.g. Solution Landscape, Integration, Infrastructure) are available. Omit this section entirely
rather than drawing a diagram from a single domain or from missing domains.

## Missing domains summary

Plain list of every `EPMCSAPAI-<n>` domain still `Missing` this run, for quick scanning without
reading the full domain-sections table.
