# Symptom: price / discount / tax incorrect or missing on the sales document

Sub-process: `pricing`. Start from the document's **pricing Analysis** (item → Conditions →
Analysis), which shows, per condition type, which accesses ran and why a record was/wasn't found.
See also `../pricing-condition-technique.md`.

## 1. Read the pricing Analysis first (layer: any)
- The Analysis tells you the condition type, the access sequence, each access, and the message
  ("record found" / "condition record exists but not set" / "access not made — requirement N").
  Most root causes are visible here before touching config.

## 2. Condition record — existence & validity (layer: `master-data`) — MOST COMMON
- Record missing for the **key combination** actually accessed, or **validity date** doesn't cover
  the pricing date, or it's marked deleted/inactive, or wrong scale value.
- Wrong key combination = there IS a record, but on a different access than the one the document used.

## 3. Access sequence & requirements (layer: `config`)
- Access sequence order: an earlier access found a (wrong) record and stopped; or the intended
  access has a **requirement routine** that evaluated false, so it was skipped ("access not made").
- Exclusive flag on an access stopping further reads.

## 4. Pricing procedure determination (layer: `config`)
- Wrong procedure determined = f(sales area + document pricing procedure [doc type] + customer
  pricing procedure [customer sales view]). Wrong procedure → condition type absent entirely.

## 5. Condition exclusion (layer: `config`)
- Exclusion groups can suppress a condition in favor of another ("best price"). A "missing"
  discount may be intentionally excluded.

## 6. Manual changes & copy control (layer: `user` / `config`)
- Manually entered/changed condition overriding the record.
- **Pricing type** in copying control (order→billing) controls redetermination — a wrong pricing
  type explains "right on order, wrong on invoice" (or vice versa).

## 7. Tax specifics (layer: `config` / `master-data`)
- Tax condition uses tax classification of customer (billing view) + material (sales view) +
  country/region; jurisdiction / external tax engine result. Diagnose tax separately from base price.

## 8. Custom code (layer: `custom`)
- Pricing routines (requirement / formula, e.g. VOFM), condition-value BAdIs. Suspect after 1–7.

## Output of this tree
Ranked root cause + fix, e.g. "Condition PR00 record valid-from is after the pricing date — extend
validity / create new record", citing the Analysis line as evidence.
