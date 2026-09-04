# Business Process Scoping — Methodology

How to turn a Readiness Check's Simplification Item findings into a scoped
list of business processes marked **Changed** / **Unchanged** / **Out of
scope**, grounded in SAP's official Reference Business Architecture (RBA)
catalog and a real applied EPAM example (ADNOC L&S ERP Transformation,
Section 2.2 Business Process Scope).

## 1. What each input actually is

- **Readiness Check Simplification Items** (from `readiness-analysis`,
  Ch.3.1.1/3.1.2): each relevant item has a `Business Area` (and its sibling `LoB/Technology`) field
  (e.g. "Sales - Order and Contract Management," "Finance - Financial
  Operations") — freeform text describing which functional area the
  simplification touches, an Effort Ranking (Low/Medium/Potentially
  High/Assessment Required), and a **Category** (Functionality unavailable
  [alternative exists / alternative planned / no alternative planned],
  Functionality deprecated [alternative exists / alternative exists with
  roadmap], Change of existing functionality). **Category is the stronger
  signal of the two for scoping purposes** — see
  `readiness-analysis`'s `references/simplification_items_guide.md` §1
  for what each Category value actually implies; Effort Ranking alone,
  especially when marked "(default)" rather than "(calculated)," reflects
  SAP's generic past-project experience, not this client's system.
- **RBA catalog** (`scripts/extract_rba_catalog.py` output, from SAP's
  "RBA & RSA Release Excel"): a hierarchy — E2E Process → Process Module →
  Process Segment → Business Activity → Business Capability — covering
  every standard SAP business process, cross-referenced to APQC's Process
  Classification Framework (the industry-standard equivalent taxonomy;
  there's no separate "Gartner business process list" to reconcile against
  — APQC is the recognized cross-industry standard already embedded here).
  Filter it to the client's industry first (the script's `--industry` flag)
  — the unfiltered catalog covers all ~20 SAP-covered industries and is
  needlessly large otherwise.

## 2. The matching approach

There's no clean ID-to-ID join between a Simplification Item's `LoB –
Business Area` text and the RBA's `Business Activity`/`Business Capability`
names — they come from different taxonomies. Do the matching by **semantic
judgment**, not string equality:

1. For each relevant Simplification Item, read its `Business Area` (and its sibling `LoB/Technology`)
   and its business-impact note context (what it actually changes).
2. Search the RBA extract for Business Activities / Business Capabilities
   whose names or E2E/Process Module/Process Segment path plausibly overlap
   with that Business Area (e.g. "Finance - Financial Operations" →
   Business Activities under the RBA's Finance-domain Business
   Capabilities like "Accounts Payable," "General Ledger," "Financial
   Close").
3. Mark every RBA Business Process/Activity under a matched Business
   Capability as a **Changed** candidate.
4. Don't mark a process Changed on a weak/generic overlap alone — if the
   Simplification Item's actual described change (its business-impact
   note) doesn't plausibly touch that specific process, leave it
   Unchanged. A false "Changed" costs a real workshop slot; be
   conservative and let the workshop reclassify borderline cases.
5. Everything in the client's actual module/process scope that isn't
   matched to any relevant Simplification Item stays **Unchanged**
   (equivalent to "Adopt" in the ADNOC terminology below). **Enumerate
   this list explicitly — don't just describe it in prose ("everything
   else stays unchanged") and skip listing it.** A scope deliverable
   whose Unchanged column is empty or absent is incomplete, even though
   the Readiness Check itself never names these processes (it only counts
   them, e.g. "483 of 699 items not relevant" — it doesn't say what they
   are). Build the enumerated list from the RBA catalog itself: for each
   Business Area confirmed in scope, pull the RBA's Business Activities
   under that area's Process Modules/Segments (via
   `extract_rba_catalog.py`'s output) and list everything that isn't
   already claimed by a Changed or To-Assess row. Label these rows
   explicitly as candidate matches from the standard RBA taxonomy, not a
   verified inventory of exactly what the client runs — that's still a
   simplification, just a transparent one instead of a silent omission.
