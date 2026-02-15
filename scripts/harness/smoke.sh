#!/usr/bin/env bash
set -euo pipefail

FRONTEND_PORT="${FRONTEND_PORT:-5173}"
BACKEND_PORT="${BACKEND_PORT:-8000}"

wait_http() {
  local url="$1"
  local attempts=40
  for _ in $(seq 1 "$attempts"); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  return 1
}

echo "[INFO] Smoke: frontend"
wait_http "http://localhost:${FRONTEND_PORT}"

echo "[INFO] Smoke: backend root"
wait_http "http://localhost:${BACKEND_PORT}/"

echo "[INFO] Smoke: backend health"
curl -fsS "http://localhost:${BACKEND_PORT}/health" | grep -q 'healthy'

echo "[INFO] Smoke: backend API"
api_status="$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:${BACKEND_PORT}/api/v1")"
if [[ "$api_status" == "000" || "$api_status" -ge 500 ]]; then
  echo "[ERROR] API prefix check failed with status: $api_status"
  exit 1
fi

echo "[INFO] Smoke: metrics"
curl -fsS "http://localhost:${BACKEND_PORT}/metrics" >/dev/null

echo "[OK] Smoke checks passed"
