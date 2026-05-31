# 2026-05-31 Public OSS Readiness

## Goal
- Prepare ImUsumWeb for public GitHub visitors and contributors with clear repository metadata, OSS policy files, and a public-user README.

## Workstreams
1. OSS policy files
- Add an MIT license.
- Add contribution, security, and conduct guidance.

2. Public README
- Explain what ImUsumWeb is and who it helps.
- Summarize features from the current frontend/backend modules.
- Document setup, architecture, validation, contribution flow, and AI/Codex maintenance practices.
- Include a screenshots/demo section that points contributors to the harness workflow until committed screenshots are added.

3. GitHub presentation
- Set a concise repository description.
- Add relevant topics.
- Confirm Issues are enabled.

## Validation
- `npm run check:all`
- `cd backend && npm run check:guardrails && npm run test`

## Validation Outcome
- Passed on 2026-05-31:
- `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run check:all`
- `cd backend && PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run check:guardrails && PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run test`
- Blocked on 2026-05-31:
- `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run check:harness` stopped at `harness:doctor` because Docker Desktop was not running.
