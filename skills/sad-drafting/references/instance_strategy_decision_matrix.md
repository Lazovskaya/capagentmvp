# Instance Strategy — Decision Matrix

Grounded in SAP's own "Instance Strategy Enablement Webinar" methodology (SAP
DBS, Christopher Naab / Darwin Wijaya) and validated against a real EPAM
engagement (CEMEX S/4HANA Transformation, Aug 2025) that applied this exact
framework and reused SAP's evaluation criteria catalog almost verbatim. Use
this as the authoritative reference whenever the SAD needs to state — and
justify — how many production SAP instances the target landscape will have.
This decision belongs in **Section 2.1 (S/4HANA System Landscape)** of the
SAP SAD template for its outcome, and in **Section 13 (Architecture Decision
Log)** for its full rationale — instance strategy is exactly the kind of
decision the ADR exists to make traceable, since it's expensive to reverse
and every stakeholder will eventually ask "why this many systems?"

## 1. What "Instance Strategy" means

- **SAP-ERP instance** = a single installation of the SAP ERP software,
  including its process configuration and data.
- **Instance strategy** = the set of decisions that ultimately drive *how
  many* different SAP-ERP instances the landscape will have, and how the
  high-level technical architecture should be shaped to best serve business
  operations.

It's explicitly a joint business+technology decision, not a technology-only
sizing question — SAP frames it as sitting at the intersection of Business
Strategy, Operations, and Technology/Deployment. Don't let this section be
drafted by infrastructure alone; if Business/LoB stakeholders haven't weighed
in, say so as a gap rather than presenting a purely technical answer.

## 2. The centralization ↔ decentralization spectrum

Every instance strategy sits somewhere on one axis:

```
High standardization,          <---------------->      High autonomy,
centralized, single global                              decentralized,
instance                                                 many instances

Benefits of scale:                                Benefits of local control:
- Transparency                                     - No group-wide coordination needed
- Operational synergies                            - Rapid response to local business needs
- Information sharing                              - Flexibility / local control
```

Neither end is "correct" — SAP's own material calls out a "sweet spot" that
depends on the specific business. The seven patterns below are just named
points along this spectrum.

## 3. The seven SAP architecture patterns

| # | Pattern | Topology | Benefit | Challenge |
|---|---|---|---|---|
| 1 | **Single Instance** ("all in one") | 1 DEV – 1 PROD | Full transparency; reporting/consolidation flexibility | Achieving global process standardization across all business units/regions |
| 2 | **Divisional Split — Independent** | N DEV – N PROD (one full track per division) | Maximum flexibility for each division | Minimal synergy and heavy coordination overhead across divisions |
| 3 | **Divisional Split — Partial Template** | 1 DEV – N DEV – N PROD | Some shared core model, division-level flexibility on top | Coordinating template deviations across divisions |
| 4 | **Regional Split — Partial Template** | 1 DEV – N DEV – N PROD | Shared core + regional adaptation; regional operational stability | Coordination and function exchange across regions |
| 5 | **Regional Split — Independent** | N DEV – N PROD (one full track per region) | Regional operational stability, latency/performance | Least cross-region synergy; highest coordination cost if it's ever needed |
| 6 | **Regional Split — Full Template** | 1 DEV – N PROD | Strong core-model unicity; only one dev track to govern | Every region's production instance is fed by a single shared dev track — a bottleneck if regions need to move at different speeds |
| 7 | **Functional Split (Process Clusters)** | Split by process cluster / "best of breed" | Flexibility per Line of Business | Complexity and interfacing overhead between clusters |

Patterns 3-6 are the ones that matter in practice for most SAP transformation
programmes — pure Single Instance (1) and pure Independent-per-division/
region (2, 5) are the extremes most real engagements land between.

**Simplified 3-model shorthand** (how this shows up in real EPAM decision
papers, e.g. CEMEX): teams often collapse the seven patterns into three
plain-language options when presenting to non-technical stakeholders —
map back to the table above when writing the SAD's technical rationale:

- **Consolidated model** ≈ Pattern 1 (Single Instance): one global
  production instance, one dev track.
- **Harmonized model** ≈ Patterns 3/4/6 (Partial or Full Template): multiple
  production instances (by region or division) sharing one common
  dev/build track, so the core model stays unified even though production is
  split.
- **Independent / Local model** ≈ Patterns 2/5: multiple production
  instances with independent dev tracks — least core-model unicity, most
  local autonomy.

## 4. Decision methodology (3 steps)

