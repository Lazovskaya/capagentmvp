# scaffold-test-scenario (tool config)

Script and behaviour notes for the `scaffold-test-scenario` tool; no lifecycle tags (local contributor tool).

## Notes

Deterministic scaffolder (`scaffold_scenario.py`): merge-copies
`test-scenario-template` into a target workspace, renames the placeholder scenario
folder to `TS-<id>`, and optionally copies the component under test into `bundle/`.
Reaches no external system, so no Connector dependency. Writes only inside the
target workspace.
