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
  "test": "Tester"
 },
 "roleOrder": [
  "functional",
  "developer",
  "architect",
  "delivery",
  "basis",
  "data",
  "test"
 ],
 "engagements": {
  "G": "Greenfield",
  "B": "Brownfield conversion",
  "A": "Build and Extend",
  "R": "AMS & Run"
 },
 "statuses": {
  "notstarted": "Not started",
  "progress": "In progress",
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
   "kind": "Skill",
   "name": "readiness-analysis",
   "posture": "own",
   "status": "progress",
   "phase": "Discover",
   "desc": "Readiness Check, SI-Check and SAP Notes turned into a scoped, per-module impact view."
  },
  {
   "kind": "Skill",
   "name": "factory-onboard",
   "posture": "own",
   "status": "progress",
   "phase": "Discover",
   "desc": "User helper after install: day-0 orientation for consultants using the factory on a project, then phase/engagement/domain routing to the first delivery skill. Not a contributor/platform guide."
  },
  {
   "kind": "Skill",
   "name": "agent-readiness",
   "posture": "own",
   "status": "progress",
   "phase": "Discover",
   "desc": "Which client processes should be handed to agents, and why. The Autonomous Enterprise entry point."
  },
  {
   "kind": "Skill",
   "name": "knowledge-discovery",
   "posture": "own",
   "status": "progress",
   "phase": "Prepare",
   "desc": "Extract the client's real shape, custom code, config, process scope, into reviewable guides."
  },
  {
   "kind": "Skill",
   "name": "custom-code-scan",
   "posture": "own",
   "status": "progress",
   "phase": "Prepare",
   "desc": "ATC (S4HANA_READINESS) baseline joined to real usage data (SCMON/UPL) to separate retire from remediate, ranked by business criticality not raw finding count."
  },
  {
   "kind": "Skill",
   "name": "onboarding-guide",
   "posture": "own",
   "status": "progress",
   "phase": "Prepare",
   "desc": "Role-aware path through the knowledge base for a new joiner."
  },
  {
   "kind": "Skill",
   "name": "requirements-intake",
   "posture": "own",
   "status": "progress",
   "phase": "Explore",
   "desc": "Normalize free-form, ticket, notes pack, or greenfield ask into one requirements.md; never invent AC; hand off to fit-to-standard or solution-design Mode B — not a substitute for backlog-drafting."
  },
  {
   "kind": "Skill",
   "name": "fit-to-standard",
   "posture": "own",
   "status": "progress",
   "phase": "Explore",
   "desc": "Standard versus delta decided and signed, per process."
  },
  {
   "kind": "Skill",
   "name": "solution-design",
   "posture": "own",
   "status": "progress",
   "phase": "Explore",
   "desc": "Target design plus the extensibility tier decision, recorded before build starts. Assembles from scattered sources with full traceability when no single decision-log row covers it."
  },
  {
   "kind": "Skill",
   "name": "backlog-drafting",
   "posture": "own",
   "status": "progress",
   "phase": "Explore",
   "desc": "Deltas become sized, owned, traceable work items. AC quality check + review before Jira push; refuses ungrounded asks (route via requirements-intake / FTS)."
  },
  {
   "kind": "Skill",
   "name": "config-doc",
   "posture": "own",
   "status": "progress",
   "phase": "Realize",
   "desc": "Config decision, documentation and customizing transport, together."
  },
  {
   "kind": "Skill",
   "name": "abap-dev",
   "posture": "adopt",
   "status": "progress",
   "phase": "Realize",
   "desc": "Classic ABAP, RAP and CDS. Adopted from epam-sap-skills' classic-abap and modern-abap, not skills.cloud.sap."
  },
  {
   "kind": "Skill",
   "name": "reconciliation",
   "posture": "own",
   "status": "progress",
   "phase": "Realize",
   "desc": "Migration load verified: before-and-after delta against the agreed tolerance."
  },
  {
   "kind": "Skill",
   "name": "incident-triage",
   "posture": "own",
   "status": "progress",
   "phase": "Realize",
   "desc": "Intake: classify by sub-process, layer, severity; dedupe; route; then ceremony-routing for depth. Domain-neutral engine, reused by hypercare."
  },
  {
   "kind": "Skill",
   "name": "ceremony-routing",
   "posture": "own",
   "status": "progress",
   "phase": "Realize",
   "desc": "Score Light/Standard/Deep ceremony depth after triage or requirements intake. Does not replace domain diagnostics — only sets how deep to run the matrix handoff."
  },
  {
   "kind": "Skill",
   "name": "root-cause-playbook",
   "posture": "own",
   "status": "progress",
   "phase": "Realize",
   "desc": "Diagnose: walk a domain taxonomy's diagnostic tree top-down to a ranked root cause with evidence and fix. Domain-neutral engine."
  },
  {
   "kind": "Skill",
   "name": "pricing-diagnostic",
   "posture": "own",
   "status": "progress",
   "phase": "Realize",
   "desc": "Diagnose: SD pricing defects via the condition technique. Domain-specific specialization of root-cause-playbook."
  },
  {
   "kind": "Skill",
   "name": "billing-ar-error-analyzer",
   "posture": "own",
   "status": "progress",
   "phase": "Realize",
   "desc": "Diagnose: SD billing / FI-AR posting defects via VKOA account determination. Domain-specific specialization of root-cause-playbook."
  },
  {
   "kind": "Skill",
   "name": "idoc-failure-analyzer",
   "posture": "own",
   "status": "progress",
   "phase": "Realize",
   "desc": "Diagnose: failing IDocs by direction/message type/status code into technical, mapping and application layers, with a safe reprocess path. Domain-neutral engine."
  },
  {
   "kind": "Skill",
   "name": "defect-triage",
   "posture": "own",
   "status": "progress",
   "phase": "Realize",
   "desc": "Classify: bug or functional spec flaw. A commercial call, so a human confirms the verdict. Reused by hypercare."
  },
  {
   "kind": "Skill",
   "name": "fix-doc-and-regression",
   "posture": "own",
   "status": "progress",
   "phase": "Realize",
   "desc": "Fix/verify: document the fix and derive regression test scope from a domain adjacency map. Domain-neutral engine."
  },
  {
   "kind": "Skill",
   "name": "test-case-design",
   "posture": "own",
   "status": "progress",
   "phase": "Realize",
   "desc": "Derive executable test scripts from every decision-log Row ID (Standard and Delta), with input-quality gate, per-run ledger, review-before-sync, and Row ID coverage matrix."
  },
  {
   "kind": "Skill",
   "name": "defect-pattern-analysis",
   "posture": "own",
   "status": "progress",
   "phase": "Run",
   "desc": "Prevent: cluster a defect backlog by cause (not symptom), rank by business weight, propose permanent fixes on the eliminate/prevent/detect/absorb ladder. Domain-neutral engine, periodic not per-ticket."
  },
  {
   "kind": "Skill",
   "name": "cutover-plan",
   "posture": "own",
   "status": "progress",
   "phase": "Deploy",
   "desc": "Sequenced plan, rehearsed end to end against the clock, with go-live criteria attached."
  },
  {
   "kind": "Skill",
   "name": "go-live-readiness",
   "posture": "own",
   "status": "progress",
   "phase": "Deploy",
   "desc": "Per-process-area readiness checklist and status, feeding the cutover sign-off's go/no-go criteria."
  },
  {
   "kind": "Skill",
   "name": "production-conversion",
   "posture": "own",
   "status": "progress",
   "phase": "Deploy",
   "desc": "The technical SUM/DMO go-live runbook, executed with a pre-agreed go/no-go decision-maker and rollback triggers, logs captured at every checkpoint as evidence."
  },
  {
   "kind": "Skill",
   "name": "knowledge-harvest",
   "posture": "own",
   "status": "progress",
   "phase": "Run",
   "desc": "Propose knowledge deltas after each run. Reviewed, never auto-merged."
  },
  {
   "kind": "Skill",
   "name": "agent-build",
   "posture": "adopt",
   "status": "notstarted",
   "phase": "Run",
   "desc": "Joule Studio agent with card, policy and eval pack. Joule CLI skill is on skills.cloud.sap."
  },
  {
   "kind": "Agent",
   "name": "readiness-analyst",
   "posture": "own",
   "status": "progress",
   "phase": "Discover",
   "desc": "Isolated reviewer for Discover-phase quality: checks the simplification-impact-report for completeness and missing evidence."
  },
  {
   "kind": "Agent",
   "name": "extensibility-assessor",
   "posture": "own",
   "status": "progress",
   "phase": "Explore",
   "desc": "Returns the extensibility tier, its justification, and any red flags. The clean-core decision, recorded."
  },
  {
   "kind": "Agent",
   "name": "design-test-reviewer",
   "posture": "own",
   "status": "progress",
   "phase": "Explore",
   "desc": "Independent review of a design-record against the approved Explore baseline before Realize's transport-heavy work starts."
  },
  {
   "kind": "Agent",
   "name": "source-conflict-analyst",
   "posture": "own",
   "status": "progress",
   "phase": "Explore",
   "desc": "Provenance and contradiction analysis across a scattered source pack, supporting solution-design's compose/maintain mode without stuffing raw sources into its context."
  },
  {
   "kind": "Agent",
   "name": "defect-classifier",
   "posture": "own",
   "status": "progress",
   "phase": "Realize",
   "desc": "Returns class, confidence, route and recommended fix. Serves both Realize triage and Run hypercare."
  },
  {
   "kind": "Agent",
   "name": "knowledge-harvester",
   "posture": "own",
   "status": "progress",
   "phase": "Run",
   "desc": "Returns proposed knowledge deltas after each run."
  },
  {
   "kind": "Agent",
   "name": "cutover-risk-assessor",
   "posture": "own",
   "status": "progress",
   "phase": "Deploy",
   "desc": "Bounded go-live risk verdict (go/conditional/no-go) from cutover-plan's rehearsal record and go-live-readiness's checklist."
  },
  {
   "kind": "Connector",
   "name": "abap-mcp",
   "posture": "adopt",
   "status": "ready",
   "phase": "all",
   "desc": "Full ABAP CRUD (classic + RAP) via mcp-abap-adt, npx-installed, per-developer. Alternatives: SAP's own VS Code ADT MCP (Cloud ABAP only), arc-1 (enterprise/BTP deploy)."
  },
  {
   "kind": "Connector",
   "name": "jira",
   "posture": "adopt",
   "status": "ready",
   "phase": "all",
   "desc": "Work items and the defect queue. The work-intent surface of record for now."
  },
  {
   "kind": "Connector",
   "name": "knowledge-graph",
   "posture": "adopt",
   "status": "progress",
   "phase": "all",
   "desc": "Structured map of business entities and relationships. Grounds discovery and agent-readiness."
  },
  {
   "kind": "Connector",
   "name": "cloud-alm",
   "posture": "adopt",
   "status": "progress",
   "phase": "all",
   "desc": "SAP Cloud ALM delivery and operations surface, packaged with an external profile launcher and read-only-by-default tool posture."
  },
  {
   "kind": "Connector",
   "name": "readiness-check",
   "posture": "adopt",
   "status": "notstarted",
   "phase": "all",
   "desc": "Simplification items and readiness findings."
  },
  {
   "kind": "Connector",
   "name": "signavio",
   "posture": "adopt",
   "status": "notstarted",
   "phase": "all",
   "desc": "Process scope, variants and agent mining."
  },
  {
   "kind": "Connector",
   "name": "calendar",
   "posture": "adopt",
   "status": "progress",
   "phase": "all",
   "desc": "Microsoft 365 calendar. Finds real availability and drafts (never sends) invites for fit-to-standard workshop scheduling. Missing from the model even though the ported, proven fit-to-standard skill depends on it."
  },
  {
   "kind": "Connector",
   "name": "gcts-abapgit",
   "posture": "adopt",
   "status": "notstarted",
   "phase": "all",
   "desc": "Source control for ABAP Cloud, CAP and UI5."
  },
  {
   "kind": "Connector",
   "name": "joule-studio",
   "posture": "adopt",
   "status": "notstarted",
   "phase": "all",
   "desc": "Where client-facing agents are built."
  },
  {
   "kind": "Connector",
   "name": "ai-agent-hub",
   "posture": "adopt",
   "status": "notstarted",
   "phase": "all",
   "desc": "Where client-facing agents are governed. Proposed to Retired lifecycle. GA Q3 2026."
  },
  {
   "kind": "Artifact",
   "name": "assessment-report",
   "posture": "own",
   "status": "progress",
   "phase": "all",
   "desc": "Agent-candidate scoring: process, volume, exception rate, reversibility, data reachability, verdict. The Discover-phase deliverable for agent-readiness."
  },
  {
   "kind": "Artifact",
   "name": "simplification-impact-report",
   "posture": "own",
   "status": "progress",
   "phase": "all",
   "desc": "Readiness Check / SI-Check findings scoped per module: what blocks the conversion versus what merely appears in the report. The Discover-phase deliverable for readiness-analysis."
  },
  {
   "kind": "Artifact",
   "name": "requirements-record",
   "posture": "own",
   "status": "progress",
   "phase": "all",
   "desc": "Normalized requirements from intake: source, goal, AC only if present, open questions. No FTS/design backlinks yet."
  },
  {
   "kind": "Artifact",
   "name": "design-record",
   "posture": "own",
   "status": "progress",
   "phase": "all",
   "desc": "Target design, critiqued then approved."
  },
  {
   "kind": "Artifact",
   "name": "architecture-package",
   "posture": "own",
   "status": "progress",
   "phase": "all",
   "desc": "Client-facing architecture index: scope, architecture views, source records, traceability, NFRs, risks and named approvals."
  },
  {
   "kind": "Artifact",
   "name": "extensibility-record",
   "posture": "own",
   "status": "progress",
   "phase": "all",
   "desc": "Chosen extensibility tier plus the justification for it."
  },
  {
   "kind": "Artifact",
   "name": "config-record",
   "posture": "own",
   "status": "progress",
   "phase": "all",
   "desc": "What changed in customizing, and why."
  },
  {
   "kind": "Artifact",
   "name": "transport-record",
   "posture": "own",
   "status": "progress",
   "phase": "all",
   "desc": "Transport ID recorded by construction, not by hand."
  },
  {
   "kind": "Artifact",
   "name": "reconciliation-report",
   "posture": "own",
   "status": "progress",
   "phase": "all",
   "desc": "Before-and-after delta against tolerance."
  },
  {
   "kind": "Artifact",
   "name": "triage-verdict",
   "posture": "own",
   "status": "progress",
   "phase": "all",
   "desc": "Class, route, and the human who confirmed it."
  },
  {
   "kind": "Artifact",
   "name": "test-coverage-matrix",
   "posture": "own",
   "status": "progress",
   "phase": "all",
   "desc": "Row ID to test-case traceability: technique used, test case IDs, status, explicit gaps."
  },
  {
   "kind": "Artifact",
   "name": "sign-off-record",
   "posture": "own",
   "status": "progress",
   "phase": "all",
   "desc": "Named person, date, scope, artifact reference."
  },
  {
   "kind": "Artifact",
   "name": "onboarding-record",
   "posture": "own",
   "status": "progress",
   "phase": "all",
   "desc": "Ready to take a ticket, evidenced."
  },
  {
   "kind": "Artifact",
   "name": "run-exit-record",
   "posture": "own",
   "status": "progress",
   "phase": "all",
   "desc": "Named approver, four-way disposition per open item (resolved / carried over - scheduled / carried over - red flag / escalated - traceability gap), and knowledge-harvest cycle confirmation. Both the evidence and the mechanism for the one gate Activate doesn't define."
  },
  {
   "kind": "Artifact",
   "name": "agent-card",
   "posture": "own",
   "status": "notstarted",
   "phase": "all",
   "desc": "Purpose, owner, data scope, guardrails and eval pack. What AI Agent Hub registers."
  },
  {
   "kind": "Q-gate",
   "name": "discover→prepare",
   "posture": "adopt",
   "status": "progress",
   "phase": "all",
   "desc": "Exit criteria: scope and readiness accepted."
  },
  {
   "kind": "Q-gate",
   "name": "prepare→explore",
   "posture": "adopt",
   "status": "progress",
   "phase": "all",
   "desc": "Exit criteria: knowledge built and validated, custom-code baseline taken, team onboarded."
  },
  {
   "kind": "Q-gate",
   "name": "explore→realize",
   "posture": "adopt",
   "status": "progress",
   "phase": "all",
   "desc": "Exit criteria: fit-to-standard signed, design approved, extensibility tier recorded, backlog baselined."
  },
  {
   "kind": "Q-gate",
   "name": "realize→deploy",
   "posture": "adopt",
   "status": "progress",
   "phase": "all",
   "desc": "Exit criteria: config documented, custom code ATC-clean, data reconciled."
  },
  {
   "kind": "Q-gate",
   "name": "deploy→run",
   "posture": "adopt",
   "status": "progress",
   "phase": "all",
   "desc": "Exit criteria: cutover rehearsed, go-live criteria met."
  },
  {
   "kind": "Q-gate",
   "name": "run-exit",
   "posture": "own",
   "status": "progress",
   "phase": "all",
   "desc": "Exit criteria: hypercare closed, knowledge harvested. This one is ours, Activate does not define it."
  },
  {
   "kind": "Knowledge",
   "name": "domain-packs",
   "posture": "own",
   "status": "progress",
   "phase": "all",
   "desc": "Swappable domain expertise a generic engine skill plugs in (order-to-cash is the first pack), distinct from the other buckets' project-specific content."
  },
  {
   "kind": "Knowledge",
   "name": "process",
   "posture": "own",
   "status": "notstarted",
   "phase": "all",
   "desc": "Scope, variants and fit-to-standard outcomes."
  },
  {
   "kind": "Knowledge",
   "name": "config",
   "posture": "own",
   "status": "notstarted",
   "phase": "all",
   "desc": "Config decisions and their rationale."
  },
  {
   "kind": "Knowledge",
   "name": "custom-code",
   "posture": "own",
   "status": "notstarted",
   "phase": "all",
   "desc": "Inventory, usage data and remediation history."
  },
  {
   "kind": "Knowledge",
   "name": "clean-core",
   "posture": "adopt",
   "status": "progress",
   "phase": "all",
   "desc": "SAP's clean-core rules: in-app versus side-by-side, released APIs, upgrade safety. SAP publishes it; we apply it as an always-on guardrail."
  },
  {
   "kind": "Knowledge",
   "name": "extensibility",
   "posture": "own",
   "status": "notstarted",
   "phase": "all",
   "desc": "Tier decisions and the modification register."
  },
  {
   "kind": "Knowledge",
   "name": "data",
   "posture": "own",
   "status": "notstarted",
   "phase": "all",
   "desc": "Migration objects, cleansing rules and reconciliation baselines."
  },
  {
   "kind": "Knowledge",
   "name": "testing",
   "posture": "own",
   "status": "progress",
   "phase": "all",
   "desc": "Defect history and what has already been classified as a spec flaw."
  },
  {
   "kind": "Knowledge",
   "name": "operations",
   "posture": "own",
   "status": "notstarted",
   "phase": "all",
   "desc": "Runbooks, cutover history and performance baselines."
  },
  {
   "kind": "Knowledge",
   "name": "standards",
   "posture": "own",
   "status": "notstarted",
   "phase": "all",
   "desc": "EPAM delivery standards and the project's own conventions."
  }
 ],
 "activities": [
  {
   "phase": "Discover",
   "owner": "architect",
   "engagement": "B",
   "status": "notstarted",
   "file": "activities/discover/readiness-analysis.md",
   "title": "Readiness & simplification analysis",
   "desc": "Pull the Readiness Check, SI-Check and the relevant SAP Notes into one scoped view: which simplification items actually apply, which custom code they hit, and what that implies for effort. Output is a simplification-impact report that sizes the conversion before anyone commits to a date. The judgment is separating items that genuinely block from items that merely appear in the report.",
   "uses": [
    [
     "skill",
     [
      "readiness-analysis"
     ]
    ],
    [
     "agent",
     [
      "readiness-analyst"
     ]
    ],
    [
     "mcp",
     [
      "readiness-check"
     ]
    ],
    [
     "artifact",
     [
      "simplification-impact-report"
     ]
    ],
    [
     "knowledge",
     [
      "custom-code",
      "standards"
     ]
    ],
    [
     "q-gate",
     [
      "discover→prepare"
     ]
    ]
   ]
  },
  {
   "phase": "Discover",
   "owner": "delivery",
   "engagement": "GBAR",
   "status": "progress",
   "file": "activities/discover/factory-onboard.md",
   "title": "Factory onboarding (user entry)",
   "desc": "Consultant who installed the factory and wants to use it on a project: orient, day-0 setup, capture phase/engagement/domain, route to the first delivery skill. Meta for the user — no client artifact, no Q-gate evidence by itself.",
   "uses": [
    [
     "skill",
     [
      "factory-onboard"
     ]
    ],
    [
     "knowledge",
     [
      "standards",
      "domain-packs"
     ]
    ]
   ]
  },
  {
   "phase": "Discover",
   "owner": "architect",
   "engagement": "GBAR",
   "status": "notstarted",
   "file": "activities/discover/agent-readiness.md",
   "title": "Agent-readiness assessment",
   "desc": "Score the client's processes for whether they should be handed to agents: volume, exception rate, how reversible the decisions are, and whether the data an agent would need is actually reachable. Output names both the candidate processes and the ones to leave alone. This is the bridge from delivery work into SAP's Autonomous Enterprise, and it is a consulting deliverable, not a product.",
   "uses": [
    [
     "skill",
     [
      "agent-readiness"
     ]
    ],
    [
     "mcp",
     [
      "signavio",
      "knowledge-graph"
     ]
    ],
    [
     "artifact",
     [
      "assessment-report"
     ]
    ],
    [
     "knowledge",
     [
      "process"
     ]
    ],
    [
     "q-gate",
     [
      "discover→prepare"
     ]
    ]
   ]
  },
  {
   "phase": "Prepare",
   "owner": "architect",
   "engagement": "GBAR",
   "status": "notstarted",
   "file": "activities/prepare/knowledge-foundation.md",
   "title": "Knowledge foundation",
   "desc": "Scan the client's real system and process landscape, custom code inventory, configuration baseline, integration surface, process scope, and turn it into the nine knowledge buckets every other activity reads. Includes a human validation gate, because inferred SAP context is wrong often enough to be dangerous: someone corrects it and adds the client-specific why. Nothing downstream is trustworthy until this exists.",
   "uses": [
    [
     "skill",
     [
      "knowledge-discovery"
     ]
    ],
    [
     "mcp",
     [
      "abap-mcp",
      "knowledge-graph"
     ]
    ],
    [
     "knowledge",
     [
      "builds all nine buckets"
     ]
    ],
    [
     "q-gate",
     [
      "prepare→explore"
     ]
    ]
   ]
  },
  {
   "phase": "Prepare",
   "owner": "developer",
   "engagement": "B",
   "status": "progress",
   "file": "activities/prepare/custom-code-evaluation.md",
   "title": "Custom code evaluation",
   "desc": "Run ATC against the target release, join the findings to usage data, and produce a prioritised remediation inventory rather than a forty-thousand-finding dump. Output lands in the custom-code bucket. The real judgment is what to retire rather than remediate, unused code is the cheapest code to fix.",
   "uses": [
    [
     "skill",
     [
      "custom-code-scan"
     ]
    ],
    [
     "mcp",
     [
      "abap-mcp"
     ]
    ],
    [
     "knowledge",
     [
      "custom-code",
      "clean-core",
      "standards"
     ]
    ],
    [
     "q-gate",
     [
      "prepare→explore"
     ]
    ]
   ]
  },
  {
   "phase": "Prepare",
   "owner": "delivery",
   "engagement": "GBAR",
   "status": "progress",
   "file": "activities/prepare/team-onboarding.md",
   "title": "Team onboarding",
   "desc": "Walk a new joiner through project-specific context on a path shaped by their role, ending at a recorded ready-to-take-a-ticket checkpoint. It reads the whole knowledge base and produces an onboarding record. It is also that knowledge base's own test harness: if someone cannot reach first-ticket-ready without a human explaining things verbally, the knowledge base is not real yet.",
   "uses": [
    [
     "skill",
     [
      "onboarding-guide"
     ]
    ],
    [
     "mcp",
     [
      "jira"
     ]
    ],
    [
     "artifact",
     [
      "onboarding-record"
     ]
    ],
    [
     "knowledge",
     [
      "reads all nine buckets"
     ]
    ],
    [
     "q-gate",
     [
      "prepare→explore"
     ]
    ]
   ]
  },
  {
   "phase": "Explore",
   "owner": "functional",
   "engagement": "GBAR",
   "status": "progress",
   "file": "activities/explore/requirements-intake.md",
   "title": "Requirements intake",
   "desc": "Normalize a free-form ask, ticket, notes pack, or greenfield idea into one requirements.md with explicit Source and Open questions. Prevents invented acceptance criteria before fit-to-standard or solution-design Mode B. Does not create backlinked backlog items.",
   "uses": [
    [
     "skill",
     [
      "requirements-intake"
     ]
    ],
    [
     "artifact",
     [
      "requirements-record"
     ]
    ],
    [
     "mcp",
     [
      "jira",
      "cloud-alm"
     ]
    ],
    [
     "knowledge",
     [
      "process",
      "standards"
     ]
    ]
   ]
  },
  {
   "phase": "Explore",
   "owner": "functional",
   "engagement": "GB",
   "status": "notstarted",
   "file": "activities/explore/fit-to-standard.md",
   "title": "Fit-to-standard workshops",
   "desc": "Run each in-scope process against SAP standard, decide standard-versus-delta per step, and get it signed. Produces the process bucket and a sign-off record naming who accepted what. The discipline is recording the delta and its justification together, a delta with no reason becomes a modification nobody can defend at the next upgrade.",
   "uses": [
    [
     "skill",
     [
      "fit-to-standard"
     ]
    ],
    [
     "mcp",
     [
      "signavio",
      "calendar"
     ]
    ],
    [
     "artifact",
     [
      "sign-off-record"
     ]
    ],
    [
     "knowledge",
     [
      "process",
      "config",
      "standards"
     ]
    ],
    [
     "q-gate",
     [
      "explore→realize"
     ]
    ]
   ]
  },
  {
   "phase": "Explore",
   "owner": "architect",
   "engagement": "GBA",
   "status": "notstarted",
   "file": "activities/explore/solution-design.md",
   "title": "Solution design, architecture package & extensibility routing",
   "desc": "Turn the complete in-scope fit-to-standard outcome into a coherent solution architecture. Establish architecture views and cross-artifact traceability, then produce one design record and one extensibility record per delta. The scope-level architecture package is the client-facing output and explore→realize handoff.",
   "uses": [
    [
     "skill",
     [
      "solution-design"
     ]
    ],
    [
     "agent",
     [
      "extensibility-assessor",
      "design-test-reviewer",
      "source-conflict-analyst"
     ]
    ],
    [
     "artifact",
     [
      "architecture-package",
      "design-record",
      "extensibility-record"
     ]
    ],
    [
     "knowledge",
     [
      "process",
      "config",
      "data",
      "extensibility",
      "clean-core",
      "standards"
     ]
    ],
    [
     "q-gate",
     [
      "explore→realize"
     ]
    ]
   ]
  },
  {
   "phase": "Explore",
   "owner": "delivery",
   "engagement": "GBA",
   "status": "progress",
   "file": "activities/explore/backlog-drafting.md",
   "title": "Backlog drafting",
   "desc": "Convert deltas and design decisions into sized, owned, traceable work items in the work-intent system, each carrying a link back to the process decision that caused it. Includes AC quality check, clarifying questions when thin, and review before push. Traceability is established here or not at all.",
   "uses": [
    [
     "skill",
     [
      "backlog-drafting"
     ]
    ],
    [
     "mcp",
     [
      "jira",
      "cloud-alm"
     ]
    ],
    [
     "knowledge",
     [
      "process"
     ]
    ],
    [
     "q-gate",
     [
      "explore→realize"
     ]
    ]
   ]
  },
  {
   "phase": "Realize",
   "owner": "functional",
   "engagement": "GB",
   "status": "notstarted",
   "file": "activities/realize/configuration.md",
   "title": "Configuration & documentation",
   "desc": "Make the customizing change, record what changed and why, and attach the transport, as one unit rather than three tasks that drift apart. Produces a config record and a transport record. This is the fattest role's daily work, and the activity that generates most of what triage later reads.",
   "uses": [
    [
     "skill",
     [
      "config-doc"
     ]
    ],
    [
     "artifact",
     [
      "config-record",
      "transport-record"
     ]
    ],
    [
     "knowledge",
     [
      "config",
      "process",
      "standards"
     ]
    ],
    [
     "q-gate",
     [
      "realize→deploy"
     ]
    ]
   ]
  },
  {
   "phase": "Realize",
   "owner": "developer",
   "engagement": "GBA",
   "status": "progress",
   "file": "activities/realize/abap-development.md",
   "title": "ABAP / RAP development",
   "desc": "Build classic ABAP, RAP or CDS objects against the clean-core tier the design assigned. Gates on ATC findings and unit tests, then hands off a released transport. Mostly adopted skills from skills.cloud.sap, our contribution here is the gate and the transport record, not the ABAP knowledge itself.",
   "uses": [
    [
     "skill",
     [
      "abap-dev"
     ]
    ],
    [
     "mcp",
     [
      "abap-mcp",
      "gcts-abapgit"
     ]
    ],
    [
     "artifact",
     [
      "transport-record"
     ]
    ],
    [
     "knowledge",
     [
      "custom-code",
      "clean-core",
      "standards"
     ]
    ],
    [
     "q-gate",
     [
      "realize→deploy"
     ]
    ]
   ]
  },
  {
   "phase": "Realize",
   "owner": "data",
   "engagement": "GB",
   "status": "notstarted",
   "file": "activities/realize/data-reconciliation.md",
   "title": "Data migration & reconciliation",
   "desc": "Load the migration objects, then prove the load: before-and-after counts and balances against an agreed tolerance. Produces a reconciliation report that either sits inside tolerance or blocks the phase. The cleanest evidence in the whole factory, because the answer is a number rather than an opinion.",
   "uses": [
    [
     "skill",
     [
      "reconciliation"
     ]
    ],
    [
     "artifact",
     [
      "reconciliation-report"
     ]
    ],
    [
     "knowledge",
     [
      "data",
      "standards"
     ]
    ],
    [
     "q-gate",
     [
      "realize→deploy"
     ]
    ]
   ]
  },
  {
   "phase": "Realize",
   "owner": "test",
   "engagement": "GBAR",
   "status": "progress",
   "file": "activities/realize/defect-triage.md",
   "title": "Defect triage",
   "desc": "Full defect pipeline: intake/classify, ceremony depth (Light/Standard/Deep), diagnose, bug vs spec-flaw (human confirms), fix-doc and regression. Traceability chain must be complete upstream.",
   "uses": [
    [
     "skill",
     [
      "incident-triage",
      "ceremony-routing",
      "root-cause-playbook",
      "pricing-diagnostic",
      "billing-ar-error-analyzer",
      "idoc-failure-analyzer",
      "defect-triage",
      "fix-doc-and-regression"
     ]
    ],
    [
     "agent",
     [
      "defect-classifier"
     ]
    ],
    [
     "mcp",
     [
      "jira"
     ]
    ],
    [
     "artifact",
     [
      "triage-verdict"
     ]
    ],
    [
     "knowledge",
     [
      "domain-packs",
      "process",
      "config",
      "custom-code",
      "testing"
     ]
    ]
   ]
  },
  {
   "phase": "Realize",
   "owner": "test",
   "engagement": "GBA",
   "status": "progress",
   "file": "activities/realize/test-case-design.md",
   "title": "Test case design",
   "desc": "Derive executable test scripts from every decision-log Row ID in a process area, Standard and Delta alike, with an input-quality gate and per-run ledger, pick the design technique per row's shape, seed regression from defect history, produce a coverage matrix, and require review before optional test-management sync.",
   "uses": [
    [
     "skill",
     [
      "test-case-design"
     ]
    ],
    [
     "artifact",
     [
      "test-coverage-matrix"
     ]
    ],
    [
     "knowledge",
     [
      "process",
      "domain-packs",
      "testing"
     ]
    ]
   ]
  },
  {
   "phase": "Deploy",
   "owner": "delivery",
   "engagement": "GB",
   "status": "notstarted",
   "file": "activities/deploy/cutover-planning.md",
   "title": "Cutover planning & go-live readiness",
   "desc": "Sequence every cutover task against the clock, rehearse it end to end, and track the per-process-area readiness checklist that decides whether production opens. Produces a sign-off record naming who accepted the go/no-go call. The rehearsal is the point, a plan that has never been run is an estimate.",
   "uses": [
    [
     "skill",
     [
      "cutover-plan",
      "go-live-readiness"
     ]
    ],
    [
     "agent",
     [
      "cutover-risk-assessor"
     ]
    ],
    [
     "mcp",
     [
      "cloud-alm"
     ]
    ],
    [
     "artifact",
     [
      "sign-off-record"
     ]
    ],
    [
     "knowledge",
     [
      "operations"
     ]
    ],
    [
     "q-gate",
     [
      "deploy→run"
     ]
    ]
   ]
  },
  {
   "phase": "Deploy",
   "owner": "basis",
   "engagement": "GB",
   "status": "progress",
   "file": "activities/deploy/production-conversion.md",
   "title": "Production conversion",
   "desc": "Execute the conversion runbook in production, with logs captured as evidence rather than reassurance. The highest-risk hours of a brownfield programme, owned by Basis. Output goes to the operations bucket so the next conversion starts from what actually happened rather than what was planned.",
   "uses": [
    [
     "skill",
     [
      "production-conversion"
     ]
    ],
    [
     "mcp",
     [
      "cloud-alm"
     ]
    ],
    [
     "knowledge",
     [
      "operations"
     ]
    ],
    [
     "q-gate",
     [
      "deploy→run"
     ]
    ]
   ]
  },
  {
   "phase": "Run",
   "owner": "functional",
   "engagement": "R",
   "status": "notstarted",
   "file": "activities/run/hypercare-triage.md",
   "title": "Hypercare & incident triage",
   "desc": "Same pipeline as Realize defect-triage with live-user intake. Ceremony depth after route, before diagnose; does not replace O2C diagnostics.",
   "uses": [
    [
     "skill",
     [
      "incident-triage",
      "ceremony-routing",
      "root-cause-playbook",
      "pricing-diagnostic",
      "billing-ar-error-analyzer",
      "idoc-failure-analyzer",
      "defect-triage",
      "fix-doc-and-regression"
     ]
    ],
    [
     "agent",
     [
      "defect-classifier"
     ]
    ],
    [
     "mcp",
     [
      "cloud-alm",
      "jira"
     ]
    ],
    [
     "artifact",
     [
      "triage-verdict"
     ]
    ],
    [
     "knowledge",
     [
      "domain-packs",
      "process",
      "config",
      "testing",
      "operations"
     ]
    ]
   ]
  },
  {
   "phase": "Run",
   "owner": "test",
   "engagement": "R",
   "status": "notstarted",
   "file": "activities/run/defect-pattern-analysis.md",
   "title": "Defect pattern analysis",
   "desc": "Periodically (sprint / month / hypercare wrap-up), look backwards across a period of resolved defects and ask why they keep happening: cluster by cause, rank by business weight, propose a permanent fix on the eliminate/prevent/detect/absorb ladder. Distinct from the per-ticket triage flow above — this is the Prevent stage, run on a schedule, not reactively.",
   "uses": [
    [
     "skill",
     [
      "defect-pattern-analysis"
     ]
    ],
    [
     "mcp",
     [
      "jira"
     ]
    ],
    [
     "knowledge",
     [
      "domain-packs",
      "process",
      "testing",
      "operations"
     ]
    ]
   ]
  },
  {
   "phase": "Run",
   "owner": "developer",
   "engagement": "AR",
   "status": "notstarted",
   "file": "activities/run/agent-build.md",
   "title": "Agent build & registration",
   "desc": "Build a client-facing agent in Joule Studio and ship it with the things that make it governable: an agent card naming purpose, owner and data scope, its guardrails, and an eval pack. Registers into AI Agent Hub against the Proposed-to-Retired lifecycle. The security question with no pre-agent equivalent is which business user the agent acts as, and which authorization objects that grants it.",
   "uses": [
    [
     "skill",
     [
      "agent-build"
     ]
    ],
    [
     "mcp",
     [
      "joule-studio",
      "ai-agent-hub"
     ]
    ],
    [
     "artifact",
     [
      "agent-card"
     ]
    ],
    [
     "knowledge",
     [
      "extensibility",
      "standards"
     ]
    ]
   ]
  },
  {
   "phase": "Run",
   "owner": "architect",
   "engagement": "GBAR",
   "status": "notstarted",
   "file": "activities/run/knowledge-harvest.md",
   "title": "Knowledge harvest",
   "desc": "After a run, propose targeted knowledge deltas: what changed, what was learned, which guidance turned out to be wrong. Reviewed, never auto-merged. This is the step that makes the next engagement start faster than the last, and the one most likely to be skipped under delivery pressure.",
   "uses": [
    [
     "skill",
     [
      "knowledge-harvest"
     ]
    ],
    [
     "agent",
     [
      "knowledge-harvester"
     ]
    ],
    [
     "artifact",
     [
      "run-exit-record"
     ]
    ],
    [
     "knowledge",
     [
      "refreshes all nine buckets"
     ]
    ],
    [
     "q-gate",
     [
      "run-exit"
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
      "adp",
      "background agents / modes"
     ],
     [
      "adp",
      "limited"
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
   "agents": null,
   "gates": null,
   "mcp": ".cursor/mcp.json",
   "gaps": [
    "agents, configured as background agents in-app, not as files",
    "gates, no lifecycle hooks; run in CI instead"
   ]
  },
  "copilot": {
   "label": "Copilot",
   "entry": ".github/copilot-instructions.md",
   "skills": ".agents/skills/<n>/",
   "agents": null,
   "gates": null,
   "mcp": ".vscode/mcp.json",
   "gaps": [
    "agents, limited convention; to verify",
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
