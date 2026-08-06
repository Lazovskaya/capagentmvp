---
name: agent-readiness
description: Score a client's business processes for whether they should be handed to AI agents — volume, exception rate, decision reversibility, data reachability — and produce a named candidates-vs-leave-alone assessment. Use during Discover when scoping which processes to route toward SAP's Autonomous Enterprise / Joule agents, before any agent gets built.
---

# Agent-readiness assessment

*Design conventions this skill follows (ID schemes, status enums, role naming, etc.) are in `../../docs/skill-design-conventions.md` — check it before modifying this skill's templates.*

## Purpose

Decide, per client process, whether handing it to an agent is a good idea — and say so even when the
answer is no. This is the Discover-phase gate that sits in front of any agent-build work: it is the
bridge from delivery work into SAP's Autonomous Enterprise, and it is **a consulting deliverable, not
a product** — the output is a judgment call with reasons, not a sales pitch for how many processes can
be automated.

The failure mode this guards against is picking processes because they demo well, not because they
score well. A process that looks impressive in a Joule Studio walkthrough but has a high exception
rate or irreversible outcomes is a liability wearing a demo.

## When to use

- Early Discover, when scoping which client processes are candidates for agent handling
- Before any `agent-build` work starts — this activity's `assessment-report` is what `agent-build`
  should be scoped against, not a hunch
- When a client or internal stakeholder proposes "let's put an agent on X" and the claim needs
  testing rather than accepting at face value
- Revisiting a prior assessment after a process, its data, or its exception handling has changed

## Inputs needed

- Candidate process list and their variants (from the `signavio` connector's process mining, or
  supplied by the client/team directly)
- The business entities and relationships each process touches (from `knowledge-graph`) — this is
  what lets you actually check data reachability rather than assume it
- The `process` knowledge bucket, if populated from prior Discover/Prepare work

## Workflow

1. **List candidates, not just the popular one.** Don't evaluate only the process someone already
   wants to automate — pull the fuller candidate list from process mining so the "leave alone" list
   has real comparison points, not just one process being waved through.

2. **Score each candidate on four axes** (see `references/scoring-rubric.md` for the full rubric and
   worked thresholds):
   - **Volume** — how often does this run? Low-volume processes rarely justify the guardrail-building
     cost even if everything else scores well.
   - **Exception rate** — what fraction of instances deviate from the happy path? High exception rate
     doesn't disqualify a process by itself, but it means the agent's guardrails and escalation path
     are the real deliverable, not the happy-path logic.
   - **Reversibility** — if the agent gets it wrong, can the outcome be undone cheaply, or is it a
     payment sent, a contract signed, a shipment dispatched? Low reversibility raises the bar on
     confidence and human-in-loop checkpoints steeply; it does not automatically disqualify, but it
     changes what "ready" means.
   - **Data reachability** — is what the agent needs actually reachable through a released API or
     structured source, or does it live in someone's inbox, a spreadsheet, or tribal knowledge? A
     process can score well on the first three axes and still fail here — check this against the
     knowledge-graph, don't take "the data exists somewhere" as reachable.

3. **Render a verdict per process**, not just a score: `Candidate` / `Candidate with guardrails`
   (needs human-in-loop or escalation design before build) / `Leave alone` (state which axis failed
   and why it isn't close). A numeric score with no verdict just moves the judgment call downstream
   to someone with less context.

4. **Resist demo-ability as a criterion.** If a process is being proposed because it's visually
   compelling or strategically favored, say so explicitly and score it on the same four axes as
   everything else — enthusiasm is not evidence of volume, low exceptions, reversibility, or data
   reachability.

5. **Name the leave-alone list as deliberately as the candidate list.** A report that only lists
   winners reads as incomplete later — "why wasn't X considered" should have an answer already on
   record, not require re-litigating the assessment.

## Outputs

- **`assessment-report` artifact**: candidate processes (with verdict and axis scores), leave-alone
  processes (with the disqualifying axis stated), and guardrail notes for anything marked "Candidate
  with guardrails" (see `../../artifacts/assessment-report/template.md`)
- **`process` knowledge bucket** update, if the scoring surfaced process detail worth retaining
- Feeds the `discover→prepare` Q-gate — and downstream, scopes what `agent-build` is allowed to build
  against; a process not in this report's candidate list isn't an agent-build target yet

## Judgment calls worth stating out loud

- **A high score on three axes does not average out a hard fail on the fourth.** These are not
  additive weights — an irreversible, unreachable-data process doesn't become viable because its
  volume is huge. State which axis is the blocker, don't blend it into a composite number that hides
  it.
- **"We already have an agent-adjacent tool for this" is not the same as "this process is
  agent-ready."** Score the process, not the enthusiasm for the tooling.
- **Low exception rate today can be an artifact of a narrow happy-path definition**, not genuine
  process simplicity — check whether "exceptions" were scoped to include the messy real cases or just
  the documented ones.
- **This report is a bridge, not a commitment.** Naming a process as `Candidate` schedules it for
  `agent-build` evaluation later; it does not authorize building it. Say that distinction out loud so
  it isn't read as a green light.
