# Fix documentation & regression scope — method (agnostic)

Generic method for documenting an SAP defect fix and deriving **regression test scope** from a
domain **adjacency map**. Orchestrated by `fix-doc-and-regression`. Domain packs supply the
adjacency rows (O2C: `../../../knowledge/domain-packs/order-to-cash/subprocess-adjacency.md`). Method only — no
client data.

Output shape: the sibling `fix-regression-template.md` in this same `references/` folder.

## When this runs
After diagnose has a **confirmed** (or strongly evidenced) root cause and an intended fix path —
not during triage, not while still guessing among three causes.

## Inputs required
- Root cause statement + **layer** (`config` / `master-data` / `custom` / `data` / `user`).
- Intended fix (what changes: customizing, master record, reprocess, enablement, scoped dev).
- Domain + **primary sub-process** changed (taxonomy code).
- Evidence already gathered (doc numbers, Analysis lines, VKOA keys, IDoc status, etc.).

Optional: ticket id, SAP Note/KBA **numbers** as pointers, transport/CR id, secondary sub-processes
touched.

## Fix-doc principles
1. **State cause before fix** — one primary root cause; alternatives only if still open (TBC).
2. **Layer drives ownership** — who implements vs who verifies.
3. **Pointers only** for SAP Notes/KBAs/Help — number + why relevant; never paste proprietary text.
4. **No client secrets** in committed knowledge; client doc goes to `workspace/` (gitignored).
5. For `custom`: document the **scoped change request** (object, expected behavior, test focus) —
   do not invent ABAP in the fix doc.
6. For `user`: fix doc is enablement notes + process steps, not a transport.

## Regression derivation (from adjacency)

1. Load the domain adjacency map.
2. Take the row for **From = primary sub-process** of the fix.
3. Start with **Must re-test**.
4. Add **Often adjacent** when the fix actually touches that link (e.g. pricing account key → include
   `ar`; EDI medium → include `interface`).
5. Apply **layer-sensitive extras** (widen for `config`/`custom`/mass master-data; narrow for single
   doc `data` or single-master `master-data`; skip system tests for `user`).
6. Apply **negative adjacency** — do not over-scope (e.g. OB52-only → spot PGI + billing release).
7. Turn sub-process codes into **concrete scenarios** using the map's templates + client doc types
   (ask consultant if missing).
8. Mark each scenario: smoke / full / negative; owner of execution (functional / integration /
   Basis).

## Output
One markdown file (template below) in `workspace/bugfix/<ticket-or-doc>-fix.md` containing:
- Fix documentation section
- Regression scope section (adjacency-traced)
- Open points / TBC

Feeds verify execution (manual or `realize/test-script-gen` when used) and later
`defect-pattern-analysis` / `known-issues-kb` once resolved.
