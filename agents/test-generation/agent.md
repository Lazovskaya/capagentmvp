# test-generation

Bounded Realize-phase agent for `EPMCSAPAI-259`. Orchestrates `test-case-design`
(`EPMCSAPAI-257`) and `e2e-test-scenario-generation` (`EPMCSAPAI-258`) to produce full test
coverage — functional test cases per decision-log row and E2E scenarios per process flow —
then reports coverage against whatever specs/tickets were supplied as scope. Test automation
(execution) stays out of scope, per the ticket's own note.

## Inputs

**Required:**
- Fit-to-standard decision log (full Row ID range) — passed through to `test-case-design`.
- `e2e-process-scope` artifact (`EPMCSAPAI-249`) — passed through to
  `e2e-test-scenario-generation`.

**Optional:**
- Specifications/tickets from a project tool (Jira, Solution Manager or Signavio — the ticket's
  own `## Notes` flags this as an open decision, still unresolved here) to report coverage
  against. Without this, coverage reporting is skipped and only stated explicitly as
  `NOT_PERFORMED` — never silently omitted.

## Procedure

1. **Invoke `test-case-design`** against the full decision-log Row ID range. Do not narrow to
   a Delta-only subset — that skill itself refuses a Delta-only ask, and this agent doesn't
   pre-filter around that refusal.
2. **Invoke `e2e-test-scenario-generation`** against every flow in the supplied
   `e2e-process-scope`.
3. **Report coverage against supplied specs/tickets**, if any were provided. For each
   spec/ticket, cite the `row_id`(s) or flow(s) that trace back to it; a spec/ticket with no
   traceable test coverage is listed as `UNCOVERED`, not omitted. If no specs/tickets were
   supplied, mark this step `NOT_PERFORMED` in the output rather than skipping the field
   entirely.
4. **Write `test-generation-report` artifact** referencing both `test-coverage-matrix`
   (from step 1) and `e2e-test-scenarios` (from step 2) by their own generated timestamps —
   never re-embed or duplicate their content.

## Returns

- `test-generation-report` artifact: pointers to the `test-coverage-matrix` and
  `e2e-test-scenarios` artifacts this run produced, plus the coverage-vs-input-specs report
  (or `NOT_PERFORMED`).

## Refuse conditions

- No decision log supplied: return `blocking missing input — no decision log for test-case-design`.
- No `e2e-process-scope` artifact supplied: return
  `blocking missing input — no E2E flow scope for e2e-test-scenario-generation`.

## Related

- `EPMCSAPAI-257` `test-case-design` — orchestrated sub-skill, already built and dry-run tested
  (this factory's most mature skill).
- `EPMCSAPAI-258` `e2e-test-scenario-generation` — orchestrated sub-skill, built alongside this
  agent, not yet dry-run tested.
- `EPMCSAPAI-249` `e2e-process-scope` — upstream dependency, itself not yet dry-run tested.

## Status

Progress. `agent.md` written; not yet dry-run tested end to end. The project-tool choice for
step 3 (Jira / Solution Manager / Signavio) is still an open decision per the ticket's own
`## Notes` — this agent works without an answer (marks the step `NOT_PERFORMED`) but the
coverage-reporting acceptance criterion stays unmet until it's resolved.
