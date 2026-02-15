# ImUsum Backend (Node.js)

Fastify + TypeScript + Prisma backend for the ImUsum educational platform.

## Prerequisites
- Node.js 20+
- Docker Desktop (recommended for PostgreSQL)

## Standalone Backend Setup
Run from `backend/`.

1. Install dependencies:
```bash
npm install
```

2. Configure env:
```bash
cp .env.example .env
```

3. Start DB:
```bash
docker-compose up -d db
```

4. Generate Prisma client:
```bash
npm run prisma:generate
```

5. Optional deterministic seed:
```bash
npm run db:reset:seed
```

6. Start API:
```bash
npm run dev
```

## Harness Integration (Preferred from Repo Root)
Use unified harness commands from the root workspace:

```bash
npm run harness:doctor
npm run harness:up
npm run harness:smoke
npm run harness:sla
npm run harness:e2e
```

This starts:
- backend API (`http://localhost:8000`)
- PostgreSQL
- Grafana/Loki/Prometheus for local observability

## Important Endpoints
- Root: `GET /`
- Health: `GET /health`
- Metrics: `GET /metrics`
- API prefix: `/api/v1`

## Quality Commands
From `backend/`:
- `npm run lint`
- `npm run type-check`
- `npm run check:guardrails`
- `npm run test`
- `npm run smoke`

## Database & Prisma Helpers
- `npm run db:up`
- `npm run db:down`
- `npm run prisma:generate`
- `npm run prisma:pull`
- `npm run prisma:seed`
- `npm run db:reset:seed`
- `npm run prisma:diff`
