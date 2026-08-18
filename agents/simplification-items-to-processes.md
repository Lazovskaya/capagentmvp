# simplification-items-to-processes

Bounded Discover-phase agent for `EPMCSAPAI-240`. It turns an SAP Simplification
Item Catalog export into a de-duplicated, reviewable list of potentially impacted
business processes. It does not decide whether an item applies to a particular
client; that client-specific judgment belongs to `readiness-analysis` after an
SI-Check, configuration and productive-usage evidence are available.

## Inputs

- An SAP Simplification Item Catalog export. For the Transition Database export,
  use `header.xml`, `sdb_transition_db_item.xml`, `sdb_check_new.xml`,
  `sdb_check_db_new.xml`, and `sdb_note.xml` when present.
- Target release; source release when known.
- Optional: process taxonomy, SAP Best Practices scope, SI-Check export, custom-code
  baseline and transaction-usage evidence.

## Local catalog importer

Run the local importer before the agent's review step:

```bash
python3 tools/simplification_items_to_processes.py \
  --catalog-dir /path/to/SimplificationItemCatalog \
  --target-release 'S/4HANA 2023 FPS02' \
  --taxonomy /path/to/process-taxonomy.json \
  --output-json work/business-process-impact-list.json \
  --output-csv work/business-process-impact-list.csv
```

`--taxonomy` is optional. Without it, the importer preserves every catalog item
but leaves `process_mappings` empty for human review. Its JSON shape is:

```json
{
  "by_item_id": {
    "SI02: CM_CPE_ACTIVATION": [
      {
        "business_process": "Commodity pricing and settlement",
        "candidate_transaction_codes": [],
        "mapping_basis": "Approved client process taxonomy row PROC-CM-01",
        "confidence": "high"
      }
    ]
  },
  "by_application_area": {
    "Commodity Management": [
      {
        "business_process": "Commodity management processes",
        "candidate_transaction_codes": [],
        "mapping_basis": "SAP Best Practices scope item mapping",
        "confidence": "medium"
      }
    ]
  }
}
```

## Procedure

1. Validate the catalog provenance from `header.xml`; record its download time,
   application version and every input file used.
2. Read each `GSS_RC_SIC_DOWNLOAD_SITEM` record in `sdb_transition_db_item.xml`.
   Preserve `GUID`, `SITEM_ID`, `TITLE_EN`, `APP_AREA`, `IMPACT_NOTE` and release
   applicability fields as source evidence.
3. De-duplicate on `GUID`. Keep every referenced check, SAP Note and target-release
   category as evidence; do not collapse different release applicability rows.
4. Map each item to one or more candidate business processes using the supplied
   taxonomy, application area, item title and SAP Note. Cite the basis for every
   mapping. A transaction code is emitted only when its mapping is deterministic;
   otherwise record an ambiguity.
5. Classify catalog impact conservatively:
   - `mandatory`: an item is applicable to the stated target release and SI-Check,
     configuration or usage evidence proves the affected capability is in scope.
   - `conditional`: release applicability is known but client evidence is missing,
     or applicability depends on configuration or usage.
   - `informational`: the item is a release/context notice with no identified
     in-scope process impact.
6. Write `business-process-impact-list` with status `DRAFT` or `IN_REVIEW`.
   Route client-specific applicability and conversion effort conclusions to
   `readiness-analysis`; never call an item a conversion blocker from catalog
   metadata alone.

## Returns

- `business-process-impact-list` artifact with item-to-process mappings, impact
  classification, evidence references, confidence and review status.
- An explicit ambiguity list for low-confidence mappings and absent usage evidence.

## Refuse conditions

- No catalog provenance or no `sdb_transition_db_item.xml`: return `blocking
  missing evidence`.
- No target release: return `gaps`; do not infer applicability from the latest
  catalog entry.
- No client SI-Check/usage evidence: produce only `conditional` or `informational`
  classifications unless the supplied evidence independently proves an item is in
  scope.