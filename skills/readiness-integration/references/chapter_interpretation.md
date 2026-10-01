# Integration — Chapter Interpretation (Ch. 7)

Extracted from `knowledge/methodology/brownfield-conversion/readiness-check-interpretation.md`
(the cross-topic superset reference) for this skill's own chapter only.

## The core principle (applies to every topic, restated briefly)

**Absence of findings is not absence of risk.** Flat File interfaces routinely show *"No data was
collected for this interface type during the data collection"* — this is a data-collection gap,
not evidence there are no flat file interfaces. Report gaps as their own finding, separate from a
genuinely clean result.

## 7. Required Adjustments for Integration

Categorization scheme to use directly: **Functionality Unavailable / Blocked / Serialization
Issue** (plus an Upgrade Toolset flag for RFC/BAPI, and a Working/Working-with-Restrictions/
Obsolete scheme specific to BW Extractors). These categories imply very different remediation
profiles:

- *Blocked* or *Serialization Issue* interfaces need to be fixed before cutover — treat as harder
  blockers.
- *Functionality Unavailable* interfaces need redesign/rebuild against the target's replacement
  functionality — real remediation work, but plannable rather than an emergency.

Report which bucket dominates; it changes the shape of the Section 5 (Integration Architecture)
remediation plan.

**Two sanity-check patterns worth applying before reporting an interface finding at face value:**

- **Industry-mismatch false positives**: the impact analysis is generated from generic,
  cross-industry simplification-item logic, so it can flag an interface tied to a component the
  client plausibly never uses (e.g. IDoc interfaces flagged purely because they matched *SAP
  Patient Management (IS-H)* logic, on a client with no healthcare footprint). Still name the
  finding in the brief; don't silently drop it without noting why it's likely a false positive.
- **"Not Used" as its own finding, not just a denominator**: the RFC/BAPI usage breakdown
  (Used/Not Used/Referenced/Unknown) often shows a large "Not Used" share — a real decommissioning
  opportunity in its own right, deserving its own line in the brief.

If custom code hasn't been analyzed yet (see `readiness-extensibility`), note explicitly that
Serialization Issue detection for custom function modules and custom/extension IDoc segments is
undetermined, not confirmed zero, until ATC results exist.

## Mapping into the SAP SAD

| Chapter | Feeds SAD section | Also feeds |
|---|---|---|
| 7. Integration | 5. Integration Architecture, 5.6 Technical Debt Register | — |

If this analysis feeds a `sad-drafting` engagement, say so explicitly and route each finding per
this table.
