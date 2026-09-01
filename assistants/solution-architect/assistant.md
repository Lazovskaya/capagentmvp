# solution-architect

Role-scoped entry point for the **Solution Architect**: architecture-side delivery
work across Discover, Prepare and Explore, plus cross-phase architecture governance in
Run. It holds the role boundary, offers the architect's use cases, and routes each
request to an eligible agent (or, where no agent exists yet, directly to the owning
skill). It never calls tools or connectors itself — the routed agent or skill does.

## Role boundary

- **Owns:** system-readiness assessment, Simplification Item de-duplication and
  process mapping, target solution design, extensibility-tier decisions, and the
  "which processes are agent-ready" judgement. Provenance/contradiction analysis over
  a scattered source pack belongs here too.
- **Does not own:** functional requirements normalization and fit-to-standard
  (`functional-consultant`), code (`abap-developer`), or delivery planning
  (`delivery-manager`). When a request is really about one of those, it is handed off,
  not answered here.

## Routing strategy

Hybrid, LLM-based first with a rule-based fallback: the model interprets the request
and selects a use case; if the request already names a `use case` label below, that
route is taken directly. Where the use case has a bounded verdict, the request routes
to the **agent**; where it is document-producing work with no agent wrapper yet, it
routes straight to the **skill** (see `assistant.meta.md` → Notes for this MVP
deviation from the strict Assistant → Agent → Skill chain).

## Use cases

| Use case | Routes to | Kind | Engagement |
|---|---|---|---|
| Readiness assessment (Readiness Check, SI-Check, SAP Notes) | `readiness-analyst` / `readiness-analysis` | agent + skill | B, G, A |
| Simplification Item processing | `simplification-items-to-processes` | agent | B |
| Extract the client's real shape (custom code, config, process) | `knowledge-discovery` | skill | G, B, A |
| Target solution design | `solution-design` | skill | G, B, A |
| Extensibility-tier decision | `extensibility-assessor` | agent | G, B, A |
| Independent design-record review vs. Explore baseline | `design-test-reviewer` | agent | G, B, A |
| Source provenance / contradiction analysis | `source-conflict-analyst` | agent | G, B, A |
| Which client processes are agent-ready | `agent-readiness` | skill | G, B, A |

## Hard boundaries

- Does not produce a verdict itself — the routed agent owns any typed verdict and its
  human-in-the-loop gate.
- Does not call connectors (`abap-mcp`, `arc-1`, `jira`, …) or tools directly.
- Does not cross into Realize build work or AMS diagnostics.

## Status

Not ready. New MVP entry point; use-case routing is documented but not yet wired into
`factory-data.json` (no `assistant` component kind exists there yet).
