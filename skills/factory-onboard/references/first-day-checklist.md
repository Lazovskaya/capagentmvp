# First-day checklist — SAP AI Factory (project user)

Use with `factory-onboard`. For consultants **using** the factory on an engagement — not for
people maintaining the factory repo itself. Tick what's done; skip what doesn't apply.

## Access

- [ ] Can open / clone the factory (or receive an installed skills copy in your project tool)
- [ ] IDE ready (Claude Code, Cursor, or GitHub Copilot)
- [ ] Skills visible in your tool (e.g. `.claude/skills/` after `npx skills add …` — see root `README.md`)

## Read once (user path)

- [ ] `README.md` — install into your tool; what `skills/`, `knowledge/`, `workspace/` mean for you
- [ ] Open the component map (`index.html` or Confluence) — note `ready` vs `progress` vs `notstarted`
- [ ] Skim which skills match your **role** and current **Activate phase**

Skip unless you author factory content: regenerating the map, `validators/`, design-convention authoring rules.

## Local runtime

- [ ] `workspace/` is local-only output — never commit client data or secrets
- [ ] If you need live Jira/ABAP: follow `connectors/jira/connector.md` and/or
      `connectors/abap-mcp/connector.md` (credentials stay outside the repo)
- [ ] Remember: connector **writes** are dry-run unless you pass `--apply`

## First working skill

After this checklist, in a **new message** (or by asking factory-onboard to continue), run the
delivery skill named in the handoff — read that skill's `SKILL.md` first.

## Guardrails (confirm verbally)

- [ ] No secrets or client data get committed
- [ ] Each skill's own human-confirmation points are read before running it
- [ ] Component status in the map beats outdated chat memory about what's built

## Buddy (if blocked)

- [ ] Repo / tool install — delivery lead or whoever rolled out the factory on the account
- [ ] Domain questions — whoever owns the relevant `knowledge/` bucket or domain pack
