# sad-assembly

Peer Realize-phase agent for `EPMCSAPAI-290` (Backlog ID S11, SAD / Technical Architecture track).
It requests the domain-strategy outputs from the nine technical-architecture agents (`EPMCSAPAI-275`
Solution Landscape, `-281` Release & Transport Management, `-282` Security, `-283` Integration,
`-284` Extensibility/Clean Core, `-285` Data, `-286` Output Management & UX, `-287` Operations &
Continuity, `-288` Infrastructure, `-289` Project Toolchain & Standards) and composes whatever is
available into a single, review-ready technical SAD document. It is a peer to those nine agents, not
above them — it does not decide their content, only how the outputs are ordered, reconciled, and
where the gaps are.

Does not produce the business part of the SAD (scope, timeline, commercial content) — technical
composition only. Does not resolve a cross-domain conflict itself — surfaces it for architect
review rather than picking a side.

## Inputs

**Required:** none of the nine domain-strategy outputs are required to run — this agent is designed
to compose whatever subset exists today and report the rest as gaps, per its own acceptance
criteria ("runs with whatever is available"). As of this writing, none of the nine domain agents
(`EPMCSAPAI-275`, `-281` through `-289`) have an `agent.md` in this repo yet, so every run today
produces an all-gaps skeleton — that is the expected, correct output while they remain unbuilt, not
a failure of this agent.

**Optional, per domain, when a domain agent has produced output:**
- The domain's strategy output content (format TBD per domain agent — not yet defined since none
  exist yet).
- The domain's own open-issues list, if it tracks one.

**Interim domain sources, while `EPMCSAPAI-275`/`-281` through `-289` remain unbuilt:** two ported
skills already cover part of this same ground with real, engagement-tested content —
`skills/sad-drafting` (Solution Landscape `-275`, Data `-285`, Extensibility/RICEFW `-284`, and part
of Infrastructure `-288`) and `skills/integration-strategy-hip` (Integration `-283`). Treat their
output as `AVAILABLE` for the corresponding domain row when the dedicated domain agent doesn't exist
yet, labeled `source: interim (sad-drafting)` / `source: interim (integration-strategy-hip)` rather
than `source: EPMCSAPAI-<n> agent` — so a reviewer can see at a glance that the content came from
the interim path, not the eventual dedicated agent. Once a dedicated domain agent is actually built,
prefer its output over the interim skill's for that domain.

**Required, always:** the agreed SAD template (`../../artifacts/technical-sad/template.md`) — section
ordering and structure come from this template, not invented per run.

## Procedure

1. **Request each of the nine domain outputs.** For a domain with no dedicated agent yet, check for
   an interim source first (`sad-drafting` for Landscape/Data/Extensibility/part of Infrastructure;
   `integration-strategy-hip` for Integration) before marking it `MISSING` — see "Interim domain
   sources" in `## Inputs` above. Only a domain with neither a dedicated agent nor an interim source
   is `MISSING`.
2. **Assemble available domains into the SAD template's section order.** Preserve the template's
   fixed ordering (`../../artifacts/technical-sad/template.md`) — do not reorder sections based on
   which domains happened to have output this run, since a reviewer relies on the same section
   appearing in the same place across revisions.
