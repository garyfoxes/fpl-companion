#!/usr/bin/env bash
# Resolves the correct Node version (from .nvmrc) before starting @playwright/mcp.
# Works with nvm, fnm, or any Node install that satisfies the .nvmrc version.
# Fails fast with a clear message if the required version cannot be activated.

set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Always operate from the repo root so nvm use / fnm use pick up .nvmrc
cd "$REPO_ROOT"

# Load nvm if present and activate the .nvmrc version
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  # shellcheck source=/dev/null
  source "$HOME/.nvm/nvm.sh"
  nvm use --silent
# Otherwise try fnm (runs regardless of whether node is already on PATH)
elif command -v fnm &>/dev/null; then
  eval "$(fnm env)"
  fnm use 2>/dev/null || fnm install
fi

# Validate the active Node version satisfies .nvmrc (>= required); fail fast with a clear message
REQUIRED="$(cat .nvmrc | tr -d '[:space:]')"
ACTIVE="$(node --version 2>/dev/null | tr -d 'v[:space:]')"

# semver_gte: returns 0 if $1 >= $2, 1 otherwise
semver_gte() {
  [ "$(printf '%s\n' "$2" "$1" | sort -V | head -n1)" = "$2" ]
}

if [ -z "$ACTIVE" ] || ! semver_gte "$ACTIVE" "$REQUIRED"; then
  echo "ERROR: @playwright/mcp requires Node >= $REQUIRED but found ${ACTIVE:-none}." >&2
  echo "Run 'nvm install' or 'fnm install' from the repo root, then retry." >&2
  exit 1
fi

exec npx -y @playwright/mcp "$@"
