## Migration object scoping & mapping

Determine what actually migrates: build the object inventory, cut it down to the records
that clear the client's retention/scoping rules, then map each in-scope object and field to
its S/4HANA target. Three decisions in sequence — object scope, record scope, then target
mapping — each human-reviewed before the next agent reads it, so Realize's migration code
development starts from a settled mapping rather than a moving target.

**Owner:** Data Lead
**Engagement(s):** Greenfield / Brownfield conversion
**Status:** In progress

## Uses

- **agent:** objects-list, data-scoping, objects-mapping
- **artifact:** record-scoping-decision, object-field-mapping
- **knowledge:** data, standards
- **q-gate:** explore→realize
