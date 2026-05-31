# Security Policy

## Supported Versions

Security fixes are handled on the `main` branch unless a maintained release branch is created later.

## Reporting a Vulnerability

Please do not open a public issue for sensitive security reports.

Report vulnerabilities privately through GitHub Security Advisories when available, or contact the repository owner directly through their GitHub profile:

- Repository: `Narek-Khachikyan/ImUsumWeb`
- Owner: `Narek-Khachikyan`

Include as much detail as you can safely share:

- Affected route, page, script, or dependency.
- Reproduction steps.
- Expected impact.
- Any proof-of-concept payloads.
- Suggested fix, if known.

## Scope

In scope:

- Authentication and session handling.
- Role-based authorization for students, teachers, directors, and admins.
- Data exposure across school, class, assignment, grade, purchase, job, material, attendance, and test workflows.
- Unsafe AI output handling or unintended autonomous application of AI-generated drafts.
- Dependency vulnerabilities that are reachable in normal use.

Out of scope:

- Legacy Python/FastAPI references not used by the current application.
- Vulnerabilities requiring full local machine compromise.
- Denial-of-service claims without a realistic exploitation path.

## Project Security Expectations

- Backend routes belong under `backend/src/routes/v1`.
- Business rules belong in `backend/src/services` when they are shared or non-trivial.
- AI-assisted workflows must remain human-confirmed before applying changes that affect users.
- Harness migration failures should fail loudly unless an explicit local recovery fallback is enabled.
- Sensitive `.env` values must not be committed.
