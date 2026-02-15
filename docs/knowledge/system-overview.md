# System Overview

ImUsumWeb is a two-app repository:
- Frontend app at repo root (`src/`) served by Vite.
- Backend API in `backend/` served by Fastify and connected to PostgreSQL via Prisma.

## Runtime Topology
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000/api/v1`
- Backend health: `http://localhost:8000/health`
- Database: PostgreSQL on `localhost:5432`
- Observability (harness):
  - Grafana: `http://localhost:3000`
  - Prometheus: `http://localhost:9090`
  - Loki: `http://localhost:3100`

## Data Flow
1. Frontend calls backend endpoints under `/api/v1`.
2. Backend authenticates and validates requests.
3. Backend reads/writes PostgreSQL through Prisma.
4. Backend and frontend logs are written to `/.harness/logs` for local observability.
