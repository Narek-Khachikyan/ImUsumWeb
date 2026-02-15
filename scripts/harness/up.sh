#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

HARNESS_ALLOW_RUNNING_PORTS=1 bash scripts/harness/doctor.sh

set -a
# shellcheck disable=SC1091
source .env
set +a

HARNESS_LOG_DIR="${HARNESS_LOG_DIR:-.harness/logs}"
mkdir -p "$HARNESS_LOG_DIR" .harness/pids

FRONTEND_PORT="${FRONTEND_PORT:-5173}"
BACKEND_PORT="${BACKEND_PORT:-8000}"

docker compose -f backend/docker-compose.yml up -d db

run_backend_migrations() {
  if [[ "${HARNESS_SKIP_MIGRATIONS:-0}" == "1" ]]; then
    echo "[INFO] Skipping Prisma migrations (HARNESS_SKIP_MIGRATIONS=1)"
    return
  fi

  local attempts=20
  local delay_seconds=2
  local migrate_output=""

  echo "[INFO] Applying backend migrations"
  for _ in $(seq 1 "$attempts"); do
    if migrate_output="$(cd "$ROOT_DIR/backend" && npx prisma migrate deploy 2>&1)"; then
      echo "[OK] Backend migrations are up to date"
      return
    fi

    if grep -Eq 'P1001|ECONNREFUSED|database system is starting up|Can.t reach database server' <<<"$migrate_output"; then
      sleep "$delay_seconds"
      continue
    fi

    break
  done

  echo "[WARN] Prisma migrate deploy did not complete. Falling back to schema sync (prisma db push)."
  if (cd "$ROOT_DIR/backend" && npx prisma db push --accept-data-loss --skip-generate >/dev/null 2>&1); then
    echo "[OK] Backend schema synced via prisma db push"
    return
  fi

  if [[ -n "$migrate_output" ]]; then
    echo "$migrate_output"
  fi

  echo "[ERROR] Could not prepare backend database schema. Check backend/.env DATABASE_URL and DB status."
  return 1
}

run_backend_migrations

docker compose -f docker-compose.harness.yml up -d

start_service() {
  local name="$1"
  local command="$2"
  local pid_file=".harness/pids/${name}.pid"
  local log_file="$HARNESS_LOG_DIR/${name}.log"

  if [[ -f "$pid_file" ]]; then
    local old_pid
    old_pid="$(cat "$pid_file")"
    if kill -0 "$old_pid" >/dev/null 2>&1; then
      echo "[INFO] $name already running with PID $old_pid"
      return
    fi
  fi

  nohup bash -c "$command" >> "$log_file" 2>&1 &
  local pid=$!
  echo "$pid" > "$pid_file"
  echo "[OK] Started $name (PID $pid), logs -> $log_file"
}

start_service "backend" "cd '$ROOT_DIR/backend' && PORT=$BACKEND_PORT exec node --import tsx src/main.ts"
start_service "frontend" "cd '$ROOT_DIR' && exec node ./node_modules/vite/bin/vite.js --host 0.0.0.0 --port $FRONTEND_PORT"

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

if ! wait_http "http://localhost:${BACKEND_PORT}/health"; then
  echo "[ERROR] Backend health endpoint not ready"
  exit 1
fi

if ! wait_http "http://localhost:${FRONTEND_PORT}"; then
  echo "[ERROR] Frontend endpoint not ready"
  exit 1
fi

echo "[OK] Harness is up"
echo "Frontend: http://localhost:${FRONTEND_PORT}"
echo "Backend:  http://localhost:${BACKEND_PORT}"
echo "Grafana:  http://localhost:${GRAFANA_PORT:-3000}"
echo "Prom:     http://localhost:${PROMETHEUS_PORT:-9090}"
echo "Loki:     http://localhost:${LOKI_PORT:-3100}"
