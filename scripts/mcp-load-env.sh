#!/usr/bin/env bash
# Portable loader for project .env.local (CRLF-safe on GNU and BSD).
# Usage: source this file, or: load_env_local "/path/to/.env.local"
load_env_local() {
  local env_file="${1:-}"
  if [[ -z "$env_file" || ! -f "$env_file" ]]; then
    return 0
  fi
  # tr -d '\r' strips CR on both GNU and BSD; sed 's/\r$//' is GNU-only
  # (BSD sed treats \r as a literal trailing "r").
  set -a
  # shellcheck disable=SC1090
  source <(tr -d '\r' < "$env_file")
  set +a
}
