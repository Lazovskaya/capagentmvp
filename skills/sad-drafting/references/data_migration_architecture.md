# Data Migration Architecture — Decision Matrix

For SAD Section 7.1 (Data Migration Architecture). Grounded in EPAM's own
internal SAP methodology KB (transition-path decision criteria, tool
comparison, and the shell-conversion/Selective Data Transition technical
sequence) plus SAP's own published Selective Data Transition (SDT)
guidance. Use this whenever 7.1 needs to say something more concrete than
"data will be migrated using standard tools and validated before go-live"
— that sentence is exactly the kind of filler the quality rubric marks
down, and the transition-path choice is a real, expensive-to-reverse
decision on its own.

## 1. Why this needs its own decision framework

"Data migration" is not one thing — SAP itself publishes **three distinct
transition paths**, each with different tooling, different data-retention
outcomes, and different technical eligibility constraints. Section 7.1
should show *which path this engagement is on and why*, not describe
generic ETL activities. This decision interacts directly with the
engagement type already established in `playbooks/conversion.md`
(Greenfield/Bluefield/Brownfield) — SDT is specifically the Bluefield
technical mechanism, not a separate fourth option.

## 2. The three transition paths

| Path | SAP term | What happens to data/processes | Tooling |
|---|---|---|---|
| **Brownfield** | System conversion | Full data set stays; processes stay except S/4HANA-forced simplifications | Software Update Manager (SUM), optionally with near-zero-downtime add-ons |
| **Bluefield** | Selective Data Transition (SDT) | New S/4HANA system; ECC can remain; history/org units/process reuse chosen per area | SAP Business Transformation Center (BTC, Lean SDT only) · Syniti ADM · SNP CrystalBridge · Natuvion · CBS ET |
| **Greenfield** | New implementation | Fresh S/4HANA; master data and open items only — SAP does not migrate closed historic documents through standard APIs | SAP S/4HANA Migration Cockpit |

## 3. Decision criteria — walk through all eight before picking a path

Don't jump to a path from the engagement label alone; SAP's own published
criteria are a per-question walk, and the majority answer (not the first
answer) names the path. If 2-3 paths tie, that's a real workshop
discussion, not something to resolve by guessing — say so explicitly in
7.1 rather than picking arbitrarily.

1. **Historical transactional data needed?** Conversion = all history;
   SDT = a selected slice; New impl. = none (master data/open items only).
2. **Do current processes support the long-term strategy?** Conversion =
   reuse, change only what simplifications force; SDT = keep some/
   redesign others per area; New impl. = fit-to-standard redesign.
3. **Must master data/org structures be redesigned?** Conversion = current
   structures already fit; SDT = redesign required but not full rebuild;
   New impl. = new org model from scratch.
4. **Is landscape consolidation a value driver?** Conversion = one system
   in place; SDT = split with dedicated tool support; New impl. =
   consolidate into new system (limited tool support).
5. **Phased go-live needed (company code by company code)?** Conversion
   cannot do this — SUM converts the whole system in one cutover. SDT
   supports productive waves (migrate CoCd 1000 now, add 2000 later into
   the already-live S/4) — **note: phased/productive waves in SAP BTC are
   early access as of August 2026, not GA — verify availability before
   committing to BTC specifically for this scenario.**
6. **Quality of existing data?** Conversion takes the full set as-is; SDT
   and New impl. can leave obsolete data behind.
7. **Custom code: take over, cherry-pick, or leave behind?** Well-
   maintained code favors Conversion; outdated code favors New impl.; SDT
   can cherry-pick per area.
8. **Technical eligibility — can SUM convert this ECC in place at all?**
   This is a technical gate, not a strategy preference: SAP converts in
   one step only from Unicode, ABAP-only ERP 6.0+. Non-Unicode, dual-stack
   (ABAP+Java), or pre-ERP-6.0 systems cannot run a standard SUM
   conversion — this alone can force SDT or New impl. regardless of what
   the other seven answers indicate. Cross-check against
   `readiness-analysis`'s own findings before assuming Conversion is
   technically viable.

