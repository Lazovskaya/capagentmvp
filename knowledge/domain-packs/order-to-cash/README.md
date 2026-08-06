# Order-to-Cash — domain knowledge (agnostic)

Ported from `sap-ai-cons`'s `knowledge/domain/order-to-cash/` — real, curated content, not a stub.
Tool-blind SAP O2C expertise — the **O2C domain pack** that this factory's bugfix pipeline
(`incident-triage`, `root-cause-playbook`, `defect-pattern-analysis`, `idoc-failure-analyzer`,
`fix-doc-and-regression`, `pricing-diagnostic`, `billing-ar-error-analyzer`) orchestrates — the
generic engines plug this in; O2C is the first domain pack, other domains bring their own later. No
tool-specific content — this is the durable asset that survives a change of AI tool.

## What lives here

- `incident-taxonomy.md` — O2C sub-processes used to classify/route/cluster.
- `incident-signal-catalog.md` — ticket-text signals → sub-process + layer hint + confidence
  (disambiguation rules); primary input matcher for `incident-triage`.
- `troubleshooting/` — per-symptom diagnostic trees (the core of root-cause analysis).
- `pricing-condition-technique.md` — condition-technique reference + failure modes.
- `billing-ar-account-determination.md` — SD→FI posting / VKOA / tax-at-posting / splitting.
- `routing-matrix.md` — stream / owner / co-assign / diagnose handoff for triage.
- `subprocess-adjacency.md` — regression / related-area map for fix-doc.
- `idoc-orders-invoic.md` — O2C message catalog for the IDoc analyzer.

## How this knowledge is filled (policy)

1. **Primarily static, curated, distilled expertise.** Diagnostic trees and failure-mode catalogs
   written in our own words from consultant experience + SAP Best Practices. This is what makes it
   work in a locked-down / offline tenant.
2. **Reference, don't copy.** Cite SAP artefacts as **pointers** — SAP Note numbers, Simplification
   Item IDs, transaction codes, table/field names, Best Practice scope-item IDs. Do **not** paste
   proprietary SAP Note text or Help Portal content verbatim (IP/copyright). A pointer + our own
   distilled summary is both legal and more useful.
3. **No client data, ever.** Trees describe *method*, not any client's orders, prices or customers.
   Client specifics stay in `workspace/` (gitignored) at runtime.
4. **Grows from resolved tickets (the differentiator).** `defect-pattern-analysis` feeds
   generalized, anonymized patterns back here (and known-issue entries into
   `knowledge/operations/`, via `knowledge-harvest` — see that skill's workflow) — turning each
   engagement into a compounding asset. Anonymize before it lands in the repo.
5. **Live SAP resources are a runtime concern, not baked in.** Fetching current SAP Notes / Help at
   runtime belongs to an MCP connector (from the dev-built registry), used only if wired — never a
   copied snapshot committed here.

## Delete-test

Delete every skill and `.claude/`: the O2C expertise here must still stand on its own as readable
consultant reference. If a file only makes sense as prompt-glue, it belongs in the skill, not here.
