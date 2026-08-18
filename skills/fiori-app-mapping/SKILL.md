---
name: fiori-app-mapping
description: Map a supplied business-process list to a supplied SAP Fiori Apps Reference Library XLSX export. Produces reviewable, source-traceable mappings and flags unmapped processes. Never stores the export as factory knowledge.
---

# Fiori app mapping

## Inputs

- Required: an approved or reviewable business-process list in JSON.
- Required: a current XLSX export from SAP Fiori Apps Reference Library.
- Optional: target release, application-component restrictions and named functional reviewer.

The process list has this minimal shape:

```json
{
  "processes": [
    {
      "process_id": "PROC-FI-001",
      "name": "Error correction and suspense accounting",
      "keywords": ["error documents", "journal entries"]
    }
  ]
}
```

## Procedure

1. Keep the XLSX export local to the run. It is a licensed/source-specific input,
   not a knowledge-bucket contribution.
2. Run the local adapter:

   ```bash
   python3 tools/map_processes_to_fiori_apps.py \
     --processes /path/to/processes.json \
     --app-list /path/to/AppList.xlsx \
     --output workspace/fiori-app-mapping/process-app-mapping.json
   ```

3. Review every proposed app match with the functional owner. The adapter uses
   process names/keywords against app names, subtitles and descriptions; it does
   not know client configuration, authorizations or country scope.
4. Set `UNMAPPED` when no candidate is defensible. Do not invent an app to make
   coverage look complete.
5. Use approved mappings as workshop/application-list evidence. A mapping does
   not itself decide Standard versus Delta; route that decision to
   `fit-to-standard`.

## Outputs

- `process-app-mapping` JSON/CSV with app IDs, application components, match
  basis, confidence and the source-export hash.
- Explicit unmapped-process review queue.

## Hard boundaries

- Never scrape the Fiori Apps Library UI or depend on its private web APIs.
- Never persist the app catalog as reusable factory knowledge.
- Never treat lexical candidate matches as approved application scope.
- Never create Jira or Cloud ALM work items.