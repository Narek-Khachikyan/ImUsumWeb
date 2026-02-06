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
