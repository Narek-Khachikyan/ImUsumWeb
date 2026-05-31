# ImUsumWeb

ImUsumWeb is an open-source school-management platform for students, teachers, and school leaders. It combines a React dashboard with a Fastify + Prisma API so schools can manage learning workflows, communication, attendance, rewards, jobs, and AI-assisted teaching tools from one place.

## Who It Helps

- Students who need one home for schedules, assignments, tests, grades, recommendations, offers, jobs, and communication.
- Teachers who need faster workflows for assignments, tests, attendance, grading, and targeted class or student support.
- Directors and administrators who need visibility into users, schedules, learning materials, announcements, and school operations.
- Contributors who want a practical full-stack education product with clear local harnesses and test gates.

## Features

- Role-aware dashboard for students, teachers, directors, and admins.
- Authentication, registration, password reset, and token refresh handling.
- Assignments with class, group, and individual-student targeting.
- Tests with question/option management, attempts, scoring, and recommendation payloads.
- Grades, schedules, attendance, chat, user management, and student home data.
- Offers, purchases, QR redemption, rewards, and job opportunities for top students.
- Learning materials and blog/news modules for school resources.
- AI-assisted workflows for test drafts, recommendations, and schedule optimization drafts with human confirmation.
- Local observability harness with Grafana, Prometheus, Loki, smoke checks, SLA checks, and Playwright e2e checks.

## Screenshots And Demo

Committed screenshots are not included yet. You can run the local harness and capture the live product from:

- Frontend: `http://localhost:5173`
- API: `http://localhost:8000/api/v1`
- Grafana: `http://localhost:3000`

When adding UI changes, please include screenshots or a short recording in the pull request whenever practical.

## Tech Stack

- Frontend: React 18, TypeScript, Vite, Redux Toolkit, React Router, Tailwind CSS, Vitest, Testing Library.
- Backend: Node.js, Fastify, Prisma, PostgreSQL, JWT auth, Vitest.
- Harness: Docker Compose, Playwright, Prometheus, Loki, Grafana, shell-based smoke/SLA/e2e commands.

Python/FastAPI references in this repository are legacy references and are not used for new changes.

## Local Setup

Prerequisites:

- Node.js 20+
- Docker Desktop

Install dependencies:

```bash
npm install
cd backend && npm install && cd ..
```

Prepare environment files:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Install the browser used by e2e smoke checks:

```bash
npx playwright install chromium
```

Start and verify the local harness:

```bash
npm run harness:doctor
npm run harness:up
npm run harness:smoke
npm run harness:sla
npm run harness:e2e
```

Stop the harness:

```bash
npm run harness:down
```

`harness:up` applies backend Prisma migrations automatically. For local recovery only, set `HARNESS_ALLOW_DB_PUSH_FALLBACK=1` to permit a Prisma `db push` fallback when migrations fail.

## Quality Gates

Run these before merging:

```bash
npm run check:all
cd backend && npm run check:guardrails && npm run test
npm run check:harness
```

If the harness fails, inspect logs:

```bash
npm run harness:logs
```

## Architecture

ImUsumWeb is a two-app repository:

- `src/`: React + TypeScript frontend served by Vite.
- `backend/`: Fastify API connected to PostgreSQL through Prisma.
- `backend/src/routes/v1`: versioned route modules.
- `backend/src/services`: shared backend business logic.
- `docs/knowledge`: system, frontend, backend, runbook, troubleshooting, and feedback-loop documentation.
- `docs/exec-plans`: active and completed implementation plans.
- `scripts/harness`: local environment, smoke, SLA, e2e, log, and teardown scripts.

Runtime defaults:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000/api/v1`
- Backend health: `http://localhost:8000/health`
- PostgreSQL: `localhost:5432`
- Grafana: `http://localhost:3000`
- Prometheus: `http://localhost:9090`
- Loki: `http://localhost:3100`

## Contributing

Start with:

- `CONTRIBUTING.md`
- `AGENTS.md`
- `docs/knowledge/system-overview.md`
- `docs/knowledge/frontend-architecture.md`
- `docs/knowledge/backend-architecture.md`
- `docs/knowledge/runbooks.md`
- `docs/knowledge/troubleshooting.md`
- `docs/knowledge/feedback-loop.md`
- `docs/exec-plans/index.md`
- `PLANS.md`

For non-trivial work:

1. Record the architectural decision in `PLANS.md`.
2. Track the implementation in `docs/exec-plans/active`.
3. Add or update focused tests.
4. Run the quality gates.
5. Move the validated plan to `docs/exec-plans/completed`.

## Why AI And Codex Help Maintain It

ImUsumWeb has many cross-cutting product contracts: role-based authorization, frontend state, Prisma data models, harness scripts, observability, and AI-assisted school workflows. Codex helps maintain the project by reading the repository context, drafting execution plans, making scoped changes, adding regression coverage, and running the same quality gates contributors use locally.

AI is treated as an engineering assistant, not an unchecked production actor. Product-facing AI workflows remain draft-first and human-confirmed, while Codex maintenance work is expected to be source-backed, reviewed through diffs, and verified with tests or harness commands.

## Security

Please report sensitive vulnerabilities privately. See `SECURITY.md` for scope and reporting guidance.

## License

ImUsumWeb is available under the MIT License. See `LICENSE`.
