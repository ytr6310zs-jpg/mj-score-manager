#!/usr/bin/env bash
# Loads GITHUB_TOKEN from .env.local before starting the GitHub MCP server.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/mcp-load-env.sh"
load_env_local "$PROJECT_ROOT/.env.local"

if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  echo "GITHUB_TOKEN is not set. Add it to .env.local or export it in your environment." >&2
  exit 1
fi

export GITHUB_PERSONAL_ACCESS_TOKEN="$GITHUB_TOKEN"
exec npx -y @modelcontextprotocol/server-github "$@"
