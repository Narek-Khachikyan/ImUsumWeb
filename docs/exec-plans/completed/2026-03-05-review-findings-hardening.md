# 2026-03-05 Review Findings Hardening

## Goal
- Fix the highest-priority issues from the project review, starting with authorization and validation defects, then resolve the linked frontend regressions.

## Workstreams
1. Backend authorization
- Restrict `grades`, `purchases`, `assignments`, and `jobs` routes to the intended caller scope.
- Preserve current director/admin capabilities where already intended.

2. Validation hardening
- Remove the silent harness fallback that can hide migration failures.
- Extend regression coverage around the fixed backend paths.

3. Frontend correctness
- Refresh access tokens on 401 before logout.
- Clear stale test detail state before opening a new take-test modal.
- Normalize schedule day values on teacher/director dashboard.

## Validation
- `npm run check:all`
- `cd backend && npm run test`

## Validation Outcome
- Passed on 2026-03-05:
- `npm run check:all`
- `cd backend && npm run test`
