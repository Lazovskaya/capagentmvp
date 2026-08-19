# Pilot infrastructure & client context (P4)

**Backlog ID:** P4 (Platform MVP track) — [EPMCSAPAI-294](https://jiraeu.epam.com/browse/EPMCSAPAI-294)

## What this is

A structured, secret-free description of a pilot engagement's target SAP landscape and client
identifiers, defined so the Unpack step (P5) and the Transcription connector (T3) have a single
typed parameter source instead of ad-hoc environment lookups. This directory ships the **schema**
and a **redacted example** — never a real, filled-in context file.

- [`schema.json`](schema.json) — JSON Schema (draft-07) for the context document.
- [`context.example.json`](context.example.json) — a fully redacted instance, validates against
  the schema, safe to commit and copy as a starting point.

## Why credentials never appear here

Every field that would otherwise hold a secret (`credentialRef`, the BTP service-key reference)
holds only the *name* of an environment variable or secret-manager key, never a literal value. The
schema enforces this shape (`credentialRef` rejects anything that looks like a URL or a base64-ish
blob) but a schema check is a backstop, not the control — the actual control is: **a filled-in
pilot context file is never committed.** Add every real `<engagement>.context.json` to
`.gitignore` the same way `workspace/` is already excluded for per-engagement skill outputs.

This follows the credential pattern already established for connectors in this repo (see
`CLAUDE.md`'s connector section, and `abap-mcp`/`jira`): real secrets live in a file outside the
project directory, loaded by a small launcher — never inline in a committed config, and never an
OS-specific store like macOS Keychain (breaks the cross-platform contract this factory targets:
Claude Code, Cursor, GitHub Copilot on whatever OS the consultant runs).

## Secure storage & injection

1. **Where real values live.** Store the actual credentials outside the project directory, e.g.
   `~/.config/sap-ai-factory/pilot-contexts/<engagementId>.env` (or your org's secret manager if
   one is available — HashiCorp Vault, a cloud provider's secret store, etc.). One env var per
   `credentialRef` named in the context file, e.g.:
   ```
   SAP_AI_FACTORY_PILOT_DR1_CREDENTIAL=<real basic-auth token>
   SAP_AI_FACTORY_PILOT_QA1_CREDENTIAL=<real basic-auth token>
   SAP_AI_FACTORY_PILOT_BTP_SERVICE_KEY=<real BTP service key JSON, single-line>
   ```
2. **How Unpack (P5) resolves them.** P5 reads the committed `<engagement>.context.json` (validated
   against `schema.json`) for shape/topology, then resolves each `credentialRef` from the
   environment at run time — the two never merge into one file on disk.
3. **What must never happen.**
   - No `credentialRef` value is ever a literal secret — enforced by schema pattern, verified again
     by human review before a pilot context file is added anywhere outside `.gitignore`.
   - No filled `*.context.json` (as opposed to `context.example.json`) is committed.
   - No OS-specific secret store — this must work identically for a consultant on macOS, Linux, or
     Windows.
4. **Verification before calling P4 done.** Confirm with `git status` that a real, filled context
   file for an actual pilot does not appear as tracked or staged — if one needs to exist locally
   for testing, it must match a `.gitignore` pattern first (see below).

## Using this for a new pilot

1. Copy `context.example.json` to a working file, e.g. `pilot-<engagementId>.context.json`.
2. Fill in real `systemId`/`host`/`client`/`ports` — these are topology, not secrets, so they're
   fine to keep in a tracked file once redacted of anything client-identifying beyond the code name.
3. For every `credentialRef`, choose an env var name (convention:
   `SAP_AI_FACTORY_PILOT_<SYSTEMID>_CREDENTIAL`) and set the real value only in the out-of-repo
   `.env` described above — never in the working file itself.
4. Validate the working file against `schema.json` before handing it to P5.

## Status

Schema and example are defined and validated (`jsonschema.validate` passes). Not yet wired into an
actual Unpack step implementation — P5 ([EPMCSAPAI-295](https://jiraeu.epam.com/browse/EPMCSAPAI-295))
is still Open and depends on this ticket plus P1/P3. This directory is P4's deliverable in full;
P5 is the next unblocked step in the platform chain once P1/P3 land.
