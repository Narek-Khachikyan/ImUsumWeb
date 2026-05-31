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

## 2026-02-15: Core Modules Gap Closure (Attendance + AI + Jobs + Targeted Assignments + Student Home Data)

### Summary
- Close five product-critical gaps in one coordinated release:
- Geolocation-based attendance workflow.
- AI workflow with human confirmation (test drafts, recommendations, schedule optimization drafts).
- Dedicated jobs module for top students (without replacing offers marketplace).
- Assignment targeting beyond class-level (groups and individual students).
- Student home data from real backend sources instead of local mocks.

### Scope
- In scope:
- New backend modules: `attendance`, `ai`, `jobs`, `assignment-groups`.
- Prisma schema additions and migration/backfill for attendance, workflows, jobs, and assignment targeting.
- Frontend data and UI integrations for student-home announcements/discounts, jobs page, assignment targeting, attendance check-in, and AI draft actions.
- Backend and frontend tests for the new flows.
- Out of scope:
- Fully autonomous AI apply flows without human confirmation.
- Removing or redesigning existing offers/purchases marketplace.

### Interfaces And API Changes
- New API modules:
- `/api/v1/attendance/*`
- `/api/v1/ai/*`
- `/api/v1/jobs/*`
- `/api/v1/assignment-groups/*`
- Extended assignment contracts with targeting fields:
- `target_scope`
- `target_group_ids`
- `target_student_ids`
- Extended test attempt contract with recommendation source:
- `recommendations_source: "ai" | "rule_based"`
- New env configuration:
- `GEOLOCATION_CHECKIN_BEFORE_MINUTES`
- `GEOLOCATION_CHECKIN_AFTER_MINUTES`
- `BEST_STUDENT_GRADE_THRESHOLD`
- `BEST_STUDENT_LOOKBACK_DAYS`
- `BEST_STUDENT_MIN_GRADES`

### Key Decisions
- Jobs module is separate from offers; both are kept.
- Geolocation attendance uses lesson-bound check-in with `-15/+20` minute window and school radius checks.
- AI outputs are drafts first; apply requires explicit user action.
- Top-student eligibility defaults:
- average grade `>= 8.0`
- lookback period `90` days
- minimum `3` grades
- manual eligibility override has higher priority.
- Student home uses existing backend modules:
- announcements from `blogs`
- discount cards from active `offers`
- Assignment targeting modes:
- `CLASS`, `GROUPS`, `STUDENTS`.

### Risks And Mitigations
- Risk: geolocation/browser permission variance.
- Mitigation: add explicit fallback manual check-in action and clear user feedback.
- Risk: AI latency/failures.
- Mitigation: safe fallback to rule-based recommendations and never fail request if AI fails.
- Risk: migration complexity and backward compatibility.
- Mitigation: additive schema with default/backfill behavior for existing assignments.
- Risk: assignment visibility regressions.
- Mitigation: route-level authorization filters + targeted API parity tests for each scope mode.

### Validation Plan
- `npm run check:all`
- `cd backend && npm run check:guardrails && npm run test`
- `npm run check:harness`

### Acceptance Criteria
- Attendance check-in and class attendance journal function with geolocation radius and time-window policy.
- AI draft endpoints are available and integrated into tests/schedule frontend workflows with explicit apply steps.
- Jobs module supports eligibility checks, overrides, postings, and applications with role-based permissions.
- Assignments support class/group/student targeting and preserve old records as class-targeted.
- Student home announcements/discounts are fetched from backend APIs, with robust empty/error states.

## 2026-03-05: Review Findings Hardening

### Summary
- Close the review findings uncovered in project-wide audit, with priority on authorization gaps, validation blind spots, and frontend state/session regressions.

