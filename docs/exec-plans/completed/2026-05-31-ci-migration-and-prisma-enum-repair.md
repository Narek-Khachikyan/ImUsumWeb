# CI Migration And Prisma Enum Repair

## Summary
- Restore clean-install CI validation by making backend migrations deployable on an empty PostgreSQL database.
- Remove attendance service runtime dependence on Prisma enum object exports so route registration works with freshly generated clients.

## Root Cause
- The migration directory starts with `20260207000041_auth_schema_alignment`, which alters `users` before any checked-in migration creates baseline tables.
- `attendanceService.ts` imports `DayOfWeek` as a runtime value from `@prisma/client`; generated-client drift can make that value undefined even though string enum values remain valid Prisma inputs.

## Scope
- In scope:
- Add focused backend regression tests for migration baseline ordering and attendance enum runtime imports.
- Add an idempotent baseline migration before the existing migration chain.
- Use type-only DayOfWeek imports plus string enum values in attendance service.
- Out of scope:
- Product behavior changes.
- Schema redesign or historical migration rewrites beyond adding the missing baseline.

## Validation Plan
- `npm run test --prefix backend`
- `npm run check:all`
- `cd backend && npm run check:guardrails && npm run test`
- `npm run check:harness` when Docker is available.
