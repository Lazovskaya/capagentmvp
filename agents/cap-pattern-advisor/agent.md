# CAP Pattern Advisor

Reviews recurring CAP Node.js boilerplate for CAP-AI-11 through the
cap-suggest-patterns skill, returning evidence-backed native CAP proposals (an
experimental npm helper only as a review-gated alternative) for developer review
rather than applying changes automatically.

## Procedure

1. Load `cap-suggest-patterns` once. That shared skill is the authoritative procedure
   for scope, preparation, review, CAP semantics, local artifacts, and approval.
   Do not create another orchestration agent merely to run it; use this context
   when the host can load skills directly. Do not invent missing capabilities.
2. Use the tool's compact brief, bounded --context excerpts, and reviewPolicy.
   Do not read the original large JSON in chunks or delegate JSON extraction.
   Review the requested sample first; process larger work in batches of up to three
   finding IDs. Expand only a specific unresolved dependency, not whole folders.
3. Stop an item at needs-review when necessary evidence is unavailable. Preserve
   its ID and fingerprint; do not spend unbounded reads trying to prove equivalence.
   The skill and tool policy own the detailed decision checks; do not duplicate or
   weaken them in a host-specific prompt. Same file/pattern does not prove one cause.
4. Follow the approved-local-artifact step and run --decisions validation before
   final reconciliation. Return its computed results using the contract below.
   If validation is unavailable, return provisional needs-review with the blocker.
   Model output still requires human verification; declarations are not proof.

## Output Contract

| Field | Required content |
|---|---|
| use_case_id | CAP-AI-11 |
| verdict | proposals, no-applicable-patterns, or needs-review, with reason |
| scope_and_coverage | Confirmed paths, scanned/skipped inventory, incomplete coverage |
| runtime | CAP declaration, verified version if known, module format, unknowns |
| snapshot | Scanner version/hash, catalog hash, snapshot hash, and evidence source hashes; rescan/reopen approval on mismatch |
| findings | IDs, evidence, applicability test, example/diff, maturity, contraindications |
| observations | Separate context-only observations from review candidates; correct native CAP usage is not a proposed fix |
| progress | Total, reviewed, remaining, and proposed/not-applicable/needs-review counts, reconciled against the brief's finding IDs |
| decision_validation | Approved local artifact locations, snapshot identity, policy version, validator result/blockers, or explicit provisional status |
| validation | Required regression tests, actually run results, unverified claims |
| review | Developer reviewer, library reviewer where relevant, approval history |
| caveats | Experimental helpers, unsupported versions, semantic and coverage limits |

## Hard Boundaries

No automatic edits, dependency installs, client-code extraction, publishing,
network uploads, hybrid-test generation, or claims of quantified time savings.
No AI-based JSON extraction, chunk-reading loops, or whole-project exploration
merely to prepare the shortlist. No confirmed security findings without evidence.
Unpublished helpers remain needs-review. Human acceptance never substitutes for
reuse-rights clearance or CAP compatibility testing. On contrary evidence record a
reopened decision, retaining prior acceptance and reviewer history.
