# Clean-core principles

Consultant reference for applying SAP's clean-core rules across extensibility decisions,
custom-code remediation, and solution design. Use alongside
`knowledge/extensibility/` (per-delta tier decisions) and
`skills/solution-design/references/extensibility-ladder.md` (tier rubric).

## What clean-core means

Two constraints, both required:

1. **No modifications** to SAP-delivered objects (no direct edits to SAP namespace code,
   tables, views, or programs — this is Tier 5 in the extensibility ladder and always an
   escalation trigger).
2. **Released APIs only** — custom code, extensions, and integrations must call only objects
   SAP has explicitly marked as part of its public contract.

A system can fail clean-core on either axis independently: side-by-side BTP code that calls a
non-released BAPI is not clean-core-compliant even though it doesn't modify anything.

## API release classification (ABAP Cloud)

SAP classifies every ABAP repository object with a *release state*:

| State | Meaning | Use in custom code |
|---|---|---|
| **Released** (C1) | Part of SAP's public stable API contract | Yes — safe to call |
| **Released for key users** (C2) | Released for key-user tools, not for developer code | No — key-user tools only |
| **Not released** | Internal SAP implementation detail | Never — subject to change without notice |
| **Deprecated** | Was released, being phased out | Avoid — migrate away; SAP will announce successor |

The release state is the single authoritative gate. "This function module has existed since R/3"
is not a substitute — non-released objects that have been stable for years still carry zero
upgrade-safety guarantee.

## How to check release state

- **ADT (ABAP Development Tools)**: open the object → Properties → API State. The quickest check.
- **ABAP Doc** (`ABAP Documentation` view in ADT): released objects carry `@EndUserText` and
  release annotations in their source or ABAP Doc entry.
- **Where-Used on a CDS view**: if the annotation `@VDM.viewType: #CONSUMPTION` or
  `@ObjectModel.supportedCapabilities` is present and the object is in the `C_` or `I_` namespace,
  it is a released consumption or interface view respectively.
- **Transaction SACM** (API Compliance Monitor, S/4HANA on-premise): scans a development package
  for non-released API usage; the primary tool for a custom-code-scan remediation pass.
- **ATC check `ABAP_CLOUD_READINESS`**: static analysis check that flags non-released calls —
  run this in ADT or via `tools/custom-code-scan` before committing a Tier 4 implementation.

## In-app vs. side-by-side decision criteria

Use this alongside `extensibility-ladder.md` (Tier 3 vs. Tier 4) when both are technically
clean-core-compliant and the decision is about architecture, not compliance.

| Factor | Prefer in-app (Tier 4) | Prefer side-by-side (Tier 3) |
|---|---|---|
| Coupling to core transaction | Must run inside document save / post | Can tolerate eventual or async call |
| Latency tolerance | Sub-second, synchronous | Can tolerate network hop |
| External system calls | None, or via released RFC | Calls external APIs, cloud services |
| Upgrade cadence | Must move with core | Independent release cycle desirable |
| Data access | Core tables via released CDS views | Own schema, or core via OData/released API |
| Team skills | ABAP team available | BTP/CAP/Node/Java team available |

Neither tier is inherently "cleaner" than the other — both are clean-core-compliant when
implemented correctly. Side-by-side is not automatically the right answer; the integration
complexity and operational overhead are real costs that must be weighed against the coupling
avoided.

## Released extension points for in-app (Tier 4)

When implementing Tier 4, the extension must attach to a released extension point. Common types:

| Extension point type | Where defined | Check |
|---|---|---|
| **BAdI** | `Get BAdI` statement in SAP code | Must be in a released enhancement spot (`@ReleaseState: RELEASED` on the spot) |
| **Enhancement spot** | `ENHANCEMENT-POINT` / `ENHANCEMENT-SECTION` | Same — spot must be released |
| **CDS extension** | `EXTEND VIEW ENTITY` | Source view must allow extension (`@ObjectModel.usageType.dataClass: #MIXED` or explicit extension annotation) |
| **Business Add-In** (classic) | SE18/SE19 | Valid for on-premise S/4; not available in ABAP Cloud |
| **Key-user Custom Logic** | Fiori `Custom Logic` app | Tier 2 only — not for developer-written code |

Never use `CALL CUSTOMER-FUNCTION` or `USER-EXIT` patterns in new code — these are pre-BAdI
legacy mechanisms with no release-state guarantee.

## Common violations

Pattern catalog for `custom-code-scan` triage and remediation planning:

| Violation | Why it breaks clean-core | Remediation path |
|---|---|---|
| Direct `SELECT` on `MARA`, `VBAK`, `BKPF`, etc. | Non-released table access; SAP may rename, restructure, or deprecate fields | Replace with released CDS view (`I_Material`, `I_SalesOrder`, `I_JournalEntry`, etc.) |
| Call to non-released function module | No stability guarantee | Find released BAPI/CDS action/RAP action; if none exists, escalate — this may be a genuine Tier 5 case |
| `CALL FUNCTION 'RFC_...'` to internal RFC | Internal RFC not in released API contract | Use OData service, SOAP service with released WSDL, or released RFC (check C1 state) |
| Direct modification of SAP include/class | Tier 5 by definition | Redesign using BAdI or enhancement spot; escalation addendum required |
| Access to `_SYS_` HANA views or AMDP on non-released views | DB-layer coupling; breaks on HANA version change | Use released CDS analytical views or Embedded Analytics APIs |
| `SYST-` fields used for business logic | System fields change meaning across releases | Use proper application APIs |

## Clean-core in the context of this factory

- `extensibility-assessor` agent uses these rules as criteria at each tier transition — if this
  file is empty or absent it will say so rather than invent criteria.
- `custom-code-scan` skill uses the violation patterns above to classify findings and propose
  remediation tiers.
- `solution-design` reads this bucket alongside `knowledge/extensibility/` when constructing
  extensibility records.
- The tier ladder in `skills/solution-design/references/extensibility-ladder.md` is the
  *decision rubric*; this file is the *technical criteria* the ladder references at each step.
