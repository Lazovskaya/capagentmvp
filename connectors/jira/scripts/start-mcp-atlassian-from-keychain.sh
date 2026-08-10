#!/usr/bin/env bash
set -euo pipefail

# Jira-only launcher for the project MCP config. Credentials stay in macOS
# Keychain and are never written to this repository or MCP configuration.
UVX_CMD="${UVX_CMD:-uvx}"
SECURITY_CMD="${SECURITY_CMD:-security}"

for command_name in "$SECURITY_CMD" "$UVX_CMD"; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "$command_name is required but was not found in PATH" >&2
    exit 1
  fi
done

JIRA_URL="${JIRA_URL:-https://jiraeu.epam.com/}"
KEYCHAIN_SERVICE="${KEYCHAIN_SERVICE:-mcp-atlassian}"
JIRA_USERNAME_ACCOUNT="${JIRA_USERNAME_ACCOUNT:-JIRAEU_USERNAME}"
JIRA_API_TOKEN_ACCOUNT="${JIRA_API_TOKEN_ACCOUNT:-JIRAEU_API_TOKEN}"

read_keychain_secret() {
  "$SECURITY_CMD" find-generic-password \
    -s "$KEYCHAIN_SERVICE" \
    -a "$1" \
    -w 2>/dev/null || true
}

JIRA_USERNAME="$(read_keychain_secret "$JIRA_USERNAME_ACCOUNT")"
JIRA_API_TOKEN="$(read_keychain_secret "$JIRA_API_TOKEN_ACCOUNT")"

# Backward-compatible account names used by the earlier connector.
if [[ -z "$JIRA_USERNAME" ]]; then
  JIRA_USERNAME="$(read_keychain_secret JIRA_USERNAME)"
fi
if [[ -z "$JIRA_API_TOKEN" ]]; then
  JIRA_API_TOKEN="$(read_keychain_secret JIRA_API_TOKEN)"
fi

if [[ -z "$JIRA_USERNAME" || -z "$JIRA_API_TOKEN" ]]; then
  echo "Jira credentials are missing in macOS Keychain service '$KEYCHAIN_SERVICE'." >&2
  echo "Expected accounts: $JIRA_USERNAME_ACCOUNT and $JIRA_API_TOKEN_ACCOUNT." >&2
  exit 1
fi

export JIRA_URL JIRA_USERNAME JIRA_API_TOKEN

exec "$UVX_CMD" mcp-atlassian
