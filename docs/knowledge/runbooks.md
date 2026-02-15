# Runbooks

## Local Bootstrap
1. `npm run harness:doctor`
2. `npm run harness:up` (applies backend Prisma migrations automatically)
3. `npm run harness:smoke`
4. `npm run harness:sla`
5. `npm run harness:e2e`

First-time e2e prerequisite:
- `npx playwright install chromium`

## Shutdown
- `npm run harness:down`

## Logs
- `npm run harness:logs`
- Raw files:
  - `.harness/logs/frontend.log`
  - `.harness/logs/backend.log`

## Quality Gate Before Merge
1. `npm run check:all`
2. `cd backend && npm run check:guardrails && npm run test`
3. `npm run check:harness`
