# Playbook: Rollout

A Rollout extends an already-implemented, already-running SAP template (global
template, "core model") to a new country, business unit, or legal entity. The
core design decisions were made once, elsewhere, and largely aren't up for
debate again — the job here is disciplined reuse, localization, and change
governance, not redesign.

## What's different about a rollout SAD

- The customer almost always already has a running S/4HANA (or ECC) landscape
  and a documented global template. Ask for it — if it's not available, flag
  this as a risk in IV.IV Constraints / VIII.XI Risks: designing a rollout
  without visibility into the template it extends is genuinely risky, not
  just a formality.
- Most architectural decisions (technology stack, integration patterns,
  security model, extensibility approach) are **inherited**, not designed
  from scratch. The SAD should say so explicitly rather than re-deriving them —
  padding the document with content that just restates the global template
  adds no value and buries the handful of decisions that actually are local.
- The interesting content is almost entirely in what's *local*: legal/tax/
  statutory requirements for the new country, local language and currency,
  local third-party integrations (banks, tax authorities, e-invoicing
  mandates), local org structure (company codes, plants, sales
  organizations), and any deviations from the template that this rollout
  requires (and why — deviations need strong justification since they erode
  the template's value over time).

## Sections that matter most (map to EPAM_SAP_SAD_Template.docx)

| Priority | Section | Why |
|---|---|---|
| High | 1.3 Architecture Domains, 1.4 Scope & Chapter Ownership | State clearly this SAD only covers what's local/new for this rollout; everything else is "per global template vX.Y". |
| High | 6.5 Global Template vs. Rollout Governance | The centerpiece of a rollout SAD. Document exactly what's reused unchanged, what's configured (not coded) for locality, and what — if anything — is a genuine template deviation with sign-off. |
| High | 3.2 Transport Governance Rules, 3.3 Transport Path & Domain | Rollouts usually plug into an existing transport landscape; get this wrong and you break other countries already live on the template. |
| High | 7.1 Data Migration Architecture | Master/org data load for the new entity (customers, vendors, materials, org structure) — not a full historical data migration in most rollouts. |
| Medium | 4. Security Architecture | Usually inherited, but local legal entities often need new company-code-level authorization scoping. |
| Medium | 2.3 Client Strategy, 2.6 Workstation & End-User Tools | Local user onboarding, language packs, local device/print requirements. |
| Conditional | 5. Integration Architecture | Only substantial if this country has local mandatory integrations (e-invoicing, local banks, statutory reporting) not covered by the template. |
| Low/skip | 6.1-6.4 Clean Core / Extensibility strategy | Already decided at template level; reference it, don't re-litigate it. |

## Questions to ask the user if not already known

1. What global template/core model is this rollout based on, and is there a
   SAD or architecture document for it you can reference?
2. Which country/entity/business unit, and what's unique about it legally,
   tax-wise, or organizationally (company code structure, currency, language)?
3. Are there any local systems this entity must integrate with that aren't
   already covered by the template (local banks, e-invoicing/SAF-T/other
   statutory reporting, local HR/payroll)?
4. Is this rollout expected to be a "vanilla" adoption, or are deviations from
   the template already anticipated? If deviations: who approves them?
5. What's the transport/landscape topology this entity plugs into (shared
   landscape with other live countries, or a separate track)?

## Common pitfalls

- Re-describing the whole global architecture as if it were new — bloats the
  document and obscures the one or two things that are actually local.
- Treating "local legal requirement" as equivalent to "template deviation"
  without checking if the template already has a configuration switch for it.
- Skipping the transport governance section because "it's just a rollout" —
  transport mistakes in a shared landscape affect every other live country.
