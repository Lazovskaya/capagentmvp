# Playbook: Conversion (Greenfield / Bluefield / Brownfield)

"Conversion" here is used loosely to mean any move to (or major transformation
within) S/4HANA. The three SAP-standard approaches make very different
promises to the business, and that difference should visibly shape which
sections of the SAD carry the most weight. Ask the user which one applies
before drafting — if they're not sure, the questions below help disambiguate.

**Before interviewing ad hoc, read `references/conversion_intake_matrix.md`.**
It's a section-by-section list of exactly which documents/artifacts to
request from the client and which fallback questions to ask if a document
isn't available, for all 14 sections of the SAP SAD template. Generate one
consolidated document/information request list from it (filtered to the
High/Medium-priority sections below for the identified sub-type) and send it
to the user as a single checklist before drafting — this is what turns a
generic-sounding SAD into one with real, decision-grade specifics, and it
respects the user's time better than trickling questions in section by
section.

Disambiguation, in one line each:
- **Greenfield** = new implementation. Business processes are redesigned;
  historical data is mostly not carried over (maybe balances/open items only).
- **Brownfield** = system/technical conversion. Existing business processes
  and configuration are preserved as-is; the change is technical (ECC →
  S/4HANA, on-prem → RISE, etc.). Custom code remediation is the central
  technical activity.
- **Bluefield** = selective data transition / hybrid. Some scope is
  redesigned (like greenfield), some is technically converted and carried
  forward (like brownfield) — typically via SAP-certified tools (e.g. SNP
  Bluefield, SAP Landscape Transformation). Landscape consolidation (merging
  multiple ECC systems into one S/4HANA) is a common Bluefield driver.

## Sections that matter most, by sub-type

### Greenfield

| Priority | Section | Why |
|---|---|---|
| High | 1.1 Programme Context, IV.I Business Goals (generic rubric) | Greenfield is business-transformation-led; the "why" carries real weight and should be traceable to specific process redesign decisions, not just "modernize the ERP". |
| High | 6. Extensibility Architecture (Clean Core) | No legacy custom code to carry forward — this is the best (and often only) chance to set a strict Clean Core policy from day one. Document the extensibility decision framework, not just the target state. |
| High | 7.1 Data Migration Architecture | Full data migration strategy: what's migrated (master + configurable minimum of history) vs. what's left behind/archived. |
| High | 4. Security Architecture | New IAM/SSO/role design from scratch — this is a real design section, not "as documented elsewhere". |
| Medium | 5. Integration Architecture | New integration landscape; document integration patterns and platform choice deliberately. |
| Medium | 2.1 System Landscape — Sizing | No source system to measure, so this runs on `references/sizing_strategy_decision_matrix.md`'s Quick Sizer path — size from expected usage, not real data, and say so explicitly. |
| Lower | 3.5/3.6 System Refresh / Upgrade Strategy | Less central — there's no legacy system generating conversion-specific risk. |

### Brownfield

| Priority | Section | Why |
|---|---|---|
| High | 3.5 System Refresh Strategy, 3.6 S/4HANA Upgrade Strategy | The technical conversion path (DMO with/without system move, target release) is the crux of a brownfield SAD. |
| High | 3.2 Transport Governance Rules — Dual Maintenance/Retrofit | ECC almost never freezes for the whole project window; run `references/dual_maintenance_retrofit.md` to pick and justify a retrofit approach (SolMan, Cloud ALM, gCTS, or manual tracking) rather than leaving how legacy changes reach the target system unstated. |
| High | 6.4 Clean Core Level Targets, Integration Technical Debt Register (5.6) | Custom code remediation and simplification-item resolution are the dominant technical workstream; the SAD should size and categorize this debt explicitly, not gloss over it. |
| High | 9. Operations & Continuity (RISE with SAP) | Existing SLAs/ops model often carry forward with adjustments — document what changes vs. what doesn't. |
| High | 2.1 System Landscape — Sizing | A real source system to measure means the HANA Sizing Report is mandatory, not optional — if a `readiness-analysis` analysis already exists, reuse its Chapter 6 output directly per `references/sizing_strategy_decision_matrix.md` §4 rather than re-running it. |
| Medium | 10. Infrastructure | Existing infra is usually reused or lifted; document what's inherited vs. re-platformed. |
| Lower | 6.1-6.3 Clean Core principles/decision flow | Less discretion here — much of the app/extension landscape already exists; focus on remediation, not on redesigning the extensibility model from scratch. |

