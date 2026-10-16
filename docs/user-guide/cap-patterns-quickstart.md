# CAP Pattern Review 0.1.0

Pre-1.0 pilot for CAP Node.js. Review-only: no application edits, npm install,
service calls, or automatic helper adoption. Replace example paths with real ones.

## Local Scanner

Requires Node.js 22+. From the factory clone or extracted generic bundle:

```sh
node tools/cap-pattern-scanner/scripts/scan.mjs /actual/path/to/cap-app srv db
```

Select the application folder containing package.json and its @sap/cds dependency.
Default output is a compact candidate brief. Exit 0 means scope traversal completed,
2 means incomplete coverage with a report, and 1 means invalid input/fatal failure.
Findings are not confirmed defects. --full returns the complete inventory.

## AI Assistants

Python 3 is needed only on the factory side for packaging/adapter installation.
Choose ONE command to install into a new tooling folder outside application source:

```sh
python3 scripts/claude-code/adapter/install.py --project /new/tooling-folder --use-case CAP-AI-11
python3 scripts/github-copilot/adapter/install.py --project /new/tooling-folder --use-case CAP-AI-11
python3 scripts/cursor/adapter/install.py --project /new/tooling-folder --use-case CAP-AI-11
```

| Host | Open/start from the new tooling folder |
|---|---|
| Claude Code | Run claude; the agent/skill are registered under .claude. |
| GitHub Copilot | Open in VS Code and select cap-pattern-advisor. |
| Cursor | Open in Cursor and invoke the installed cap-pattern-advisor. |
| Other approved local assistant | Load the shared skill explicitly and use the same CLI/JSON contracts. |

Ask: "Use cap-pattern-advisor to review /actual/path/to/cap-app, srv and db.
No existing report. Review one query and one remote-error candidate first.
Do not modify application code."

The agent scans, reads bounded context, reviews applicability, and asks for an
approved local artifact folder before validating decisions. Approve tool/project
access only under customer policy. If a host cannot discover the agent, explicitly
load skills/cap-suggest-patterns/SKILL.md and give it the tool and project paths.
Adapters are structurally tested; live UI discovery/model behavior needs acceptance.
Do not install over existing client instructions blindly: generated entry files
can be overwritten. Browser-only assistants cannot directly scan local directories.

## Customer VDI Or Offline

Build on the factory machine, without committing or pushing first:

```sh
python3 scripts/package_client_artifacts.py --client-name cap-ai-11-0.1.0 --use-case CAP-AI-11 --out-dir /approved/delivery
```

Transfer only through an approved channel, verify the ZIP checksum, and extract
outside the customer repo. The generic ZIP runs the scanner directly; it does NOT
include factory installer scripts. For native discovery, generate the chosen host's
tooling folder above on the factory machine, then archive/transfer that folder.
Include hidden .claude/.cursor/.github/.agents folders in a host-specific archive.
No EPAM Git/SSO credentials are needed in VDI. Node.js 22+ is still required.
Windows example: node tools/cap-pattern-scanner/scripts/scan.mjs "C:\work\cap-app" srv db.
Use only the customer-approved AI account/model. Keep source, excerpts, and reports
inside the customer boundary; do not bypass blocked downloads or VDI controls.

## Saved Reviews

```sh
node tools/cap-pattern-scanner/scripts/scan.mjs --report /approved/scan.json
node tools/cap-pattern-scanner/scripts/scan.mjs /actual/path/to/cap-app --report /approved/brief.json --context FINDING_ID
node tools/cap-pattern-scanner/scripts/scan.mjs --report /approved/brief.json --decisions /approved/decisions.json
```

The agent normally runs these itself. Decision validation checks evidence
declarations/counts, not semantic truth or developer acceptance. Full contracts:
tools/cap-pattern-scanner/tool.md; architecture and release limits:
docs/adr/cap-ai-11-pattern-suggestions.md. The experimental npm helper is private.