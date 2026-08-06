# Symptom: output not issued (print / email / EDI channel)

Sub-process: `output`. Order confirmation, delivery note, invoice PDF/email, or similar **output**
is not determined, not processed, or not received by the customer — when the **application
document exists**. Walk top-down; stop at the first check that explains it.

**Disambiguate first:**
- Outbound **IDoc/EDI** (INVOIC/ORDERS/…) with WE02/BD87/status → sub-process `interface`, hand off
  `idoc-failure-analyzer` — leave this tree (or use only for "no output type determined" before
  IDoc creation).
- Billing document **missing** in document flow → `billing-document-not-created.md`, not output.
- "Customer did not get invoice" + billing doc exists + no EDI wording → stay here (medium
  confidence until channel is known).

## 1. Confirm document + expected output (layer: `data`) — FIRST
- Which application object (order / delivery / billing) and which output type / medium the
  business expects (print, email, EDI, XML).
- Document flow / Messages (NAST) or Output Determination (BRF+/OPD on S/4): is an output **line
  present**? Wrong type vs no type vs type present but failed processing are different paths.

## 2. Output determination — no output found (layer: `config` / `master-data`) — VERY COMMON
- Classic: condition records for the output type (NACE / VV* condition maintenance) — key
  combination (sales org, customer, doc type…), validity, language, partner function.
- S/4 output management: BRF+ / OPD rules not matching the document attributes.
- Output determination procedure not assigned to the application / doc type; output type not in the
  procedure.
- Transmission medium / partner function on the record does not match the partner on the document.

## 3. Output present but not processed (layer: `data` / `config` / `user`) — COMMON
- Timing: output scheduled for later processing; dispatch time not reached.
- Processing mode: batch-only output waiting for RSNAST00 / equivalent job — job not run (`data` /
  operations), not an SD determination defect.
- Status error on the output line — read the processing log (repeat / change messages).
- User did not trigger issue (manual send) when medium requires it → `user`.

## 4. Channel / technical send failure (layer: `data` / `config`) — COMMON
- Print: device / spool / PDF form (SAPscript/Smart Form/Adobe) error — Basis/forms co-assign.
- Email: SCOT / BCS send error; missing email on BP/customer; wrong communication method on the
  partner.
- Form routine / program dump on issue — check ST22; may become `custom` if Z-form.
- If the failure is ALE/IDoc partner profile after an EDI output type → reclassify to `interface`.

## 5. Partner & communication master data (layer: `master-data`)
- Output partner (sold-to / bill-to / ship-to) missing address, language, or email.
- Customer output indicator / marketing lock suppressing communication (where used).
- Wrong partner function on the output record pointing at a partner not on the document.

## 6. Document completeness / blockers (layer: `data` / `config`)
- Some outputs require complete document / released accounting / PGI — requirement routines in
  the output procedure skipping the type.
- Billing output before FI release when a requirement demands accounting doc — related to `ar`
  timing, not missing VKOA if billing already posted later.

## 7. Custom code (layer: `custom`)
- Output requirement / substitution routines (VOFM), Z-print programs, BAdIs in output. Suspect
  after 1–6; scope a developer change — do not invent the code fix in prose.

## Output of this tree
Ranked root cause + fix, e.g. "No RD00 condition record for bill-to + sales org — maintain output
condition; document and form OK", or "Output RD00 status error — email address missing on bill-to
BP", with determination keys + processing log evidence.
