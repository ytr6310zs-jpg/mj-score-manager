#!/usr/bin/env bash
# Loads DATABASE_URL from .env.local and passes it as argv to the Postgres MCP server.
# Cursor's ${env:VAR} / envFile do not inject .env.local into argv at parse time.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/mcp-load-env.sh"
load_env_local "$PROJECT_ROOT/.env.local"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set. Add a local/read-only postgres URL to .env.local." >&2
  exit 1
fi

exec npx -y @modelcontextprotocol/server-postgres "$DATABASE_URL" "$@"
