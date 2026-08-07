# O2C routing matrix (domain pack)

Default **stream → owner → co-assign → diagnose handoff** for `incident-triage` on O2C. Generic
routing principles live in `../../../skills/incident-triage/references/incident-triage-method.md`;
this file is the O2C pack.
Client engagements may override stream names / RACI — keep overrides in `workspace/` (gitignored),
not here.

Use after sub-process + layer hint are assigned. Signal catalog still picks the sub-process; this
matrix picks **who** and **which diagnose skill**.

## Stream map

| Sub-process | Owning stream (default) | Primary owner | Co-assign by layer | Diagnose handoff |
|-------------|-------------------------|---------------|--------------------|------------------|
| `order` | SD order capture | SD functional | `custom`→dev; `user`→OCM | RCA → `order-will-not-save` |
| `pricing` | SD pricing | SD pricing | `custom`→dev (VOFM/BAdI); `master-data`→data owner | `pricing-diagnostic` |
| `atp` | SD / aATP | SD + ATP | `custom`→dev; allocation master→planning | RCA → `atp-no-confirmation` |
| `credit` | FSCM / credit | Credit / FSCM | `custom`→dev; limit master→credit data owner | RCA → `credit-block` |
| `delivery` | LE / shipping | SD shipping / LE | PGI FI period→FI; `custom`→dev; WM/EWM→WM | RCA → `delivery-not-created` or `pgi-fails` |
| `billing` | SD-FI billing | SD billing | copy control/`custom`→dev | RCA → `billing-document-not-created` **or** `billing-ar-error-analyzer` if error is account det on create |
| `ar` | SD-FI / AR | SD-FI | VKOA/`config`→SD-FI; period→FI/Basis; splitting→FI; `custom`→dev | `billing-ar-error-analyzer` |
| `output` | Output management | SD output / forms | print/spool/email gateway→Basis; EDI output→integration | RCA → `output-not-issued` |
| `returns` | SD returns / disputes | SD + (FSCM if dispute) | ARM/`custom`→dev; how-to→OCM | RCA → `returns-credit-memo` |
| `interface` | Integration (by partner) | Integration lead | technical ALE→Basis; mapping→middleware; application 51→functional of the **secondary** sub-process | `idoc-failure-analyzer` |

## Layer co-assign rules (always apply)

| Layer | Co-assign | Note |
|-------|-----------|------|
| `config` | Owning functional stream only (unless cross-module) | Transport owner = stream |
| `master-data` | Data owner / master-data team + functional | Functional still owns diagnosis |
| `custom` | **Developer** + functional (scopes the change) | Never invent code in triage |
| `data` | Functional + **Basis** when period/number range/IDoc technical / system job | Rebuild/reprocess may need Basis |
| `user` | **OCM / enablement** — not a defect queue | Still keep ticket visible on worklist as S3/training |

## Interface routing (override module stream)

For `interface`, **do not** route solely by ORDERS→SD or INVOIC→billing. Route by:

1. **Partner** (WE20 partner / EDI partner id) → integration owner for that partner.
2. **IDoc layer** from status (`idoc-processing.md`): technical → Basis; mapping → middleware;
   application → functional stream of the failing business object (customer master → `order`/
   master-data; material → master-data; pricing in ORDERS → `pricing`; etc.).
3. Put both on the ticket: `owner=integration (P-EDI07)` + `co-assign=SD functional` when status 51.

## Worklist sort key

After severity S1/S2/S3 and volume weight (methodology § Severity weighting):

1. Severity band (S1 first).
2. Volume weight (higher first within band).
3. Duplicate-group primary before duplicates.
4. Confidence **low** flagged but **not** sorted to the bottom — low-confidence S1 still first;
   surface in an ambiguity section.

## Client override checklist (workspace only)

When an engagement has different team names, copy this matrix into
`workspace/bugfix/routing-matrix-<client>.md` and adjust stream labels only — keep sub-process
codes stable so skills and adjacency stay aligned.
