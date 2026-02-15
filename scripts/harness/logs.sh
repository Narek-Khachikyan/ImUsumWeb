#!/usr/bin/env bash
set -euo pipefail

LOG_DIR="${HARNESS_LOG_DIR:-.harness/logs}"
mkdir -p "$LOG_DIR"

touch "$LOG_DIR/frontend.log" "$LOG_DIR/backend.log"
tail -n 120 -f "$LOG_DIR/frontend.log" "$LOG_DIR/backend.log"
