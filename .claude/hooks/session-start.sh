#!/usr/bin/env bash
# PANGU SessionStart hook — make the gates runnable in a fresh (web) container
# and activate the committed git pre-commit gate.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

if [ ! -d node_modules ]; then
  echo "PANGU: installing dependencies…"
  npm ci || npm install
fi

git config core.hooksPath .githooks

echo "PANGU session ready — deps present, git hooks → .githooks (pre-commit runs npm run check:all)."
