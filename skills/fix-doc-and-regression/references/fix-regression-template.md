# Fix & regression — template

Fill one file per fix. Replace angle-bracket placeholders. Keep SAP Note references as **numbers +
one-line why** only — never paste Note text. Client-specific paths stay under `workspace/`
(gitignored).

---

# Fix: \<short title\>

| Field | Value |
|-------|--------|
| Ticket / defect id | |
| Date | |
| Domain | e.g. O2C |
| Primary sub-process | taxonomy code |
| Layer | `config` / `master-data` / `custom` / `data` / `user` |
| Document(s) evidenced | |
| Status | Proposed / Implemented / Verified |

## 1. Symptom (as reported)
\<what failed, where, business impact\>

## 2. Root cause
\<one primary cause\>

**Evidence checked:**
- …

**Ruled out:**
- …

## 3. Solution
| Step | Action | Owner |
|------|--------|-------|
| 1 | | |
| 2 | | |

**Transports / CR / master-data change:** \<id or n/a\>  
**SAP Note / KBA pointers (optional):** \<number — why relevant\>

### If layer = `custom`
Scoped change (no invented code):
- Object / exit / BAdI (known name or "to be identified by dev"):
- Expected behavior after change:
- Out of scope:

### If layer = `user`
Enablement only:
- Process steps / audience:
- No system change:

## 4. Verification of the original defect
- Retest document / steps:
- Expected result:

---

## 5. Regression scope

**Adjacency source:** domain adjacency map row for `From = <sub-process>`; layer extras applied:
`<layer>`.

| Sub-process | In scope? | Why (Must / Often / layer extra / negative skip) |
|-------------|-----------|--------------------------------------------------|
| | yes/no | |

### Scenarios

| # | Scenario | Sub-processes covered | Depth | Executed by |
|---|----------|----------------------|-------|-------------|
| 1 | | | smoke / full / negative | functional / integration / Basis |
| 2 | | | | |

### Explicitly out of scope
- \<what we are not retesting and why — cite negative adjacency if used\>

## 6. Open points / TBC
| ID | Point | Impact | Owner |
|----|-------|--------|-------|
| | | | |

## 7. Handoff
- Verify tracker / test tool: paste or MCP attach  
- After verify → consider `known-issues-kb` / pattern analysis if recurring
