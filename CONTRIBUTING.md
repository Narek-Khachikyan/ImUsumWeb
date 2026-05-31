# Contributing to ImUsumWeb

Thanks for your interest in improving ImUsumWeb. This project is a full-stack school-management platform with a React + TypeScript frontend and a Node.js + Fastify + Prisma backend.

## Before You Start

- Read `AGENTS.md` for repository-specific rules.
- Read the required context docs in `docs/knowledge/`.
- Use Node.js 20+.
- Keep Python/FastAPI references as legacy only; new backend work belongs in `backend/`.

## Local Setup

```bash
npm install
cd backend && npm install && cd ..
cp .env.example .env
cp backend/.env.example backend/.env
npx playwright install chromium
npm run harness:doctor
npm run harness:up
```

Useful local URLs:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000/api/v1`
- Backend health: `http://localhost:8000/health`
- Grafana: `http://localhost:3000`

Stop the local harness with:

```bash
npm run harness:down
```

## Development Rules

- Prefer frontend alias imports such as `@/...`.
- Keep backend route registration in `backend/src/routes/v1`.
- Keep backend business logic in `backend/src/services`.
- Document non-trivial architectural decisions in `PLANS.md` before implementation.
- Track non-trivial implementation plans in `docs/exec-plans/active`, then move validated plans to `docs/exec-plans/completed`.
- Add focused tests for behavior changes.

## Quality Gates

Run these before opening a pull request:

```bash
npm run check:all
cd backend && npm run check:guardrails && npm run test
npm run check:harness
```

If `check:harness` fails, inspect logs with:

```bash
npm run harness:logs
```

## Pull Requests

Please include:

- A short summary of the change.
- The user-facing or operational impact.
- Validation commands and results.
- Screenshots or short recordings for visible UI changes when practical.
- Any follow-up risks or intentionally deferred work.

## Reporting Bugs

Open an issue with:

- What you expected.
- What happened.
- Steps to reproduce.
- Relevant logs from `.harness/logs/` or `npm run harness:logs`.
- Browser, Node.js, and Docker versions when relevant.
