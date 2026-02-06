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
      create: vi.fn(),
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
    mockPrisma.assignment.findUnique.mockResolvedValue({ id: 1 });

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

  it('assignment duplicate submission -> 409', async () => {
    const app = buildApp();
    await app.ready();

    const token = app.jwt.sign({ sub: '1', type: 'access', ver: 0 }, { expiresIn: '30m' });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ role: 'student' }));
    mockPrisma.studentProfile.findUnique.mockResolvedValue({ id: 10, user_id: 1 });
    mockPrisma.assignment.findUnique.mockResolvedValue({ id: 7 });
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
