# Materials Module MVP (Backend)

Status: Completed  
Date: 2026-02-15

## Goal
- Introduce a dedicated backend module for учебные материалы/книги with role-aware visibility and full admin management.

## Planned Changes
1. Add Prisma enum/model + SQL migration for `learning_materials`.
2. Extend seed/reset/required-table checks with learning materials data.
3. Implement `materialsService` for query parsing, filtering, and visibility checks.
4. Implement `routes/v1/materials.ts` CRUD endpoints and register in v1 router.
5. Add `serializeLearningMaterial(...)` response mapping.
6. Extend backend API tests with positive/negative cases and role checks.
7. Update backend README with endpoint contracts and access policy.

## Acceptance Criteria
- `GET /api/v1/materials` supports filters (`skip`, `limit`, `q`, `material_type`, `subject_id`, `class_id`, `is_published`) and role rules.
- `GET /api/v1/materials/:material_id` enforces visibility rules and returns 404 for missing records.
- `POST/PUT/DELETE` are restricted to director/admin and behave per contract.
- New Prisma model is migrated and seeded.
- Backend checks/tests and harness validations pass.

## Validation
- `npm run check:all`
- `cd backend && npm run check:guardrails && npm run test`
- `npm run check:harness`

## Validation Outcome
- Passed on 2026-02-15:
- `npm run check:all`
- `cd backend && npm run check:guardrails && npm run test`
- `npm run check:harness`
