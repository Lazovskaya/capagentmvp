# Dual Maintenance & Retrofit — Decision Matrix

Grounded in SAP's own retrofit mechanics (Solution Manager/ChaRM, SAP Cloud
ALM, gCTS) and a real EPAM engagement (Breakthru Beverage Group S/4HANA
Brownfield, Jul 2025) that faced exactly this problem without mature tooling
in place. Use this whenever a Conversion engagement has a legacy ECC system
that keeps receiving changes while the S/4HANA target is being built —
which is the normal case for Brownfield and Bluefield, and worth confirming
explicitly for Greenfield too if the legacy system isn't being frozen on
day one. This feeds **Section 3 (Release & Transport Management)** for the
mechanics and **Section 13 (Architecture Decision Log)** for the decision
record — see `references/instance_strategy_decision_matrix.md` for the
sibling decision this interacts with (how many instances exist on each side
directly drives how hard retrofit is).

## 1. What Dual Maintenance is, and why it can't be skipped

**Dual Maintenance** = the need to manage custom code and configuration
changes in *both* the ECC legacy system and the S/4HANA target system during
the same project window.

The reason this is unavoidable, not optional: **the ECC system doesn't
freeze itself.** Business keeps evolving, legal/tax changes still land,
support packs still ship, and all of this happens *while* the conversion
project is migrating the same objects in parallel. Typical exposure window:
**3-12 months** where both systems need parallel support. Any change made
in ECC during that window may need to be duplicated into S/4HANA, or it's
lost at cutover.

**Retrofit** is the (semi-)automated mechanism for pushing those legacy
changes forward into the project landscape. Whatever tool is used, retrofit
flows **one direction only: maintenance → project.** It is never used to
push project-landscape changes back into maintenance.

## 2. Landscape prerequisite: this is a two-track problem

Dual maintenance assumes (and requires naming explicitly in the SAD) two
separate transport tracks running concurrently:

- **Maintenance track** — the existing ECC landscape (its own DEV→QA→PROD),
  continuing to receive normal support-pack-level changes.
- **Project track** — the new S/4HANA conversion landscape (its own
  DEV→QA→PROD, or however many systems the target instance strategy
  produced), where the conversion build happens.

**This compounds with the instance strategy decision, not independently of
it.** If the target instance strategy (see the companion decision matrix)
produces multiple production instances — e.g. a Harmonized regional-split
model — decide explicitly whether retrofit runs **once into a shared
project dev track** (matches a Regional-Split-with-Template pattern) or
**separately per target instance** (matches an Independent pattern). Don't
leave this implicit; it changes the retrofit team's workload roughly
linearly with the number of independent project tracks.

## 3. Mechanics that apply regardless of tool

- **Conflict/collision detection**: the core problem retrofit solves is that
  if the *same* object is changed independently in both the maintenance and
  project landscape, whichever lands last silently overwrites the other
  unless something detects and flags it. SAP's classic mechanism for this is
  **CSOL (Cross System Object Lock)** — embedded in editors/transport-linked
  transactions, storing lock entries that persist until final release or
  go-live.
- **Traffic-light categorization**: retrofittable transports get triaged —
  green (safe to auto-retrofit), yellow (needs review), red (real conflict,
  manual resolution required). Expect roughly this three-way split whichever
  tool is used, even where the tool's automation maturity differs.
- **Retrofit queue must be empty at cutover.** This is a hard go-live
  gate, not a nice-to-have — state it explicitly as a cutover criterion in
  Section 9 (Operations & Continuity) or the cutover plan, not only in
  Section 3.
- **This needs an owner, not just a tool.** SAP's own guidance calls for a
  dedicated retrofit team/role with "responsibility, initiative, expert
  knowledge, governance, regular monitoring of the retrofit queue,
  coordination between maintenance and project." A tool without an assigned
  owner accumulates an unmanaged backlog that surfaces as a crisis right
  before cutover.

## 4. Tooling options

### Option A — SAP Solution Manager (ChaRM + Focused Build retrofit)

