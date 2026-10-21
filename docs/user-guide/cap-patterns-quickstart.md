# CAP Pattern Review — Quickstart

Pre-1.0 pilot for CAP Node.js projects. The agent handles everything; you only answer
approve / reject questions and push the final branch yourself.

## What You Need

- Node.js 22+ on the machine where Claude Code runs
- A CAP Node.js project with `@sap/cds` in its `package.json`
- The release ZIP extracted into a tooling folder **outside** your CAP project

## Step 1 — Set up the tooling folder (once per project)

The release ZIP (`client-artifacts-*.zip`) contains three folders: `agents/`, `skills/`,
and `tools/`. Extract it anywhere **outside** your CAP project. That is correct so far,
but Claude Code looks for agents and skills under `.claude/`, not under `agents/` and
`skills/`. You need to create that layout.

**Option A — preferred: run the adapter installer on the factory machine, then transfer**

```sh
# On the factory machine (has the factory repo)
python3 scripts/claude-code/adapter/install.py \
  --project /path/to/tooling-folder \
  --use-case CAP-AI-11

# Zip including hidden folders, then transfer to the customer environment
zip -r cap-ai-11-claude-code.zip /path/to/tooling-folder
```

Extract that zip in the customer environment. The `.claude/` folder inside it is what
Claude Code reads.

**Option B — if you only have the generic ZIP in the customer environment**

```sh
mkdir -p .claude/agents .claude/skills/cap-suggest-patterns
cp agents/cap-pattern-advisor/agent.md   .claude/agents/cap-pattern-advisor.md
cp skills/cap-suggest-patterns/SKILL.md  .claude/skills/cap-suggest-patterns/SKILL.md
```

Run these commands inside your extracted ZIP folder. The `tools/` folder stays as-is.

For GitHub Copilot or Cursor replace `claude-code` with `github-copilot` or `cursor` in
Option A, and copy to `.cursor/` or `.github/` respectively in Option B.

## Step 2 — Open Claude Code from that tooling folder

```sh
cd /path/to/tooling-folder
claude
```

The agent and skill register automatically under `.claude/`.

## Step 3 — Say one sentence

> "Use cap-pattern-advisor to review /path/to/cap-project, srv and db."

That is all. Claude takes it from there.

## What Claude Does (you watch and answer questions)

| What happens | What you do |
|---|---|
| Scans `srv/` and `db/` for antipattern signals | Nothing — Claude runs the scanner |
| Reads bounded source context around each finding | Nothing |
| Reviews applicability and writes a proposed diff | Nothing |
| Shows each diff one at a time, explains risk and uncertainty | Read it |
| Asks: **Approve / Reject / Request changes / Defer?** | Answer |
| Records your decision | Nothing |
| Asks once: run everything / apply only / stop | Answer |
| Applies approved diffs to an isolated workspace (your project untouched) | Nothing |
| Runs your test command, reports result | Read result |
| Offers to commit to a review branch | Say yes or no |
| Gives you the `git push` command | Run it yourself when ready |

You never type a `node` command. Claude runs the tool internally and shows you only the
decisions and results that require your input.

## If Something Goes Wrong

Tell Claude: "The session was interrupted" or "A command said the session is not trustworthy."
Claude will run a recovery preview, show you the output, and ask before doing anything.
Never edit files inside the session folder by hand.

## Offline / Customer Environment

Build the ZIP on the factory machine:

```sh
python3 scripts/package_client_artifacts.py \
  --client-name <name> --use-case CAP-AI-11 --out-dir /approved/delivery
```

Transfer through an approved channel, verify the checksum, extract outside the customer
repo. Node.js 22+ is still required in the customer environment. No EPAM credentials go
into the customer environment. Keep source, excerpts, and reports inside the customer
boundary.

## For GitHub Copilot or Cursor

```sh
python3 scripts/github-copilot/adapter/install.py --project /new/tooling-folder --use-case CAP-AI-11
python3 scripts/cursor/adapter/install.py          --project /new/tooling-folder --use-case CAP-AI-11
```

Open the tooling folder in VS Code / Cursor and select `cap-pattern-advisor`. The same
conversation flow applies. GitHub Copilot and Cursor have not been run live yet; only
Claude Code has a confirmed live session.

## Advanced: Run the Scanner by Hand (no agent)

Only needed for debugging or a custom automation:

```sh
# Scan
node tools/cap-pattern-scanner/scripts/scan.mjs /path/to/cap-project \
  --output /approved/brief.json

# Convert a saved raw report
node tools/cap-pattern-scanner/scripts/scan.mjs \
  --report /approved/raw.json --output /approved/brief.json

# Validate a decisions submission
node tools/cap-pattern-scanner/scripts/scan.mjs \
  /path/to/cap-project \
  --report /approved/brief.json \
  --decisions /approved/decisions.json \
  --output /approved/validated.json

# Run the tool's own tests (no project needed)
node --test tools/cap-pattern-scanner/scripts/scan.test.mjs \
             tools/cap-pattern-scanner/helpers/index.test.js
```

Exit 0 = complete scan. Exit 2 = incomplete coverage (check `coverage.skipped`). Exit 1 = bad input.

Full contracts: `tools/cap-pattern-scanner/tool.md`.
Architecture and release limits: `docs/adr/cap-ai-11-pattern-suggestions.md`.
The npm helper (`@epam/cap-pattern-helpers`) is optional, experimental, private, and
unpublished; it is never required.
