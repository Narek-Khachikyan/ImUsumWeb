# ImUsum Backend (Node.js)

Fastify + TypeScript + Prisma backend for the ImUsum educational platform.

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Docker (optional)

### Development Setup

1. **Install dependencies:**
```bash
cd backend
npm install
```

2. **Configure environment:**
```bash
cp .env.example .env
# or edit existing .env
```

3. **Generate Prisma client:**
```bash
npm run prisma:generate
```

4. **(Optional) Pull schema from existing DB (introspection-first):**
```bash
npm run prisma:pull
```

5. **Start API in dev mode:**
```bash
npm run dev
```

### Build & Run

```bash
npm run build
npm run start
```

### Docker Setup

```bash
docker-compose up -d
```

## Quality Commands

- `npm run test` - run Vitest tests
- `npm run lint` - run ESLint
- `npm run type-check` - run TypeScript checks
- `npm run prisma:diff` - generate schema diff report in `reports/schema-diff.sql`
- `npm run prisma:seed` - reset-safe deterministic test data seed
- `npm run db:reset:seed` - migrate reset + deterministic seed

## Seeding Test Data

This backend includes a deterministic Prisma seed for full manual QA across all key modules:
- auth and role-based access (admin/director/teachers/students)
- schedules
- assignments + submissions + grades
- tests + attempts + analytics-ready data
- blog posts
- offers + purchases (pending/redeemed states)

### Run seed only
```bash
npm run prisma:seed
```

### Reset DB and seed
```bash
npm run db:reset:seed
```

The seed runs in full-reset mode for domain tables (children -> parents) and recreates a consistent data set on every run.

### Test accounts

Password for all accounts:
```txt
Test12345!
```

Accounts:
- `admin@imusum.local`
- `director@imusum.local`
- `teacher.math@imusum.local`
- `teacher.physics@imusum.local`
- `teacher.humanities@imusum.local`
- `student01@imusum.local`
- `student02@imusum.local`
- `student03@imusum.local`
- `student04@imusum.local`
- `student05@imusum.local`
- `student06@imusum.local`
- `student07@imusum.local`
- `student08@imusum.local`
- `student09@imusum.local`
- `student10@imusum.local`
- `student11@imusum.local`
- `student12@imusum.local`

## API Base URL

- Local API: `http://localhost:8000`
- API prefix: `/api/v1`
- Frontend env should remain:
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

## Endpoints

Implemented with parity to previous FastAPI backend:
- Auth: `/api/v1/auth/*`
- Users: `/api/v1/users/*`
- Blogs: `/api/v1/blogs/*`
- Schedules: `/api/v1/schedules/*`
- Assignments: `/api/v1/assignments/*`
- Grades: `/api/v1/grades/*`
- Offers: `/api/v1/offers/*`
- Purchases: `/api/v1/purchases/*`
- Health: `/health`
- Root: `/`
