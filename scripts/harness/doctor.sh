#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

required_commands=(node npm docker curl)
for cmd in "${required_commands[@]}"; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "[ERROR] Missing required command: $cmd"
    exit 1
  fi
done

NODE_VERSION_RAW="$(node -v 2>/dev/null || true)"
NODE_VERSION="${NODE_VERSION_RAW#v}"
NODE_MAJOR="${NODE_VERSION%%.*}"
MIN_NODE_MAJOR=20

if [[ -z "$NODE_MAJOR" || ! "$NODE_MAJOR" =~ ^[0-9]+$ ]]; then
  echo "[ERROR] Could not determine Node.js version (got: ${NODE_VERSION_RAW:-unknown})"
  exit 1
fi

if (( NODE_MAJOR < MIN_NODE_MAJOR )); then
  echo "[ERROR] Node.js >= ${MIN_NODE_MAJOR} is required for harness (current: ${NODE_VERSION_RAW})"
  echo "[INFO] If you use nvm: nvm install ${MIN_NODE_MAJOR} && nvm use ${MIN_NODE_MAJOR}"
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "[ERROR] Docker daemon is not running. Start Docker Desktop and retry."
  exit 1
fi

required_files=(.env backend/.env)
for file in "${required_files[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo "[ERROR] Missing required env file: $file"
    exit 1
  fi
done

FRONTEND_PORT="${FRONTEND_PORT:-5173}"
BACKEND_PORT="${BACKEND_PORT:-8000}"
GRAFANA_PORT="${GRAFANA_PORT:-3000}"
PROMETHEUS_PORT="${PROMETHEUS_PORT:-9090}"
LOKI_PORT="${LOKI_PORT:-3100}"

check_port_free() {
  local port="$1"
  local name="$2"

  if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    if [[ "${HARNESS_ALLOW_RUNNING_PORTS:-0}" == "1" ]]; then
      echo "[WARN] Port $port ($name) is already in use; assuming existing harness/local service"
      return
    fi
    echo "[ERROR] Port $port ($name) is already in use"
    lsof -nP -iTCP:"$port" -sTCP:LISTEN || true
    exit 1
  fi
}

check_port_free "$FRONTEND_PORT" "frontend"
check_port_free "$BACKEND_PORT" "backend"
check_port_free "$GRAFANA_PORT" "grafana"
check_port_free "$PROMETHEUS_PORT" "prometheus"
check_port_free "$LOKI_PORT" "loki"

echo "[OK] Harness doctor checks passed"
