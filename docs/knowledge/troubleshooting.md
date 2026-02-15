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

## Observability Services Down
- Run: `docker compose -f docker-compose.harness.yml ps`
- Restart: `docker compose -f docker-compose.harness.yml up -d`

## Smoke Test Failures
- Ensure frontend and backend are running (`npm run harness:up`).
- Inspect `.harness/logs/*.log` and Grafana Loki explorer.
