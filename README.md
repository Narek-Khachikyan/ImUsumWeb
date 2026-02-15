# ImUsumWeb

React + TypeScript frontend with a Node/Fastify + Prisma backend.

## Quick Start (Harness)

Prerequisites:
- Node.js 20+
- Docker Desktop

1. Install dependencies:
```bash
npm install
cd backend && npm install && cd ..
```

2. Prepare env files:
```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Optional first-time browser install for e2e smoke:
```bash
npx playwright install chromium
```

3. Bootstrap local environment:
```bash
npm run harness:doctor
npm run harness:up
npm run harness:smoke
npm run harness:sla
npm run harness:e2e
```

`harness:up` now applies Prisma migrations automatically (set `HARNESS_SKIP_MIGRATIONS=1` to skip).

4. Open services:
- Frontend: `http://localhost:5173`
- API: `http://localhost:8000/api/v1`
- Grafana: `http://localhost:3000`
- Prometheus: `http://localhost:9090`
- Loki: `http://localhost:3100`

5. Stop environment:
```bash
npm run harness:down
```

## Quality Commands
- `npm run check:all`
- `cd backend && npm run check:guardrails && npm run test`
- `npm run check:harness`

## Key Docs
- `docs/knowledge/system-overview.md`
- `docs/knowledge/frontend-architecture.md`
- `docs/knowledge/backend-architecture.md`
- `docs/knowledge/runbooks.md`
- `docs/knowledge/troubleshooting.md`
- `docs/knowledge/feedback-loop.md`
- `PLANS.md`
