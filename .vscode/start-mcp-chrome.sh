#!/usr/bin/env bash
# Resolves the correct Node version (from .nvmrc) before starting chrome-devtools-mcp.
# Works with nvm, fnm, or any Node install that satisfies the .nvmrc version.

set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Load nvm if present
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  # shellcheck source=/dev/null
  source "$HOME/.nvm/nvm.sh"
  nvm use --silent
fi

# Load fnm if present and nvm wasn't available
if ! command -v node &>/dev/null && command -v fnm &>/dev/null; then
  eval "$(fnm env)"
  fnm use --silent 2>/dev/null || true
fi

exec npx -y chrome-devtools-mcp "$@"
