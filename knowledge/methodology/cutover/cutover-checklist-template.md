# Cutover checklist — task shape & representative task tree

See [_index.md](_index.md) for consumer context. This file captures the
**shape** — column set and stage sequence — a real cutover checklist follows, not a copy of
any one project's actual dates/effort numbers.

## Task-row column set

Every cutover task row carries:

| Column | Purpose |
|---|---|
| No. | Stable task number (source uses steps of 10, so tasks can be inserted between existing ones without renumbering) |
| Cutover Task Description | The task itself; indentation in the source denotes a sub-task under the preceding heading |
| Team / Resource | Owning team or named resource |
| System | Target system the task acts on |
| Dependencies | Predecessor task number(s) — **this is the field a dependency-check agent validates**: every task past the earliest preparation steps should name at least one dependency, and a named dependency should itself already exist earlier in the sequence |
| Status | Task execution status |
| Planned Effort / Actual Effort | Hours/minutes, planned vs. actual |
| Start Date/Time, End Date/Time | Scheduled and actual execution window |
| Comments | Free text |

A checklist missing the Dependencies column entirely, or leaving it blank past the
Preparation stage, is a real gap this knowledge exists to catch — not a formatting nitpick.

## Representative stage sequence

The source template's actual task tree, condensed to the stage level (real projects add
client-specific detail under each, but the stage order and intent below is the reusable
part):

1. **Preparation** — resourcing for cutover-weekend tasks, customer/internal communications.
2. **Go-Live support setup** — help desk, support-staff contact list, local support structure
 (incl. Key Users), legacy-system access restriction post-cutover, issue/call tracking.
3. **Site preparation** — confirm user access, confirm systems properly set up.
4. **Verify configuration** — configuration and number-range verification in Production.
5. **Month-end activities (legacy system)** — vendor notifications (incl. reminder), close all
 inventory movements (goods receipts from PO/production, goods issues to production/
 customer, other material movements), AR/AP close (reconcile Material Ledger vs. Financial
 Ledger, ensure invoices posted, pay open items, run payroll, post adjustment/accrual
 journal entries), close books for the period, restrict security access to read-only.
6. **Balance extraction from legacy** — Trial Balance, GR/IR balance, Material Ledger review,
 inventory/vendor/customer balances downloaded and mapped/prepared for upload.
7. **Master data load** — Finance (GL accounts, cost/profit-center hierarchies and masters),
 configuration-independent data (house banks, GL account company-code extension, cost-center
 groups, bank masters, internal orders), Sales (customers, finished-goods creation/pricing/
 quantities), then **validate all master data** (Finance, Sales, Procurement) before moving
 on.
8. **Transactional data load** — exchange rates, inventory/vendor/customer balances, material
 balances, GL open items/balances, GR/IR balance, purchase-order cleanup and open-PO upload,
 then **validate all transactional data loads**, including a Trial Balance comparison
 (Finance Cloud vs. legacy) and finished-goods sales pricing.
9. **Go/No-Go decision** — formal approval from Project Management.
10. **Go-Live** — includes posting-period check/update as an explicit go-live-day task, not an
 afterthought.

## How to use this

- `agents/strategies-generation` cites this stage sequence when a project's Cutover strategy
 needs a checklist skeleton to reference, rather than inventing stage names from scratch.
- The cutover dependency-check agent (``) uses the stage order above as the
 expected precedence (Preparation → support/site setup → config verification → legacy
 month-end close → master data → transactional data → Go/No-Go → Go-Live) when checking
 whether a real project's checklist has tasks out of order or missing a dependency link
 against an earlier stage's task.