3. **Flag every missing or inconsistent domain input explicitly**, in the SAD itself, rather than
   silently omitting its section. A missing domain gets an empty section marked `MISSING — no
   EPMCSAPAI-<n> output available` (per pattern 4 in `docs/skill-design-conventions.md`: a coarse
   "assembled" status can't carry a per-section gap, so each section carries its own).
4. **Surface cross-domain conflicts for architect review — do not resolve them.** When two available
   domain outputs make incompatible claims about the same area (e.g. Security's isolation model vs.
   Integration's shared-tenant assumption), record both claims, name the domains involved, and mark
   the conflict `NEEDS_ARCHITECT_REVIEW`. Never silently prefer one domain's claim over another's —
   this agent has no basis to judge which domain is authoritative on a cross-cutting concern.
5. **Exclude the business part.** Scope, timeline, and commercial content stay out of this SAD
   entirely, even if a domain output happens to include some — strip it out and note the omission
   rather than passing it through.
6. **Write the `technical-sad` artifact**, versioned, with every section's status (`AVAILABLE` /
   `MISSING` / `INCONSISTENT`) visible at a glance per pattern 4, and the full list of open
   cross-domain conflicts collected in one place rather than scattered per-section.

## Returns

- `technical-sad` artifact (`../../artifacts/technical-sad/template.md`): one section per domain
  (with `AVAILABLE`/`MISSING`/`INCONSISTENT` status and, when available, the domain's content and
  open issues), a consolidated cross-domain conflicts list, and an explicit list of which
  `EPMCSAPAI-<n>` domains are still missing.

## Refuse conditions

- No SAD template available: return `blocking missing input — no agreed SAD template to assemble
  against`. This is the one required input; missing domain content is expected steady state, not a
  refuse condition.

## Output schema compatibility

`technical-sad` sections key by the producing domain agent's ticket ID (`EPMCSAPAI-275`, `-281`
through `-289`) — the same stable-ID discipline as the object-migration chain (pattern 1 in
`docs/skill-design-conventions.md`), so that once a domain agent starts producing real output, this
agent's assembly logic does not need to change — it already keys sections by the domain's ticket ID.

## Related

- `EPMCSAPAI-275` Solution Landscape architecture strategy — domain input, not yet built.
- `EPMCSAPAI-281` Release & Transport Management architecture strategy — domain input, not yet built.
- `EPMCSAPAI-282` Security architecture strategy — domain input, not yet built.
- `EPMCSAPAI-283` Integration architecture strategy — domain input, not yet built.
- `EPMCSAPAI-284` Extensibility architecture strategy (Clean Core) — domain input, not yet built.
- `EPMCSAPAI-285` Data architecture strategy — domain input, not yet built.
- `EPMCSAPAI-286` Output Management & UX architecture strategy — domain input, not yet built.
- `EPMCSAPAI-287` Operations & Continuity architecture strategy — domain input, not yet built.
- `EPMCSAPAI-288` Infrastructure architecture strategy — domain input, not yet built.
- `EPMCSAPAI-289` Project Toolchain & Standards architecture strategy — domain input, not yet built.
- `EPMCSAPAI-251` Strategies generation (Cutover, Training, Testing, Convention) — sibling,
  non-technical delivery-strategy track; explicitly out of scope for this agent (relates-to link
  only, no data dependency).
- `skills/sad-drafting` — interim source for `-275`/`-285`/`-284`/part of `-288` until those domain
  agents exist.
- `skills/integration-strategy-hip` — interim source for `-283` until that domain agent exists.

## Status

Progress. `agent.md` and the `technical-sad` artifact written; not yet dry-run tested, since none
of the nine domain-strategy agents it composes exist in this repo yet — every run today would
produce an all-`MISSING` skeleton. Jira's own link graph on `EPMCSAPAI-290` records this agent as
`blocks` the nine domain agents (and they in turn `is_blocked_by` it), which is backwards from this
agent's actual content dependency (it *consumes* their output, per its own ticket description) —
flagging this as a likely Jira link-direction artifact rather than a real constraint on building
this agent's spec now. The exact `Sn` numbering (S1–S10) referenced in the ticket's Backlog ID is
not resolved to specific domains in this repo — this agent keys sections by ticket ID
(`EPMCSAPAI-275`/`-281`..`-289`) instead of by an unconfirmed `Sn` mapping.

Resolved: the previously-open question of `sad-drafting`/`integration-strategy`'s overlap with this
agent's domains is now handled as interim sourcing (see `## Inputs`/`## Procedure` step 1) rather
than left undecided — those two ported skills fill four of the nine domain rows with real content
today; the other five domains remain `MISSING` until their dedicated agents are built.
