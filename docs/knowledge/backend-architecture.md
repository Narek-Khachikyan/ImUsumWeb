# Backend Architecture

## Stack
- Fastify HTTP server (`backend/src/app.ts`, `backend/src/main.ts`)
- Prisma ORM (`backend/prisma/schema.prisma`)
- PostgreSQL database

## Module Boundaries
- `src/routes/v1`: HTTP layer, request parsing, response shaping.
- `src/services`: business/domain logic.
- `src/lib`: reusable primitives (auth, errors, serializers, etc).
- `src/config`: env loading and typed config.

## API Surface
- Versioned API prefix from `API_V1_PREFIX` (default `/api/v1`).
- Infra endpoints:
  - `GET /`
  - `GET /health`
  - `GET /metrics`

## Operational Notes
- Keep route handlers thin; move domain logic to services.
- Add tests for each new endpoint and error path.
