# Fit-to-standard decision log — credit management (EVAL FIXTURE — anonymized)

**Session status:** Draft — pending facilitation  
**Process area:** Credit management  
**Row ID prefix:** `FTS-EVAL-credit-management`

| Row ID | Step | Requirement | Decision | Classification | Impact |
|--------|------|-------------|----------|----------------|--------|
| FTS-EVAL-credit-management-row-01 | Credit check at order save | Block order when credit exposure exceeds limit | Use SAP standard credit management | Standard | — |
| FTS-EVAL-credit-management-row-02 | Manual release | Credit analyst can release blocked sales orders | Delta — dual approval for releases above threshold | Delta | Custom release workflow |
| FTS-EVAL-credit-management-row-03 | Segment mapping | Map customers to credit segments | Not yet decided in workshop | Workaround | — |

Notes: Row 02 accepted as Delta in draft; design-record may be missing or thin in paired fixtures. Row 03 deliberately unresolved.
