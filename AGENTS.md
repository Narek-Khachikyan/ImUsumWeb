# Repository Guidelines

## Project Structure & Module Organization
- `src/` holds the React + TypeScript frontend; features live in `src/features/`, shared UI in `src/components/`, Redux state in `src/app/`, and page entry points in `src/pages/`.
- Static assets are in `src/assets/` and `public/`.
- Frontend tests are in `src/test/` (e.g., `src/test/Title.test.tsx`).
- The FastAPI backend lives in `backend/` with app code under `backend/app/` and tests in `backend/tests/`.
- Vite build output goes to `dist/`.

## Build, Test, and Development Commands
Frontend (repo root):
- `npm run dev` starts the Vite dev server with HMR.
- `npm run build` runs `tsc` then `vite build` for production.
- `npm run preview` serves the production build locally.
- `npm run lint`, `npm run format`, `npm run format:check`, `npm run type-check` for quality checks.

Backend (from `backend/`):
- `uvicorn app.main:app --reload --port 8000` runs the API locally.
- `alembic upgrade head` applies DB migrations.
- `docker-compose up -d` starts the backend stack with Docker.

## Coding Style & Naming Conventions
- Frontend uses Prettier and ESLint; format with `npm run format` (2-space indentation, trailing commas).
- Prefer path aliases like `@/components/...` instead of deep relative imports.
- Use PascalCase for React components and `camelCase` for functions/variables.
- Backend uses Black/Ruff/Mypy settings from `backend/pyproject.toml` (88-char lines, typed defs).

## Testing Guidelines
- Frontend: Vitest + Testing Library. Run `npm run test`, `npm run test:ui`, or `npm run test:coverage`.
- Backend: Pytest (`pytest` from `backend/`); tests live in `backend/tests/`.
- Name tests `*.test.ts`/`*.test.tsx` on frontend and `test_*.py` on backend.

## Commit & Pull Request Guidelines
- Commit history follows Conventional Commits (e.g., `feat: ...`, `fix: ...`). Keep subjects short and imperative.
- PRs should include a clear description, linked issue (if any), and screenshots for UI changes.
- Note test coverage in the PR body (commands run or “not run” with reason).

## Configuration Notes
- Backend requires a `.env` file (copy from `.env.example` if present).
- Frontend API base URL is configured via `VITE_API_BASE_URL` (see `backend/README.md`).
