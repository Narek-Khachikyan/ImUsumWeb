import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const now = new Date('2026-02-06T10:00:00.000Z');

const { mockPrisma, requestPasswordReset, resetPasswordWithToken } = vi.hoisted(() => ({
  mockPrisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
    },
    studentProfile: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    teacherProfile: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    passwordResetToken: {
      updateMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    blogPost: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    learningMaterial: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    assignment: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    assignmentSubmission: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    grade: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    test: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    testQuestion: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    testOption: {
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    testAttempt: {
      count: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
    testAnswer: {
      findMany: vi.fn(),
    },
    offer: {
      findFirst: vi.fn(),
    },
    purchase: {
      findUnique: vi.fn(),
    },
    $queryRaw: vi.fn(),
    $transaction: vi.fn(),
  },
  requestPasswordReset: vi.fn(),
  resetPasswordWithToken: vi.fn(),
}));

vi.mock('../src/lib/prisma.js', () => ({ prisma: mockPrisma }));
vi.mock('../src/lib/security.js', () => ({
  getPasswordHash: vi.fn(async () => 'hashed-password'),
  verifyPassword: vi.fn(async () => true),
  hashResetToken: vi.fn((token: string) => token),
  generateResetToken: vi.fn(() => 'token'),
}));
vi.mock('../src/services/passwordResetService.js', () => ({
  requestPasswordReset,
  resetPasswordWithToken,
}));

import { buildApp } from '../src/app.js';

function buildUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    email: 'test@example.com',
    hashed_password: 'hashed-password',
    first_name: 'Test',
    last_name: 'User',
    role: 'student',
    is_active: true,
    is_verified: false,
    token_version: 0,
    avatar_url: null,
    phone: null,
    school_id: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

function buildAssignment(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    title: 'Assignment',
    description: null,
    assignment_type: 'individual',
    subject_id: 2,
    class_id: 1,
    teacher_id: 1,
    due_date: new Date('2099-02-10T10:00:00.000Z'),
    max_points: 10,
    is_published: true,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

function buildSubmission(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    assignment_id: 1,
    student_id: 1,
    content: 'answer',
    file_url: null,
    submitted_at: now,
    points_earned: null,
    feedback: null,
    is_graded: false,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

function buildGrade(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    student_id: 1,
    subject_id: 2,
    teacher_id: 1,
    grade_value: 9,
    max_value: 10,
    grade_type: 'Assignment',
    reference_id: 1,
    date: new Date('2026-02-06'),
    comment: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

function buildTest(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    title: 'Math Test',
    description: 'Unit 1',
    subject_id: 2,
    class_id: 1,
    teacher_id: 1,
    due_date: new Date('2099-02-20T10:00:00.000Z'),
    is_published: true,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

function buildLearningMaterial(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    title: 'Algebra Workbook',
    description: 'Exercises for class',
    material_type: 'BOOK',
    author: 'Author Name',
    file_url: 'https://example.com/materials/algebra.pdf',
    thumbnail_url: null,
    subject_id: 2,
    class_id: 1,
    is_published: true,
    uploaded_by_user_id: 99,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

function buildTestQuestion(overrides: Record<string, unknown> = {}) {
  return {
    id: 101,
    test_id: 1,
    question_text: '2 + 2 = ?',
    order_index: 1,
    points: 5,
    created_at: now,
    updated_at: now,
    options: [
      { id: 501, question_id: 101, option_text: '3', order_index: 1, is_correct: false, created_at: now, updated_at: now },
      { id: 502, question_id: 101, option_text: '4', order_index: 2, is_correct: true, created_at: now, updated_at: now },
      { id: 503, question_id: 101, option_text: '5', order_index: 3, is_correct: false, created_at: now, updated_at: now },
      { id: 504, question_id: 101, option_text: '6', order_index: 4, is_correct: false, created_at: now, updated_at: now },
    ],
    ...overrides,
  };
}

function buildTestAttempt(overrides: Record<string, unknown> = {}) {
  return {
    id: 201,
    test_id: 1,
    student_id: 10,
    submitted_at: now,
    score_points: 5,
    max_points: 10,
    percentage: 50,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

function resolveGradingMigrationPath(): string {
  const migrationSuffix = 'prisma/migrations/20260207200000_normalize_grading_to_10/migration.sql';
  const candidates = [resolve(process.cwd(), migrationSuffix), resolve(process.cwd(), `backend/${migrationSuffix}`)];
  const matched = candidates.find((candidate) => existsSync(candidate));

  if (!matched) {
    throw new Error(`Could not locate grading migration SQL. Looked in: ${candidates.join(', ')}`);
  }

  return matched;
}

describe('API parity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetPasswordWithToken.mockResolvedValue(true);
    requestPasswordReset.mockResolvedValue(undefined);

    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue(buildUser());
    mockPrisma.user.update.mockResolvedValue(buildUser());

    mockPrisma.studentProfile.findUnique.mockResolvedValue({ id: 1, user_id: 1, class_id: 1, bonus_points: 100 });
    mockPrisma.studentProfile.count.mockResolvedValue(20);
    mockPrisma.teacherProfile.findUnique.mockResolvedValue({ id: 1, user_id: 1 });

    mockPrisma.blogPost.findMany.mockResolvedValue([]);
    mockPrisma.learningMaterial.findMany.mockResolvedValue([]);
    mockPrisma.learningMaterial.findUnique.mockResolvedValue(null);
    mockPrisma.learningMaterial.create.mockResolvedValue(buildLearningMaterial());
    mockPrisma.learningMaterial.update.mockResolvedValue(buildLearningMaterial());
    mockPrisma.assignmentSubmission.findFirst.mockResolvedValue(null);
    mockPrisma.assignmentSubmission.findMany.mockResolvedValue([]);
    mockPrisma.assignmentSubmission.create.mockResolvedValue(buildSubmission());
    mockPrisma.assignmentSubmission.update.mockResolvedValue(
      buildSubmission({ points_earned: 10, feedback: 'Checked', is_graded: true })
    );
    mockPrisma.assignment.findUnique.mockResolvedValue(buildAssignment());
    mockPrisma.grade.findUnique.mockResolvedValue(buildGrade());
    mockPrisma.grade.findFirst.mockResolvedValue(null);
    mockPrisma.grade.findMany.mockResolvedValue([]);
    mockPrisma.grade.create.mockResolvedValue(buildGrade());
    mockPrisma.grade.update.mockResolvedValue(buildGrade());
    mockPrisma.test.findUnique.mockResolvedValue(buildTest());
    mockPrisma.test.findMany.mockResolvedValue([]);
    mockPrisma.test.create.mockResolvedValue(buildTest());
    mockPrisma.test.update.mockResolvedValue(buildTest());
    mockPrisma.testAttempt.count.mockResolvedValue(0);
    mockPrisma.testAttempt.findUnique.mockResolvedValue(null);
    mockPrisma.testAttempt.findMany.mockResolvedValue([]);
    mockPrisma.testQuestion.findFirst.mockResolvedValue(buildTestQuestion());
    mockPrisma.testQuestion.findMany.mockResolvedValue([]);
    mockPrisma.testAnswer.findMany.mockResolvedValue([]);

    mockPrisma.$queryRaw.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('register success -> 201 with lowercase role and tokens', async () => {
    const app = buildApp();
    await app.ready();

    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue(buildUser({ role: 'student', token_version: 0 }));

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'new-user@example.com',
        password: 'pass123456',
        first_name: 'New',
        last_name: 'User',
        role: 'student',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().user.role).toBe('student');
    expect(response.json().access_token).toEqual(expect.any(String));
    expect(response.json().refresh_token).toEqual(expect.any(String));
    await app.close();
  });

  it('register duplicate email -> 409', async () => {
    const app = buildApp();
    await app.ready();

    mockPrisma.user.findUnique.mockResolvedValue(buildUser());

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'test@example.com',
        password: 'pass123456',
        first_name: 'Test',
        last_name: 'User',
      },
    });

    expect(response.statusCode).toBe(409);
    await app.close();
  });

  it('self-register with non-student role -> 403', async () => {
    const app = buildApp();
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'teacher-register@example.com',
        password: 'pass123456',
        first_name: 'Teacher',
        last_name: 'User',
        role: 'teacher',
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().detail).toBe('Self-registration is only available for students');
    await app.close();
  });

  it('login wrong password -> 401', async () => {
    const { verifyPassword } = await import('../src/lib/security.js');
    vi.mocked(verifyPassword).mockResolvedValue(false);

    const app = buildApp();
    await app.ready();

    mockPrisma.user.findUnique.mockResolvedValue(buildUser());

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'test@example.com', password: 'wrong-password' },
    });

    expect(response.statusCode).toBe(401);
    await app.close();
  });

  it('auth/me without token -> 403', async () => {
    const app = buildApp();
    await app.ready();

    const response = await app.inject({ method: 'GET', url: '/api/v1/auth/me' });

    expect(response.statusCode).toBe(403);
    expect(response.json().detail).toBe('Not authenticated');
    await app.close();
  });

  it('refresh invalid token -> 401', async () => {
    const app = buildApp();
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: { refresh_token: 'invalid-token' },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().detail).toBe('Invalid refresh token');
    await app.close();
  });

  it('refresh token version mismatch -> 401', async () => {
    const app = buildApp();
    await app.ready();

    const refreshToken = app.jwt.sign({ sub: '1', type: 'refresh', ver: 0 }, { expiresIn: '7d' });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ token_version: 2 }));

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: { refresh_token: refreshToken },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().detail).toBe('Invalid refresh token');
    await app.close();
  });

  it('forgot-password unknown email -> generic message', async () => {
    const app = buildApp();
    await app.ready();

    mockPrisma.user.findUnique.mockResolvedValue(null);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/forgot-password',
      payload: { email: 'unknown@example.com' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ message: 'If an account exists, reset instructions have been sent.' });
    expect(requestPasswordReset).not.toHaveBeenCalled();
    await app.close();
  });

  it('reset-password invalid token -> 400', async () => {
    const app = buildApp();
    await app.ready();

    resetPasswordWithToken.mockResolvedValue(false);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/reset-password',
      payload: { token: 'bad', new_password: 'newpassword123' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().detail).toBe('Invalid, expired, or already used reset token');
    await app.close();
  });

  it('old access token becomes invalid by token version mismatch -> 401', async () => {
    const app = buildApp();
    await app.ready();

    const token = app.jwt.sign({ sub: '1', type: 'access', ver: 0 }, { expiresIn: '30m' });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ token_version: 1 }));

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(401);
    await app.close();
  });

  it('student cannot create blog -> 403', async () => {
    const app = buildApp();
    await app.ready();

    const token = app.jwt.sign({ sub: '1', type: 'access', ver: 0 }, { expiresIn: '30m' });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ role: 'student' }));

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/blogs',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        title: 'Blog',
        letter: 'Body',
        date: '2026-02-06',
      },
    });

    expect(response.statusCode).toBe(403);
    await app.close();
  });

  it('non-director cannot list users -> 403', async () => {
    const app = buildApp();
    await app.ready();

    const token = app.jwt.sign({ sub: '1', type: 'access', ver: 0 }, { expiresIn: '30m' });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ role: 'student' }));

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(403);
    await app.close();
  });

  it('director can create student user -> 201', async () => {
    const app = buildApp();
    await app.ready();

    const token = app.jwt.sign({ sub: '1', type: 'access', ver: 0 }, { expiresIn: '30m' });
    mockPrisma.user.findUnique
      .mockResolvedValueOnce(buildUser({ id: 1, role: 'director' }))
      .mockResolvedValueOnce(null);
    mockPrisma.user.create.mockResolvedValue(
      buildUser({
        id: 2,
        role: 'student',
        email: 'new-student@example.com',
        first_name: 'New',
        last_name: 'Student',
      })
    );

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/users',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        email: 'new-student@example.com',
        password: 'pass123456',
        first_name: 'New',
        last_name: 'Student',
        role: 'student',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().role).toBe('student');
    expect(mockPrisma.studentProfile.create).toHaveBeenCalledTimes(1);
    await app.close();
  });

  it('director cannot create admin user -> 403', async () => {
    const app = buildApp();
    await app.ready();

    const token = app.jwt.sign({ sub: '1', type: 'access', ver: 0 }, { expiresIn: '30m' });
    mockPrisma.user.findUnique.mockResolvedValueOnce(buildUser({ id: 1, role: 'director' }));

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/users',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        email: 'new-admin@example.com',
        password: 'pass123456',
        first_name: 'New',
        last_name: 'Admin',
        role: 'admin',
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().detail).toBe('Directors can only manage students and teachers');
    await app.close();
  });

  it('admin can create director user -> 201', async () => {
    const app = buildApp();
    await app.ready();

    const token = app.jwt.sign({ sub: '1', type: 'access', ver: 0 }, { expiresIn: '30m' });
    mockPrisma.user.findUnique
      .mockResolvedValueOnce(buildUser({ id: 1, role: 'admin' }))
      .mockResolvedValueOnce(null);
    mockPrisma.user.create.mockResolvedValue(
      buildUser({
        id: 3,
        role: 'director',
        email: 'new-director@example.com',
        first_name: 'New',
        last_name: 'Director',
      })
    );

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/users',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        email: 'new-director@example.com',
        password: 'pass123456',
        first_name: 'New',
        last_name: 'Director',
        role: 'director',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().role).toBe('director');
    await app.close();
  });

  it('director cannot update admin user -> 403', async () => {
    const app = buildApp();
    await app.ready();

    const token = app.jwt.sign({ sub: '1', type: 'access', ver: 0 }, { expiresIn: '30m' });
    mockPrisma.user.findUnique
      .mockResolvedValueOnce(buildUser({ id: 1, role: 'director' }))
      .mockResolvedValueOnce(buildUser({ id: 2, role: 'admin' }));

    const response = await app.inject({
      method: 'PUT',
      url: '/api/v1/users/2',
      headers: { authorization: `Bearer ${token}` },
      payload: { first_name: 'Blocked' },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().detail).toBe('Directors can only manage students and teachers');
    await app.close();
  });

  it('director cannot change admin role -> 403', async () => {
    const app = buildApp();
    await app.ready();

    const token = app.jwt.sign({ sub: '1', type: 'access', ver: 0 }, { expiresIn: '30m' });
    mockPrisma.user.findUnique
      .mockResolvedValueOnce(buildUser({ id: 1, role: 'director' }))
      .mockResolvedValueOnce(buildUser({ id: 2, role: 'admin' }));

    const response = await app.inject({
      method: 'PUT',
      url: '/api/v1/users/2/role?role=teacher',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().detail).toBe('Directors can only manage students and teachers');
    await app.close();
  });

  it('director cannot delete admin user -> 403', async () => {
    const app = buildApp();
    await app.ready();

    const token = app.jwt.sign({ sub: '1', type: 'access', ver: 0 }, { expiresIn: '30m' });
    mockPrisma.user.findUnique
      .mockResolvedValueOnce(buildUser({ id: 1, role: 'director' }))
      .mockResolvedValueOnce(buildUser({ id: 2, role: 'admin' }));

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/users/2',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().detail).toBe('Directors can only manage students and teachers');
    await app.close();
  });

  it('cannot deactivate your own account -> 400', async () => {
    const app = buildApp();
    await app.ready();

    const token = app.jwt.sign({ sub: '1', type: 'access', ver: 0 }, { expiresIn: '30m' });
    mockPrisma.user.findUnique
      .mockResolvedValueOnce(buildUser({ id: 1, role: 'admin' }))
      .mockResolvedValueOnce(buildUser({ id: 1, role: 'admin', is_active: true }));

    const response = await app.inject({
      method: 'PUT',
      url: '/api/v1/users/1',
      headers: { authorization: `Bearer ${token}` },
      payload: { is_active: false },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().detail).toBe('Cannot deactivate your own account');
    await app.close();
  });

  it('assignment duplicate submission -> 409', async () => {
    const app = buildApp();
    await app.ready();

    const token = app.jwt.sign({ sub: '1', type: 'access', ver: 0 }, { expiresIn: '30m' });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ role: 'student' }));
    mockPrisma.studentProfile.findUnique.mockResolvedValue({ id: 10, user_id: 1, class_id: 3 });
    mockPrisma.assignment.findUnique.mockResolvedValue(
      buildAssignment({ id: 7, class_id: 3, is_published: true, due_date: new Date('2099-02-10T10:00:00.000Z') })
    );
    mockPrisma.assignmentSubmission.findFirst.mockResolvedValue({ id: 33 });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/assignments/7/submit',
      headers: { authorization: `Bearer ${token}` },
      payload: { content: 'my answer' },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json().detail).toBe('Already submitted this assignment');
    await app.close();
  });

  it('assignment submit after deadline -> 400', async () => {
    const app = buildApp();
    await app.ready();

    const token = app.jwt.sign({ sub: '1', type: 'access', ver: 0 }, { expiresIn: '30m' });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ role: 'student' }));
    mockPrisma.studentProfile.findUnique.mockResolvedValue({ id: 10, user_id: 1, class_id: 3 });
    mockPrisma.assignment.findUnique.mockResolvedValue(
      buildAssignment({ id: 7, class_id: 3, due_date: new Date('2026-02-01T10:00:00.000Z') })
    );

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/assignments/7/submit',
      headers: { authorization: `Bearer ${token}` },
      payload: { content: 'late answer' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().detail).toBe('Assignment submission deadline has passed');
    await app.close();
  });

  it('assignment submit unpublished -> 403', async () => {
    const app = buildApp();
    await app.ready();

    const token = app.jwt.sign({ sub: '1', type: 'access', ver: 0 }, { expiresIn: '30m' });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ role: 'student' }));
    mockPrisma.studentProfile.findUnique.mockResolvedValue({ id: 10, user_id: 1, class_id: 3 });
    mockPrisma.assignment.findUnique.mockResolvedValue(
      buildAssignment({ id: 7, class_id: 3, is_published: false })
    );

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/assignments/7/submit',
      headers: { authorization: `Bearer ${token}` },
      payload: { content: 'answer' },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().detail).toBe('Assignment is not published');
    await app.close();
  });

  it('assignment submit wrong class -> 403', async () => {
    const app = buildApp();
    await app.ready();

    const token = app.jwt.sign({ sub: '1', type: 'access', ver: 0 }, { expiresIn: '30m' });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ role: 'student' }));
    mockPrisma.studentProfile.findUnique.mockResolvedValue({ id: 10, user_id: 1, class_id: 4 });
    mockPrisma.assignment.findUnique.mockResolvedValue(
      buildAssignment({ id: 7, class_id: 3, is_published: true })
    );

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/assignments/7/submit',
      headers: { authorization: `Bearer ${token}` },
      payload: { content: 'answer' },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().detail).toBe('Assignment is not available for this class');
    await app.close();
  });

  it('student can read own submissions -> 200', async () => {
    const app = buildApp();
    await app.ready();

    const token = app.jwt.sign({ sub: '1', type: 'access', ver: 0 }, { expiresIn: '30m' });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ role: 'student' }));
    mockPrisma.studentProfile.findUnique.mockResolvedValue({ id: 10, user_id: 1, class_id: 3 });
    mockPrisma.assignmentSubmission.findMany.mockResolvedValue([
      buildSubmission({ id: 50, assignment_id: 7, student_id: 10 }),
    ]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/assignments/my/submissions',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()[0]).toMatchObject({
      id: 50,
      assignment_id: 7,
      student_id: 10,
    });
    await app.close();
  });

  it('teacher cannot view foreign assignment submissions -> 403', async () => {
    const app = buildApp();
    await app.ready();

    const token = app.jwt.sign({ sub: '1', type: 'access', ver: 0 }, { expiresIn: '30m' });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ role: 'teacher' }));
    mockPrisma.teacherProfile.findUnique.mockResolvedValue({ id: 11, user_id: 1 });
    mockPrisma.assignment.findUnique.mockResolvedValue(buildAssignment({ id: 7, teacher_id: 99 }));

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/assignments/7/submissions',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(403);
    await app.close();
  });

  it('teacher cannot grade foreign assignment submissions -> 403', async () => {
    const app = buildApp();
    await app.ready();

    const token = app.jwt.sign({ sub: '1', type: 'access', ver: 0 }, { expiresIn: '30m' });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ role: 'teacher' }));
    mockPrisma.teacherProfile.findUnique.mockResolvedValue({ id: 11, user_id: 1 });
    mockPrisma.assignment.findUnique.mockResolvedValue(buildAssignment({ id: 7, teacher_id: 99, max_points: 10 }));

    const response = await app.inject({
      method: 'PUT',
      url: '/api/v1/assignments/7/submissions/9',
      headers: { authorization: `Bearer ${token}` },
      payload: { points_earned: 9, feedback: 'good' },
    });

    expect(response.statusCode).toBe(403);
    await app.close();
  });

  it('owner teacher grades submission and creates grade -> 200', async () => {
    const app = buildApp();
    await app.ready();

    const token = app.jwt.sign({ sub: '1', type: 'access', ver: 0 }, { expiresIn: '30m' });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ role: 'teacher' }));
    mockPrisma.teacherProfile.findUnique.mockResolvedValue({ id: 11, user_id: 1 });
    mockPrisma.assignment.findUnique.mockResolvedValue(
      buildAssignment({ id: 7, teacher_id: 11, subject_id: 9, max_points: 10 })
    );
    mockPrisma.assignmentSubmission.findFirst.mockResolvedValue(
      buildSubmission({ id: 9, assignment_id: 7, student_id: 55 })
    );
    mockPrisma.assignmentSubmission.update.mockResolvedValue(
      buildSubmission({
        id: 9,
        assignment_id: 7,
        student_id: 55,
        points_earned: 9,
        feedback: 'Great work',
        is_graded: true,
      })
    );
    mockPrisma.grade.findFirst.mockResolvedValue(null);
    mockPrisma.grade.create.mockResolvedValue(
      buildGrade({
        id: 81,
        student_id: 55,
        subject_id: 9,
        teacher_id: 11,
        reference_id: 7,
        grade_value: 9,
        max_value: 10,
      })
    );

    const response = await app.inject({
      method: 'PUT',
      url: '/api/v1/assignments/7/submissions/9',
      headers: { authorization: `Bearer ${token}` },
      payload: { points_earned: 9, feedback: 'Great work' },
    });

    expect(response.statusCode).toBe(200);
    expect(mockPrisma.assignmentSubmission.update).toHaveBeenCalled();
    expect(mockPrisma.grade.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          student_id: 55,
          subject_id: 9,
          teacher_id: 11,
          reference_id: 7,
          grade_type: 'Assignment',
          grade_value: 9,
          max_value: 10,
        }),
      })
    );
    expect(mockPrisma.studentProfile.update).toHaveBeenCalledTimes(1);
    await app.close();
  });

  it('owner teacher grading rejects invalid 10-point values -> 400', async () => {
    const app = buildApp();
    await app.ready();

    const token = app.jwt.sign({ sub: '1', type: 'access', ver: 0 }, { expiresIn: '30m' });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ role: 'teacher' }));
    mockPrisma.teacherProfile.findUnique.mockResolvedValue({ id: 11, user_id: 1 });
    mockPrisma.assignment.findUnique.mockResolvedValue(
      buildAssignment({ id: 7, teacher_id: 11, subject_id: 9, max_points: 10 })
    );
    mockPrisma.assignmentSubmission.findFirst.mockResolvedValue(
      buildSubmission({ id: 9, assignment_id: 7, student_id: 55 })
    );

    for (const points of [1, 11, 7.5]) {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/v1/assignments/7/submissions/9',
        headers: { authorization: `Bearer ${token}` },
        payload: { points_earned: points, feedback: 'invalid' },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().detail).toBe('points_earned must be an integer between 2 and 10');
    }

    await app.close();
  });

  it('owner teacher grading accepts 2 and 10 -> 200', async () => {
    const app = buildApp();
    await app.ready();

    const token = app.jwt.sign({ sub: '1', type: 'access', ver: 0 }, { expiresIn: '30m' });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ role: 'teacher' }));
    mockPrisma.teacherProfile.findUnique.mockResolvedValue({ id: 11, user_id: 1 });
    mockPrisma.assignment.findUnique.mockResolvedValue(
      buildAssignment({ id: 7, teacher_id: 11, subject_id: 9, max_points: 10 })
    );
    mockPrisma.assignmentSubmission.findFirst.mockResolvedValue(
      buildSubmission({ id: 9, assignment_id: 7, student_id: 55 })
    );

    for (const points of [2, 10]) {
      mockPrisma.assignmentSubmission.update.mockResolvedValue(
        buildSubmission({
          id: 9,
          assignment_id: 7,
          student_id: 55,
          points_earned: points,
          feedback: `Score ${points}`,
          is_graded: true,
        })
      );
      mockPrisma.grade.create.mockResolvedValue(
        buildGrade({
          id: 81 + points,
          student_id: 55,
          subject_id: 9,
          teacher_id: 11,
          reference_id: 7,
          grade_value: points,
          max_value: 10,
        })
      );

      const response = await app.inject({
        method: 'PUT',
        url: '/api/v1/assignments/7/submissions/9',
        headers: { authorization: `Bearer ${token}` },
        payload: { points_earned: points, feedback: `Score ${points}` },
      });

      expect(response.statusCode).toBe(200);
    }

    await app.close();
  });

  it('teacher grade create enforces 2..10 and max_value=10', async () => {
    const app = buildApp();
    await app.ready();

    const token = app.jwt.sign({ sub: '1', type: 'access', ver: 0 }, { expiresIn: '30m' });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ role: 'teacher' }));
    mockPrisma.teacherProfile.findUnique.mockResolvedValue({ id: 11, user_id: 1 });

    for (const gradeValue of [1, 11, 7.5]) {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/grades',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          student_id: 55,
          subject_id: 9,
          grade_value: gradeValue,
          max_value: 10,
          grade_type: 'Manual',
          date: '2026-02-07',
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().detail).toBe('grade_value must be an integer between 2 and 10');
    }

    const wrongMaxResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/grades',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        student_id: 55,
        subject_id: 9,
        grade_value: 9,
        max_value: 20,
        grade_type: 'Manual',
        date: '2026-02-07',
      },
    });
    expect(wrongMaxResponse.statusCode).toBe(400);
    expect(wrongMaxResponse.json().detail).toBe('max_value must be 10');

    for (const gradeValue of [2, 10]) {
      mockPrisma.grade.create.mockResolvedValue(
        buildGrade({
          id: 90 + gradeValue,
          student_id: 55,
          subject_id: 9,
          teacher_id: 11,
          grade_value: gradeValue,
          max_value: 10,
          grade_type: 'Manual',
          reference_id: null,
        })
      );

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/grades',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          student_id: 55,
          subject_id: 9,
          grade_value: gradeValue,
          max_value: 10,
          grade_type: 'Manual',
          date: '2026-02-07',
        },
      });

      expect(response.statusCode).toBe(201);
      expect(mockPrisma.grade.create).toHaveBeenLastCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            grade_value: gradeValue,
            max_value: 10,
          }),
        })
      );
    }

    await app.close();
  });

  it('teacher grade update enforces 2..10 and max_value=10', async () => {
    const app = buildApp();
    await app.ready();

    const token = app.jwt.sign({ sub: '1', type: 'access', ver: 0 }, { expiresIn: '30m' });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ role: 'teacher' }));
    mockPrisma.grade.findUnique.mockResolvedValue(buildGrade({ id: 77, grade_value: 9, max_value: 10 }));

    for (const gradeValue of [1, 11, 7.5]) {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/v1/grades/77',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          grade_value: gradeValue,
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().detail).toBe('grade_value must be an integer between 2 and 10');
    }

    const wrongMaxResponse = await app.inject({
      method: 'PUT',
      url: '/api/v1/grades/77',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        max_value: 20,
      },
    });
    expect(wrongMaxResponse.statusCode).toBe(400);
    expect(wrongMaxResponse.json().detail).toBe('max_value must be 10');

    for (const gradeValue of [2, 10]) {
      mockPrisma.grade.update.mockResolvedValue(
        buildGrade({
          id: 77,
          grade_value: gradeValue,
          max_value: 10,
        })
      );

      const response = await app.inject({
        method: 'PUT',
        url: '/api/v1/grades/77',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          grade_value: gradeValue,
          max_value: 10,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(mockPrisma.grade.update).toHaveBeenLastCalledWith(
        expect.objectContaining({
          where: { id: 77 },
          data: expect.objectContaining({
            grade_value: gradeValue,
            max_value: 10,
          }),
        })
      );
    }

    await app.close();
  });

  it('grading normalization migration includes conversion and DB checks for 2..10 scale', () => {
    const migrationSql = readFileSync(resolveGradingMigrationPath(), 'utf8');
    const normalizationFormulaCount = (migrationSql.match(/ROUND\(2 \+/g) ?? []).length;

    expect(normalizationFormulaCount).toBeGreaterThanOrEqual(3);
    expect(migrationSql).toContain('UPDATE "grades"');
    expect(migrationSql).toContain('"max_value" = 10');
    expect(migrationSql).toContain('UPDATE "assignment_submissions" AS s');
    expect(migrationSql).toContain('UPDATE "assignments"');
    expect(migrationSql).toContain('"max_points" = 10');
    expect(migrationSql).toContain('UPDATE "test_attempts"');
    expect(migrationSql).toContain('"score_points" BETWEEN 2 AND 10');
    expect(migrationSql).toContain('"ck_grades_grade_value_2_10"');
    expect(migrationSql).toContain('"ck_grades_max_value_10"');
    expect(migrationSql).toContain('"ck_assignment_submissions_points_earned_2_10"');
    expect(migrationSql).toContain('"ck_assignments_max_points_10"');
    expect(migrationSql).toContain('"ck_test_attempts_score_points_2_10"');
    expect(migrationSql).toContain('"ck_test_attempts_max_points_10"');
  });

  it('assignment duplicate submission on unique race -> 409', async () => {
    const app = buildApp();
    await app.ready();

    const token = app.jwt.sign({ sub: '1', type: 'access', ver: 0 }, { expiresIn: '30m' });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ role: 'student' }));
    mockPrisma.studentProfile.findUnique.mockResolvedValue({ id: 10, user_id: 1, class_id: 3 });
    mockPrisma.assignment.findUnique.mockResolvedValue(
      buildAssignment({ id: 7, class_id: 3, is_published: true, due_date: new Date('2099-02-10T10:00:00.000Z') })
    );
    mockPrisma.assignmentSubmission.findFirst.mockResolvedValue(null);
    mockPrisma.assignmentSubmission.create.mockRejectedValue({ code: 'P2002' });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/assignments/7/submit',
      headers: { authorization: `Bearer ${token}` },
      payload: { content: 'my answer' },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json().detail).toBe('Already submitted this assignment');
    await app.close();
  });

  it('teacher can create and publish test -> 201 then 200', async () => {
    const app = buildApp();
    await app.ready();

    const token = app.jwt.sign({ sub: '1', type: 'access', ver: 0 }, { expiresIn: '30m' });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ role: 'teacher' }));
    mockPrisma.teacherProfile.findUnique.mockResolvedValue({ id: 1, user_id: 1 });
    mockPrisma.test.create.mockResolvedValue(
      buildTest({
        id: 7,
        title: 'Algebra Test',
        is_published: false,
      })
    );

    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/tests',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        title: 'Algebra Test',
        description: 'Unit 1',
        subject_id: 2,
        class_id: 1,
        due_date: '2026-02-20T10:00:00.000Z',
      },
    });

    expect(createResponse.statusCode).toBe(201);
    expect(createResponse.json()).toMatchObject({
      id: 7,
      title: 'Algebra Test',
      is_published: false,
    });

    mockPrisma.test.findUnique.mockResolvedValue(
      buildTest({
        id: 7,
        is_published: false,
      })
    );
    mockPrisma.test.update.mockResolvedValue(
      buildTest({
        id: 7,
        is_published: true,
      })
    );

    const publishResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/tests/7/publish',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(publishResponse.statusCode).toBe(200);
    expect(publishResponse.json()).toMatchObject({
      id: 7,
      is_published: true,
    });
    await app.close();
  });

  it('student can view tests list only for own class -> 200', async () => {
    const app = buildApp();
    await app.ready();

    const token = app.jwt.sign({ sub: '1', type: 'access', ver: 0 }, { expiresIn: '30m' });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ role: 'student' }));
    mockPrisma.studentProfile.findUnique.mockResolvedValue({ id: 10, user_id: 1, class_id: 1, bonus_points: 100 });
    mockPrisma.test.findMany.mockResolvedValue([
      {
        ...buildTest({ id: 21, class_id: 1, is_published: true }),
        attempts: [],
        _count: { questions: 2 },
      },
    ]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/tests/my',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toHaveLength(1);
    expect(response.json()[0]).toMatchObject({
      id: 21,
      class_id: 1,
      is_published: true,
      questions_count: 2,
      attempt: null,
    });
    await app.close();
  });

  it('student submits test once and second attempt returns 409', async () => {
    const app = buildApp();
    await app.ready();

    const token = app.jwt.sign({ sub: '1', type: 'access', ver: 0 }, { expiresIn: '30m' });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ role: 'student' }));
    mockPrisma.studentProfile.findUnique.mockResolvedValue({ id: 10, user_id: 1, class_id: 1, bonus_points: 100 });

    const testWithQuestions = {
      ...buildTest({ id: 7, class_id: 1, is_published: true, teacher_id: 1 }),
      questions: [buildTestQuestion({ test_id: 7 })],
    };
    mockPrisma.test.findUnique.mockResolvedValue(testWithQuestions);
    mockPrisma.testAttempt.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(buildTestAttempt({ id: 300, test_id: 7, student_id: 10 }));

    mockPrisma.$transaction.mockImplementation(async (fn: any) =>
      fn({
        testAttempt: {
          create: vi.fn().mockResolvedValue({
            ...buildTestAttempt({ id: 301, test_id: 7, student_id: 10, score_points: 10, max_points: 10, percentage: 100 }),
            answers: [
              {
                id: 901,
                attempt_id: 301,
                question_id: 101,
                selected_option_id: 502,
                is_correct: true,
                awarded_points: 5,
                created_at: now,
                updated_at: now,
              },
            ],
          }),
        },
        grade: {
          findFirst: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue(
            buildGrade({
              grade_type: 'Test',
              reference_id: 7,
              student_id: 10,
              grade_value: 10,
              max_value: 10,
            })
          ),
          update: vi.fn(),
        },
      })
    );

    const submitResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/tests/7/submit',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        answers: [{ question_id: 101, selected_option_id: 502 }],
      },
    });

    expect(submitResponse.statusCode).toBe(200);
    expect(submitResponse.json().attempt).toMatchObject({
      test_id: 7,
      student_id: 10,
      score_points: 10,
      max_points: 10,
      percentage: 100,
    });

    const secondSubmitResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/tests/7/submit',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        answers: [{ question_id: 101, selected_option_id: 502 }],
      },
    });

    expect(secondSubmitResponse.statusCode).toBe(409);
    expect(secondSubmitResponse.json().detail).toBe('Already submitted this test');
    expect(mockPrisma.studentProfile.update).toHaveBeenCalled();
    await app.close();
  });

  it('test submit after deadline -> 400', async () => {
    const app = buildApp();
    await app.ready();

    const token = app.jwt.sign({ sub: '1', type: 'access', ver: 0 }, { expiresIn: '30m' });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ role: 'student' }));
    mockPrisma.studentProfile.findUnique.mockResolvedValue({ id: 10, user_id: 1, class_id: 1 });
    mockPrisma.test.findUnique.mockResolvedValue({
      ...buildTest({
        id: 7,
        class_id: 1,
        is_published: true,
        due_date: new Date('2026-02-01T10:00:00.000Z'),
      }),
      questions: [buildTestQuestion({ test_id: 7 })],
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/tests/7/submit',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        answers: [{ question_id: 101, selected_option_id: 502 }],
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().detail).toBe('Test submission deadline has passed');
    await app.close();
  });

  it('student attempt includes recommendations payload -> 200', async () => {
    const app = buildApp();
    await app.ready();

    const token = app.jwt.sign({ sub: '1', type: 'access', ver: 0 }, { expiresIn: '30m' });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ role: 'student' }));
    mockPrisma.studentProfile.findUnique.mockResolvedValue({ id: 10, user_id: 1, class_id: 1 });
    mockPrisma.test.findUnique.mockResolvedValue(buildTest({ id: 7, class_id: 1, subject_id: 2, is_published: true }));
    mockPrisma.testAttempt.findUnique.mockResolvedValue({
      ...buildTestAttempt({ id: 700, test_id: 7, student_id: 10, score_points: 8, percentage: 78 }),
      answers: [
        {
          id: 901,
          attempt_id: 700,
          question_id: 101,
          selected_option_id: 501,
          is_correct: false,
          awarded_points: 0,
          created_at: now,
          updated_at: now,
          question: {
            question_text: '2 + 2 = ?',
            points: 5,
            options: [{ option_text: '4' }],
          },
          selected_option: {
            option_text: '3',
          },
        },
        {
          id: 902,
          attempt_id: 700,
          question_id: 102,
          selected_option_id: 601,
          is_correct: true,
          awarded_points: 5,
          created_at: now,
          updated_at: now,
          question: {
            question_text: '3 + 3 = ?',
            points: 5,
            options: [{ option_text: '6' }],
          },
          selected_option: {
            option_text: '6',
          },
        },
      ],
    });
    mockPrisma.grade.findMany.mockResolvedValue([
      { grade_value: 8 },
      { grade_value: 8 },
      { grade_value: 7 },
      { grade_value: 6 },
    ]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/tests/7/attempt',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().recommendations).toMatchObject({
      level: 'good',
      recommended_difficulty: 'medium',
      subject_context: {
        trend: 'up',
      },
    });
    expect(response.json().recommendations.action_items).toHaveLength(3);
    expect(response.json().answers[0]).toMatchObject({
      question_id: 101,
      selected_option_text: '3',
      correct_option_text: '4',
    });
    await app.close();
  });

  it('student attempt recommendations trend insufficient_data when grade history is short -> 200', async () => {
    const app = buildApp();
    await app.ready();

    const token = app.jwt.sign({ sub: '1', type: 'access', ver: 0 }, { expiresIn: '30m' });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ role: 'student' }));
    mockPrisma.studentProfile.findUnique.mockResolvedValue({ id: 10, user_id: 1, class_id: 1 });
    mockPrisma.test.findUnique.mockResolvedValue(buildTest({ id: 7, class_id: 1, subject_id: 2, is_published: true }));
    mockPrisma.testAttempt.findUnique.mockResolvedValue({
      ...buildTestAttempt({ id: 701, test_id: 7, student_id: 10, score_points: 4, percentage: 40 }),
      answers: [
        {
          id: 903,
          attempt_id: 701,
          question_id: 101,
          selected_option_id: 501,
          is_correct: false,
          awarded_points: 0,
          created_at: now,
          updated_at: now,
          question: {
            question_text: '2 + 2 = ?',
            points: 5,
            options: [{ option_text: '4' }],
          },
          selected_option: {
            option_text: '3',
          },
        },
      ],
    });
    mockPrisma.grade.findMany.mockResolvedValue([{ grade_value: 5 }, { grade_value: 6 }]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/tests/7/attempt',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().recommendations).toMatchObject({
      level: 'critical',
      recommended_difficulty: 'easy',
      subject_context: {
        trend: 'insufficient_data',
      },
    });
    await app.close();
  });

  it('student attempt recommendations are excellent for high score -> 200', async () => {
    const app = buildApp();
    await app.ready();

    const token = app.jwt.sign({ sub: '1', type: 'access', ver: 0 }, { expiresIn: '30m' });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ role: 'student' }));
    mockPrisma.studentProfile.findUnique.mockResolvedValue({ id: 10, user_id: 1, class_id: 1 });
    mockPrisma.test.findUnique.mockResolvedValue(buildTest({ id: 7, class_id: 1, subject_id: 2, is_published: true }));
    mockPrisma.testAttempt.findUnique.mockResolvedValue({
      ...buildTestAttempt({ id: 702, test_id: 7, student_id: 10, score_points: 9, percentage: 92 }),
      answers: [
        {
          id: 904,
          attempt_id: 702,
          question_id: 101,
          selected_option_id: 502,
          is_correct: true,
          awarded_points: 5,
          created_at: now,
          updated_at: now,
          question: {
            question_text: '2 + 2 = ?',
            points: 5,
            options: [{ option_text: '4' }],
          },
          selected_option: {
            option_text: '4',
          },
        },
      ],
    });
    mockPrisma.grade.findMany.mockResolvedValue([
      { grade_value: 9 },
      { grade_value: 9 },
      { grade_value: 8 },
      { grade_value: 8 },
    ]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/tests/7/attempt',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().recommendations).toMatchObject({
      level: 'excellent',
      recommended_difficulty: 'hard',
    });
    expect(response.json().recommendations.focus_questions).toEqual([]);
    await app.close();
  });

  it('teacher can get test analytics -> 200', async () => {
    const app = buildApp();
    await app.ready();

    const token = app.jwt.sign({ sub: '1', type: 'access', ver: 0 }, { expiresIn: '30m' });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ role: 'teacher' }));
    mockPrisma.teacherProfile.findUnique.mockResolvedValue({ id: 1, user_id: 1 });
    mockPrisma.test.findUnique.mockResolvedValue(buildTest({ id: 7, teacher_id: 1, class_id: 1 }));
    mockPrisma.studentProfile.count.mockResolvedValue(4);
    mockPrisma.testAttempt.findMany.mockResolvedValue([
      buildTestAttempt({ id: 401, test_id: 7, percentage: 100 }),
      buildTestAttempt({ id: 402, test_id: 7, percentage: 50 }),
    ]);
    mockPrisma.testQuestion.findMany.mockResolvedValue([
      buildTestQuestion({ id: 101, test_id: 7, options: [] }),
      buildTestQuestion({ id: 102, test_id: 7, options: [], order_index: 2 }),
    ]);
    mockPrisma.testAnswer.findMany.mockResolvedValue([
      { question_id: 101, is_correct: true },
      { question_id: 101, is_correct: false },
      { question_id: 102, is_correct: false },
      { question_id: 102, is_correct: false },
    ]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/tests/7/analytics',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      students_total: 4,
      attempts_total: 2,
      completion_rate: 50,
      average_score: 75,
      score_distribution: {
        '0_20': 0,
        '21_40': 0,
        '41_60': 1,
        '61_80': 0,
        '81_100': 1,
      },
    });
    expect(response.json().question_stats).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ question_id: 101, wrong_count: 1 }),
        expect.objectContaining({ question_id: 102, wrong_count: 2 }),
      ])
    );
    await app.close();
  });

  it('teacher cannot edit question after first attempt -> 400', async () => {
    const app = buildApp();
    await app.ready();

    const token = app.jwt.sign({ sub: '1', type: 'access', ver: 0 }, { expiresIn: '30m' });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ role: 'teacher' }));
    mockPrisma.teacherProfile.findUnique.mockResolvedValue({ id: 1, user_id: 1 });
    mockPrisma.test.findUnique.mockResolvedValue(buildTest({ id: 7, teacher_id: 1 }));
    mockPrisma.testAttempt.count.mockResolvedValue(1);

    const response = await app.inject({
      method: 'PUT',
      url: '/api/v1/tests/7/questions/101',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        question_text: 'Updated text',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().detail).toBe('Cannot modify test after first attempt');
    await app.close();
  });

  it('student materials list includes only published and class/global scope -> 200', async () => {
    const app = buildApp();
    await app.ready();

    const token = app.jwt.sign({ sub: '1', type: 'access', ver: 0 }, { expiresIn: '30m' });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ role: 'student' }));
    mockPrisma.studentProfile.findUnique.mockResolvedValue({ id: 10, user_id: 1, class_id: 3 });
    mockPrisma.learningMaterial.findMany.mockResolvedValue([
      buildLearningMaterial({ id: 10, class_id: 3, is_published: true }),
      buildLearningMaterial({ id: 11, class_id: null, is_published: true, material_type: 'WORKSHEET' }),
    ]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/materials',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toHaveLength(2);
    expect(response.json()[0]).toMatchObject({ id: 10, class_id: 3, is_published: true });
    expect(response.json()[1]).toMatchObject({ id: 11, class_id: null, is_published: true });
    expect(mockPrisma.learningMaterial.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            { is_published: true },
            { OR: [{ class_id: 3 }, { class_id: null }] },
          ]),
        }),
      })
    );
    await app.close();
  });

  it('teacher materials list always excludes unpublished -> 200', async () => {
    const app = buildApp();
    await app.ready();

    const token = app.jwt.sign({ sub: '1', type: 'access', ver: 0 }, { expiresIn: '30m' });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ role: 'teacher' }));
    mockPrisma.learningMaterial.findMany.mockResolvedValue([buildLearningMaterial({ id: 12, is_published: true })]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/materials?is_published=false',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
    expect(mockPrisma.learningMaterial.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { AND: [{ is_published: true }] },
      })
    );
    await app.close();
  });

  it('director materials list supports is_published=false filter -> 200', async () => {
    const app = buildApp();
    await app.ready();

    const token = app.jwt.sign({ sub: '1', type: 'access', ver: 0 }, { expiresIn: '30m' });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ role: 'director' }));
    mockPrisma.learningMaterial.findMany.mockResolvedValue([buildLearningMaterial({ id: 13, is_published: false })]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/materials?is_published=false',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
    expect(mockPrisma.learningMaterial.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { AND: [{ is_published: false }] },
      })
    );
    await app.close();
  });

  it('student cannot access material from another class -> 403', async () => {
    const app = buildApp();
    await app.ready();

    const token = app.jwt.sign({ sub: '1', type: 'access', ver: 0 }, { expiresIn: '30m' });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ role: 'student' }));
    mockPrisma.studentProfile.findUnique.mockResolvedValue({ id: 10, user_id: 1, class_id: 1 });
    mockPrisma.learningMaterial.findUnique.mockResolvedValue(
      buildLearningMaterial({ id: 15, class_id: 2, is_published: true })
    );

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/materials/15',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().detail).toBe('Material is not available for this class');
    await app.close();
  });

  it('teacher cannot create material -> 403', async () => {
    const app = buildApp();
    await app.ready();

    const token = app.jwt.sign({ sub: '1', type: 'access', ver: 0 }, { expiresIn: '30m' });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ role: 'teacher' }));

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/materials',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        title: 'Teacher draft',
        file_url: 'https://example.com/materials/teacher-draft.pdf',
      },
    });

    expect(response.statusCode).toBe(403);
    await app.close();
  });

  it('director creates material and uploader is current user -> 201', async () => {
    const app = buildApp();
    await app.ready();

    const token = app.jwt.sign({ sub: '44', type: 'access', ver: 0 }, { expiresIn: '30m' });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ id: 44, role: 'director' }));
    mockPrisma.learningMaterial.create.mockResolvedValue(
      buildLearningMaterial({ id: 22, uploaded_by_user_id: 44, title: 'Director material' })
    );

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/materials',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        title: 'Director material',
        file_url: 'https://example.com/materials/director-material.pdf',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ id: 22, uploaded_by_user_id: 44 });
    expect(mockPrisma.learningMaterial.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Director material',
          file_url: 'https://example.com/materials/director-material.pdf',
          uploaded_by_user_id: 44,
        }),
      })
    );
    await app.close();
  });

  it('director updates material partially without changing uploader -> 200', async () => {
    const app = buildApp();
    await app.ready();

    const token = app.jwt.sign({ sub: '1', type: 'access', ver: 0 }, { expiresIn: '30m' });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ id: 1, role: 'director' }));
    mockPrisma.learningMaterial.findUnique.mockResolvedValue(
      buildLearningMaterial({ id: 22, uploaded_by_user_id: 77, title: 'Old title' })
    );
    mockPrisma.learningMaterial.update.mockResolvedValue(
      buildLearningMaterial({ id: 22, uploaded_by_user_id: 77, title: 'New title' })
    );

    const response = await app.inject({
      method: 'PUT',
      url: '/api/v1/materials/22',
      headers: { authorization: `Bearer ${token}` },
      payload: { title: 'New title' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ id: 22, title: 'New title', uploaded_by_user_id: 77 });
    const updateCall = mockPrisma.learningMaterial.update.mock.calls.at(-1);
    expect(updateCall).toBeDefined();
    const updateArg = updateCall?.[0] as { data: Record<string, unknown> };
    expect(updateArg.data).not.toHaveProperty('uploaded_by_user_id');
    await app.close();
  });

  it('director delete material returns 204 and then detail returns 404', async () => {
    const app = buildApp();
    await app.ready();

    const token = app.jwt.sign({ sub: '1', type: 'access', ver: 0 }, { expiresIn: '30m' });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ id: 1, role: 'director' }));
    mockPrisma.learningMaterial.findUnique
      .mockResolvedValueOnce(buildLearningMaterial({ id: 31 }))
      .mockResolvedValueOnce(null);

    const deleteResponse = await app.inject({
      method: 'DELETE',
      url: '/api/v1/materials/31',
      headers: { authorization: `Bearer ${token}` },
    });

    const getResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/materials/31',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(deleteResponse.statusCode).toBe(204);
    expect(getResponse.statusCode).toBe(404);
    expect(getResponse.json().detail).toBe('Material not found');
    await app.close();
  });

  it('materials invalid limit/material_type/id return 400', async () => {
    const app = buildApp();
    await app.ready();

    const token = app.jwt.sign({ sub: '1', type: 'access', ver: 0 }, { expiresIn: '30m' });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ role: 'director' }));

    const invalidLimitResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/materials?limit=0',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(invalidLimitResponse.statusCode).toBe(400);

    const invalidTypeResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/materials?material_type=unknown',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(invalidTypeResponse.statusCode).toBe(400);

    const invalidIdResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/materials/not-a-number',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(invalidIdResponse.statusCode).toBe(400);

    await app.close();
  });

  it('purchase insufficient balance -> 400', async () => {
    const app = buildApp();
    await app.ready();

    const token = app.jwt.sign({ sub: '1', type: 'access', ver: 0 }, { expiresIn: '30m' });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ role: 'student' }));

    mockPrisma.$transaction.mockImplementation(async (fn: any) =>
      fn({
        studentProfile: {
          findUnique: vi.fn().mockResolvedValue({ id: 1, user_id: 1, bonus_points: 2 }),
          update: vi.fn(),
        },
        offer: {
          findFirst: vi.fn().mockResolvedValue({
            id: 3,
            is_active: true,
            price: 10,
            stock_quantity: 10,
            name: 'Offer',
            brand_name: 'Brand',
            image_url: null,
          }),
          update: vi.fn(),
        },
        purchase: {
          create: vi.fn(),
        },
        $queryRaw: vi.fn(),
      })
    );

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/offers/3/purchase',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().detail).toContain('Insufficient balance');
    await app.close();
  });

  it('redeem already redeemed purchase -> success false', async () => {
    const app = buildApp();
    await app.ready();

    const token = app.jwt.sign({ sub: '1', type: 'access', ver: 0 }, { expiresIn: '30m' });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ role: 'student' }));
    mockPrisma.purchase.findUnique.mockResolvedValue({ id: 11, status: 'redeemed' });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/purchases/11/redeem',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ success: false, message: 'Already redeemed' });
    await app.close();
  });
});
