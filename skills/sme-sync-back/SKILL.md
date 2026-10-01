---
name: sme-sync-back
description: Walk an SME through contributing changes made in a generated install (e.g. sap-ai-factory-test) back into the sap-ai-factory factory repo as a normal merge request. Invoked when the user says something like "contribute my changes back", "sync my edits to the factory", or "what did I change that's worth keeping" while working inside an installed project. Not useful outside a generated install -- it has nothing to sync back from a fresh clone of sap-ai-factory itself.
---

# SME sync-back

Runs `scripts/sync_back.py` (in the SME's `sap-ai-factory` checkout) on the SME's behalf and
narrates its verdicts in plain language, so an SME who is an SAP consultant first and a git user
second can land their edits without knowing anything about content hashes, adapter transforms, or
governance sidecars. See `staff/sme-contribution-roundtrip-plan.md` (in the factory repo, if the
SME has it) for the full design rationale; this skill is the conversational front end to it.

## When to use

The user is working inside a generated install of the factory (this session is rooted in a
project with a `factory-lock.json` and `.claude/skills/` -- e.g. `sap-ai-factory-test`) and wants
to know what they changed that's worth keeping, or wants to send it back to the factory repo.
Trigger phrases: "contribute my changes back", "sync this to the factory", "what did I edit that
matters", "send this upstream".

Do not use this from inside the factory repo itself (`sap-ai-factory`) -- there is nothing to
sync back from; the factory is the destination, not the source.

## Locating the factory checkout

`sync_back.py` lives in, and must run from, a `sap-ai-factory` checkout -- a different directory
than the one this skill is running in. This skill assumes the SME's `sap-ai-factory` clone sits
at the conventional sibling path, `../sap-ai-factory` relative to this project's root (the same
convention every command in the plan itself uses, and the one this factory's own maintainers'
setups follow). If `../sap-ai-factory/scripts/sync_back.py` doesn't exist, **stop and say so
explicitly** -- name the expected path and ask the SME to clone `sap-ai-factory` there (or tell
you where it actually is, if their setup genuinely differs) rather than guessing another location
or silently failing partway through.

## Steps

1. **Locate the factory checkout** as above. If found, note its path for every command below.

2. **Run the check.** `python3 <factory>/scripts/sync_back.py --project <this project's root>
 --check`. This never writes anything -- always safe to run, as many times as needed.

3. **Narrate the verdicts, grouped, in plain language** -- don't just paste the raw table:
   - **UNCHANGED** -- nothing to do, skip past these quickly.
   - **LOCAL-EDIT** -- "you changed `<name>` and it's ready to send back." List these as the
     headline: this is the value the SME came here for.
   - **NEW** -- "`<name>` doesn't exist in the factory yet -- this looks like something you
     built fresh." If several NEW skills appear alongside the split/rename hint `sync_back.py`
     prints, explain it as: "this looks like you split `<parent>` into these pieces -- is that
     right?" and show the graph impact report as the checklist of factory-only files (gates,
     `*.meta.md`, `factory-data.json`) that still need hand-updating once this lands -- make
     clear the skill does not attempt that rewrite itself, the SME finishes it in their factory
     branch.
   - **CONFLICT** -- never resolve silently. Show both the SME's content and the factory's
     current content (or at minimum the three hashes `sync_back.py` prints) and ask which one is
     right, or whether both changes need to be merged by hand. `--apply` will refuse to touch
     these on its own for exactly this reason.
   - **REMOVED** -- always ask, never assume it's a stale checkout even when `sync_back.py`'s
     own git-history annotation suggests one. "It looks like `<name>` disappeared locally -- was
     that intentional, or did your checkout just predate it?" A wrong guess here would delete
     upstream work if it were ever auto-applied (it isn't, but the SME's own next factory commit
     could still do it by hand if misinformed).
   - **NO-BASELINE** -- "there's no recorded baseline for `<name>`/`<file>` to compare against,
     so I can't tell if this is new or already matches the factory -- worth a manual look."
   - **ORPHANED-LOCK** -- "the install's records mention `<name>`, but it no longer exists in the
     factory at all -- nothing to contribute, this is just stale bookkeeping."
   - **AMBIGUOUS** (a new `.claude/agents/<name>.md` with no matching factory Agent or
     Assistant) -- ask directly: "is `<name>` a new Agent or a new Assistant?" Never guess.

4. **For each NEW skill with no `skill.meta.md`** (the scaffolding gap `lint_dependencies.py`
 fails on unconditionally), collect the governance fields the SME never sees in the test repo:
   - `owner` -- their own email, unless this is a declared split (step 5), in which case offer to
     inherit the parent's owner and let them override.
   - `project_types` -- ask, or infer from context if the engagement type is already known.
   - `sdlc_phases` -- same.
   - `risk_freedom` -- explain briefly if asked (`low`/`medium`/`high`, per
     `docs/skill-design-conventions.md`), default to asking rather than guessing.

   Then run: `python3 <factory>/scripts/sync_back.py --scaffold-sidecars --scaffold-skills
   <names> [--scaffold-parent <parent> | --owner <owner> --project-types <csv>
   --sdlc-phases <csv> --risk-freedom <level>]`.

5. **Confirm before writing anything.** Summarize exactly what `--apply` will do: which
 skills/tools/agents/assistants will be overlaid into the factory, which knowledge/artifact files
 (only if the SME also wants those included -- ask, since `--apply` needs `--include
 knowledge,artifact` explicitly for those kinds), and confirm CONFLICT/REMOVED items are excluded
 as always. Get an explicit go-ahead before running anything that writes.

6. **Apply.** `python3 <factory>/scripts/sync_back.py --project <this project's root> --apply
 [--include knowledge,artifact]`. Report exactly what changed, from its own "applied:" lines.

7. **Commit and open the MR.** Ask for the ticket number if the SME has one (the repo's
 commits use an `EPMCSAPAI-NNN:` subject prefix throughout); if they don't have one, ask before
 falling back to a placeholder. Then: `python3 <factory>/scripts/sync_back.py --project <this
 project's root> --apply --commit --open-mr --branch <name>`. `sync_back.py` itself asks for
 confirmation before writing to a protected branch (`main`, `feature/architecture-assistant`) --
 relay that prompt to the SME rather than answering it yourself.

8. **Tell the SME what's still theirs to do.** Point at the printed graph impact report (if a
 split was detected) and remind them: `factory-data.json`'s `components[]`/`activities[]`,
 `gates/*.md`, and any other skill's Dependency graph the report named are not touched by this
 skill or by `sync_back.py` -- they finish that rewiring on their new branch in the factory repo,
 then `python3 scripts/lint_dependencies.py --fix`, then `python3 build.py`, before the MR is
 ready for review.

## What this skill never does

- Never resolves a CONFLICT or a REMOVED verdict on its own judgment -- always asks.
- Never attempts the graph rewrite (updating `factory-data.json`, gates, other skills'
  dependency rows) -- only reports what needs it.
- Never applies to knowledge/artifacts without the SME explicitly asking for it.
- Never pushes or opens an MR without an explicit go-ahead at step 5, separate from the earlier
  check.
