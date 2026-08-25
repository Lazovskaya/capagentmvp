# SAP AI Architecture Knowledge Sources

Curated external sources to extend a Solution Architect's (SAP AI) knowledge base / RAG context.
This is a living document — new sources will be added over time.

---

## Architecture patterns & reference

### SAP Architecture Center
- **Link:** https://github.com/SAP/architecture-center
- **Description / Purpose:** SAP's official collection of architecture patterns and reference architectures for solutions built on/around SAP (BTP, S/4HANA, integration scenarios, etc.).
- **How to use:** Primary reference for solution/architecture patterns when designing target architectures or writing architecture decision records (ADRs). Suitable for ingestion into a RAG knowledge base as the core "patterns" source.

### SAP BTP Solution Diagrams
- **Link:** https://github.com/SAP/btp-solution-diagrams
- **Description / Purpose:** Official, actively maintained "single source of truth for BTP Architects" — guidelines and templates (drawio, PowerPoint) for building architecture/solution diagrams in the SAP Fiori Horizon notation, plus a library of BTP service icons. Unlike architecture-center (which covers *content* — which patterns to use), this repo covers *notation* — how a diagram should look to be recognizably "SAP-style" and understandable to other architects/customers.
- **How to use:** Feed the guidelines to an agent to auto-generate solution diagrams in the correct notation; use the icon library and templates when producing customer-facing architecture diagrams.
- **⚠️ Note:** There is an archived predecessor, `SAP-archive/sap-btp-reference-architectures`, superseded by `architecture-center`. Do not confuse it with the current source or index it as up to date.

---

## Development & coding standards

### SAP Styleguides (Clean ABAP, etc.)
- **Link:** https://github.com/SAP/styleguides
- **Description / Purpose:** Developer-level style guides (Clean ABAP and others). For a Solution Architect who also writes ABAP/RAP, this serves as a normative reference for architectural decisions — naming conventions, layering, RAP object patterns — not just syntax.
- **How to use:** Reference during architecture-level code reviews and when drafting ADRs that touch technical/coding conventions, especially for ABAP/RAP-based solutions.

---

## Integration & SDK — understanding platform capabilities/patterns

### SAP Cloud SDK for Java
- **Link:** https://github.com/SAP/cloud-sdk-java
- **Description / Purpose:** Official SDK for BTP applications communicating with SAP systems (Java). Architecturally relevant mainly via its README/docs describing integration patterns (OData, destination service, connectivity), which often underpin integration-layer decision records.
- **How to use:** Consult docs/README when designing the integration layer of a target architecture involving Java-based BTP apps.

### SAP Cloud SDK for JavaScript
- **Link:** https://github.com/SAP/cloud-sdk-js
- **Description / Purpose:** Same as above (Java SDK), for the JavaScript/Node.js ecosystem.
- **How to use:** Same as above, for JS/Node-based BTP apps.

### SAP Cloud SDK for Python
- **Link:** https://github.com/SAP/cloud-sdk-python
- **Description / Purpose:** Same pattern set, for Python-based BTP apps.
- **How to use:** Same as above, for Python-based BTP apps.

### SAP AI SDK for JavaScript
- **Link:** https://github.com/SAP/ai-sdk-js
- **Description / Purpose:** SDK for SAP AI Core / Generative AI Hub / Orchestration Service. Directly relevant to an AI-developer/architect role — clarifies which AI services and abstractions are actually available on the platform.
- **How to use:** Reference when designing AI components of an architecture to understand what's realistically implementable via SAP's AI stack.

### SAP Cloud Security Services Integration Library
- **Link:** https://github.com/SAP/cloud-security-services-integration-library
- **Description / Purpose:** Authentication/authorization integration patterns for XSUAA and Identity Authentication Service.
- **How to use:** Reference for designing the security layer of a solution architecture (auth flows, token handling, service bindings).

---

## Infrastructure as Code — landscape & provisioning boundaries

### Terraform Provider for SAP BTP
- **Link:** https://github.com/SAP/terraform-provider-btp
- **Description / Purpose:** Useful less as "content" and more as a signal of what can actually be provisioned declaratively on BTP — this directly shapes the boundaries of what's realizable in a target architecture.
- **How to use:** Check resource coverage when validating whether a proposed architecture can be provisioned via IaC.

### Terraform Provider for SAP Cloud Identity Services
- **Link:** https://github.com/SAP/terraform-provider-sap-cloud-identity-services
- **Description / Purpose:** Same rationale as above, scoped to Cloud Identity Services provisioning.
- **How to use:** Same as above, for identity-related IaC scoping.

### Terraform Provider for SAP Cloud Connector (SCC)
- **Link:** https://github.com/SAP/terraform-provider-scc
- **Description / Purpose:** Same rationale as above, scoped to Cloud Connector provisioning.
- **How to use:** Same as above, for on-prem connectivity IaC scoping.

### Cloud MTA Build Tool
- **Link:** https://github.com/SAP/cloud-mta-build-tool
- **Description / Purpose:** Multi-Target Application (MTA) build tool. Useful for understanding how MTA-based application deployments work.
- **How to use:** Reference when a target architecture includes multi-target application deployment scenarios.

---

## Cloud Application Programming Model (CAP) — outside github.com/SAP

Note: CAP-related repositories live in separate GitHub organizations (`cap-js`, `cap-java`, `capire`), not under `github.com/SAP`. Relevant if the target architecture includes CAP-based extension apps on BTP (as opposed to ABAP/RAP only).

### capire (CAP documentation)
- **Link:** https://cap.cloud.sap/ (docs source: https://github.com/cap-js/docs)
- **Description / Purpose:** Official CAP documentation site.
- **How to use:** Primary reference for CAP concepts, patterns, and best practices when extension apps are in scope.

### cap-js
- **Link:** https://github.com/cap-js
- **Description / Purpose:** CAP implementation and tooling for Node.js.
- **How to use:** Reference for CAP/Node.js implementation details when relevant to the architecture.

---

## Explicitly excluded from the knowledge base

The bulk of `github.com/SAP`'s ~309 public repositories are narrowly-scoped open-source runtime tools unrelated to architecture guidance — e.g. Kyma operators (`redis-operator-cop`, `nginx-ingress-controller-cop`), SapMachine/OpenJDK components, Spartacus (Commerce Cloud), Jenkins libraries, UI5/Angular component libraries (`fundamental-ngx`). These are implementation-level code for specific runtime tasks, not architectural documentation, and would add noise rather than value to a RAG context for architecture work. Not included.

---

## Change log
- 2026-08-19: Initial version, based on review of `github.com/SAP` public repositories.
