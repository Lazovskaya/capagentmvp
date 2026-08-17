# First-day checklist — SAP AI Factory

Use with `factory-onboard` for consultants using the factory on an engagement.
This is a user day-0 checklist, not a platform authoring checklist.

## Access and tool path

- [ ] Can open or clone the factory, or received an installed skills copy
- [ ] IDE ready: Claude Code, GitHub Copilot or Cursor
- [ ] Selected tool is recorded
- [ ] Skills are visible where the selected tool loads them
- [ ] Installed skill location is recorded and readable

## Read once

- [ ] Read the user installation section of `README.md`
- [ ] Opened the component map and noted `ready`, `progress` and `notstarted`
- [ ] Identified skills matching the role and current Activate phase

Skip contributor topics such as regenerating the map, validators, CI and build
authoring unless the user is maintaining the platform.

## Local runtime and connectors

- [ ] `workspace/` is local engagement output; no client data or secrets are committed
- [ ] Required connectors for the first skill are listed explicitly
- [ ] Jira/ABAP connector contracts were read when those connectors are required
- [ ] Cloud ALM/LeanIX connector contracts were read when those connectors are required
- [ ] Each required connector is recorded as `configured`, `unavailable` or `not checked`
- [ ] A connector is not called ready merely because a config file exists
- [ ] Connector writes are dry-run/preview unless explicit `--apply` approval exists
- [ ] Credentials remain outside the repository

## First working skill

After this checklist, run the delivery skill named in the handoff. Read that
skill's `SKILL.md` first. The handoff must state:

- phase and engagement;
- goal and next skill;
- required inputs;
- connector gaps;
- write mode.

## Guardrails

- [ ] No secrets or client data are committed
- [ ] Human-confirmation points for the selected skill are understood
- [ ] Component status in the map beats outdated chat memory

## Buddy if blocked

- Repo or tool installation: delivery lead or rollout owner
- Domain questions: owner of the relevant knowledge bucket or domain pack