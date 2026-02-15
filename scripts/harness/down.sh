#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

stop_service() {
  local name="$1"
  local pid_file=".harness/pids/${name}.pid"

  if [[ ! -f "$pid_file" ]]; then
    echo "[INFO] $name is not running"
    return
  fi

  local pid
  pid="$(cat "$pid_file")"
  if kill -0 "$pid" >/dev/null 2>&1; then
    kill "$pid" >/dev/null 2>&1 || true
    sleep 1
    if kill -0 "$pid" >/dev/null 2>&1; then
      kill -9 "$pid" >/dev/null 2>&1 || true
    fi
    echo "[OK] Stopped $name (PID $pid)"
  fi

  rm -f "$pid_file"
}

stop_service backend
stop_service frontend

docker compose -f docker-compose.harness.yml down >/dev/null 2>&1 || true
docker compose -f backend/docker-compose.yml stop db >/dev/null 2>&1 || true

echo "[OK] Harness is down"
