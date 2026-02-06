# Repository Guidelines

## Project Structure & Module Organization
- Backend code lives in `app/`.
- API routes are in `app/api/v1/endpoints/`; shared dependencies are in `app/api/deps.py`.
- Core cross-cutting logic (security, permissions, rate limiting, exceptions) is in `app/core/`.
- Business/domain logic belongs in `app/services/`; DB setup/config is in `app/database.py` and `app/config.py`.
- Migrations are under `alembic/versions/`; backend tests are in `tests/`.
- Frontend code is at repo root in `../src/`; backend integration docs are in `README.md`.

## Build, Test, and Development Commands
Run commands from `backend/` unless noted.
- `python -m venv venv && source venv/bin/activate`: create and activate local env.
- `pip install -r requirements.txt`: install runtime dependencies.
- `uvicorn app.main:app --reload --port 8000`: run API locally.
- `alembic upgrade head`: apply latest schema migrations.
- `pytest`: run backend tests.
- `docker-compose up -d`: start local backend stack (including DB).
- From repo root: `npm run dev` starts frontend against this API.

## Coding Style & Naming Conventions
- Target Python `3.11+`; prefer explicit type hints (`mypy` enforces typed defs).
- Formatting/linting rules come from `pyproject.toml`: Black/Ruff, 88-char line length.
- Use `snake_case` for modules/functions/variables, `PascalCase` for classes, and clear endpoint/resource naming (e.g., `offers.py`, `purchases.py`).
- Keep route handlers thin; move reusable logic to `app/services/`.

## Testing Guidelines
- Framework: `pytest` with `pytest-asyncio` (`asyncio_mode = auto`).
- Place tests in `tests/` and name files `test_*.py`.
- Add API tests for new endpoints, permissions, and error paths.
- Before opening a PR, run at least `pytest` and relevant migration checks.

## Commit & Pull Request Guidelines
- Prefer Conventional Commits: `feat: ...`, `fix: ...`, `chore: ...`.
- Keep commit subjects imperative and scoped (`feat(auth): add refresh token rotation`).
- PRs should include: purpose, linked issue (if any), migration notes, and test evidence (commands run).
- Include request/response examples or screenshots when API behavior affects frontend UX.

## Security & Configuration Tips
- Use `.env` for secrets; never commit credentials.
- Validate DB and CORS settings before deploy.
- Keep uploaded/generated artifacts out of git unless explicitly required.
