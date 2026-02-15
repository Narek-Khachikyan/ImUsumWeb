# ImUsumWeb Agent Guide

## Table of Contents
- [Source of Truth](#source-of-truth)
- [Required Context Docs](#required-context-docs)
- [Harness Commands](#harness-commands)
- [Quality Gates](#quality-gates)
- [Execution Rules](#execution-rules)

## Source of Truth
- Frontend: React + TypeScript in `src/`.
- Backend: Node.js + Fastify + Prisma in `backend/`.
- Python/FastAPI references are legacy and must not be used for new changes.

## Required Context Docs
- `docs/knowledge/system-overview.md`
- `docs/knowledge/frontend-architecture.md`
- `docs/knowledge/backend-architecture.md`
- `docs/knowledge/runbooks.md`
- `docs/knowledge/troubleshooting.md`
- `docs/knowledge/feedback-loop.md`
- `PLANS.md`

## Harness Commands
Run from repo root unless stated otherwise.
- `npm run harness:doctor`
- `npm run harness:up`
- `npm run harness:smoke`
- `npm run harness:logs`
- `npm run harness:down`

## Quality Gates
- `npm run check:all`
- `cd backend && npm run check:guardrails && npm run test`

## Execution Rules
- Prefer alias imports (`@/...`) over deep relative imports in frontend.
- Keep backend route registration in `backend/src/routes/v1`.
- Keep backend business logic in `backend/src/services`.
- Document non-trivial architectural decisions in `PLANS.md` before implementation.
