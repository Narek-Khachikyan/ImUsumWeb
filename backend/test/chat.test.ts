import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const now = new Date('2026-02-09T10:00:00.000Z');

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    user: {
      findUnique: vi.fn(),
    },
    studentProfile: {
      findUnique: vi.fn(),
    },
    teacherProfile: {
      findUnique: vi.fn(),
    },
    class: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    schedule: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    chatChannel: {
      upsert: vi.fn(),
      createMany: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    chatMessage: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    chatChannelRead: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    $transaction: vi.fn(),
    $queryRaw: vi.fn(),
  },
}));

vi.mock('../src/lib/prisma.js', () => ({ prisma: mockPrisma }));

import { buildApp } from '../src/app.js';

function buildUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    email: 'user@imusum.local',
    hashed_password: 'hashed',
    first_name: 'Test',
    last_name: 'User',
    role: 'student',
    is_active: true,
    is_verified: true,
    token_version: 0,
    avatar_url: null,
    phone: null,
    school_id: 10,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

type TestUser = ReturnType<typeof buildUser>;

function buildClassChannel(overrides: Record<string, unknown> = {}) {
  return {
    id: 10,
    key: 'class:55',
    type: 'class',
    school_id: 10,
    class_id: 55,
    title: 'Դասարան 10-A',
    last_message_id: null,
    last_message_at: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

function buildStaffChannel(overrides: Record<string, unknown> = {}) {
  return {
    id: 11,
    key: 'staff:10',
    type: 'staff',
    school_id: 10,
    class_id: null,
    title: 'Ուսուցիչների ալիք',
    last_message_id: null,
    last_message_at: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

async function createAuthedApp(user: TestUser) {
  mockPrisma.user.findUnique.mockResolvedValue(user);
  const app = buildApp();
  await app.ready();
  const token = app.jwt.sign({ sub: String(user.id), type: 'access', ver: user.token_version });
  return { app, token };
}

describe('chat routes', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  beforeEach(() => {
    mockPrisma.chatChannel.upsert.mockResolvedValue(buildClassChannel());
    mockPrisma.chatChannel.createMany.mockResolvedValue({ count: 0 });
    mockPrisma.chatChannel.findMany.mockResolvedValue([]);
    mockPrisma.chatChannelRead.findMany.mockResolvedValue([]);
    mockPrisma.chatMessage.findMany.mockResolvedValue([]);
    mockPrisma.chatMessage.count.mockResolvedValue(0);
    mockPrisma.chatChannelRead.upsert.mockResolvedValue({});
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => fn(mockPrisma));
    mockPrisma.chatMessage.create.mockResolvedValue({
      id: 99,
      channel_id: 10,
      sender_user_id: 1,
      body: 'Hi',
      created_at: now,
      edited_at: null,
      deleted_at: null,
      updated_at: now,
    });
    mockPrisma.chatChannel.update.mockResolvedValue(buildClassChannel({ last_message_id: 99, last_message_at: now }));
    mockPrisma.$queryRaw.mockResolvedValue([]);
  });

  it('student sees only own class channel', async () => {
    const currentUser = buildUser({ role: 'student' });
    const { app, token } = await createAuthedApp(currentUser);

    mockPrisma.studentProfile.findUnique.mockResolvedValue({ id: 1, user_id: 1, class_id: 55 });
    mockPrisma.class.findFirst.mockResolvedValue({ id: 55, name: '10-A' });
    mockPrisma.chatChannel.findMany.mockResolvedValue([buildClassChannel()]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/chat/channels/my',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([
      expect.objectContaining({
        key: 'class:55',
        type: 'class',
        unread_count: 0,
      }),
    ]);

    await app.close();
  });

  it('teacher sees staff and schedule-based class channels', async () => {
    const teacherUser = buildUser({ id: 2, role: 'teacher', email: 'teacher@imusum.local' });
    const { app, token } = await createAuthedApp(teacherUser);

    mockPrisma.teacherProfile.findUnique.mockResolvedValue({ id: 200, user_id: teacherUser.id });
    mockPrisma.schedule.findMany.mockResolvedValue([
      { class_: { id: 55, name: '10-A', school_id: 10 } },
      { class_: { id: 56, name: '10-B', school_id: 10 } },
      { class_: { id: 55, name: '10-A', school_id: 10 } },
    ]);
    mockPrisma.chatChannel.findMany.mockResolvedValue([
      buildClassChannel(),
      buildClassChannel({ id: 12, key: 'class:56', class_id: 56, title: 'Դասարան 10-B' }),
      buildStaffChannel(),
    ]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/chat/channels/my',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().map((channel: { key: string }) => channel.key)).toEqual([
      'staff:10',
      'class:55',
      'class:56',
    ]);
    expect(mockPrisma.chatChannel.createMany).not.toHaveBeenCalled();

    await app.close();
  });

  it('student from different class gets 403 when posting', async () => {
    const currentUser = buildUser({ role: 'student' });
    const { app, token } = await createAuthedApp(currentUser);

    mockPrisma.chatChannel.findUnique.mockResolvedValue(buildClassChannel({ class_id: 77, key: 'class:77' }));
    mockPrisma.studentProfile.findUnique.mockResolvedValue({ id: 1, user_id: 1, class_id: 55 });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/chat/channels/10/messages',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      payload: { body: 'Test' },
    });

    expect(response.statusCode).toBe(403);

    await app.close();
  });

  it('unread count grows and resets after mark-as-read', async () => {
    const currentUser = buildUser({ role: 'student' });
    const { app, token } = await createAuthedApp(currentUser);

    const channel = buildClassChannel({ last_message_id: 2, last_message_at: now });
    const lastMessage = {
      id: 2,
      channel_id: channel.id,
      sender_user_id: 99,
      body: 'New message',
      created_at: now,
      edited_at: null,
      deleted_at: null,
      updated_at: now,
      sender: {
        id: 99,
        first_name: 'Teacher',
        last_name: 'One',
        role: 'teacher',
        avatar_url: null,
      },
    };

    mockPrisma.studentProfile.findUnique.mockResolvedValue({ id: 1, user_id: 1, class_id: 55 });
    mockPrisma.class.findFirst.mockResolvedValue({ id: 55, name: '10-A' });
    mockPrisma.chatChannel.findMany.mockResolvedValue([channel]);
    mockPrisma.chatMessage.findMany.mockResolvedValue([lastMessage]);
    mockPrisma.$queryRaw
      .mockResolvedValueOnce([{ channel_id: 10, unread_count: 2 }])
      .mockResolvedValueOnce([{ channel_id: 10, unread_count: 0 }]);
    mockPrisma.chatChannelRead.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ user_id: 1, channel_id: 10, last_read_message_id: 2, updated_at: now }]);
    mockPrisma.chatChannel.findUnique.mockResolvedValue(channel);

    const beforeRead = await app.inject({
      method: 'GET',
      url: '/api/v1/chat/channels/my',
      headers: { authorization: `Bearer ${token}` },
    });

    const markRead = await app.inject({
      method: 'POST',
      url: '/api/v1/chat/channels/10/read',
      headers: { authorization: `Bearer ${token}` },
    });

    const afterRead = await app.inject({
      method: 'GET',
      url: '/api/v1/chat/channels/my',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(beforeRead.statusCode).toBe(200);
    expect(beforeRead.json()[0].unread_count).toBe(2);
    expect(markRead.statusCode).toBe(200);
    expect(markRead.json()).toEqual({ channel_id: 10, last_read_message_id: 2 });
    expect(afterRead.statusCode).toBe(200);
    expect(afterRead.json()[0].unread_count).toBe(0);

    await app.close();
  });

  it('soft-delete permissions: author yes, other student no, director yes', async () => {
    const author = buildUser({ id: 1, role: 'student', email: 'student01@imusum.local' });
    const otherStudent = buildUser({ id: 2, role: 'student', email: 'student02@imusum.local' });
    const director = buildUser({ id: 3, role: 'director', email: 'director@imusum.local' });

    mockPrisma.user.findUnique.mockImplementation(async ({ where }: { where: { id: number } }) => {
      if (where.id === 1) {
        return author;
      }
      if (where.id === 2) {
        return otherStudent;
      }
      if (where.id === 3) {
        return director;
      }
      return null;
    });

    const app = buildApp();
    await app.ready();

    const authorToken = app.jwt.sign({ sub: '1', type: 'access', ver: 0 });
    const otherStudentToken = app.jwt.sign({ sub: '2', type: 'access', ver: 0 });
    const directorToken = app.jwt.sign({ sub: '3', type: 'access', ver: 0 });

    mockPrisma.chatChannel.findUnique.mockResolvedValue(buildClassChannel());
    mockPrisma.chatMessage.findUnique.mockResolvedValue({
      id: 5,
      channel_id: 10,
      sender_user_id: 1,
      body: 'delete me',
      created_at: now,
      edited_at: null,
      deleted_at: null,
      updated_at: now,
    });
    mockPrisma.studentProfile.findUnique.mockResolvedValue({ id: 1, user_id: 1, class_id: 55 });
    mockPrisma.chatMessage.update.mockResolvedValue({});

    const authorDelete = await app.inject({
      method: 'DELETE',
      url: '/api/v1/chat/messages/5',
      headers: { authorization: `Bearer ${authorToken}` },
    });

    const otherStudentDelete = await app.inject({
      method: 'DELETE',
      url: '/api/v1/chat/messages/5',
      headers: { authorization: `Bearer ${otherStudentToken}` },
    });

    const directorDelete = await app.inject({
      method: 'DELETE',
      url: '/api/v1/chat/messages/5',
      headers: { authorization: `Bearer ${directorToken}` },
    });

    expect(authorDelete.statusCode).toBe(204);
    expect(otherStudentDelete.statusCode).toBe(403);
    expect(directorDelete.statusCode).toBe(204);
    expect(mockPrisma.chatMessage.update).toHaveBeenCalledTimes(2);

    await app.close();
  });
});
