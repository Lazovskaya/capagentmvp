---
name: knowledge-discovery
description: Scan a client's real system and process landscape — custom code, configuration baseline, process scope, existing extensions, data objects, defect/ops history — and turn it into draft knowledge buckets, then run them through a named human validation gate before anything downstream trusts them. Use once at the start of Prepare, and again whenever a knowledge bucket needs a substantial refresh (not for the ongoing small updates knowledge-harvest handles).
---

# Knowledge foundation / discovery

*Design conventions this skill follows (ID schemes, status enums, role naming, etc.) are in `../../../docs/skill-design-conventions.md` — check it before modifying this skill's templates.*

## Purpose

Nothing downstream is trustworthy until this exists. Every other skill in this factory — `fit-to-standard`,
`solution-design`, `defect-triage`, all of it — reads the knowledge buckets this activity builds. An
inferred, unvalidated bucket is worse than an empty one, because it looks authoritative while being
wrong often enough to be dangerous: a scanner can find that 500 Z-programs exist, but it cannot tell
you *why* the client built them, and that "why" is exactly what later activities (custom-code
evaluation, extensibility routing) need to make a correct call.

This is a discovery-plus-judgment activity, not a scan-and-publish one. The scan produces a draft; a
named human turns the draft into something the rest of the factory can rely on.

## When to use

- Once, early in Prepare, to build the initial knowledge base for a new engagement
- Whenever an existing bucket needs a substantial re-scan (e.g. a brownfield client's custom-code
  landscape turns out to be badly under-documented, or a merger/carve-out changes the process scope)
- **Not** for the steady small corrections that accumulate during Run — that's `knowledge-harvest`'s
  job (propose targeted deltas after each run, reviewed, never auto-merged). This skill does the first
  full build (or a full rebuild); `knowledge-harvest` does incremental upkeep afterward.

## Inputs needed

- System and landscape access: `abap-mcp` for custom-code inventory and usage data (object read,
  syntax check, ATC), `knowledge-graph` for the client's business entities, relationships, and process
  scope
- Whatever the client/team already has documented (interviews, prior assessment reports, an existing
  process map) — the scan augments this, it doesn't replace it
- A named reviewer per bucket, or a small set of reviewers covering all nine — someone who can supply
  the client-specific "why" a scan cannot produce

## The nine buckets — what this skill actually builds

Eight of the nine are client-specific and get built here from scratch: `process`, `config`,
`custom-code`, `extensibility`, `data`, `testing`, `operations`, `standards` (the last one is mostly
"EPAM delivery standards plus this project's own conventions" — thin at first, grows over the
engagement). **`clean-core` is the ninth bucket and is different in kind: it's SAP's own published
rules, `adopt`-posture, a central default this skill confirms is loaded and current — not something
inferred from this client's landscape.** Treat "builds all nine buckets" as "builds eight and confirms
the ninth is the right adopted version," not as inferring clean-core rules from the client's system.

## Workflow

1. **Scope the pass.** Full initial build, or a targeted refresh of specific buckets? State which
   buckets are in scope before scanning — don't silently redo buckets that weren't asked for.

2. **Scan each in-scope client-specific bucket** using the appropriate source:
   - `custom-code` — object inventory and usage data via `abap-mcp` (this is a first-pass inventory,
     not the deeper ATC remediation pass `custom-code-evaluation` does later in Prepare — don't
     duplicate that activity's depth here)
   - `process` — scope and variants via `knowledge-graph`, supplemented by whatever process
     documentation already exists
   - `config`, `extensibility`, `data`, `testing`, `operations` — whatever landscape access and
     existing documentation can surface; where nothing is reachable yet, say so rather than leaving a
     bucket looking populated when it's actually empty

3. **Mark every scanned bucket as `inferred — not yet validated`** before it goes anywhere near a
   human reviewer or a downstream skill. An inferred bucket must be visibly distinguishable from a
   validated one — see `references/bucket-validation-log-template.md`.

4. **Route each bucket to a named reviewer.** The reviewer's job is not to rubber-stamp the scan — it's
   to correct what's wrong (scanners misread SAP context often enough that this is expected, not
   exceptional) and add the **client-specific why** that no scan can produce: why this custom object
   exists, why this config choice was made historically, which parts of the process map are actually
   obsolete. A bucket with corrections but no "why" added is still incomplete.

5. **Do not let partial validation look like full validation.** If 6 of 8 client-specific buckets are
   validated and 2 aren't, say exactly which 2 are still draft — don't let the bucket set as a whole
   read as "done" when it's mixed. The `prepare→explore` Q-gate reads bucket-by-bucket status, not an
   aggregate.

6. **Close each bucket with a named validation record**, not just an edited file — who reviewed it,
   what they corrected, what "why" they added, and the date. This is what lets a later activity trust
   the bucket without re-verifying it from scratch.

## Outputs

- **Eight client-specific knowledge buckets**, each either `inferred — not yet validated` or
  `validated` with a named reviewer and date
- **Confirmation that `clean-core` is loaded and current** (not authored, just confirmed)
- **`references/bucket-validation-log-template.md`** entries — one per bucket, tracking source,
  inferred summary, reviewer, corrections, client-specific why, and status
- Feeds the `prepare→explore` Q-gate, and is the foundation every other activity's "knowledge" input
  actually reads

## Judgment calls worth stating out loud

- **An inferred-but-unvalidated bucket is a liability, not partial progress.** Downstream skills that
  read it without checking its status will silently inherit scanner errors — the visible status flag
  exists specifically to stop that.
- **"The scan found nothing wrong" is not the same as "validated."** A reviewer who skims and approves
  without adding any client-specific why hasn't actually done the job this step exists for — the why is
  the value, not the rubber stamp.
- **Don't re-scan a bucket that only needs a small correction.** A single wrong fact in `process`
  doesn't justify redoing the whole bucket via this skill — that's a `knowledge-harvest` delta, not a
  `knowledge-discovery` rebuild. Using the heavier tool for a light correction just adds noise.
- **A brownfield client's `custom-code` and `operations` buckets are rarely as clean as the scan
  suggests** — treat surprisingly tidy scan results on a long-lived system as a signal to look harder,
  not as good news to accept quickly.
