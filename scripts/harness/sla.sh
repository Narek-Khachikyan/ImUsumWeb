#!/usr/bin/env bash
set -euo pipefail

BACKEND_PORT="${BACKEND_PORT:-8000}"
SLA_SAMPLE_SIZE="${SLA_SAMPLE_SIZE:-20}"
SLA_MAX_P95_MS="${SLA_MAX_P95_MS:-800}"
SLA_MAX_ERROR_RATE_PERCENT="${SLA_MAX_ERROR_RATE_PERCENT:-0}"
SLA_TARGET_URL="${SLA_TARGET_URL:-http://localhost:${BACKEND_PORT}/health}"

if ! [[ "$SLA_SAMPLE_SIZE" =~ ^[0-9]+$ ]] || (( SLA_SAMPLE_SIZE <= 0 )); then
  echo "[ERROR] SLA_SAMPLE_SIZE must be a positive integer (current: $SLA_SAMPLE_SIZE)"
  exit 1
fi

ms_samples=()
error_count=0

for _ in $(seq 1 "$SLA_SAMPLE_SIZE"); do
  read -r http_code time_total < <(curl -s -o /dev/null -w "%{http_code} %{time_total}\n" "$SLA_TARGET_URL")

  sample_ms="$(awk -v t="$time_total" 'BEGIN { printf "%.3f", t * 1000 }')"
  ms_samples+=("$sample_ms")

  if [[ ! "$http_code" =~ ^2[0-9][0-9]$ ]]; then
    error_count=$((error_count + 1))
  fi
done

sorted_samples="$(printf "%s\n" "${ms_samples[@]}" | sort -n)"
p95_index=$(( (SLA_SAMPLE_SIZE * 95 + 99) / 100 ))
if (( p95_index < 1 )); then
  p95_index=1
fi

p95_ms="$(printf "%s\n" "$sorted_samples" | sed -n "${p95_index}p")"
avg_ms="$(awk '{ sum += $1 } END { if (NR == 0) { print "0.000" } else { printf "%.3f", sum / NR } }' <<<"$sorted_samples")"
error_rate_percent="$(awk -v e="$error_count" -v n="$SLA_SAMPLE_SIZE" 'BEGIN { printf "%.2f", (e * 100) / n }')"

echo "[INFO] SLA target: $SLA_TARGET_URL"
echo "[INFO] Samples: $SLA_SAMPLE_SIZE"
echo "[INFO] Avg latency: ${avg_ms}ms"
echo "[INFO] p95 latency: ${p95_ms}ms (max ${SLA_MAX_P95_MS}ms)"
echo "[INFO] Error rate: ${error_rate_percent}% (max ${SLA_MAX_ERROR_RATE_PERCENT}%)"

p95_ok="$(awk -v p95="$p95_ms" -v max="$SLA_MAX_P95_MS" 'BEGIN { print (p95 <= max) ? "1" : "0" }')"
error_ok="$(awk -v err="$error_rate_percent" -v max="$SLA_MAX_ERROR_RATE_PERCENT" 'BEGIN { print (err <= max) ? "1" : "0" }')"

if [[ "$p95_ok" != "1" || "$error_ok" != "1" ]]; then
  echo "[ERROR] SLA checks failed"
  exit 1
fi

echo "[OK] SLA checks passed"