SAP also offers a guided version of this same questionnaire in SAP Cloud
ALM (the "Transformation Approach Finder" tile) — mention this to the
client as a way to jointly validate the path, not just take EPAM's word
for it.

## 4. If the path is SDT — pick a tool, don't default to BTC

SAP BTC is an SAP product; Syniti, SNP CrystalBridge, Natuvion, and CBS ET
are independent vendor products, each with a different fit. **Do not use
BTC when any of these is true** — pick a specialist vendor tool instead:

- More than one source system (landscape consolidation)
- Legal re-org, system merge/split, or M&A carve-out
- NewGL parallel ledgers, document split, or Chart-of-Accounts redesign
  as part of the move
- Mix-and-match onto a mostly new target, or other on-the-fly value
  mapping BTC doesn't ship
- Sequential productive waves into an already-live S/4 (dual landscape,
  temporary interfaces) — see the early-access caveat in §3, item 5

If BTC is ruled out, typical vendor fit:

- **Syniti ADM** — multi-source loads where data quality (rule
  repository, cleansing, reconciliation) is the primary driver. Weaker
  for legal re-org or near-zero-downtime needs.
- **SNP CrystalBridge** — multi-ECC merge, legal entity/re-org, table-
  level transformation, near-zero downtime. Typical for large, high-
  complexity programs.
- **Natuvion** — partner-led custom SDT (ALLFIELD/PRISM); fits when the
  engagement is sold as a bundled method+tool rather than a customer-run
  product license.
- **CBS ET (Enterprise Transformer)** — consolidation, carve-outs,
  complex restructuring, low-downtime migrations; value is tied to a
  consulting-led delivery model, not a self-service product.

## 5. SDT sub-scenarios — name which one, don't leave it generic

- **Time slice** — keep recent fiscal years, leave the rest. SAP
  recommends at least the last complete fiscal year; too short a slice
  increases complexity rather than reducing it.
- **Company code** — move a subset of org units (phased rollout, M&A);
  combinable with a time slice. Temporary interfaces between the migrated
  and not-yet-migrated org units are the usual cost — call this out
  explicitly as an integration architecture consequence (Section 5), not
  just a data question.
- **Shell + adaptation** — empty copy of source config, converted via
  SUM, then adapted for what conversion itself can't change (e.g.
  accounts → ledger restructuring, document split introduction). History
  is kept where structures still match.
- **Mix and match** — starts closer to Greenfield; retains selected ECC
  solution areas onto a mostly-new-Best-Practice target. SAP describes
  this as less tooling-heavy, more consultant-heavy than the other
  sub-scenarios.

## 6. Shell Conversion technical sequence (Bluefield/SDT specifically)

When the SDT sub-scenario is Shell + adaptation, the actual build sequence
is:

1. **Prepare the source system** (during normal operations, no downtime
   yet): data volume reduction/archiving, Simplification Item analysis,
   **CVI (Customer/Vendor Integration) completion — mandatory before
   selective transition can run at all**, SAP Finance consistency checks
   (GL/AP/AR/AA/CO reconciliation, configuration verification).
2. **Assess the source system** via SAP Readiness Check inside BTC —
   usage/data profiling structured by organizational unit and
   transformation object, feeding the actual scoping decision.
3. **Prepare the target system**: create the shell (via Basis system/
   client copy, SAP LT-based reduced copy, or a service-based option),
   then run the shell conversion via SUM (pre-conversion: simplification-
   item evaluation, Maintenance Planner, custom-code remediation;
   post-conversion: custom-code and authorization adaptation). The
   resulting converted shell is kept as a **"golden" S/4HANA shell, not
   used directly for migration** — further copies are cut for dev/QA, and
   each test cycle uses a fresh copy of the golden shell as the actual
   migration target.
