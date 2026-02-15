# Plans And Decisions

## 2026-02-15: Agent-First Environment Hardening

### Summary
- Increase repository legibility and enforcement for agents by adding CI gates, browser-level smoke checks, and measurable harness SLA checks.

### Scope
- In scope:
- Add GitHub Actions CI that runs `check:all`, backend tests, and full harness validation.
- Add Playwright-based e2e smoke checks as part of harness verification.
- Add latency/error SLA checks in harness verification.
- Add execution-plan documentation structure in `docs/exec-plans/`.
- Out of scope:
- Product feature work.
- Large backend/frontend architecture rewrites.

### Interfaces And API Changes
- New npm scripts:
- `harness:sla`
- `harness:e2e`
- Updated `check:harness` to include smoke + SLA + e2e with guaranteed teardown.
- New environment knobs for SLA thresholds:
- `SLA_SAMPLE_SIZE`
- `SLA_MAX_P95_MS`
- `SLA_MAX_ERROR_RATE_PERCENT`
- `SLA_TARGET_URL`
- No public API endpoint contract changes.

### Key Decisions
- CI is split into quality and harness jobs to keep failures localized:
- Quality job validates static/runtime tests (`check:all` + backend `test`).
- Harness job validates runtime topology (`check:harness`) including observability-aware checks.
- Browser smoke is implemented with Playwright and Chromium only:
- Faster and deterministic for CI and local harness loop.
- SLA gate is intentionally simple and mechanical:
- Fixed-size sampling against backend health target.
- Enforced on p95 latency and error rate only to avoid noisy first iteration.

### Risks And Mitigations
- Risk: Playwright browser missing on local machines.
- Mitigation: explicit install guidance and CI-side browser installation.
- Risk: SLA flakiness in slower environments.
- Mitigation: thresholds are env-configurable; defaults are strict but practical.
- Risk: Harness teardown skipped on failed checks.
- Mitigation: `check:harness` wrapped in a script with `trap` for mandatory `harness:down`.

### Validation Plan
- `npm run check:all`
- `cd backend && npm run test`
- `npm run check:harness`

### Acceptance Criteria
- CI workflow exists and runs all required gates on push/PR.
- Harness validation includes smoke, SLA, and browser e2e.
- Execution-plan docs are discoverable under `docs/exec-plans/active` and `docs/exec-plans/completed`.

## 2026-02-15: Materials Module MVP (Backend)

### Summary
- Add a dedicated backend module for educational materials/books with isolated routing under `/api/v1/materials`.
- Scope is backend-only for this iteration: Prisma model + migration + route/service + serializer + tests.

### Scope
- In scope:
- New `LearningMaterial` domain model in Prisma and SQL migration.
- New Fastify route module `materials` registered in `routes/v1/index.ts`.
- Role-aware visibility and management rules:
- `student`: published + own class/global materials.
- `teacher`: published only.
- `director/admin`: full CRUD and unpublished visibility.
- API parity tests for list/detail/create/update/delete and access checks.
- Seed data updates for deterministic local environments.
- Out of scope:
- Frontend pages/components/services.
- Binary file upload/storage pipeline.

### Interfaces And API Changes
- New database enum: `LearningMaterialType` (`BOOK`, `ARTICLE`, `WORKSHEET`, `VIDEO`, `OTHER`).
- New database table/model: `learning_materials` / `LearningMaterial`.
- New API endpoints:
- `GET /api/v1/materials`
- `GET /api/v1/materials/:material_id`
- `POST /api/v1/materials`
- `PUT /api/v1/materials/:material_id`
- `DELETE /api/v1/materials/:material_id`
- New serializer contract: `serializeLearningMaterial(...)`.

### Key Decisions
- Keep storage as metadata + `file_url` only in MVP (no file-upload subsystem).
- Use optional `subject_id` and `class_id` to support both focused and global materials.
- Restrict write operations to `director/admin` for governance parity with school-level modules.
- Use hard delete in MVP for simplicity.

### Risks And Mitigations
- Risk: visibility regressions for student/teacher roles.
- Mitigation: enforce role-aware filters in shared service helpers and cover with dedicated tests.
- Risk: migration drift between Prisma schema and SQL.
- Mitigation: explicit SQL migration plus test/seed validation via harness and backend tests.

### Validation Plan
- `npm run check:all`
- `cd backend && npm run check:guardrails && npm run test`
- `npm run check:harness`

### Acceptance Criteria
- Materials module is mounted and reachable under `/api/v1/materials`.
- CRUD endpoints work with expected role restrictions.
- Student/teacher visibility behavior matches product rules.
- Prisma schema, migration, seed, and serializer are consistent.
- Backend test suite and harness checks pass.

### Validation Outcome
- Passed on 2026-02-15:
- `npm run check:all`
- `cd backend && npm run check:guardrails && npm run test`
- `npm run check:harness`
