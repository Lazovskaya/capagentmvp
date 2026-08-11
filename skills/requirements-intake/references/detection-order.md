# Detection order — requirements-intake

Stop at the first match.

| Order | Signal | Funnel | Source field value |
|------:|--------|--------|--------------------|
| 1 | User says greenfield / new process / "idea for" with no ticket | greenfield | `greenfield` |
| 2 | Path to existing `workspace/**/requirements.md` or story draft | story-file | `story:<path>` |
| 3 | Looks like Jira/ALM key or URL (`PROJ-123`, `https://…/browse/…`) | ticket | `ticket:<id>` or `ticket-unresolved:<id>` |
| 4 | User provides multiple note/email/transcript files | notes-pack | `notes-pack:<n files>` |
| 5 | Everything else | free-form | `free-form` |

## Ticket funnel notes

- If `jira` / `cloud-alm` connector works: fetch summary, description, acceptance criteria, comments
  summary; set Source `ticket:<id>`.
- If not configured or fetch fails: do not abort the whole intake. Source =
  `ticket-unresolved:<id>`, Open questions include adapter/access, body uses whatever text the user
  pasted.

## Notes-pack funnel notes

List each source file under Context with a short label (`email-2026-08-01`, `workshop-notes`).
Do not silently drop a file. Conflicts between sources → Open questions, not a picked winner.
