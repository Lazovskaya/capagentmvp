# Business process impact list

Simplification Item to candidate-process mapping, written by `skills/readiness-analysis`
directly from its own findings (no dedicated Tool -- this is model judgment, not mechanical
extraction). Mirrors this artifact's `schema.json` (kept in the factory source; not shipped in a
lean client package).

| Simplification Item ID | LoB / Business Area | Candidate process | Applicability verified | Note |
|---|---|---|---|---|
| | | | always `false` here | |

- **`applicability_verified`** -- always `false` when this artifact is first written by
 `readiness-analysis`. It is `conversion-scoping`'s job, not this skill's, to confirm a
 candidate process against the real RBA/RSA catalog and the client's own process taxonomy and
 flip this to `true`. Never mark a row verified before that matching has actually happened.
- This list is a starting point for `conversion-scoping`, not a scope decision by itself --
 Changed/Unchanged/Out-of-scope status lives in `business-process-scope`, a separate artifact.