The mature, full-featured option. SAP's own claim: **fully automates over
90%** of retrofit tasks when configured well.

- Automatic export + retrofit categorization on transport release.
- CSOL-based proactive conflict warnings (catches collisions *before* they
  happen, not just after).
- Refresh/regenerate retrofit data on demand.
- Supports cross-release retrofit (maintenance and project landscape on
  different SAP release levels).
- **Choose this when**: the client already runs SolMan-based ChaRM for their
  current landscape (near-zero net-new tooling investment), the programme is
  large/long enough that >90% automation materially matters, or the
  landscape is complex enough that proactive conflict detection (not just
  after-the-fact) is worth the setup cost.

### Option B — SAP Cloud ALM retrofit

SAP's cloud-native successor to Solution Manager, with retrofit
categorization implemented — but **materially less mature** as of current
guidance:

- Semi-automatic only: a person must manually select transports and click
  "Start Retrofit" — automation still needs a human trigger.
- No proactive "refresh" during processing (you wait for it to finish
  rather than monitoring progress).
- Can't regenerate retrofit data proactively — only after an error already
  occurred.
- No CSOL-equivalent warning for concurrent changes.
- Simplified reject status that doesn't distinguish "retrofit rejected" from
  "handled manually instead" — worse audit trail than SolMan.
- **No cross-release retrofit support.**
- Landscape requirement: paired maintenance/project "projects" in Cloud ALM,
  same or linked TMS domain for transport visibility.
- **Choose this when**: the client is already committed to Cloud ALM (SAP's
  stated direction, and SolMan is being sunset over time), the conversion is
  smaller/shorter (less exposure to the missing automation), or introducing
  SolMan fresh purely for this project isn't justified. **If chosen, size the
  maturity gap as a real risk in Section 12/VIII.XI** (more manual
  monitoring effort, more retrofit-queue firefighting risk near cutover) —
  don't present it as equivalent to SolMan.

### Option C — gCTS (Git-enabled Change and Transport System)

A fundamentally different paradigm, not a traffic-light retrofit tool at
all: branch-based, not lock-based.

- Maintenance work happens on a **maintenance branch**, project/conversion
  work on a **feature/project branch**, in the same N-landscape dev system.
- **No cherry-picking** — you can't selectively pull one commit's changes.
  You can only activate a given commit (i.e. a full historical state), so
  merge discipline has to be designed around that constraint, not around
  picking-and-choosing individual fixes.
- Branching support requires S/4HANA 2020+ on the target side.
- **Choose this when**: the client is already Git-centric in their ABAP
  DevOps (rare today, more common going forward as Clean Core/ABAP Cloud
  adoption grows), and the team has the engineering discipline to manage
  branch/merge strategy without cherry-pick as a safety net. Don't recommend
  this as a first-time introduction to Git-based ABAP development *and* a
  live retrofit mechanism simultaneously — that's two new disciplines at
  once during an already-risky conversion window.

### Option D — Manual / lightweight tracking (no dedicated retrofit tool)

Legitimate, common in practice, and not automatically "wrong" — this is
what many real Brownfield programmes actually run when SolMan/Cloud ALM
retrofit isn't already in place and standing it up isn't justified for the
project's scale. Mechanics (from a real applied case, see §6):

- Custom code freeze **with named exceptions** (rarely a full freeze in
  practice — negotiate what "must-change" categories are: legal, tax,
  pricing, critical Z-reports) rather than an unenforceable blanket freeze.
- ATC (ABAP Test Cockpit) baseline snapshot comparisons between ECC and
  S/4HANA versions to catch drift.
- Weekly sync checkpoints between the ECC transport list and S/4HANA
  workstreams — a standing meeting, not just a tracking spreadsheet.
- Git-based ABAP repositories if already available, even without full gCTS
  retrofit tooling, as a lightweight diff mechanism.
