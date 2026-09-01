---
assistant: functional-consultant
namespace: "@epam/sap"

role_scope: functional-consultant
engagement: [G, B, A, R]     # R is only the temporarily-hosted AMS cluster; core role is G/B/A

sdlc-stage: not-ready        # not-ready | in-progress | in-test | ready
distribution-class: client-shippable  # client-shippable | epam-internal-only | public-external

source: internal             # internal | secondsky | SAP | community
source-repo: [TBD]
---

## Notes

Entry point for the Functional role (`roles.functional`), active across Explore and
Realize. `engagement` includes `R` **only** because this assistant temporarily hosts
the AMS defect-diagnosis cluster; the core functional-consultant scope is G/B/A. When
`ams-support-analyst` is created (second wave), the `*(temp)*` use cases and their
`routes-to` edges move there and this assistant's `engagement` drops back to [G, B, A].

**MVP routing deviation.** Strict model is Assistant → Agent → Skill, but most
functional use cases are skill-only today. `routes-to` points at a **skill** where no
agent wrapper exists, and at an **agent** where one does (`fit-to-standard-accelerator`,
`defect-classifier`). Wrapping the rest is second-wave work.

`backlog-drafting` is routed from here (delta → work-item authoring is the Explore
functional activity), not from `delivery-manager`, which owns ceremony/planning
instead. `use_case_id` identifiers are descriptive labels until a registry exists.

## Dependency graph

| Type | Ref | Relation | Notes |
|---|---|---|---|
| agent | fit-to-standard-accelerator | routes-to | for use case: compose a full Explore fit-to-standard run |
| agent | defect-classifier | routes-to | for use case: bug-vs-spec-flaw commercial verdict (AMS, temp) |
| skill | requirements-intake | routes-to | no agent wrapper yet |
| skill | fit-to-standard | routes-to | no agent wrapper yet |
| skill | workshop-preparation | routes-to | no agent wrapper yet |
| skill | workshop-transcript-intake | routes-to | no agent wrapper yet |
| skill | fit-gap-analysis | routes-to | no agent wrapper yet |
| skill | fiori-app-mapping | routes-to | no agent wrapper yet |
| skill | backlog-drafting | routes-to | no agent wrapper yet; delta → sized work items |
| skill | config-doc | routes-to | no agent wrapper yet; Realize configuration |
| skill | incident-triage | routes-to | AMS cluster, temp |
| skill | root-cause-playbook | routes-to | AMS cluster, temp |
| skill | pricing-diagnostic | routes-to | AMS cluster, temp |
| skill | billing-ar-error-analyzer | routes-to | AMS cluster, temp |
| skill | idoc-failure-analyzer | routes-to | AMS cluster, temp |
| skill | defect-triage | routes-to | AMS cluster, temp; paired with defect-classifier |
| skill | defect-pattern-analysis | routes-to | AMS cluster, temp |
| knowledge | process | requires | process/domain context loaded as role context |
| knowledge | domain-packs | requires | swappable domain expertise (e.g. order-to-cash) |
| knowledge | config | requires | configuration guidance loaded as role context |
