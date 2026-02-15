#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

cleanup() {
  npm run harness:down >/dev/null 2>&1 || true
}

trap cleanup EXIT

npm run harness:doctor
npm run harness:up
npm run harness:smoke
npm run harness:sla
npm run harness:e2e

echo "[OK] Full harness checks passed"
