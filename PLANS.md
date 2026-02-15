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
