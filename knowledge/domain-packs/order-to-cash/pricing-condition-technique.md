# Pricing — condition technique reference (agnostic)

Reference for `pricing-diagnostic` and the `troubleshooting/pricing-incorrect.md` tree. Describes
how pricing is determined and where it fails. Method only — no client data, no copied SAP text.

## The determination chain (trace in this order)

1. **Pricing procedure determination** — f(sales area + document pricing procedure [from sales doc
   type] + customer pricing procedure [customer sales area view]). Wrong procedure → the condition
   type is absent from the document entirely.
2. **Condition type** — the element being priced (base price, discount, surcharge, freight, tax).
3. **Access sequence** — the ordered list of accesses (key combinations) tried for that condition
   type. Read top-down; the first successful access wins unless flagged otherwise.
4. **Access / condition table** — each access reads a condition table (a key combination). A
   **requirement routine** on an access can skip it ("access not made").
5. **Condition record** — the actual data (price/%/amount), with validity period, scales, and
   status. Found or not found per access.

## The "Analysis" is the primary diagnostic

The document's pricing **Analysis** view exposes the whole chain per condition type: which accesses
ran, which were skipped and why (requirement), and for the executed access whether a record was
found. Always read it before changing anything.

## Common failure modes (→ layer)

| Failure | Layer | Tell-tale in Analysis |
|---------|-------|-----------------------|
| Record missing for the key actually accessed | `master-data` | "record not found" on the intended access |
| Record exists but validity excludes pricing date | `master-data` | found on a different date / not set |
| Wrong key combination used | `master-data`/`config` | record found on an unexpected access |
| Requirement routine skips the access | `config`/`custom` | "access not made (requirement nnn)" |
| Earlier access wins with wrong record | `config` | first-found short-circuits the sequence |
| Condition excluded (exclusion group) | `config` | condition inactive — "excluded" |
| Wrong pricing procedure | `config` | condition type entirely absent |
| Redetermination on copy (order→billing) | `config` | differs order vs invoice — pricing type |
| Manual override | `user` | condition flagged as changed manually |
| Tax classification / jurisdiction | `config`/`master-data` | tax condition wrong/zero |

## Scales, quantity & currency
- Scale basis (quantity/value) and unit conversion (base UoM vs sales UoM) mis-set → right rate,
  wrong amount.
- Currency conversion (condition currency vs document currency) and exchange-rate date.

## Redetermination boundaries
- **Copying control pricing type** governs whether prices are copied, redetermined, or carried with
  updates from order → delivery-related billing → invoice. This is the usual explanation for a
  price that is correct in one document and wrong in the next.
