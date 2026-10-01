---
name: readiness-security
description: Assess the Security topic for a Brownfield S/4HANA conversion from whatever auth-adjacent Simplification Items scatter across a SAP Readiness Check report -- the report has no dedicated security chapter, so this skill's main job is stating that gap explicitly and scoping a real security assessment, not fabricating coverage that doesn't exist. Use in Discover alongside the other readiness topics, or standalone once a security/authorization assessment approach is agreed with the client.
---

# Readiness Check — Security

One of 6 topic-scoped skills split out of the former monolithic `readiness-analysis` (see
`knowledge/methodology/brownfield-conversion/confluence-publication-structure.md` for the full
6-folder taxonomy this mirrors). Unlike the other 5 topic skills, this one has **no dedicated
Readiness Check chapter to extract from** -- its main output is often "here's what's missing,"
not "here's what the report found."

## When to use

Discover phase, alongside the other readiness topics -- or standalone, once the client agrees to
scope a real security/authorization assessment (this skill's own recommended next step). Does not
require `readiness-analysis` to have run first.

## Inputs (contract)

- **Required:** the Readiness Check export (used only to pull the handful of auth-adjacent
  Simplification Items scattered across Chapters 2/3 -- there is no dedicated security chapter).
- **Required:** `engagement_id`, to locate/write the cached extraction.
- **Optional:** the client's existing authorization concept document, if one exists -- this skill
  cannot assess authorization design without it.

## Steps

1. **Reuse or run the extraction.** Check for
   `workspace/<engagement_id>/brownfield-sad/rc_data/rc_data.json` first; run it yourself if
   missing.
2. **Pull only the auth-adjacent Simplification Items** listed in `references/chapter_interpretation.md`
   (New Default Security Settings, Workflow authorization, Authorization Objects in QM,
   Authorization Concept for Supplier Invoice, Business User Management, SSCR license key) --
   these live in Chapters 2/3, owned by `readiness-technical-architecture` and
   `readiness-business-architecture` respectively; don't re-interpret them here, just note their
   security-relevant angle and cross-reference.
3. **State the coverage gap explicitly** -- do not present the absence of a security chapter as a
   clean result. This is itself the primary finding.
4. **Recommend scoping a dedicated security & authorization assessment** as an Explore-phase
   activity, per `references/chapter_interpretation.md`.
5. **Cite SAP references per the standing rule**: plain text for a Note/KBA number; hyperlink only
   when the extracted data itself contains a real URL (see `references/official_resources.md`).
6. Once a security assessment approach is agreed with the client, raise it into `adr-log` as its
   own entry.

## References

- `references/chapter_interpretation.md` -- why there's no dedicated chapter, and what auth-
  adjacent items exist instead.
- `references/official_resources.md` -- stable official SAP resource entry points + curation
  placeholders (never fabricate a specific deep-link URL). This is the topic most in need of
  per-engagement curation, given the thin default source data.

## Output

- **`simplification-impact-report` artifact**, scoped to security/authorization -- expect this to
  be a short document by design, not an under-delivered one.
- Feeds SAD Section 10 (Security and Authorization), currently a stub (`*TBC*`) in this factory's
  `brownfield-sad` template until a real assessment happens.
- When publishing to Confluence, this topic's content goes under "05 Security" per
  `knowledge/methodology/brownfield-conversion/confluence-publication-structure.md`.

## Driver

Main driver: architect (invoked by the Brownfield SAD Authoring Agent, or directly by the user for
a single-topic update).

## Status

In test -- split out of `readiness-analysis`. Original content (not extracted from the master
interpretation guide, since it never covered this topic) -- treat as a first draft pending the
user's own per-topic knowledge curation.
