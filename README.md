# CAP Pattern Advisor MVP

Read-only pilot tooling for reviewing CAP Node.js patterns and reusable helper
opportunities. Nine catalog entries; scanner 2.0.0, catalog 0.4.0.

## Downloads

- [Claude-ready ZIP](https://github.com/Lazovskaya/capagentmvp/releases/download/cap-ai-11-pilot-v2.0.0/client-artifacts-cap-ai-11-claude-code.zip)
- [Claude ZIP checksum](https://github.com/Lazovskaya/capagentmvp/releases/download/cap-ai-11-pilot-v2.0.0/client-artifacts-cap-ai-11-claude-code.zip.sha256)
- [Generic ZIP and release notes](https://github.com/Lazovskaya/capagentmvp/releases/tag/cap-ai-11-pilot-v2.0.0)

## Claude Code

Extract the Claude-ready ZIP outside the customer repository, verify its checksum
and review/trust it under customer policy, then run `claude` from its extracted root.
The agent and skill are registered under `.claude/`; customer project files are not
modified. Ask:

> Use cap-pattern-advisor to review C:\work\your-cap-app with the existing report
> at C:\work\your-scan-report.json. Review one query and one remote-error candidate first.

Use actual paths. Saved reports are filtered/grouped deterministically by the tool;
no manual JSON filtering or corrective extraction prompts are needed. The review
still depends on model behavior and must be checked by a developer.

## Scanner

Download the pilot ZIP and matching SHA-256 file from Releases, verify integrity
under your organization's policy, and extract outside the CAP application checkout.
Node.js 22+ is required. From the extracted directory:

```sh
node --test tools/cap-pattern-scanner/scripts/scan.test.mjs tools/cap-pattern-scanner/helpers/index.test.js
node tools/cap-pattern-scanner/scripts/scan.mjs /path/to/cap-project srv db
```

Default JSON is a compact candidate brief with shared pattern guidance, groups,
fingerprints, and progress. Use `--full` for the complete inventory or
`node tools/cap-pattern-scanner/scripts/scan.mjs --report /path/to/report.json`
to compact an existing report locally without rescanning.

The included `tools/cap-pattern-scanner/README.md` explains Windows VDI downloading,
scope selection, exit codes, fingerprints, and optional policy-approved AI review.
No npm install, EPAM Git access, BTP credentials, or customer code upload is needed.

Findings are review candidates, not automated fixes or security certification.
The npm helper remains experimental and unpublished. No production certification,
customer SSO verification, or open-source license grant is implied by this README.
Keep customer source, reports, and credentials out of this public repository.