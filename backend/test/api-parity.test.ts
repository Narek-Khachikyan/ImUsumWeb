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
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
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
    due_date: new Date('2026-02-10T10:00:00.000Z'),
    max_points: 100,
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
    grade_value: 95,
    max_value: 100,
    grade_type: 'Assignment',
    reference_id: 1,
    date: new Date('2026-02-06'),
    comment: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
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
    mockPrisma.teacherProfile.findUnique.mockResolvedValue({ id: 1, user_id: 1 });

    mockPrisma.blogPost.findMany.mockResolvedValue([]);
    mockPrisma.assignmentSubmission.findFirst.mockResolvedValue(null);
    mockPrisma.assignmentSubmission.findMany.mockResolvedValue([]);
    mockPrisma.assignmentSubmission.create.mockResolvedValue(buildSubmission());
    mockPrisma.assignmentSubmission.update.mockResolvedValue(
      buildSubmission({ points_earned: 10, feedback: 'Checked', is_graded: true })
    );
    mockPrisma.assignment.findUnique.mockResolvedValue(buildAssignment());
    mockPrisma.grade.findFirst.mockResolvedValue(null);
    mockPrisma.grade.create.mockResolvedValue(buildGrade());
    mockPrisma.grade.update.mockResolvedValue(buildGrade());

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
      buildAssignment({ id: 7, class_id: 3, is_published: true, due_date: new Date('2026-02-10T10:00:00.000Z') })
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
    mockPrisma.assignment.findUnique.mockResolvedValue(buildAssignment({ id: 7, teacher_id: 99, max_points: 20 }));

    const response = await app.inject({
      method: 'PUT',
      url: '/api/v1/assignments/7/submissions/9',
      headers: { authorization: `Bearer ${token}` },
      payload: { points_earned: 15, feedback: 'good' },
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
      buildAssignment({ id: 7, teacher_id: 11, subject_id: 9, max_points: 20 })
    );
    mockPrisma.assignmentSubmission.findFirst.mockResolvedValue(
      buildSubmission({ id: 9, assignment_id: 7, student_id: 55 })
    );
    mockPrisma.assignmentSubmission.update.mockResolvedValue(
      buildSubmission({
        id: 9,
        assignment_id: 7,
        student_id: 55,
        points_earned: 18,
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
        grade_value: 18,
        max_value: 20,
      })
    );

    const response = await app.inject({
      method: 'PUT',
      url: '/api/v1/assignments/7/submissions/9',
      headers: { authorization: `Bearer ${token}` },
      payload: { points_earned: 18, feedback: 'Great work' },
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
          grade_value: 18,
          max_value: 20,
        }),
      })
    );
    expect(mockPrisma.studentProfile.update).toHaveBeenCalledTimes(1);
    await app.close();
  });

  it('assignment duplicate submission on unique race -> 409', async () => {
    const app = buildApp();
    await app.ready();

    const token = app.jwt.sign({ sub: '1', type: 'access', ver: 0 }, { expiresIn: '30m' });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ role: 'student' }));
    mockPrisma.studentProfile.findUnique.mockResolvedValue({ id: 10, user_id: 1, class_id: 3 });
    mockPrisma.assignment.findUnique.mockResolvedValue(
      buildAssignment({ id: 7, class_id: 3, is_published: true, due_date: new Date('2026-02-10T10:00:00.000Z') })
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
