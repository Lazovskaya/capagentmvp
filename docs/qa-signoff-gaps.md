# Specification gaps to resolve before formal QA sign-off

Source: `Agents_Test_Checklist (example).docx`, section 3 ("Specification Gaps to Resolve Before
Formal Sign-off") — six items the testers flagged as needing an explicit answer before they can
write deterministic test cases against this factory's skills/agents.

**Status of this document: DRAFT.** Each section below states what this repo already has (cited),
what's genuinely missing, and a *proposed* resolution where one can be derived from content already
in the repo. A proposal here is not a decision — whoever owns quality sign-off for this factory
needs to confirm, adjust, or reject each one before testers treat it as settled. Nothing in this
document invents a business rule that isn't already implied by existing repo content; where no such
basis exists, the gap is left open rather than guessed at.

## 1. Decision rules for subjective terms

*(appropriate, relevant, coherent, suitable, sufficient, complete)*

**Current state:** these words appear across `agents/`, `skills/`, and `artifacts/` (25 occurrences
found), always descriptively (e.g. "Why is SAP standard not appropriate or sufficient?" in the
WRICEF templates) — never as an operational test a reviewer or an automated check could apply. No
repo-wide glossary exists.

**Proposed default tests** (derived from the checklist's own "1. Common Checks" section, which
already implies an operational meaning for each — restated here as reusable rules, not invented):

| Term | Proposed operational test | Basis |
|---|---|---|
| **Complete** | Every field the artifact's `schema.json` marks `required` is populated; any field the agent can't populate is recorded as an explicit gap, not left silently blank. | Common Checks: "does not invent facts... where information is missing" |
| **Sufficient** | The evidence supports the specific conclusion it's attached to without relying on an unresolved assumption for a currently-blocking decision. | Common Checks: "confirmed results remain separate from unresolved conclusions" |
| **Coherent** | No two required fields/sections of the same artifact assert contradictory claims without an explicit conflict flag. | Common Checks: "material conflicts... are not silently merged"; pattern 4 in `docs/skill-design-conventions.md` |
| **Appropriate / Suitable** | The choice (a design technique, a routing decision, a classification) traces to a named, written rule in that component's own procedure — not an unstated judgment call. | Common Checks: "the result reflects the agent purpose rather than merely summarizing"; pattern 5 (N-way routing needs a written decision test) |
| **Relevant** | The item is traceable to the current activity's declared scope boundary; out-of-scope or mixed-scope material is excluded, not silently folded in. | Common Checks: "mixed-scope or out-of-scope data is excluded from the current analysis" |

**Open gap:** these are factory-wide defaults proposed here for the first time — no component
currently cites them. If accepted, each skill/agent's own `## Refuse conditions` /
`## Judgment calls` section should reference the relevant test by name instead of restating it, the
same way components already reference `docs/skill-design-conventions.md`.

## 2. Agent action vs. external-tool action

*(run/consume, execute/guide, push/synchronize/register)*

**Current state:** individually defined per component, not consolidated:

| Verb pair | What it means here today | Where defined |
|---|---|---|
| **run / consume** | Agent reads and interprets an input; never mutates the source. | Implicit in every agent's `## Inputs` — no agent in this repo writes back to a source it reads. |
| **execute / guide** | `production-conversion` **guides** — a named human go/no-go decision-maker executes the runbook; the skill captures evidence at each checkpoint, it does not act unattended in production. | `skills/production-conversion/SKILL.md` |
| **push / synchronize** | Connector-mutating action, always gated: local draft first, human approval, then optional push (`--apply` / explicit "yes, create" per pattern 6). | `skills/backlog-drafting/SKILL.md`, `skills/test-case-design/SKILL.md`, pattern 6 in `docs/skill-design-conventions.md` |
| **register** | Not yet defined — `agent-build` (AI Agent Hub registration) is `status: notstarted`; no component in this repo performs a "register" action today. | — |

**Open gap:** the pattern is consistent (agent decides/drafts, human approves, tool/connector
executes the write) everywhere it's been built — but nothing states this as a factory-wide rule
that new components must follow, and `register` has no defined behavior at all because `agent-build`
doesn't exist yet. Proposed resolution: promote the "local draft → human approval → connector write"
sequence from pattern 6 to also cover `execute` (a runbook) and `register` (once `agent-build` is
built) explicitly, so every named verb in the checklist maps to the same underlying rule.

## 3. Mandatory vs. optional human validation/review/sign-off points

**Current state:** stronger than it first appears —
- Every one of the 15 `agent.meta.md` files sets `human-confirms` (`true` in 10, `false` in 5) —
  no agent is missing this field.
- Every `skill.meta.md` sets a `q-gate` field naming which phase-transition gate the skill's output
  feeds.
- Several skills state their own mandatory review point explicitly (`backlog-drafting`: "show the
  drafted item(s) and get approval before any connector push"; `test-case-design`: "Required review
  occurs before optional synchronization").

**Open gap:** there is no single cross-repo table a tester can scan to see, per activity, which
step is mandatory-before-proceeding vs. optional, and what status the artifact carries before vs.
after that approval. This is scattered truth, not missing truth — the fix is compiling it, not
inventing it. Proposed resolution: a generated table (one row per skill/agent) of
`component | human-confirms or q-gate | mandatory step | pre-approval status | post-approval status`,
sourced from each component's existing `agent.meta.md`/`skill.meta.md` plus its own procedure —
mechanical to build once the six phase gates below are confirmed as the checkpoint list.

## 4. Q-gate / lifecycle entry and exit criteria, including required artifacts/evidence

**Current state:** this is the most complete of the six items already. All six phase-transition
gates exist under `gates/<name>/gate.md` (`discover-prepare`, `prepare-explore`, `explore-realize`,
`realize-deploy`, `deploy-run`, `run-exit`), each with an explicit **evidence mapping table**
(checklist item → evidence artifact → producing component) and, for five of the six, an explicit
note that SAP Cloud ALM's Quality Gates app owns the actual checklist/approval mechanism while this
factory owns the evidence mapping. `run-exit` (the one gate Activate doesn't define) owns both the
mechanism and the evidence itself, and is the most fully specified of the six — four required
open-item dispositions, no silent fifth option, a named approver.

**Open gap:** none structural — the gates exist and are reasonably specific. The one caveat every
gate file states itself: none has been **run on a real engagement**, and the evidence-mapping tables
are sourced from SAP Community blog posts, not SAP's primary product documentation, so they're
marked "representative/typical, not verbatim official" pending verification against a real client's
Cloud ALM instance. That verification is an engagement-time action item, not a spec gap to close in
this repo.

## 5. Precedence rules for conflicting sources

**Current state:** one explicit rule already exists — `knowledge-discovery`'s "client-specific
evidence is preserved over generic SAP assumptions" (also directly named in the checklist's own
Prepare-phase Knowledge Foundation section). Beyond that single named case, this factory's default
posture is **not** to auto-resolve: `source-conflict-analyst` and `sad-assembly` both exist
specifically to surface a conflict for human review rather than pick a side, and pattern 4 in
`docs/skill-design-conventions.md` requires a fine-grained flag for exactly this kind of unresolved
claim.

**Open gap:** there's no single statement of what the *default* precedence rule is when no
component-specific override exists. Proposed resolution: state the default explicitly — **escalate
to human review; auto-resolve only where a named, written override rule exists** (today, exactly
one such override: client-specific evidence over generic SAP default) — so a tester encountering a
new conflict scenario knows which behavior (escalate vs. the one named override) is actually correct
without checking every component individually.

## 6. Measurable output schemas and required fields for named artifacts

**Current state:** strong. 35 of 36 artifacts under `artifacts/` have a `schema.json` with
`required` fields; the one exception (`explore-chain`) is a cross-skill handoff model
(`artifact-model.yaml` + `handoff.md`, per pattern 7), not a single-instance artifact, so it isn't a
gap of the same kind. The four artifacts the checklist names explicitly by name
(`assessment-report`, `architecture-package`, `triage-verdict`, `run-exit-record`) all have a
`schema.json` with `required` fields already.

**Open gap:** none structural. The residual risk is the same one flagged in item 4 — schemas exist
but haven't been validated against real generated output, since (per every component's own
`## Status` section) most have not yet been dry-run tested. A schema that's never been exercised
against a real artifact instance can still be wrong in ways only a real run would surface.

## Summary — what actually needs a decision vs. what needs compiling

| Item | Needs a human decision | Needs compiling existing content | Already adequate |
|---|---|---|---|
| 1. Subjective terms | Confirm/adjust the five proposed tests above | — | — |
| 2. Agent vs. tool boundary | Confirm the proposed factory-wide rule; decide `register`'s behavior once `agent-build` is built | — | — |
| 3. Human validation points | — | Build the cross-repo table | — |
| 4. Q-gate criteria | — | — | Yes, pending real-engagement verification |
| 5. Precedence rules | Confirm the proposed default | — | — |
| 6. Output schemas | — | — | Yes, pending dry-run validation |

Items 1, 2, and 5 are the ones this document can't close alone — they need an explicit yes/no from
whoever owns quality sign-off for this factory. Items 3, 4, and 6 are either already in good shape or
just need someone to compile/verify what already exists, not decide something new.
