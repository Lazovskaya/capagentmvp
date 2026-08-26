---
artifact: fit-gap-analysis
namespace: "@epam/sap"

category: "SAP Activate / Explore"    # UNVERIFIED — no factory-data.json components[] entry for this Artifact exists to source this from; inferred from the same-named skill's phase
sdlc-stage: in-progress               # UNVERIFIED — same reason; the matching skill's own status (`notstarted`) doesn't necessarily apply to the artifact template's own maturity

distribution-class: client-shippable

source: internal
source-repo: [TBD]

q-gate: []                            # not cited in explore-realize's own Evidence-mapping table
---

## Notes
Classifies workshop outcomes as Fit / Gap / Workaround / TBC. Does not
choose an extensibility tier — every confirmed Gap routes to `solution-design`
using its FTS Row ID.

**A real `factory-data.json` gap:** the same-named `skills/fit-gap-analysis`
**does** have a `components[]` entry (Explore, `notstarted`), but this
Artifact does not — so `category`/`sdlc-stage` above are marked `UNVERIFIED`
rather than sourced. This is one of only two genuine artifact orphans left;
the other is `explore-chain`.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| skill | fit-gap-analysis | produced-by | TMP — that skill has no `skill.meta.md` yet, so there is no `produces` row to mirror against; remove once the catalog inverts the graph instead |
| skill | solution-design | related | every confirmed Gap routes here, cited by FTS Row ID |
