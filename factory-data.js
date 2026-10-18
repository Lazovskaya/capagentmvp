window.FACTORY_DATA = {
 "phases": [
  "Discover",
  "Prepare",
  "Explore",
  "Realize",
  "Deploy",
  "Run"
 ],
 "bands": [
  [
   "Shape",
   2
  ],
  [
   "Build",
   2
  ],
  [
   "Run",
   2
  ]
 ],
 "roles": {
  "functional": "Functional",
  "developer": "Developer",
  "architect": "Architect",
  "delivery": "Delivery Manager",
  "basis": "Basis",
  "data": "Data Lead",
  "test": "Tester",
  "solution-architect": "Solution Architect"
 },
 "roleOrder": [
  "functional",
  "developer",
  "architect",
  "solution-architect",
  "delivery",
  "basis",
  "data",
  "test"
 ],
 "engagements": {
  "greenfield": "Greenfield",
  "brownfield": "Brownfield",
  "bluefield": "Bluefield",
  "ams": "AMS",
  "product-development": "Product development",
  "discovery": "Discovery",
  "consulting": "Consulting",
  "enterprise-architecture": "Enterprise architecture"
 },
 "statuses": {
  "notstarted": "Not started",
  "progress": "In progress",
  "in-test": "In test",
  "ready": "Ready"
 },
 "postures": {
  "own": "Own - we author it",
  "adopt": "Adopt - we pull it in"
 },
 "postureWhy": {
  "own": "Own, authored by us. Lives in the factory repo, versioned by us.",
  "adopt": "Adopt, pulled in, not authored. Vendored via npx skills add --copy, provenance in factory-lock.json."
 },
 "rows": [
  {
   "label": "Skills",
   "desc": "Workflow playbooks. Roughly one per activity, though some are shared across several.",
   "layout": "phase"
  },
  {
   "label": "Agents",
   "desc": "Bounded workers returning a typed, auditable verdict. Used only where the output is a decision rather than a document.",
   "layout": "phase"
  },
  {
   "label": "Tools",
   "desc": "Callable operations a Skill or Agent invokes to act on a system or retrieve data. Each is a tool.md contract plus a script; it reaches an external system only through a Connector.",
   "layout": "phase"
  },
  {
   "label": "Assistants",
   "desc": "Role-scoped entry points that route requests to the appropriate agent or skill.",
   "layout": "band"
  },
  {
   "label": "Connectors",
   "desc": "MCP and CLI. In the repo each is one connectors/*.md plus an .mcp.json block, not code.",
   "layout": "band"
  },
  {
   "label": "Artifacts",
   "desc": "Durable handoffs, and the links in the traceability chain that makes non-technical work verifiable: requirement, decision, object, sign-off. A client acceptance record is contractual, not a product feature.",
   "layout": "band"
  },
  {
   "label": "Q-gates",
   "desc": "Phase exits. We do not invent a gate vocabulary, Activate already defines these. We instrument them and supply the evidence.",
   "layout": "band"
  },
  {
   "label": "Knowledge",
   "desc": "Every bucket ships a central default. A project takes it as-is or overrides any file by name, the same convention skills use. Buckets are added when an activity needs one.",
   "layout": "band"
  }
 ],
 "components": [
  {
   "kind": "Agent",
   "name": "brownfield-sad-authoring-agent",
   "posture": "own",
   "status": "progress",
   "phase": "Discover",
   "phases": [
    "Discover",
    "Explore"
   ],
   "desc": "Determines SAD readiness, gathers prerequisite evidence, orchestrates the Brownfield SAD authoring flow (readiness -> sizing -> conversion scoping -> workshop scheduling -> state reconciliation -> ADR log -> SAD drafting -> Confluence publication), and returns SAD review status. Invoked by the `solution-architect` Assistant for the `brownfield-sad-authoring` use case; never invoked directly."
  },
  {
   "kind": "Agent",
   "name": "cap-pattern-advisor",
   "posture": "own",
   "status": "progress",
   "phase": "Realize",
   "phases": [
    "Realize"
   ],
   "desc": "Reviews recurring CAP Node.js boilerplate for CAP-AI-11 through the cap-suggest-patterns skill, returning evidence-backed native CAP proposals (an experimental npm helper only as a review-gated alternative) for developer review rather than applying changes automatically."
  },
  {
   "kind": "Artifact",
   "name": "brownfield-sad-authoring-state",
   "posture": "own",
   "status": "progress",
   "phase": "Discover",
   "phases": [
    "Discover",
    "Explore"
   ],
   "desc": "Engagement state.json for the Brownfield SAD Authoring Agent (workspace/<engagement_id>/brownfield-sad/state.json)."
  },
  {
   "kind": "Artifact",
   "name": "business-process-impact-list",
   "posture": "own",
   "status": "progress",
   "phase": "Discover",
   "phases": [
    "Discover"
   ],
   "desc": "Simplification Item to candidate-process mapping, authored by readiness-analysis directly from its findings (no dedicated Tool) as conversion-scoping's primary input."
  },
  {
   "kind": "Artifact",
   "name": "business-process-scope",
   "posture": "own",
   "status": "progress",
   "phase": "Discover",
   "phases": [
    "Discover"
   ],
   "desc": null
  },
  {
   "kind": "Artifact",
   "name": "simplification-impact-report",
   "posture": "own",
   "status": "progress",
   "phase": "Discover",
   "phases": [
    "Discover"
   ],
   "desc": "Readiness Check findings brief produced by the readiness-analysis Skill (EPMCSAPAI-324), from a report parsed by tools/parse-readiness-check-export."
  },
  {
   "kind": "Artifact",
   "name": "sizing-recommendation",
   "posture": "own",
   "status": "progress",
   "phase": "Discover",
   "phases": [
    "Discover"
   ],
   "desc": "Sizing recommendation produced by the sizing-analysis Skill from tools/calculate-s4hana-sizing's arithmetic."
  },
  {
   "kind": "Assistant",
   "name": "solution-architect",
   "posture": "own",
   "status": "progress",
   "phase": "Discover",
   "phases": [
    "Discover",
    "Explore"
   ],
   "desc": "Role-scoped entry point for the **Solution Architect**: architecture-side delivery work across Discover, Prepare and Explore, plus cross-phase architecture governance in Run. It holds the role boundary, offers the architect's use cases, and routes each request to an eligible agent (or, where no agent exists yet, directly to the owning skill). It never calls tools or connectors itself — the routed agent or skill does."
  },
  {
   "kind": "Connector",
   "name": "abap-mcp",
   "posture": "adopt",
   "status": "progress",
   "phase": "Explore",
   "phases": [
    "Explore",
    "Realize",
    "Deploy",
    "Run"
   ],
   "desc": "Full ABAP repository read/write (classic ABAP, RAP, CDS/views, transports) via `mcp-abap-adt` (`@mcp-abap-adt/core` on npm, repo `fr0ster/mcp-abap-adt`), run per-developer via `npx`. Chosen as this factory's default ABAP connector: broadest scope (classic on-prem + BTP ABAP Cloud + legacy) and least setup friction for a single consultant working in Claude Code, Cursor, or Copilot — no extra IDE or infrastructure required. See \"Alternatives\" below for when a different connector fits better.",
   "pattern": "mcp"
  },
  {
   "kind": "Connector",
   "name": "ai-agent-hub",
   "posture": "adopt",
   "status": "progress",
   "phase": "Discover",
   "phases": [
    "Discover"
   ],
   "desc": "Where client-facing agents are governed. Proposed to Retired lifecycle.",
   "pattern": "api"
  },
  {
   "kind": "Connector",
   "name": "calendar",
   "posture": "adopt",
   "status": "progress",
   "phase": "Prepare",
   "phases": [
    "Prepare",
    "Explore"
   ],
   "desc": "Finds real attendee availability and drafts (never sends) meeting invites. Microsoft 365 in the ported version — this connector was missing from the data model even though `skills/fit-to-standard` (the one component ported as \"proven to work end to end\") actually depends on it for its scheduling step; this entry closes that gap.",
   "pattern": "api"
  },
  {
   "kind": "Connector",
   "name": "cloud-alm",
   "posture": "adopt",
   "status": "progress",
   "phase": "Prepare",
   "phases": [
    "Prepare",
    "Explore",
    "Realize",
    "Deploy",
    "Run"
   ],
   "desc": "**Pattern:** `mcp` + `script` — two integration modes for the same service.",
   "pattern": "mcp"
  },
  {
   "kind": "Connector",
   "name": "confluence",
   "posture": "adopt",
   "status": "progress",
   "phase": "Discover",
   "phases": [
    "Discover",
    "Prepare",
    "Explore",
    "Realize",
    "Deploy",
    "Run"
   ],
   "desc": "Canonical document store for Brownfield SAD engagement outputs. Publishes approved readiness, sizing, scoping, and SAD documents as Confluence pages; also read-checks linked pages during state reconciliation.",
   "pattern": "script"
  },
  {
   "kind": "Connector",
   "name": "gcts-abapgit",
   "posture": "adopt",
   "status": "progress",
   "phase": "Discover",
   "phases": [
    "Discover"
   ],
   "desc": "Source control for ABAP Cloud, CAP and UI5.",
   "pattern": "api"
  },
  {
   "kind": "Connector",
   "name": "jira",
   "posture": "adopt",
   "status": "progress",
   "phase": "Prepare",
   "phases": [
    "Prepare",
    "Explore",
    "Realize",
    "Deploy",
    "Run"
   ],
   "desc": "Work items and the defect queue. The work-intent surface of record for now.",
   "pattern": "mcp"
  },
  {
   "kind": "Connector",
   "name": "joule-studio",
   "posture": "adopt",
   "status": "progress",
   "phase": "Discover",
   "phases": [
    "Discover"
   ],
   "desc": "Where client-facing agents are built.",
   "pattern": "cli"
  },
  {
   "kind": "Connector",
   "name": "knowledge-graph",
   "posture": "adopt",
   "status": "progress",
   "phase": "Discover",
   "phases": [
    "Discover",
    "Prepare"
   ],
   "desc": "Structured map of business entities and relationships. Grounds discovery and agent-readiness.",
   "pattern": "api"
  },
  {
   "kind": "Connector",
   "name": "leanix",
   "posture": "adopt",
   "status": "progress",
   "phase": "Discover",
   "phases": [
    "Discover",
    "Prepare",
    "Explore"
   ],
   "desc": "SAP LeanIX MCP provides workspace-scoped access to enterprise architecture facts, technology stacks, application components, transformations, surveys and architecture decisions.",
   "pattern": "mcp"
  },
  {
   "kind": "Connector",
   "name": "readiness-check",
   "posture": "adopt",
   "status": "progress",
   "phase": "Discover",
   "phases": [
    "Discover"
   ],
   "desc": "Simplification items and readiness findings.",
   "pattern": "script"
  },
  {
   "kind": "Connector",
   "name": "signavio",
   "posture": "adopt",
   "status": "progress",
   "phase": "Discover",
   "phases": [
    "Discover",
    "Prepare",
    "Explore"
   ],
   "desc": "**Pattern:** `script` — direct HTTP, called by Python tools. No public MCP server exists for Signavio's basic-auth API; runtime access from a skill uses the repository's API scripts.",
   "pattern": "script"
  },
  {
   "kind": "Knowledge",
   "name": "activate-roadmaps",
   "posture": "adopt",
   "status": "progress",
   "phase": "Discover",
   "phases": [
    "Discover",
    "Prepare",
    "Explore",
    "Realize",
    "Deploy",
    "Run"
   ],
   "desc": "SAP Activate roadmap task lists per product/scenario, generated from SAP Roadmap Viewer XML exports (source XMLs gitignored under `workspace/roadmaps/`)."
  },
  {
   "kind": "Knowledge",
   "name": "clean-core",
   "posture": "adopt",
   "status": "progress",
   "phase": "Explore",
   "phases": [
    "Explore",
    "Realize",
    "Run"
   ],
   "desc": "SAP's clean-core rules applied as an always-on guardrail across extensibility decisions, custom-code remediation, and solution design."
  },
  {
   "kind": "Knowledge",
   "name": "cutover-methodology",
   "posture": "own",
   "status": "progress",
   "phase": "Realize",
   "phases": [
    "Realize",
    "Deploy"
   ],
   "desc": "Curated cutover strategy decision framework, remote-cutover playbook, and checklist task shape."
  },
  {
   "kind": "Knowledge",
   "name": "north-star-methodology",
   "posture": "own",
   "status": "progress",
   "phase": "Discover",
   "phases": [
    "Discover",
    "Prepare",
    "Explore"
   ],
   "desc": "EPAM's SAP North Star delivery methodology: architecture-vision, strategy, business-architecture, and application/data-architecture modules (one-pagers, positioning/scoping guides, delivery guides, report templates), organized by ADM-like phase under `03-delivery-of-service-modules/`."
  },
  {
   "kind": "Knowledge",
   "name": "operations",
   "posture": "own",
   "status": "notstarted",
   "phase": "Deploy",
   "phases": [
    "Deploy",
    "Run"
   ],
   "desc": "Run-loop contract plus reusable templates for cutover, hypercare, rollback/escalation, SLO baselining, known issues, and production conversion."
  },
  {
   "kind": "Knowledge",
   "name": "order-to-cash-domain-pack",
   "posture": "own",
   "status": "progress",
   "phase": "Explore",
   "phases": [
    "Explore",
    "Realize",
    "Run"
   ],
   "desc": "Swappable Order-to-Cash domain expertise: taxonomy, signal catalog, and 10 troubleshooting decision trees."
  },
  {
   "kind": "Knowledge",
   "name": "readiness-check-interpretation",
   "posture": "own",
   "status": "notstarted",
   "phase": "Discover",
   "phases": [
    "Discover",
    "Explore"
   ],
   "desc": "Chapter-by-chapter interpretation guidance for a SAP Readiness Check for SAP S/4HANA report, calibrated against real client exports, plus the SAD section-routing table."
  },
  {
   "kind": "Knowledge",
   "name": "sap-best-practices-taxonomy",
   "posture": "adopt",
   "status": "progress",
   "phase": "Discover",
   "phases": [
    "Discover",
    "Prepare",
    "Explore"
   ],
   "desc": "Generated taxonomy and BPMN-derived cache of 732 SAP Best Practices scope items, plus 13 value-stream index files."
  },
  {
   "kind": "Knowledge",
   "name": "standards",
   "posture": "own",
   "status": "notstarted",
   "phase": "Discover",
   "phases": [
    "Discover",
    "Prepare",
    "Explore",
    "Realize",
    "Deploy",
    "Run"
   ],
   "desc": "Method-agnostic delivery standards: how to build and keep current a structured, source-traced document from scattered, heterogeneous inputs (`source-synthesis.md`, ported from a `business-blueprint` skill, with two worked examples in `skills/solution-design/references/`); a shared gap-disposition taxonomy (`gap-disposition-taxonomy.md`); and a curated SAP GitHub/documentation reference index (`sap-architecture-references.md`)."
  },
  {
   "kind": "Knowledge",
   "name": "testing",
   "posture": "own",
   "status": "progress",
   "phase": "Realize",
   "phases": [
    "Realize",
    "Deploy",
    "Run"
   ],
   "desc": "Defect-history register template and test-script template."
  },
  {
   "kind": "Q-gate",
   "name": "discover-prepare",
   "posture": "adopt",
   "status": "progress",
   "phase": "Discover",
   "phases": [
    "Discover",
    "Prepare"
   ],
   "desc": "Exit criteria: scope and readiness accepted."
  },
  {
   "kind": "Q-gate",
   "name": "explore-realize",
   "posture": "adopt",
   "status": "progress",
   "phase": "Explore",
   "phases": [
    "Explore",
    "Realize"
   ],
   "desc": "Exit criteria: fit-to-standard signed, design approved, extensibility tier recorded, backlog baselined."
  },
  {
   "kind": "Q-gate",
   "name": "prepare-explore",
   "posture": "adopt",
   "status": "progress",
   "phase": "Prepare",
   "phases": [
    "Prepare",
    "Explore"
   ],
   "desc": "Exit criteria: knowledge built and validated, custom-code baseline taken, team onboarded."
  },
  {
   "kind": "Skill",
   "name": "adr-log",
   "posture": "own",
   "status": "progress",
   "phase": "Discover",
   "phases": [
    "Discover",
    "Explore"
   ],
   "desc": "Append a new architectural decision record (or split an existing bundled one) to the engagement's ADR log and, when connected, publish it to Confluence as one child page per entry under the engagement's Architecture Decision Log index. Invoked cross-cutting by the Brownfield SAD Authoring Agent for every material manual or detected change -- not called directly by the user."
  },
  {
   "kind": "Skill",
   "name": "brownfield-sad-state-reconciliation",
   "posture": "own",
   "status": "progress",
   "phase": "Discover",
   "phases": [
    "Discover",
    "Explore"
   ],
   "desc": "Reconstruct a Brownfield SAD authoring engagement's state from workspace artifacts and, once linked, live Confluence pages -- never from conversation history. Detects local and imported manual changes since the last checkpoint, classifies them, and either resumes cleanly or surfaces a conflict for the Agent to resolve. Use before selecting or resuming any Brownfield SAD authoring stage."
  },
  {
   "kind": "Skill",
   "name": "cap-suggest-patterns",
   "posture": "own",
   "status": "progress",
   "phase": "Realize",
   "phases": [
    "Realize"
   ],
   "desc": "Suggest CAP-native patterns from evidence in an existing CAP Node.js project, with an experimental internal npm helper only as a review-gated alternative. Use for CAP-AI-11 during Realize when reviewing remote services, validation, errors, CDS modeling, query safety, transactions, pagination, drafts, or i18n lookup. Produces reviewable examples, not automatic rewrites."
  },
  {
   "kind": "Skill",
   "name": "confluence-document-publishing",
   "posture": "own",
   "status": "progress",
   "phase": "Explore",
   "phases": [
    "Explore"
   ],
   "desc": "Publish an approved Brownfield SAD engagement document to Confluence with a mandatory preview-and-approval gate, then re-read the page to confirm publication."
  },
  {
   "kind": "Skill",
   "name": "conversion-scoping",
   "posture": "own",
   "status": "progress",
   "phase": "Discover",
   "phases": [
    "Discover"
   ],
   "desc": "Turns SAP Readiness Check Simplification Item findings into a scoped business-process list marked Changed/Unchanged/Out of scope, using SAP's official Reference Business Architecture (RBA/RSA) catalog as the process taxonomy. Use whenever the user wants to scope business processes for an SAP conversion project, asks which processes will change vs. stay the same, or provides both a Readiness Check analysis and an RBA/RSA catalog file."
  },
  {
   "kind": "Skill",
   "name": "readiness-analysis",
   "posture": "own",
   "status": "progress",
   "phase": "Discover",
   "phases": [
    "Discover"
   ],
   "desc": "Intake and orchestrate a SAP Readiness Check for SAP S/4HANA export -- run the mechanical extraction once, cache it at a stable engagement path, print a chapter/gap summary, and route the user to the relevant topic-scoped skill(s) (readiness-business-architecture, readiness-technical-architecture, readiness-extensibility, readiness-integration, readiness-security, readiness-data-master-data). Use in Discover as soon as Readiness Check output exists, before committing to a conversion date, when you want a first full pass across every topic or aren't yet sure which topic to update."
  },
  {
   "kind": "Skill",
   "name": "readiness-business-architecture",
   "posture": "adopt",
   "status": "progress",
   "phase": "Discover",
   "phases": [
    "Discover"
   ],
   "desc": "Analyze the Business Architecture topic of a SAP Readiness Check for SAP S/4HANA report -- Simplification Items (Chapter 3) and Compatibility Scope Analysis (Chapter 4) -- into a scoped findings brief and the Simplification-Item-to-business-process mapping, without loading the rest of the report's chapters. Use in Discover as soon as Readiness Check output exists, or standalone to re-check just this topic after new client input arrives."
  },
  {
   "kind": "Skill",
   "name": "readiness-data-master-data",
   "posture": "adopt",
   "status": "progress",
   "phase": "Discover",
   "phases": [
    "Discover"
   ],
   "desc": "Analyze the Data & Master Data Management topic of a SAP Readiness Check for SAP S/4HANA report -- HANA Sizing/Data Volume Management (Chapter 6), Financial Data Quality (Chapter 8), and Customer Vendor Integration (Chapter 9.6) -- into a scoped findings brief, without loading the rest of the report's chapters. CVI is very often the single highest-severity finding in the whole report (a hard SAP prerequisite gate); this skill is what surfaces it. Use in Discover as soon as Readiness Check output exists, or standalone to re-check just this topic."
  },
  {
   "kind": "Skill",
   "name": "readiness-extensibility",
   "posture": "adopt",
   "status": "progress",
   "phase": "Discover",
   "phases": [
    "Discover"
   ],
   "desc": "Analyze the Extensibility topic of a SAP Readiness Check for SAP S/4HANA report -- Required Custom Code Adjustments (Chapter 5) -- into a scoped findings brief, plus forward-looking Clean-Core and Extensibility framework content the report itself doesn't cover. Use in Discover as soon as Readiness Check output exists, or standalone to re-check custom code readiness after ATC results land."
  },
  {
   "kind": "Skill",
   "name": "readiness-integration",
   "posture": "adopt",
   "status": "progress",
   "phase": "Discover",
   "phases": [
    "Discover"
   ],
   "desc": "Analyze the Integration topic of a SAP Readiness Check for SAP S/4HANA report -- Required Adjustments for Integration (Chapter 7: IDoc, Web Service, RFC/BAPI, BW Extractors, OData, SLT, Flat File) -- into a scoped findings brief, without loading the rest of the report's chapters. Use in Discover as soon as Readiness Check output exists, or standalone to re-check just this topic."
  },
  {
   "kind": "Skill",
   "name": "readiness-security",
   "posture": "adopt",
   "status": "progress",
   "phase": "Discover",
   "phases": [
    "Discover"
   ],
   "desc": "Assess the Security topic for a Brownfield S/4HANA conversion from whatever auth-adjacent Simplification Items scatter across a SAP Readiness Check report -- the report has no dedicated security chapter, so this skill's main job is stating that gap explicitly and scoping a real security assessment, not fabricating coverage that doesn't exist. Use in Discover alongside the other readiness topics, or standalone once a security/authorization assessment approach is agreed with the client."
  },
  {
   "kind": "Skill",
   "name": "readiness-technical-architecture",
   "posture": "adopt",
   "status": "progress",
   "phase": "Discover",
   "phases": [
    "Discover"
   ],
   "desc": "Analyze the Technical Architecture topic of a SAP Readiness Check for SAP S/4HANA report -- Add-On/Business Function compatibility (Chapter 2) and the Planned Downtime Calculator (Chapter 9.5) -- into a scoped conversion-strategy findings brief, without loading the rest of the report's chapters. Use in Discover as soon as Readiness Check output exists, or standalone to re-check just this topic (e.g. when a downtime-tolerance conversation with the business needs revisiting)."
  },
  {
   "kind": "Skill",
   "name": "sad-drafting",
   "posture": "own",
   "status": "progress",
   "phase": "Explore",
   "phases": [
    "Explore"
   ],
   "desc": "Draft the Brownfield SAD document from prior-stage evidence and consultant-confirmed decision matrices (instance strategy, RICEFW, sizing strategy, data migration architecture, dual maintenance / retrofit). Invoked by the Brownfield SAD Authoring Agent after readiness, sizing, and scoping stages are complete."
  },
  {
   "kind": "Skill",
   "name": "sizing-analysis",
   "posture": "own",
   "status": "progress",
   "phase": "Discover",
   "phases": [
    "Discover"
   ],
   "desc": "Turns SAP sizing inputs -- a Readiness Check's sizing chapter, a HANA Sizing Report, a Quick Sizer export, or a RISE FUE/user count -- into an actual sizing recommendation with a growth buffer, archiving offset, and per-instance breakdown, instead of just restating a raw baseline number. Use whenever the user asks about SAP system sizing, HANA memory/CPU/disk sizing, RISE T-shirt sizing, Full User Equivalents, or needs sizing figures for a Solution Architecture Document."
  },
  {
   "kind": "Skill",
   "name": "sme-sync-back",
   "posture": "own",
   "status": "progress",
   "phase": "Discover",
   "phases": [
    "Discover",
    "Prepare",
    "Explore",
    "Realize",
    "Deploy",
    "Run"
   ],
   "desc": "Walk an SME through contributing changes made in a generated install (e.g. sap-ai-factory-test) back into the sap-ai-factory factory repo as a normal merge request. Invoked when the user says something like \"contribute my changes back\", \"sync my edits to the factory\", or \"what did I change that's worth keeping\" while working inside an installed project. Not useful outside a generated install -- it has nothing to sync back from a fresh clone of sap-ai-factory itself."
  },
  {
   "kind": "Skill",
   "name": "workshop-scheduling",
   "posture": "own",
   "status": "progress",
   "phase": "Explore",
   "phases": [
    "Explore"
   ],
   "desc": null
  },
  {
   "kind": "Tool",
   "name": "calculate-s4hana-sizing",
   "posture": "own",
   "status": "progress",
   "phase": "Discover",
   "phases": [
    "Discover"
   ],
   "desc": "Mechanical sizing calculator: turns a raw sizing baseline into a padded target recommendation by applying a growth buffer, subtracting an archiving offset, and adding new-functionality headroom, split across one or more target instances. Does not decide methodology or interpret findings -- that's `sizing-analysis`'s job.",
   "operation": "calculate-s4hana-sizing",
   "permission_scope": "read-only"
  },
  {
   "kind": "Tool",
   "name": "cap-pattern-scanner",
   "posture": "own",
   "status": "in-test",
   "phase": "Realize",
   "phases": [
    "Realize"
   ],
   "desc": "Inspects explicitly scoped local CAP Node.js CDS and handler sources for catalog signals, returning deterministic candidate evidence and coverage without executing project code or calling external services. Scanning and review never change the scanned project; a separate apply step changes it only after developer approval and confirmation.",
   "operation": "scan-cap-patterns",
   "permission_scope": "read-write"
  },
  {
   "kind": "Tool",
   "name": "fill-brownfield-sad-template",
   "posture": "own",
   "status": "progress",
   "phase": "Explore",
   "phases": [
    "Explore"
   ],
   "desc": "Fills the Brownfield SAD template (`artifacts/brownfield-sad/template.md`) from confirmed evidence artifacts and decision matrix outputs. Produces a structured markdown SAD document with inline source citations and an Open Topics section for every unresolved gap.",
   "operation": "fill-brownfield-sad-template",
   "permission_scope": "read-write"
  },
  {
   "kind": "Tool",
   "name": "generate-business-process-scope",
   "posture": "own",
   "status": "progress",
   "phase": "Discover",
   "phases": [
    "Discover"
   ],
   "desc": "Three mechanical scripts behind `conversion-scoping`'s output: de-duplicating SAP's denormalized RBA/RSA catalog, extracting a client's Application Map generically, and rendering the final scope decision as a real `.xlsx` workbook. None of the three decide Changed/Unchanged/complexity or matching -- that's `conversion-scoping`'s job.",
   "operation": "generate-business-process-scope",
   "permission_scope": "read-write"
  },
  {
   "kind": "Tool",
   "name": "parse-readiness-check-export",
   "posture": "own",
   "status": "progress",
   "phase": "Discover",
   "phases": [
    "Discover"
   ],
   "desc": "Mechanical extractor for SAP Readiness Check for SAP S/4HANA exports. Walks the `.docx`'s fixed, numbered chapter structure and captures paragraph text and tables as structured data; when pointed at a folder, also ingests every supporting `.xlsx` export. Does not interpret anything -- severity/blocker judgment is the `readiness-analysis` Skill's job, guided by its `references/`.",
   "operation": "parse-readiness-check-export",
   "permission_scope": "read-only"
  },
  {
   "kind": "Tool",
   "name": "read-confluence-page",
   "posture": "own",
   "status": "progress",
   "phase": "Discover",
   "phases": [
    "Discover",
    "Explore"
   ],
   "desc": "Reads a Confluence page's metadata and content hash for the state-reconciliation use case. Returns the page's current version number, last-modified timestamp, and a SHA-256 hash of its storage-format body -- the three values `brownfield-sad-state-reconciliation` needs to decide whether the live page has drifted from the local checkpoint.",
   "operation": "read-confluence-page",
   "permission_scope": "read-only"
  },
  {
   "kind": "Tool",
   "name": "reconcile-brownfield-sad-state",
   "posture": "own",
   "status": "progress",
   "phase": "Discover",
   "phases": [
    "Discover",
    "Explore"
   ],
   "desc": "Deterministic, local-only checkpoint comparison for the Brownfield SAD Authoring Agent's resume/reconciliation flow. Detects manual changes against the engagement's last checkpoint (`diff`) and persists a new checkpoint once the Agent has classified those changes and resolved any conflicts (`commit`). Never touches Confluence -- the `brownfield-sad-state-reconciliation` Skill calls `read-confluence-page` directly for any linked Confluence page, per the plan's Resume And Manual Change Reconciliation section.",
   "operation": "reconcile-brownfield-sad-state",
   "permission_scope": "read-write"
  },
  {
   "kind": "Tool",
   "name": "search-confluence-pages",
   "posture": "own",
   "status": "progress",
   "phase": "Explore",
   "phases": [
    "Explore"
   ],
   "desc": "Searches for Confluence pages by exact title within a space using CQL. Returns a list of matching pages (id, title, space key, version, url) so the caller can decide whether to create a new page or update an existing one.",
   "operation": "search-confluence-pages",
   "permission_scope": "read-only"
  },
  {
   "kind": "Tool",
   "name": "upload-confluence-attachment",
   "posture": "own",
   "status": "progress",
   "phase": "Explore",
   "phases": [
    "Explore"
   ],
   "desc": "Uploads a file as an attachment to a Confluence page. Dry-run by default — prints the upload plan without writing. Pass `--apply` to perform the actual upload. Re-reads the page's attachment list after uploading to verify the file is present.",
   "operation": "upload-confluence-attachment",
   "permission_scope": "read-write"
  },
  {
   "kind": "Tool",
   "name": "upsert-confluence-page",
   "posture": "own",
   "status": "progress",
   "phase": "Explore",
   "phases": [
    "Explore"
   ],
   "desc": "Creates or updates a single Confluence page via the REST API. Dry-run by default — prints the full payload without writing. Pass `--apply` to perform the actual write. Re-reads the page after writing to verify title, version, and content length.",
   "operation": "upsert-confluence-page",
   "permission_scope": "read-write"
  }
 ],
 "assistants": [
  {
   "phase": "Discover",
   "phases": [
    "Discover",
    "Explore"
   ],
   "owner": "solution-architect",
   "engagement": [
    "brownfield"
   ],
   "status": "progress",
   "file": "assistants/solution-architect/assistant.md",
   "title": "brownfield-sad-authoring",
   "desc": "Role-scoped entry point for the **Solution Architect**: architecture-side delivery work across Discover, Prepare and Explore, plus cross-phase architecture governance in Run. It holds the role boundary, offers the architect's use cases, and routes each request to an eligible agent (or, where no agent exists yet, directly to the owning skill). It never calls tools or connectors itself — the routed agent or skill does.",
   "uses": [
    [
     "agent",
     [
      "brownfield-sad-authoring-agent"
     ]
    ]
   ]
  }
 ],
 "coverage": {
  "tools": [
   "Claude Code",
   "Cursor",
   "Copilot",
   "Joule Work"
  ],
  "toolNotes": {
   "Cursor": "Cursor conventions inferred, verify against current docs",
   "Copilot": "Copilot agent and hook conventions inferred, verify against current docs",
   "Joule Work": "Business-user surface in SAP's framing; may never host our primitives"
  },
  "levels": {
   "nat": "native, the tool reads our file as-is; the adapter only places it",
   "adp": "adapted, content must be rewritten into the tool's format",
   "no": "absent, no mechanism; handled elsewhere",
   "q": "unassessed"
  },
  "rows": [
   {
    "row": "Skills",
    "needs": "a discovery mechanism",
    "cells": [
     [
      "nat",
      ".claude/skills/"
     ],
     [
      "nat",
      ".cursor/skills/<n>/"
     ],
     [
      "nat",
      ".agents/skills/ + setting"
     ],
     [
      "q",
      "?"
     ]
    ]
   },
   {
    "row": "Agents",
    "needs": "isolated context",
    "cells": [
     [
      "nat",
      ".claude/agents/"
     ],
     [
      "nat",
      ".cursor/agents/<n>.md"
     ],
     [
      "nat",
      ".github/agents/<n>.md"
     ],
     [
      "q",
      "?"
     ]
    ]
   },
   {
    "row": "Q-gates",
    "needs": "lifecycle hooks",
    "cells": [
     [
      "nat",
      "settings.json"
     ],
     [
      "no",
      "CI instead"
     ],
     [
      "adp",
      "CLI / workflows"
     ],
     [
      "q",
      "?"
     ]
    ]
   },
   {
    "row": "Connectors",
    "needs": "MCP",
    "cells": [
     [
      "nat",
      "native"
     ],
     [
      "nat",
      "native"
     ],
     [
      "nat",
      "native"
     ],
     [
      "q",
      "?"
     ]
    ]
   },
   {
    "row": "Activities",
    "needs": "an entry file",
    "cells": [
     [
      "nat",
      "CLAUDE.md"
     ],
     [
      "nat",
      ".cursor/rules/"
     ],
     [
      "nat",
      "instructions.md"
     ],
     [
      "q",
      "?"
     ]
    ]
   },
   {
    "row": "Artifacts",
    "needs": "durable files",
    "cells": [
     [
      "nat",
      "as-is"
     ],
     [
      "nat",
      "as-is"
     ],
     [
      "nat",
      "as-is"
     ],
     [
      "q",
      "?"
     ]
    ]
   },
   {
    "row": "Knowledge",
    "needs": "markdown, read via instructions",
    "cells": [
     [
      "nat",
      "as-is"
     ],
     [
      "nat",
      "as-is"
     ],
     [
      "nat",
      "as-is"
     ],
     [
      "q",
      "?"
     ]
    ]
   }
  ]
 },
 "tools": {
  "claude-code": {
   "label": "Claude Code",
   "entry": "CLAUDE.md",
   "skills": ".claude/skills/<n>/",
   "agents": ".claude/agents/<n>.md",
   "gates": ".claude/settings.json",
   "mcp": ".mcp.json",
   "gaps": []
  },
  "cursor": {
   "label": "Cursor",
   "entry": ".cursor/rules/factory.mdc",
   "skills": ".cursor/skills/<n>/",
   "agents": ".cursor/agents/<n>.md",
   "gates": null,
   "mcp": ".cursor/mcp.json",
   "gaps": [
    "gates, no lifecycle hooks; run in CI instead"
   ]
  },
  "copilot": {
   "label": "Copilot",
   "entry": ".github/copilot-instructions.md",
   "skills": ".agents/skills/<n>/",
   "agents": ".github/agents/<n>.md",
   "gates": null,
   "mcp": ".vscode/mcp.json",
   "gaps": [
    "gates, via CLI hooks or GitHub workflows, not in-editor"
   ]
  },
  "joule-work": {
   "label": "Joule Work",
   "disabled": true
  }
 },
 "scaffold": {
  "factory": [
   [
    "factory.json",
    "version, contract, tool targets"
   ],
   [
    "tools/claude-code/adapter",
    "emits entry file + mcp config"
   ],
   [
    "tools/cursor/adapter",
    null
   ],
   [
    "tools/github-copilot/adapter",
    null
   ],
   [
    "validators/",
    "CI: references, orphans, drift"
   ],
   [
    "docs/",
    "design rationale"
   ],
   [
    "platform/",
    "Platform MVP track: delivery RACI — see platform/delivery-process/"
   ]
  ],
  "project": [
   [
    ".factory/",
    "@@FAC@@the whole Factory panel, installed at a pinned version"
   ],
   [
    "factory-lock.json",
    "factory version + skill provenance"
   ],
   [
    ".env.example",
    null
   ],
   [
    "CLAUDE.md",
    "generated"
   ],
   [
    ".cursor/rules/",
    "generated"
   ],
   [
    ".github/copilot-instructions.md",
    "generated"
   ],
   [
    "runs/",
    "run ledgers"
   ]
  ]
 },
 "groups": [
  [
   "Yours",
   "edit these, knowledge/ is the job",
   "^(knowledge/|workspace/|runs/)"
  ],
  [
   "Generated",
   "never hand-edit; regenerate instead",
   "^(\\.env\\.example|CLAUDE\\.md|\\.cursor/rules/|\\.github/copilot-instructions\\.md)"
  ],
  [
   "Installed",
   "the factory, pinned",
   "^(\\.factory/|factory-lock\\.json)"
  ]
 ]
};