### Scope
- In scope:
- Tighten backend authorization for grades, purchases, assignments, and jobs.
- Make harness migration failures fail loudly instead of silently falling back to schema push in normal runs.
- Fix frontend session refresh handling, test-taking state reuse, and dashboard schedule day normalization.
- Add targeted regression tests for the fixed paths.
- Out of scope:
- Large redesigns of role model or auth architecture.
- New product features unrelated to the review findings.

### Key Decisions
- Treat migration failure as a hard failure by default; any schema-sync fallback must be explicitly opt-in for local recovery.
- Keep assignment/job authorization consistent with existing class-access patterns instead of introducing a new permission model.
- Use token refresh on 401 before forcing logout so the existing refresh-token contract is actually honored.

### Validation Plan
- `npm run check:all`
- `cd backend && npm run test`

### Acceptance Criteria
- Reviewed authorization gaps are closed with regression coverage.
- Harness no longer masks broken migrations in normal validation runs.
- Expired access tokens refresh without forcing logout when refresh token is valid.
- Test-taking and dashboard views no longer use stale or mismatched state.

### Validation Outcome
- Passed on 2026-03-05:
- `npm run check:all`
- `cd backend && npm run test`

## 2026-05-31: Public OSS Readiness

### Summary
- Prepare the repository for public GitHub users with standard OSS files, a contributor-oriented README, and GitHub metadata.

### Scope
- In scope:
- Add `LICENSE`, `CONTRIBUTING.md`, `SECURITY.md`, and `CODE_OF_CONDUCT.md`.
- Rewrite `README.md` for public users and contributors.
- Record GitHub presentation settings: description, topics, and Issues availability.
- Out of scope:
- Product feature changes.
- Deployment automation changes.
- New screenshots or demo recordings beyond documenting how to capture them from the harness.

### Key Decisions
- Use MIT licensing for low-friction contribution and reuse.
- Keep setup instructions harness-first because the app depends on frontend, backend, PostgreSQL, and observability services.
- Keep AI/Codex positioning maintenance-focused: planning, regression coverage, harness checks, and source-backed documentation rather than autonomous production changes.

### Validation Plan
- `npm run check:all`
- `cd backend && npm run check:guardrails && npm run test`

### Acceptance Criteria
- Public users can understand the product, audience, features, architecture, and local setup from `README.md`.
- Contributors can find policy, security, conduct, and validation guidance at the repo root.
- GitHub repository description, topics, and Issues settings are configured.

### Validation Outcome
- Passed on 2026-05-31:
- `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run check:all`
- `cd backend && PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run check:guardrails && PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run test`
- Blocked on 2026-05-31:
- `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run check:harness` stopped at `harness:doctor` because Docker Desktop was not running.

## 2026-05-31: CI Migration And Prisma Enum Repair

### Summary
- Restore clean-install CI by adding the missing Prisma baseline migration before the existing migration chain.
- Remove attendance route registration dependence on runtime Prisma enum exports.

### Scope
- In scope:
- Backend migration deployability on empty PostgreSQL databases.
- Attendance service module-load stability in freshly generated Prisma client environments.
- Focused CI regression tests for both failure modes.
- Out of scope:
- Product feature changes.
- Frontend behavior changes.

### Key Decisions
- Add an idempotent baseline migration generated from the current Prisma schema because the repository only had follow-up migrations that assumed legacy tables already existed.
- Keep `DayOfWeek` as a TypeScript-only Prisma type and use string enum values at runtime, matching the rest of the backend's Prisma enum usage.

### Validation Plan
- `npm run test --prefix backend`
- `npm run check:all`
- `cd backend && npm run check:guardrails && npm run test`
- `npm run check:harness`

### Validation Outcome
- Passed on 2026-05-31:
- `npm run check:all` — 9 frontend test files, 30 tests, all passed
- `cd backend && npm run check:guardrails && npm run test` — 3 test files, 66 tests (incl. ci-regressions), all passed
- Blocked on 2026-05-31:
- `npm run check:harness` stopped at `harness:doctor` because Docker Desktop was not running.
