# Core Modules Gap Closure

Status: Completed  
Date: 2026-02-15

## Goal
- Deliver production-ready implementations for:
- geolocation attendance,
- AI draft workflows,
- jobs module for top students,
- assignment targeting (class/groups/students),
- and student-home real API data integration.

## Planned Changes
1. Extend Prisma schema with:
- attendance records/overrides,
- AI workflow runs,
- jobs + applications + eligibility overrides,
- assignment targeting + assignment groups/members.
2. Add SQL migration with additive backfill-safe changes and indexes.
3. Add backend services:
- `attendanceService`,
- `openaiService`,
- `aiWorkflowService`,
- `jobsService`.
4. Add backend routes and mount under v1:
- `attendance.ts`,
- `ai.ts`,
- `jobs.ts`,
- `assignment-groups.ts`.
5. Extend assignments route behavior for target scopes and targeting options endpoint.
6. Extend tests attempt response with `recommendations_source` and AI fallback behavior.
7. Add frontend services/slices/pages:
- attendance service/slice and student-home check-in UX,
- jobs service/slice + `JobsPage`,
- AI draft actions in tests/schedule pages.
8. Replace student-home mock announcements/discounts with `blogs` + `offers` API data.
9. Add/extend tests:
- backend `api-parity`,
- frontend unit tests for updated pages,
- e2e smoke for student-home, jobs, attendance, targeted assignments.
10. Update docs/env examples and backend README API contract sections.

## Acceptance Criteria
- New modules are reachable under `/api/v1` and enforce role-based access.
- Attendance check-in uses school geolocation radius and lesson window `-15/+20`.
- AI features produce drafts and require explicit apply.
- Jobs eligibility respects threshold/lookback/min-grades and manual override priority.
- Assignments support `CLASS`, `GROUPS`, `STUDENTS` targeting with backward compatibility.
- Student home loads announcements and discounts from backend APIs without local mocks.

## Validation
- `npm run check:all`
- `cd backend && npm run check:guardrails && npm run test`
- `npm run check:harness`

## Validation Outcome
- Passed on 2026-02-15:
- `npm run check:all`
- `cd backend && npm run check:guardrails && npm run test`
- `npm run check:harness`
