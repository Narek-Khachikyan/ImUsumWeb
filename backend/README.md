# ImUsum Backend

FastAPI backend for the ImUsum educational platform.

## Quick Start

### Prerequisites
- Python 3.11+
- PostgreSQL 15+
- Docker (optional)

### Development Setup

1. **Create virtual environment:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your settings
```

4. **Start PostgreSQL** (or use Docker):
```bash
docker run -d --name imusum_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=imusum \
  -p 5432:5432 \
  postgres:15
```

5. **Run migrations:**
```bash
alembic upgrade head
```

6. **Start the server:**
```bash
uvicorn app.main:app --reload --port 8000
```

### Docker Setup

```bash
docker-compose up -d
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/api/v1/docs
- ReDoc: http://localhost:8000/api/v1/redoc

## Endpoints Overview

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token
- `GET /api/v1/auth/me` - Get current user

### Users
- `GET /api/v1/users` - List users (Director)
- `GET /api/v1/users/{id}` - Get user
- `PUT /api/v1/users/{id}` - Update user
- `DELETE /api/v1/users/{id}` - Delete user (Director)

### Blogs (Frontend Integration)
- `GET /api/v1/blogs` - List blogs
- `GET /api/v1/blogs/{id}` - Get blog
- `POST /api/v1/blogs` - Create blog (Director)
- `PUT /api/v1/blogs/{id}` - Update blog (Director)
- `DELETE /api/v1/blogs/{id}` - Delete blog (Director)

### Schedules
- `GET /api/v1/schedules` - List schedules
- `GET /api/v1/schedules/my` - Get my schedule
- `POST /api/v1/schedules` - Create (Director)
- `PUT /api/v1/schedules/{id}` - Update (Director)
- `DELETE /api/v1/schedules/{id}` - Delete (Director)

### Assignments
- `GET /api/v1/assignments` - List assignments
- `GET /api/v1/assignments/my` - Get my assignments
- `POST /api/v1/assignments` - Create (Teacher)
- `POST /api/v1/assignments/{id}/submit` - Submit (Student)

### Grades
- `GET /api/v1/grades/my` - Get my grades (Student)
- `GET /api/v1/grades/summary` - Get grade summary
- `POST /api/v1/grades` - Create grade (Teacher)

## Frontend Integration

Update your frontend `.env`:
```
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

The backend endpoints match the existing frontend service patterns in `src/services/blogService.ts`.
