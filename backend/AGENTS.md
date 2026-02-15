# Backend Agent Guide (Node/Fastify)

## Stack
- Runtime: Node.js 20+
- Framework: Fastify + TypeScript
- ORM: Prisma
- Tests: Vitest (`backend/test`)

## Directory Rules
- API routes: `src/routes/v1/*.ts`
- Route aggregator: `src/routes/v1/index.ts`
- Domain/business logic: `src/services/*.ts`
- Shared libraries: `src/lib/*.ts`
- Config: `src/config/*.ts`
- Prisma schema/migrations: `prisma/`

## Must-Read Context
- `../docs/knowledge/system-overview.md`
- `../docs/knowledge/backend-architecture.md`
- `../docs/knowledge/runbooks.md`
- `../docs/knowledge/troubleshooting.md`
- `../docs/knowledge/feedback-loop.md`
- `../docs/exec-plans/index.md`
- `../PLANS.md`

## Commands
Run from `backend/`.
- `npm run dev`
- `npm run test`
- `npm run lint`
- `npm run type-check`
- `npm run check:guardrails`
- `npm run smoke`

## Guardrails
- New endpoints must be mounted through `src/routes/v1/index.ts`.
- Cross-module business logic belongs in `src/services`, not inside route handlers.
- Keep API behavior documented in `README.md` when adding modules.