6. Anything outside the client's confirmed module/process scope entirely
   (not licensed, not used, out of program scope) is **Out of scope** —
   don't list it as Unchanged; that implies it was considered and cleared,
   which is a different claim.

## 3. Output shape — mirror the real EPAM example

The ADNOC L&S ERP Transformation Section 2.2 deliverable is a good
template to match, adapted from Adopt/Enhance/Redesign to Changed/
Unchanged:

- **One sheet/table per Business Area/LoB** (Finance, Procurement, HCM,
  Sales & Distribution, Maintenance, etc.), columns: `Stream | Process |
  <entity 1> | <entity 2> | ... | Complexity` if multiple
  legal entities/subsidiaries are in scope (map "Adopt" → Unchanged,
  "Enhance"/"Redesign" → Changed at increasing complexity), or a simpler
  `Business Area | Process | Changed/Unchanged | Complexity` table for a
  single-entity engagement.
- **A Summary sheet/table**: one row per Business Area with `# Processes`,
  and counts for each classification (mirrors ADNOC's `# Processes | Adopt
  (Low) | Enhance (Medium) | Redesign (High)` row shape).
- **A caveat note, verbatim in spirit**: state explicitly that this is a
  planning-level estimate derived from the Readiness Check's Simplification
  Item findings, to be re-validated jointly with the client during Fit-to-
  Standard/Design-phase workshops. This isn't boilerplate — the ADNOC
  deliverable carries this exact disclaimer, and it's true here too: this
  method produces a solid first draft, not a workshop-validated final scope.

**Complexity heuristic** (mirrors ADNOC's own note: "Complexity is EPAM's
planning-level estimate derived from Adopt/Enhance/Redesign classification"):
derive it from **Category first, Effort Ranking second** — don't sort by
Effort Ranking alone:
- **"Functionality unavailable (no alternative planned)"** or
  **"(alternative planned)"** → **High** complexity (Redesign) almost
  regardless of Effort Ranking — these categories mean a real gap with no
  standard path forward, which is a business decision, not a routine fix.
  Flag these as `adr-log` candidates (see `SKILL.md` step 4b), not
  just High-complexity scope rows.
- **"Change of existing functionality"** or a deprecated item with an
  existing alternative → generally **Low-to-Medium**, following Effort
  Ranking (Low → Low, Medium → Medium) — these are usually technical/
  config adjustments, not process redesigns.
- A **Mandatory "Business Decision"/"Landscape Redesign" activity** (from
  the Activities table, 3.1.3) → **High**, regardless of Category or
  Effort Ranking — the Activities table's Condition/Phase combination is
  itself decision-grade signal.
- An item whose Relevance text shows the **ST03N 12-month data gap**
  (`references/simplification_items_guide.md` §3) → mark **To Assess**,
  never Changed or Unchanged directly — this is an inconclusive check
  result, not a determination either way, and folding it into either
  bucket silently loses that distinction.
- **"Potentially High" or "Assessment Required" Effort Ranking** on its
  own (without a decisive Category) → **To Assess** rather than guessing
  a complexity tier — these are exactly the items SAP itself couldn't
  size; don't manufacture false precision by picking a complexity label
  for them.
- **An item flagged with a technical consistency error** (`Consistency
  Status` in `RelevantSimplificationItems.xlsx`, or errors/warnings noted
  in the Readiness Check findings brief — see
  `readiness-analysis`'s `simplification_items_guide.md` §4, priority
  tier 1: "must-fix regardless of Category, independent of business
  scope") → tag the row `"technical_blocker": true` in the scope JSON
  **in addition to** its normal Changed/To-Assess status. This is a
  distinct axis from Category/Effort Ranking, not a replacement for them:
  a technical-blocker item still gets a status and complexity as usual,
  but the flag tells `workshop-preparation` this item needs engineering
  remediation before conversion, not a business discussion — don't let it
  land in a Fit-to-Standard workshop agenda as if it were open for
  business input, that wastes stakeholder time on something that isn't
  actually a decision.

## 4. Conversion-type decision — confirm terms before classifying

The organization's specific conversion-type taxonomy (e.g. shorthand like
"DOC" or "DMOVE2S4") should be confirmed with the user rather than guessed
— these look like internal/partner-specific abbreviations, not standard
SAP terminology, and getting this wrong would misclassify the whole
engagement. What's safely groundable in public SAP terminology, if useful
context while confirming:

- **Standard System Conversion** (SUM with DMO — Database Migration
  Option): the default Brownfield technical path, business processes
  largely unchanged except where Simplification Items force adjustment.
- **DMO with System Move**: same technical approach, combined with moving
  to new target hardware/hyperscaler during the same conversion step.
- **Shell Conversion**: used for template harmonization — converts only
  the customizing/repository shell, not full data, common when
  establishing a new global template before rolling out to entities.

Once the client/organization's exact terms and criteria are confirmed, add
them here as a proper decision table (condition → conversion-type label)
rather than re-deriving them each engagement.

## 6. Cross-referencing an Application Map (do this before the workshop, not after)

If the client has an Application Map / interface inventory (a list of the
applications and integrations that currently support their business
processes), cross-reference it into the scope **before** Fit-to-Standard
workshops, not after — the workshop is more useful when the facilitator
already knows which systems a Changed process currently touches, and this
surfaces integration/interface risk early rather than as a late surprise.
Treat the result as a draft to validate/refine during and after the
workshop (shadow IT, informal tools, and target-state decisions on
individual applications usually only surface there), not as a blocker to
starting.

**Every client formats this differently** — confirmed directly: one real
client's Application Map had a "List of SAP Interfaces" sheet (columns
like Business Domain, Code, Interface/application, Source, Target,
Middleware, criticality) and a separate "APP Ecosystem" sheet (columns
like ApplicationID, IS Application, Functionalities, Business Domains,
Number of Users, Business Criticality), using its own internal taxonomy
for "Business Domain" (e.g. "ACCOUNTING," "PURCHASING," "QUALITY," "DOI")
— **not** the Readiness Check's LoB-BusinessArea naming or the RBA's own
Business Domain/Area hierarchy. Three different taxonomies for the same
underlying business areas is the normal case, not an edge case.

**Mechanical step**: extract the raw tables generically, without assuming
any particular column layout:
```
python3 scripts/extract_application_map.py <application_map.xlsx> /tmp/appmap.json
```
This turns every sheet into a list of header→value records exactly as
found in the file — it makes no assumption about which column means
"business area" or "application name," because that varies per client.

**Semantic step (yours to do, not the script's)**: for each Changed/To-
Assess/Unchanged process in the scope, find application(s) whose
Business Domain/Functionality description plausibly covers that process's
Business Area — e.g. a process under "Finance - Accounting and Financial
Close" matching an application tagged "ACCOUNTING" in the client's own
taxonomy. Attach matched application name(s) to that row's `applications`
field before running `build_scope_workbook.py` — it renders a "Supporting
Application(s)" column automatically once at least one row has this field
populated. Be conservative here too: an app supporting "ALL" business
domains (e.g. the core SAP ERP system itself) isn't a meaningful
per-process signal — only attach applications with a real, specific
Business Domain match.

**This also feeds Section 5 (Integration Architecture) directly**: once a
Changed process is linked to a specific application, pull that
application's interfaces from the "List of SAP Interfaces"-style sheet
(Source/Target/Middleware/criticality columns) — these are real
integration remediation candidates the SAD's Integration Architecture and
Technical Debt Register sections need, not something to re-derive later
from the Readiness Check's generic interface-type counts alone.

## 7. What to ask the user if not already known

1. Which industry should filter the RBA catalog (affects both scope size
   and which Business Capabilities are even offered)?
2. Which Business Areas/LoBs are actually in scope for this engagement
   (not every client uses every SAP module)?
3. Is this a single-entity or multi-entity (rollout/harmonization) scoping
   exercise — if multi-entity, get the entity list for the per-entity
   columns in the output table?
4. What does the organization mean by its internal conversion-type labels
   (e.g. "DOC," "DMOVE2S4")? Get the exact definition/criteria before
   using them in the output.
5. Is there an Application Map / interface inventory available? If so,
   what taxonomy does it use for business area/domain, and does that need
   reconciling against the Readiness Check's LoB-BusinessArea naming and
   the RBA's own hierarchy (per §6)?
