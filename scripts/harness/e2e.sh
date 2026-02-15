#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

if ! node -e "require.resolve('@playwright/test/package.json')" >/dev/null 2>&1; then
  echo "[ERROR] Missing @playwright/test dependency"
  echo "[INFO] Run: npm install -D @playwright/test"
  exit 1
fi

if ! npx playwright test --config=playwright.config.ts --project=chromium; then
  echo "[ERROR] Playwright e2e smoke checks failed"
  echo "[INFO] If Chromium is missing, run: npx playwright install chromium"
  exit 1
fi

echo "[OK] Playwright e2e smoke checks passed"