### Bluefield

| Priority | Section | Why |
|---|---|---|
| High | 7.1 Data Migration Architecture, 7.2 Master Data Management | The selective transition itself — what's carried forward, what's rebuilt, how master data is harmonized/deduplicated across source systems — is the architectural heart of Bluefield. Name the transition tooling explicitly (e.g. SNP Bluefield, SAP LT). |
| High | 2.1 S/4HANA System Landscape (+ ADR) | Landscape consolidation *is* an instance-strategy decision — run `references/instance_strategy_decision_matrix.md` explicitly rather than assuming "many source systems become one target instance" by default; a Harmonized (multi-instance, shared template) outcome is often the right answer even when consolidating. |
| High | 1.3 Architecture Domains / 1.4 Scope & Chapter Ownership | If this is a landscape consolidation (multiple source systems → one target), scope definition is unusually load-bearing: which source system's process wins where they conflict? |
| High | 6. Extensibility Architecture | Mixed: some inherited custom code needs remediation (brownfield-style), some is genuinely new (greenfield-style). Document per-source-system, not as one blanket policy. |
| High | 2.1 System Landscape — Sizing | Run the HANA Sizing Report per source system (`references/sizing_strategy_decision_matrix.md` — Bluefield row), then combine with de-duplication for the target — don't just sum the source systems' raw sizes. |
| Medium | 5. Integration Architecture | Likely rationalizing multiple existing integration landscapes into one — document the consolidation approach. |
| Medium | 3.2 Transport Governance Rules — Dual Maintenance/Retrofit | Same driver as Brownfield, but potentially once per source system if they're not being frozen simultaneously — check `references/dual_maintenance_retrofit.md` §2 on how this interacts with the chosen instance topology. |
| Medium | 4. Security Architecture | Harmonizing potentially different IAM/role models from multiple source systems. |

## Questions to ask the user if not already known

1. Confirm which of the three approaches applies (use the one-liners above to
   help them self-identify if they're unsure — many people say "conversion"
   when they mean brownfield specifically, or say "migration" generically).
2. Source landscape: what SAP/ECC system(s) exist today (versions, number of
   systems if Bluefield/consolidation)?
3. Target: RISE with SAP or customer-managed? Which hyperscaler/datacenter?
4. Timeline and SAP Activate phase currently in progress, if any.
5. For Brownfield/Bluefield: is a custom code analysis (e.g. SAP Readiness
   Check, Custom Code Migration app) already available? This materially
   changes how much of section 6 (Extensibility) can be filled with real
   numbers vs. placeholders.
6. For Greenfield/Bluefield: which SAP modules/LoBs are in scope, and is
   process redesign led by a separate business process/BPML workstream this
   SAD should reference rather than restate?

## Common pitfalls

- Calling something "Bluefield" just because it has both new and old
  elements without an actual selective-transition tool/methodology behind
  it — if there's no real selective transition mechanism, it's probably
  Greenfield with a longer data migration tail, or Brownfield with some
  redesign bolted on. Name it accurately; the SAD's risk section depends on it.
- In Brownfield, spending most of the document on target-state architecture
  as if it were Greenfield — the real content is the *path* (remediation,
  simplification items, cutover), not the destination, which is largely fixed.
- In Greenfield, skipping Clean Core/extensibility depth because "we'll
  figure it out during build" — this is the one section where upfront rigor
  has the highest payoff and the lowest cost, precisely because there's no
  legacy debt yet to fight against.
