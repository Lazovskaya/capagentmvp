# Access & security guide: credentials, tokens, and the trust boundary

> Audience: same as `onboarding.md` — anyone working in a client project delivered from SAP AI
> Factory. Companion document for EPMCSAPAI-297 (P7); read `onboarding.md` first for the general
> setup flow, this file for the security detail behind it.
>
> **Status:** first pass, EPMCSAPAI-297 (P7). Markdown-in-repo first; see `kb-migration-plan.md`
> for when this moves to kb.epam.com.

---

## 1. The rule this whole guide follows

**No real credential ever lives inside the delivered project.** Not in `.mcp.json`, not in any
tool's config file, not in `connectors/<name>/server.json`, not in git history. Every connector
in this factory is built to this rule from the start — it isn't a policy layered on top, it's
how the wiring itself works: a connector's command line names a `<destination>` (a lookup key),
and the actual secret lives in a file outside the project directory, on the machine actually
running the tool.

If you ever find a real password, API token, or key committed anywhere in this project — in a
file, in `git log`, in a comment — treat it as a live incident (see section 5), not a cleanup
task.

## 2. What's pre-packaged vs. what you supply

| | Pre-packaged (in the repo you received) | You supply |
|---|---|---|
| Skill instructions, connector definitions (`connectors/<name>/connector.md`) | ✅ | |
| MCP wiring shape (`command`, `args` — *how* to call the connector) | ✅ | |
| The `<destination>` lookup name a connector's config points at | ✅ | |
| Real credential *values* (passwords, API tokens, JWTs) | never | ✅ |
| Knowledge/artifact starting content (`knowledge/`, `artifacts/`) | ✅ (once) | edits from here on |

The project tells you *which* destination name to use and *what kind* of credential a connector
needs (see each connector's own `connector.md` "Wiring" section). It never tells you, or contains,
the credential itself.

## 3. Where your credentials actually live

Per connector, in a file outside the project directory that only your own machine account can
read:

| Connector | Session file location | Required keys |
|---|---|---|
| `jira` | `~/.config/mcp-atlassian/sessions/<destination>.env` | `JIRA_URL`, `JIRA_USERNAME`, `JIRA_API_TOKEN` |
| `abap-mcp` | `~/.config/mcp-abap-adt/sessions/<destination>.env` (Unix) / `%USERPROFILE%\Documents\mcp-abap-adt\sessions\<destination>.env` (Windows) | `SAP_URL`, `SAP_AUTH_TYPE`, `SAP_SYSTEM_TYPE`, `SAP_CLIENT`, plus `SAP_USERNAME`/`SAP_PASSWORD` or `SAP_JWT_TOKEN` |

These locations are deliberately outside any git-tracked directory. Nothing in this factory's
tooling ever reads from, or writes to, a location inside the project for a real secret value —
if you ever see tooling try to do that, stop and treat it as a bug, not a feature to work around.

## 4. Who can see what, and why that's safe

- **This repo's own files** (skills, connector definitions, `.mcp.json`'s command/args shape) are
  safe to read, share, and — for the factory source itself — put in front of other consultants or
  reviewers. There is nothing secret in them by design.
- **Your session `.env` files** are yours alone. Never share them, screenshot them, or paste their
  contents into a chat, ticket, or this project's own files. If a teammate needs the same
  connector working, they create their **own** session file with their **own** credentials — never
  copy yours to them.
- **Write operations** (updating a ticket, creating a transport) always show you a preview before
  they happen and wait for your explicit approval — this is a deliberate design choice across
  every connector in this factory, not something you need to configure.

## 5. If a credential is ever exposed

1. **Rotate it immediately** at the source system (Jira, the SAP system) — change the password or
   revoke/reissue the API token/JWT, regardless of how it was exposed.
2. **Delete the exposed copy** — if it's in a file, delete the file (and, if it was ever
   committed, treat the repository's history as compromised and follow your engagement's incident
   process for scrubbing git history, don't just delete the current version).
3. **Tell your delivery lead or engagement security contact** — this is a real security event,
   not a private mistake to quietly fix. Rotating alone, without reporting, leaves anyone who
   already has a copy of the old credential unaddressed.
4. **Do not** attempt to "clean up" by editing the session file back to a placeholder and moving
   on — the credential was live at some point during exposure; rotation is the only step that
   actually closes the window.

## 6. Related documents

- [`onboarding.md`](onboarding.md) — what SAP AI Factory is, and the full setup/daily-use flow
  this guide's credential detail supports.
- [`kb-migration-plan.md`](kb-migration-plan.md) — when and how this guide (and `onboarding.md`)
  move to kb.epam.com.
- Each connector's own `connectors/<name>/connector.md` — the current, authoritative field list
  and "Wiring" steps for that specific connector; this guide summarizes the shared pattern, that
  file is the source of truth for any one connector's specifics.
