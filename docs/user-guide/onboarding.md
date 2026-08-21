# End-user onboarding: SAP AI Factory, from "what is this" to daily use

> Audience: anyone about to work in a client project delivered from the SAP AI Factory —
> whether you already have a repo in hand or are still finding out what this even is. Not for
> people authoring the factory itself (see `docs/skill-design-conventions.md` and, once written,
> `docs/contributing/` for that audience) and not for the consultant running the delivery
> tooling before handoff (see `skills/factory-onboard/`).
>
> **Status:** first pass, EPMCSAPAI-297 (P7). Markdown-in-repo first, structured to migrate to
> kb.epam.com once the delivery process settles — see "Migration to KB" at the end.

---

## 1. What SAP AI Factory actually is

SAP AI Factory is a library of AI skills, connectors, and knowledge for SAP delivery work —
things like fit-to-standard workshop prep, defect triage, custom-code scans, and ABAP/Jira
connectivity — built once, then installed into whichever AI coding tool a project actually uses
(Claude Code, GitHub Copilot, or Cursor).

Two things it deliberately is **not**:

- **Not a new tool to learn.** You keep using Claude Code / Copilot / Cursor exactly as you
  already do. The factory just adds skills (playbooks the assistant follows for specific SAP
  tasks) and connectors (live access to systems like Jira or an ABAP backend) into that tool.
- **Not one-size-fits-all.** A client project only receives the skills and connectors actually
  relevant to that engagement — not the whole factory catalog. What you find in your project is
  already scoped to your work, not a generic dump.

The rest of this guide gets you from "I have a project folder" to "I'm using this day to day."
Sections 2–7 assume you already have a delivered project; if you're just exploring, skim section
2 to see what a delivered project contains, then come back once you have one.

## 2. What you received

Your project folder already contains, per tool:

| Tool | Skills | MCP config | Entry file |
|---|---|---|---|
| Claude Code | `.claude/skills/<name>/` | `.mcp.json` | `CLAUDE.md` |
| GitHub Copilot | `.agents/skills/<name>/` | `.vscode/mcp.json` | `.github/copilot-instructions.md` |
| Cursor | `.cursor/skills/<name>/` | `.cursor/mcp.json` | `.cursor/rules/factory.mdc` |

Plus, at the project root: `connectors/<name>/` (what each wired connector is and how it
authenticates — no secrets in these files), `knowledge/<bucket>/` and `artifacts/<name>/`
(seeded once from the factory's defaults — yours to edit from here on, never silently
overwritten by a later delivery), and `factory-lock.json` (a record of exactly what was
installed and from where).

None of this requires network access to the factory repo itself once delivered — the project is
self-contained except for the one thing described next.

## 3. What you must supply yourself: credentials

**Nothing in your delivered project contains a real credential.** `connectors/<name>/connector.md`
describes *what* a connector is and *how* it authenticates; the actual username, password, API
token, or JWT always lives in a file **outside** the project, on your own machine, that you
create yourself:

| Connector | Session file location | Required keys |
|---|---|---|
| `jira` | `~/.config/mcp-atlassian/sessions/<destination>.env` | `JIRA_URL`, `JIRA_USERNAME`, `JIRA_API_TOKEN` |
| `abap-mcp` | `~/.config/mcp-abap-adt/sessions/<destination>.env` (Unix) / `%USERPROFILE%\Documents\mcp-abap-adt\sessions\<destination>.env` (Windows) | `SAP_URL`, `SAP_AUTH_TYPE`, `SAP_SYSTEM_TYPE`, `SAP_CLIENT`, plus `SAP_USERNAME`/`SAP_PASSWORD` or `SAP_JWT_TOKEN` |

The exact `<destination>` name to use is already in your project's `.mcp.json` (or the
tool-specific equivalent from the table above) — look for `--destination=<name>` or
`--env=<name>` in the connector's command line. Follow the connector's own "Wiring" section
(`connectors/<name>/connector.md`) for the full, current field list; the table above is a
summary, that file is the source of truth.

If your engagement supplied a pilot infrastructure context file instead of asking you to create
these by hand, `tools/pilot_context.py` (invoked automatically by `tools/unpack.py`, see below)
resolves it into the `abap-mcp` session file for you — you still only ever provide the
credential *value* via an environment variable at resolve time, never as a committed file.

## 4. Prerequisites (once, per machine)

