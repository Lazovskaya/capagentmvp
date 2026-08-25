# Connector: signavio

**Pattern:** `script` — direct HTTP, called by Python tools. No MCP server exists for
Signavio's basic-auth API; runtime access from a skill would require an MCP wrapper not yet built.

**Status:** Progress. Script integration confirmed against a real Signavio Process Manager tenant
(2026-08-24). Three tools use this connector: `enrich_sap_best_practices_signavio.py`,
`fetch_bpmn_signavio.py`, `test_signavio_bpmn_download.py`.

## Authentication

Signavio Process Manager uses a **plain username/password login** against its `/p/login`
endpoint — no OAuth2, no service keys, no API tokens. SAP has not exposed an alternative
auth mechanism for this product (distinct from SAP Signavio Process Explorer / Process Navigator,
which is read-only and unauthenticated).

```
POST /p/login
Content-Type: application/x-www-form-urlencoded
Body: name=<email>&password=<password>&tenant=<tenant_id>&token=
```

A successful login returns a `JSESSIONID` cookie and a `x-signavio-id` token used for all
subsequent requests. The Python tools manage this session automatically.

Use a **dedicated technical/integration user** — not a personal account. A personal account
login from an automated script may trigger Signavio's suspicious-login detection and lock the
account.

## Credential setup

1. Copy `.env.example` to `~/.config/signavio/sessions/<destination>.env`
   (any name for `<destination>`, e.g. `default`, `client-acme-dev`).
2. Fill in the four variables (see `.env.example`).
3. Pass the path to the tool via `--env-file`:

```bash
python3 tools/enrich_sap_best_practices_signavio.py \
    --env-file ~/.config/signavio/sessions/default.env \
    --limit 20
```

Never commit a filled-in `.env` file. The `.env.example` in this directory is the only
credential-related file committed to the repo.

## Available operations (confirmed 2026-08-24)

| Operation | Endpoint | Used by |
|---|---|---|
| Login / session | `POST /p/login` | All tools |
| List workspace directories | `POST /p/directory` | Folder navigation |
| List models in directory | `POST /p/model/info` (bulk) | Scope-item discovery |
| Get model info + `linkedBy` | `GET /p/model/{id}/info` → revision → `linkedBy` | L2 enrichment (`enrich_sap_best_practices_signavio.py`) |
| Download BPMN 2.0 XML | `GET /p/model/{id}/bpmn2_0_xml` | BPMN parse (`fetch_bpmn_signavio.py`) |

The `linkedBy` reverse-reference (which diagrams call a given model as a subprocess) is the key
data source for L2 process-group enrichment of the SAP Best Practices taxonomy.

## Tenant structure (confirmed)

The `Shared documents` folder mixes client-engagement content with a read-only
`Copy from SAP Signavio Process Explorer` folder. Only the latter's
`SAP Product Portfolio / SAP S/4HANA / Solution Process` subtree contains authoritative,
unmodified SAP content: **602 scope-item folders**, each named `"<title> (<CODE>)"`.

**Never touch the client-engagement folders** (Syngenta, ARBA, ACINO, Medartis_Demo, etc.)
or any company-code-scoped content outside the SAP-delivered subtree.

## Rate limiting and etiquette

- The tools use sequential requests with no explicit rate limiting. For the full ~602-item
  enrichment run (~1200+ requests), this takes several minutes and is well within normal
  interactive use.
- Do not parallelise requests aggressively — Signavio's API is not a public-scale service.
- `--skip-existing` flag in `fetch_bpmn_signavio.py` avoids re-fetching already-downloaded
  models; always use it for incremental runs.

## Error handling

| HTTP status | Meaning | Action |
|---|---|---|
| `401` / session cookie missing | Session expired or login failed | Re-run — the tools re-login automatically on each invocation |
| `404` on a model ID | Model deleted or moved in Signavio | Log and skip; update `scope-items/<CODE>.json` if `signavio_model_id` is stale |
| `500` on specific models | Known Signavio server-side issue for `4RF`, `6NL` | Skip; nothing the client can do |
| `403` | Account lacks access to the folder | Check technical-user permissions in Signavio admin |

## Used by

- `tools/enrich_sap_best_practices_signavio.py` — L2 process-group enrichment via `linkedBy`
- `tools/fetch_bpmn_signavio.py` — BPMN 2.0 XML download and process-step parsing
- `tools/test_signavio_bpmn_download.py` — smoke-test / single-item verification

## Governance contract

```yaml
pattern: script
data_classification:
  input: internal (SAP reference data, not client data)
  output: internal (scope-item JSON cache, committed to repo)
  credentials: restricted (never commit filled-in .env)
default_mode: read-only
allowed_operations: [login, list-directories, list-models, get-model-info, get-linkedby, download-bpmn-xml]
forbidden_operations: [create-model, update-model, delete-model, modify-workspace]
write_controls: none (all operations are read-only)
```

Client-engagement content in the same Signavio tenant is client-confidential.
Never read, copy, or reference it from these tools — only the SAP-delivered
`Copy from SAP Signavio Process Explorer` subtree is in scope.