1. **Build Foundation** — make sure everyone (especially business
   stakeholders who may have no concrete opinion yet) understands the
   pattern options and industry norms *before* debating which one fits.
   Skipping this step is the most common reason instance-strategy workshops
   go in circles — people argue past each other using different mental
   models of what "one instance" even means.
2. **Shortlist Options** — narrow to 2-3 realistic options. If the client
   already has specific options in mind, validate them for feasibility
   rather than starting from scratch.
3. **Evaluate and Score** — only meaningful if there's more than one option
   on the shortlist. Agree selection criteria and weights with the customer,
   score each option 1 (poor) to 5 (excellent) per criterion, compute the
   weighted result. Document *why* each score was given, not just the
   number — the rationale is what the ADR entry actually needs.

SAP's own "simple formulas for success" for this exercise, worth stating
directly to stakeholders: **business needs must drive the strategy** (LoB
involvement is required, not optional), and **the more business-critical a
system is, the more seriously its IT/operational constraints must be
weighed** (a system where downtime is merely inconvenient can tolerate a
riskier consolidated model than one where downtime stops revenue).

## 5. Evaluation criteria catalog (with default weights)

Use this as the starting point; add, remove, or reweight criteria through
discussion with the customer — the weights below are SAP's own worked
example, not a fixed standard. Weights should sum to 100%.

| # | Criterion | What it asks | Default weight |
|---|---|---|---|
| 1 | Fit to corporate strategy | Does the option support key corporate strategic/operational goals — growth, internationalization, M&A, divestment, shared services? | 10% |
| 2 | Business fit and flexibility | Does it fulfill future business requirements — cross-site processes, harmonized data where required, global compliance? | 20% |
| 3 | Size, scalability and performance | Can it support current *and future* demand — users, data volume, countries, network latency? | 10% |
| 4 | Software change management flexibility | Governance/oversight burden, availability and planned downtime windows, technical/development complexity | 10% |
| 5 | Maintainability of the solution | Integration to SAP and non-SAP systems, security aspects, operational burden | 10% |
| 6 | Risk of operation | How much does the option minimize risk, and the *impact* if something still goes wrong (e.g. "all eggs in one basket" for a single global instance) | 10% |
| 7 | Long-term IT cost | Hardware, software, and labor cost model, including integration cost | 20% |
| 8 | Cost and risk of transition | Cost/risk/timeline impact of *getting to* this option from the current state | 10% |

Scoring notes: if two options land within a small margin of each other, both
should be treated as "equally relevant" rather than manufacturing false
precision — the ADR should say so rather than picking a winner on a
rounding error. A quantitative score does not by itself make the decision;
it's one input alongside qualitative judgment on the criteria that matter
most to this specific client.

## 6. What SAP's onsite workshop actually walks through

If no instance-strategy decision exists yet and there's an opportunity to
run (or simulate, via structured interview) a real workshop, follow this
sequence — each step narrows the field before scoring even starts:

0. SAP boundary conditions and industry best practices (see §7)
1. Business need for process execution *across* sites (do people in
   different locations actually need to transact against the same data in
   real time, or is this theoretical?)
2. Business need for process *harmonization* (do stakeholders actually want
   one common process, or do they want the freedom to diverge?)
3. IT constraints — technical feasibility (can the target platform/hosting
   model actually support the shortlisted options at the needed scale?)
4. IT constraints — system operations / IT maturity (does the organization's
   current ops maturity support running a large consolidated system, or
   would that concentrate risk in a team not ready for it?)
5. Transition cost/risk vs. long-term benefit (what does it cost, in money
   and risk, to get from the current landscape to each shortlisted option?)

## 7. Industry patterns (starting priors, not a verdict)

SAP's own cross-industry material shows a rough default gradient — useful
as a sanity check on a proposed answer, never as a substitute for scoring
this client's actual criteria:

| Tends toward Single Instance / high centralization | Tends toward Multiple Instances / regional-local autonomy |
|---|---|
| Automotive, Manufacturing — centrally managed, vertically integrated global supply chain | Beverage, Consumer Products, Electronics OEM, Oil & Gas — de-centrally managed, supply chain largely within-market, local/regional business |

The broader industry trend (per SAP, and consistent with the harmonization
push seen in the CEMEX case below) is toward **fewer** ERP instances over
time as process/data harmonization becomes the dominant TCO driver — but
data-privacy regulation by region is actively pushing back against that
trend, making a pure single global instance harder to justify than it was a
few years ago. Both forces should be named explicitly if they're in tension
for this client.

