# Troubleshooting

## Port Already In Use
- Run `npm run harness:doctor` to see conflicts.
- Stop local services or override ports in env variables.

## Database Unreachable
- Start DB: `cd backend && docker-compose up -d db`
- Check backend env `DATABASE_URL`.

## Backend Fails at Startup
- Run `cd backend && npm run type-check`.
- Verify `backend/.env` exists and has required keys.
- Verify Node.js version is 20+ (`node -v`).

## Harness Doctor Fails with Node Version Error
- `harness` requires Node.js 20+.
- If using nvm: `nvm install 20 && nvm use 20`.

## Observability Services Down
- Run: `docker compose -f docker-compose.harness.yml ps`
- Restart: `docker compose -f docker-compose.harness.yml up -d`

## Smoke Test Failures
- Ensure frontend and backend are running (`npm run harness:up`).
- Inspect `.harness/logs/*.log` and Grafana Loki explorer.

## SLA Check Failures
- Run `npm run harness:sla` to isolate latency/error failures.
- Tune thresholds only when justified:
  - `SLA_SAMPLE_SIZE`
  - `SLA_MAX_P95_MS`
  - `SLA_MAX_ERROR_RATE_PERCENT`
  - `SLA_TARGET_URL`

## E2E Smoke Failures
- If browser is missing, run `npx playwright install chromium`.
- Re-run `npm run harness:e2e` after confirming `harness:up` is healthy.
