# CAP Pattern Advisor MVP

Read-only pilot tooling for reviewing CAP Node.js patterns and reusable helper
opportunities. Nine catalog entries; scanner 1.1.0, catalog 0.4.0.

Download the pilot ZIP and matching SHA-256 file from Releases, verify integrity
under your organization's policy, and extract outside the CAP application checkout.
Node.js 22+ is required. From the extracted directory:

```sh
node --test tools/cap-pattern-scanner/scripts/scan.test.mjs tools/cap-pattern-scanner/helpers/index.test.js
node tools/cap-pattern-scanner/scripts/scan.mjs /path/to/cap-project srv db
```

The included `tools/cap-pattern-scanner/README.md` explains Windows VDI downloading,
scope selection, exit codes, fingerprints, and optional policy-approved AI review.
No npm install, EPAM Git access, BTP credentials, or customer code upload is needed.

Findings are review candidates, not automated fixes or security certification.
The npm helper remains experimental and unpublished. No production certification,
customer SSO verification, or open-source license grant is implied by this README.
Keep customer source, reports, and credentials out of this public repository.