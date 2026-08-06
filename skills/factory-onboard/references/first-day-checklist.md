# First-day checklist — SAP AI Factory (internal)

Use with `factory-onboard`. Tick what's done; skip what doesn't apply to the role.

## Access

- [ ] Can open the repo (`git.epam.com/epmc-sap/sap-ai-competency/sap-ai-factory`)
- [ ] Clone it to a local work folder
- [ ] IDE ready (Claude Code, Cursor, or GitHub Copilot — this factory is tool-agnostic)

## Read once (in order)

- [ ] `README.md` — layout, single source of truth, how to regenerate the component map
- [ ] Open `index.html` in a browser — the interactive component map (phases × component kinds)
- [ ] `docs/skill-design-conventions.md` — conventions every skill here follows
- [ ] Skim `factory-data.json`'s `components` array for your role's phase — what's `ready` vs
      `progress` vs `notstarted`

## Local runtime

- [ ] Understand: `workspace/` (if present) is local-only output, never committed with client data
- [ ] Know which tool adapter you're using (`tools/<tool>/adapter/` — scaffold only, see its README)

## First working skill (separate — do not run inside factory-onboard)

After onboarding, in a **new message**, pick the skill matching your role from the table in
`factory-onboard/SKILL.md`'s "Role map" and read its `SKILL.md` before running it.

## Guardrails (confirm verbally)

- [ ] No secrets or client data get committed to this repo
- [ ] Every skill's own human-confirmation points are read before running it, not assumed
- [ ] `factory-data.json` beats outdated chat memory about what's built

## Buddy (if blocked)

- [ ] Repo access — delivery lead
- [ ] Domain questions for a specific bucket — whoever owns that `knowledge/<bucket>/`