4. **BTC setup** on both source and target (SAP Notes, OData services,
   Cloud Connector, RFC destinations, users/roles, command daemon).
5. **Test runs → Dress Rehearsal → Go-Live run** — the actual data
   migration cycle executes through BTC multiple times before the real
   cutover, not once.

Named tools in this sequence, for when 7.1 needs to cite the actual
toolchain rather than "migration tools": **SAP Business Transformation
Center (BTC)** (orchestration), **Software Update Manager (SUM)** (shell
technical conversion), **SAP Readiness Check** (usage/data profiling),
**Software Provisioning Manager (SWPM)** (shell system copy), **SAP
Landscape Transformation (SAP LT)** (reduced-volume copy option),
**Migration Workbench (MWB)**, part of BTC (access-plan calculation),
**Data Transition Validation (DTV) Tool** (source-vs-target consistency
validation), **Custom Code Migration app** (ATC-based impact analysis —
cross-reference `ricefw_decision_matrix.md` §4's Priority mapping), **SAP
Cloud ALM** (monitoring).

## 7. Hard constraints from SAP — state these explicitly, don't assume around them

- **SDT into SAP S/4HANA Cloud Public Edition is not supported.** SDT
  targets Private Cloud (RISE) or on-premise only — if the target is
  Public Cloud, SDT is off the table regardless of what §3's other
  answers indicate.
- **A system conversion (Brownfield/SUM) cannot introduce NewGL parallel
  ledgers or document splitting during the move.** Those changes need a
  pre-project, a follow-on SLO, or SDT instead — don't assume a standard
  conversion can absorb this kind of finance redesign.
- **Migration Cockpit (Greenfield) loads via SAP APIs — open items and
  master data only.** Closed historic documents require table-level SDT
  tools and specialist content; don't assume the Migration Cockpit alone
  covers historical data needs for a Greenfield engagement.
- **BTC requires the target to be a genuine shell** — no business data,
  not productive. A new-install target isn't supported by BTC.

## 8. Prerequisites and risks to name in 7.1

- **CVI completion is a hard prerequisite for SDT**, not a nice-to-have —
  this is the same CVI gate `readiness-analysis`'s findings brief already
  flags for Brownfield (see that skill's Chapter 8/CVI guidance); if CVI
  isn't complete, say so as a blocking dependency for 7.1, not a footnote.
- **Fiscal year constraints**: a company code can have at most one open
  fiscal year before conversion/migration — more than one open year
  blocks the move entirely. FI/CO fiscal-year-variant mismatches between
  modules must be resolved first (adopt whichever variant has more
  special periods) or postings become inconsistent.
- **Security**: the BTC background technical user (`BDTS_T_PPJOB`)
  typically needs SAP_ALL for its operation and should be locked outside
  active postprocessing windows — flag this explicitly to Security
  Architecture (Section 4), don't let it stay an unstated BTC
  implementation detail.
- **Customer views on simplification-affected tables are disallowed** —
  a common oversight that surfaces late if not checked during source
  prep.

## 9. What to ask the user / feed into Section 7.1

1. Has the eight-question path-finder (§3) actually been walked through
   with the client, or is the path assumed from the engagement label
   alone? If assumed, say so and flag it as a validation gap.
2. If SDT: which sub-scenario (§5), and does the §4 tool-exclusion
   checklist rule out BTC? If BTC is ruled out, which vendor and why?
3. Is CVI complete? Pull this directly from `readiness-analysis`'s
   findings rather than asking fresh — if not complete, this is a
   blocking dependency for 7.1 and likely an `adr-log` candidate.
4. For SDT by company code: does the phased-rollout/temporary-interfaces
   consequence get reflected in Section 5 (Integration Architecture) as
   well, not just noted here?
5. Does the target deployment model rule out SDT entirely (S/4HANA Cloud
   Public Edition, §7)? Confirm before drafting rather than after.