- **Choose this when**: change volume in the legacy system is genuinely low,
  the project window is short, or none of SolMan/Cloud ALM/gCTS retrofit is
  realistically available in time. **Say so explicitly as a risk** in the
  SAD rather than silently describing this as equivalent to a tooled
  retrofit process — the honest framing is "lower automation, higher
  process discipline required, higher residual risk of missed changes."

## 5. Decision matrix

| Existing tooling | Instance count / complexity | Recommended approach |
|---|---|---|
| SolMan + ChaRM already active | Any | **Option A** — reuse what's there; highest automation |
| Cloud ALM already active, no SolMan | Single target instance, moderate change volume | **Option B**, with the maturity gap explicitly sized as a risk |
| Cloud ALM already active | Multiple target instances (Harmonized/regional model) | **Option B**, but confirm per-instance retrofit setup explicitly — this is where Cloud ALM's lack of cross-release support and simplified status tracking hurts most; consider whether standing up SolMan just for this window is justified given the complexity |
| Neither SolMan nor Cloud ALM, Git-centric ABAP shop already | Any, especially if change volume is low-to-moderate | **Option C** — but only if the team already has Git/ABAP-Cloud fluency |
| No dedicated ALM tool, short window (&lt;6 months) or low ECC change volume | Single instance | **Option D**, with weekly sync governance and a named owner |
| No dedicated ALM tool, long window (&gt;6 months) or high ECC change volume, or multiple production instances | Any | Flag as a programme risk regardless of chosen option — recommend standing up at minimum Cloud ALM retrofit (lower setup cost than SolMan) rather than running Option D at this scale |

## 6. Worked example: how this actually gets decided and written up

The BBG (Breakthru Beverage Group) S/4HANA Brownfield engagement (EPAM,
Jul 2025) is a good template for both the *decision* and the *governance*
structure — the client had no SolMan/Cloud ALM retrofit tooling in place,
so the answer landed on Option D, negotiated explicitly rather than assumed:

- **Framing to stakeholders** (use these same driving questions):
  - Will ECC continue to receive updates during the S/4HANA project?
  - What types of changes must be synchronized (legal, tax, pricing,
    Z-reports)?
  - Who owns the tracking and sync process?
  - When do we freeze ECC changes, and how do we actually enforce it (not
    just declare it)?
- **What was actually decided** (their KDD outcome, worth mirroring in
  structure): ECC development was continuous with a real backlog of
  changes; a *complete* freeze was acknowledged as unrealistic, so the
  decision was to **minimize and track** changes rather than pretend a full
  freeze was achievable — "only must-changes during migration, coordinated
  with the Implementation Partner," with the change volume explicitly
  expected to drop once Phase 1 started.
- **Governance structure to replicate**: a KDD write-up with four parts —
  *Decision framing & context*, *Recommendation/decision taken*,
  *Implications*, *Next steps* — plus a **named validation/sign-off list**
  (decision-makers by name and role, with status/date columns). Use this
  exact shape for the Section 13 ADR entry; a decision this consequential
  deserves named accountability, not just a recorded outcome.

## 7. Questions to ask / documents to request

1. Is the legacy ECC system still receiving changes today, and is that
   expected to continue through the conversion project? For how long
   (target cutover date)?
2. What's the actual change volume/frequency in ECC (transports per month,
   or a rough estimate) — this is the single biggest driver of which option
   is proportionate.
3. Does the client already have SAP Solution Manager with ChaRM active, a
   Cloud ALM subscription, or gCTS/Git-enabled ABAP development in place
   today? (Ask for evidence — a subscription existing is not the same as it
   being actively used for change control.)
4. How many production instances exist on the maintenance side today, and
   how many will exist on the project/target side per the instance strategy
   decision? (Directly determines retrofit topology complexity — see §2.)
5. Who would own the retrofit/tracking process operationally — is there a
   named team, or does one need to be stood up as part of this programme?
6. Is a change freeze (even a partial one, with named exceptions)
   politically/operationally feasible, or will the business push back hard
   enough that "minimize and track" (like the BBG example) is the realistic
   ceiling?
