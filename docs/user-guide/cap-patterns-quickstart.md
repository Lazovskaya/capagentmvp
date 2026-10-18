# CAP Pattern Review 0.1.0

Pre-1.0 pilot for CAP Node.js. Review-only: no application edits, npm install,
service calls, or automatic helper adoption. Native SAP CAP is the default
recommendation; nothing here needs the optional, experimental helper package.
Replace example paths with real ones. For verified behavior and remaining gates see the
scanner README; for the synthetic evaluation see `tools/cap-pattern-scanner/fixtures/EVALUATION.md`.

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
Adapters are structurally tested only. A live session has been run on Claude Code with
synthetic fixtures; GitHub Copilot and Cursor have not been run live.
Do not install over existing client instructions: every adapter overwrites its generated
entry files, so use an empty tooling folder. Browser-only assistants cannot directly
scan local directories.

## Customer Environment Or Offline

Build on the factory machine, without committing or pushing first:

```sh
python3 scripts/package_client_artifacts.py --client-name cap-ai-11-0.1.0 --use-case CAP-AI-11 --out-dir /approved/delivery
```

Transfer only through an approved channel, verify the ZIP checksum, and extract
outside the customer repo. The generic ZIP runs the scanner directly; it does NOT
include factory installer scripts. For native discovery, generate the chosen host's
tooling folder above on the factory machine, then archive/transfer that folder.
Include hidden .claude/.cursor/.github/.agents folders in a host-specific archive.
No EPAM Git/SSO credentials are needed in the customer environment. Node.js 22+ is still required.
Windows example: node tools/cap-pattern-scanner/scripts/scan.mjs "C:\work\cap-app" srv db.
Use only the customer-approved AI account/model. Keep source, excerpts, and reports
inside the customer boundary; do not bypass blocked downloads or customer-environment controls.

## Saved Reviews

```sh
node tools/cap-pattern-scanner/scripts/scan.mjs --report /approved/scan.json
node tools/cap-pattern-scanner/scripts/scan.mjs /actual/path/to/cap-app --report /approved/brief.json --context FINDING_ID
node tools/cap-pattern-scanner/scripts/scan.mjs --report /approved/brief.json --decisions /approved/decisions.json
```

Add `--output /approved/<new-file>.json` to save the exact JSON printed (new file only;
existing files and paths inside the project are refused). The agent normally runs these
itself. Decision validation checks evidence declarations and counts, not semantic truth
or developer acceptance. Full contracts: tools/cap-pattern-scanner/tool.md;
architecture and release limits: docs/adr/cap-ai-11-pattern-suggestions.md. The npm
helper is optional, experimental, private, and unpublished; it is never required.