## 8. Worked example: how this decision actually gets written up

The CEMEX S/4HANA Transformation (EPAM, Aug 2025) is a good template for how
this decision matrix becomes a real, defensible section — not an abstract
exercise; the client picked a **Harmonized model** (5 regional production
instances, one shared dev/build track) over a single Consolidated global
instance. Their key considerations, organized the same way this section
should be organized in the SAD:

- **Business strategy drivers**: legal/data-residency constraints per
  country, active M&A/divestment plans (isolating a region under
  divestment is far simpler if it's already a separate instance).
- **Maintainability drivers**: need for 24x7 operations, IT maintenance
  window constraints, target SLA/performance.
- **Core model mindset**: desire to simplify/mutualize the backbone while
  still leveraging harmonized processes and master data.
- **Risk concentration**: named, quantified business risk — e.g. "Mexico
  alone generates ~40% of regional revenue; Mexico + US together ~70-80% of
  total revenue" was the explicit reason those two stayed on separate
  instances. **This is the standard to match**: risk arguments in the SAD
  should cite a real number tied to this client's business, not a generic
  "reduces risk" statement.
- **Operational scheduling conflicts**: a region with a fundamentally
  different work week/maintenance-window need (in CEMEX's case, the Middle
  East working Sundays) was cited as a standalone reason to separate an
  instance — a concrete example of criterion #4 (software change management
  flexibility) actually driving the outcome.

Structure the final decision exactly like a KDD (Key Design Decision) that
feeds Section 13 of the SAD:

```
Recommendation / Decision taken: <Model X> selected as best fit
Rationale:
  - Business alignment: ...
  - Risk reduction: ...
  - Performance & availability: ...
  - Scalability: ...
  - Clean Core / extensibility alignment (if applicable): ...
Next steps:
  - Explore/Prepare phase validation (e.g. Fit-to-Standard workshops)
  - Technical planning (hosting/landscape options, HA strategy per region)
  - Governance & roadmap (rollout sequencing, legacy transition plan)
```

## 9. How this feeds the SAD

- **Section 2.1 (S/4HANA System Landscape)**: state the chosen pattern (using
  the plain-language name — Consolidated/Harmonized/Independent — *and* the
  precise SAP pattern number from §3) and the resulting system count/
  topology. This is the outcome; keep it short here.
- **Section 13.2/13.3 (Architecture Decision Log — Core / Migration-Approach
  Decisions)**: this is where the full rationale belongs — the shortlist
  considered, the criteria and weights used, the score (if quantitative
  scoring was run), and the KDD writeup from §8. Treat "why this instance
  count" as one of the highest-value ADR entries in the whole document —
  it's usually the single decision every later reader most wants explained.
- **Section 6.5 (Global Template vs. Rollout Governance)**: if a Harmonized/
  Partial-Template pattern was chosen, this section and the instance
  strategy decision are two views of the same thing — cross-reference them
  explicitly rather than describing template governance twice.
- **Conversion sub-type interaction** (see `playbooks/conversion.md`):
  Bluefield landscape consolidations are, by definition, an instance
  strategy decision (many current instances → fewer target instances) — run
  this whole matrix explicitly for Bluefield engagements rather than
  treating landscape topology as a given. Greenfield programmes are
  designing from a blank slate, so the workshop's Step 0-2 (business need
  for shared process/data) usually dominates. Brownfield/technical
  conversions most often keep the current instance count unless the
  conversion is explicitly bundled with a consolidation — confirm which is
  the case rather than assuming continuity.

## 10. If no instance strategy decision exists yet — what to ask the client

1. How many production SAP instances exist today, and how did that number
   come to be (deliberate design, or historical accident/M&A residue)?
2. Are there specific regions/divisions/business units with a *named*
   reason to stay separate (data residency law, active divestment,
   revenue-concentration risk, incompatible maintenance windows)? Get
   specifics, not a general "compliance" wave-off — the CEMEX example above
   shows how much more defensible a specific number/date/regulation is.
3. Is there an appetite for, or active resistance to, process
   harmonization across the regions/divisions in scope? Who would need to
   sign off on harmonized processes if pursued?
4. What's the organization's current IT operations maturity — could it
   realistically run a large consolidated instance's maintenance windows,
   or would that overload the current team?
5. Is this decision genuinely still open, or already made elsewhere (e.g. by
   a Design Authority / KDD board) — if already made, get the existing
   decision paper rather than re-running the exercise; write it up per §8's
   structure regardless of who ran the original analysis.