- **Node.js** (provides `npx`) — needed if `abap-mcp` is wired. Check with `npx --version`;
  install from nodejs.org (LTS) if missing.
- **Python 3** — needed if `jira` is wired (its launcher script is Python). Check with
  `python3 --version` (or `python --version` on Windows).
- **`uv`/`uvx`** — needed if `jira` is wired (`mcp-atlassian` runs through it). Check with
  `uvx --version`; install with `pip install uv` if missing.
- **Internet access to npm/PyPI** on first use of each connector — the underlying MCP server
  package downloads itself the first time it runs (`npx -y ...` / `uvx ...`). If you're behind a
  restrictive proxy, this first run can hang; check with your IT contact if so.

None of the above needs installing by hand beyond the check-and-install step — you are not
expected to install `mcp-abap-adt` or `mcp-atlassian` yourself; the tool that provides `npx`/`uvx`
does that automatically on first use.

## 5. Running unpack/install

If you received a repo that already has `.claude/`, `.cursor/`, or `.agents/skills/` populated,
this step is already done — skip to section 6. If you received the factory source plus a pilot
context file and need to produce your own project, or need to re-run it after an update:

```bash
python3 tools/unpack.py --target claude-code --project /path/to/your-project \
  --skills '*' --connectors abap-mcp \
  --context platform/pilot-context/pilot-<id>.context.json
```

- `--target` is `claude-code`, `github-copilot` (alias `copilot`), or `cursor`; omit it to install
  for every tool listed in the context file's `toolEnvironments`.
- Re-running is safe: unchanged skills/connectors are left alone, and `knowledge/`/`artifacts/`
  content already seeded once is never silently overwritten — only genuinely new or updated
  content is touched. Nothing you've edited yourself under `knowledge/` or `artifacts/` will be
  clobbered by a later delivery cycle.
- The command prints what it installed and, if a context file was used, verifies the credential
  file it wrote actually has every field filled in before finishing.

## 6. Verifying tool readiness

- **Claude Code**: skills and MCP servers activate automatically on opening the project. Run
  `/mcp` to confirm each configured connector shows as connected.
- **GitHub Copilot**: skills need the `chat.useAgentSkills` VS Code setting, which the install
  step already enabled in `.vscode/settings.json` — confirm it's still on if skills don't appear.
- **Cursor**: unlike the other two, Cursor does **not** auto-start MCP servers from
  `.cursor/mcp.json`. Open **Settings → MCP** (the "Customize" panel) and enable each server
  listed there — a connector's tools won't show up until you do this once.

For any tool: ask the assistant a simple, read-only question that exercises a connector (e.g.
"list my Jira projects" or "read the source of class X") to confirm it's actually live, not just
configured.

## 7. Daily workflow

- Skills are playbooks the assistant loads automatically based on what you ask (or explicitly,
  depending on the tool — `/skill-name` in Claude Code, a prompt file in Copilot, a rule in
  Cursor). You don't need to "run" anything separately; describe the task and the right skill
  activates.
- Connector calls that only read data (fetch a ticket, read ABAP source) run without asking.
  Anything that would **write** — updating a Jira ticket, creating a transport — follows a
  dry-run/preview-first convention: the assistant shows you exactly what it would change and
  waits for your explicit go-ahead before it actually writes. If a skill or the assistant asks
  you to approve a write, that's expected behavior, not a bug.
- `knowledge/<bucket>/` and `artifacts/<name>/` are yours to edit as your engagement discovers
  real facts about the client's systems and processes — the factory seeded a starting point, it
  doesn't own these files going forward.

## 8. Security boundaries, summarized

| | Pre-packaged (in the repo you received) | You supply |
|---|---|---|
| Skill instructions, connector definitions | ✅ | |
| MCP wiring shape (`command`, `args`) | ✅ | |
| Real credentials (passwords, tokens, JWTs) | never | ✅ (session file outside the project) |
| Knowledge/artifact starting content | ✅ (once) | edits from here on |

Never commit a real credential into this project, even temporarily — every connector's design
assumes secrets live only in the per-user session file described in section 3, which is never
read from or written into the repo by any tooling here.

## 9. Migration to KB

This file is authored as the source of truth in-repo first. Once the delivery process
stabilizes, this content is intended to move to kb.epam.com; until then, this file (not a KB
page) is authoritative — if a KB copy exists and disagrees with this file, this file wins.
