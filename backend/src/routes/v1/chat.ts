import { Prisma } from '@prisma/client';
import type { ChatChannel, User, UserRole } from '@prisma/client';
import type { FastifyPluginAsync } from 'fastify';

import { badRequest, forbidden, notFound } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';
import { serializeChatChannelListItem, serializeChatMessage } from '../../lib/serializers.js';

const STAFF_CHANNEL_TITLE = 'Ուսուցիչների ալիք';
const STAFF_ROLES: UserRole[] = ['teacher', 'director', 'admin'];
const ADMIN_ROLES: UserRole[] = ['director', 'admin'];

type ChannelSeed = {
  key: string;
  type: 'class' | 'staff';
  school_id: number;
  class_id: number | null;
  title: string;
};

function parsePositiveInt(value: string, detail: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    badRequest(detail);
  }
  return parsed;
}

function parseOptionalPositiveInt(value: unknown, detail: string): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    badRequest(detail);
  }

  return parsed;
}

function parseLimit(value: unknown): number {
  const parsed = parseOptionalPositiveInt(value, 'limit must be a positive integer');
  if (parsed === undefined) {
    return 50;
  }
  return Math.min(parsed, 100);
}

function getStartOfToday(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function requireSchoolId(currentUser: User): number {
  if (!currentUser.school_id) {
    badRequest('School is not set for this user');
  }
  return currentUser.school_id;
}

async function resolveTeacherProfileId(userId: number): Promise<number | null> {
  const teacher = await prisma.teacherProfile.findUnique({ where: { user_id: userId } });
  return teacher?.id ?? null;
}

async function buildChannelSeeds(currentUser: User): Promise<ChannelSeed[]> {
  const schoolId = requireSchoolId(currentUser);

  if (currentUser.role === 'student') {
    const student = await prisma.studentProfile.findUnique({ where: { user_id: currentUser.id } });
    if (!student?.class_id) {
      return [];
    }

    const classEntity = await prisma.class.findFirst({
      where: { id: student.class_id, school_id: schoolId },
      select: { id: true, name: true },
    });
    if (!classEntity) {
      return [];
    }

    return [
      {
        key: `class:${classEntity.id}`,
        type: 'class',
        school_id: schoolId,
        class_id: classEntity.id,
        title: `Դասարան ${classEntity.name}`,
      },
    ];
  }

  if (currentUser.role === 'teacher') {
    const teacherId = await resolveTeacherProfileId(currentUser.id);
    if (!teacherId) {
      return [];
    }

    const startOfToday = getStartOfToday();
    const schedules = await prisma.schedule.findMany({
      where: {
        teacher_id: teacherId,
        effective_from: { lte: startOfToday },
        OR: [{ effective_to: null }, { effective_to: { gte: startOfToday } }],
      },
      select: {
        class_: {
          select: {
            id: true,
            name: true,
            school_id: true,
          },
        },
      },
      orderBy: { class_id: 'asc' },
    });

    const classById = new Map<number, { id: number; name: string }>();
    for (const schedule of schedules) {
      const classEntity = schedule.class_;
      if (!classEntity || classEntity.school_id !== schoolId) {
        continue;
      }
      classById.set(classEntity.id, { id: classEntity.id, name: classEntity.name });
    }

    const classChannels = Array.from(classById.values()).map((classEntity) => ({
      key: `class:${classEntity.id}`,
      type: 'class' as const,
      school_id: schoolId,
      class_id: classEntity.id,
      title: `Դասարան ${classEntity.name}`,
    }));

    return [
      {
        key: `staff:${schoolId}`,
        type: 'staff',
        school_id: schoolId,
        class_id: null,
        title: STAFF_CHANNEL_TITLE,
      },
      ...classChannels,
    ];
  }

  if (currentUser.role === 'director' || currentUser.role === 'admin') {
    const classes = await prisma.class.findMany({
      where: { school_id: schoolId },
      select: { id: true, name: true },
      orderBy: { id: 'asc' },
    });

    return [
      {
        key: `staff:${schoolId}`,
        type: 'staff',
        school_id: schoolId,
        class_id: null,
        title: STAFF_CHANNEL_TITLE,
      },
      ...classes.map((classEntity) => ({
        key: `class:${classEntity.id}`,
        type: 'class' as const,
        school_id: schoolId,
        class_id: classEntity.id,
        title: `Դասարան ${classEntity.name}`,
      })),
    ];
  }

  return [];
}

async function upsertAndLoadChannels(seeds: ChannelSeed[]): Promise<ChatChannel[]> {
  if (seeds.length === 0) {
    return [];
  }

  const keys = seeds.map((seed) => seed.key);
  const existingChannels = await prisma.chatChannel.findMany({
    where: { key: { in: keys } },
  });
  const existingByKey = new Map(existingChannels.map((channel) => [channel.key, channel]));

  const missingSeeds = seeds.filter((seed) => !existingByKey.has(seed.key));
  if (missingSeeds.length > 0) {
    await prisma.chatChannel.createMany({
      data: missingSeeds,
      skipDuplicates: true,
    });
  }

  const channelsToUpdate = seeds.filter((seed) => {
    const existing = existingByKey.get(seed.key);
    if (!existing) {
      return false;
    }

    return (
      existing.type !== seed.type ||
      existing.school_id !== seed.school_id ||
      existing.class_id !== seed.class_id ||
      existing.title !== seed.title
    );
  });

  for (const seed of channelsToUpdate) {
    await prisma.chatChannel.update({
      where: { key: seed.key },
      data: {
        type: seed.type,
        school_id: seed.school_id,
        class_id: seed.class_id,
        title: seed.title,
      },
    });
  }

  const channels = await prisma.chatChannel.findMany({
    where: { key: { in: keys } },
  });

  channels.sort((left, right) => {
    if (left.type !== right.type) {
      return left.type === 'staff' ? -1 : 1;
    }
    return left.title.localeCompare(right.title, 'hy');
  });

  return channels;
}

async function getUnreadCountByChannel(channelIds: number[], userId: number): Promise<Map<number, number>> {
  if (channelIds.length === 0) {
    return new Map();
  }

  const rows = await prisma.$queryRaw<Array<{ channel_id: number; unread_count: bigint | number }>>(Prisma.sql`
    SELECT
      c.id AS channel_id,
      COUNT(m.id)::bigint AS unread_count
    FROM "chat_channels" c
    LEFT JOIN "chat_channel_reads" r
      ON r.channel_id = c.id
      AND r.user_id = ${userId}
    LEFT JOIN "chat_messages" m
      ON m.channel_id = c.id
      AND m.deleted_at IS NULL
      AND m.id > COALESCE(r.last_read_message_id, 0)
    WHERE c.id IN (${Prisma.join(channelIds)})
    GROUP BY c.id
  `);

  return new Map(
    rows.map((row) => [
      Number(row.channel_id),
      typeof row.unread_count === 'bigint' ? Number(row.unread_count) : row.unread_count,
    ])
  );
}

async function assertCanAccessChannel(currentUser: User, channel: ChatChannel): Promise<void> {
  const schoolId = requireSchoolId(currentUser);
  if (channel.school_id !== schoolId) {
    forbidden('Not authorized to access this channel');
  }

  if (channel.type === 'staff') {
    if (!STAFF_ROLES.includes(currentUser.role)) {
      forbidden('Not authorized to access this channel');
    }
    return;
  }

  if (channel.type !== 'class' || !channel.class_id) {
    forbidden('Not authorized to access this channel');
  }

  if (currentUser.role === 'student') {
    const student = await prisma.studentProfile.findUnique({ where: { user_id: currentUser.id } });
    if (!student?.class_id || student.class_id !== channel.class_id) {
      forbidden('Not authorized to access this channel');
    }
    return;
  }

  if (currentUser.role === 'teacher') {
    const teacherId = await resolveTeacherProfileId(currentUser.id);
    if (!teacherId) {
      forbidden('Not authorized to access this channel');
    }

    const startOfToday = getStartOfToday();
    const matchingScheduleCount = await prisma.schedule.count({
      where: {
        teacher_id: teacherId,
        class_id: channel.class_id,
        effective_from: { lte: startOfToday },
        OR: [{ effective_to: null }, { effective_to: { gte: startOfToday } }],
      },
    });

    if (matchingScheduleCount === 0) {
      forbidden('Not authorized to access this channel');
    }
    return;
  }

  if (currentUser.role === 'director' || currentUser.role === 'admin') {
    return;
  }

  forbidden('Not authorized to access this channel');
}

async function requireChannelAccess(currentUser: User, channelId: number): Promise<ChatChannel> {
  const channel = await prisma.chatChannel.findUnique({ where: { id: channelId } });
  if (!channel) {
    notFound('Channel not found');
  }

  await assertCanAccessChannel(currentUser, channel);
  return channel;
}

const chatRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/channels/my', { preHandler: [fastify.authenticate] }, async (request) => {
    const currentUser = request.currentUser!;
    const channelSeeds = await buildChannelSeeds(currentUser);
    const channels = await upsertAndLoadChannels(channelSeeds);

    const channelIds = channels.map((channel) => channel.id);
    const unreadCountByChannel = await getUnreadCountByChannel(channelIds, currentUser.id);

    const lastMessageIds = channels
      .map((channel) => channel.last_message_id)
      .filter((value): value is number => value !== null);
    const lastMessages =
      lastMessageIds.length > 0
        ? await prisma.chatMessage.findMany({
            where: { id: { in: lastMessageIds } },
            include: {
              sender: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  role: true,
                  avatar_url: true,
                },
              },
            },
          })
        : [];
    const lastMessageById = new Map(lastMessages.map((message) => [message.id, message]));

    return channels.map((channel) => {
      const lastMessage = channel.last_message_id
        ? lastMessageById.get(channel.last_message_id)
        : null;

      return serializeChatChannelListItem(channel, {
        unreadCount: unreadCountByChannel.get(channel.id) ?? 0,
        lastMessage: lastMessage
          ? {
              message: lastMessage,
              sender: lastMessage.sender,
            }
          : null,
      });
    });
  });

  fastify.get('/channels/:channel_id/messages', { preHandler: [fastify.authenticate] }, async (request) => {
    const params = request.params as { channel_id: string };
    const query = request.query as { limit?: string; before_id?: string; after_id?: string };
    const channelId = parsePositiveInt(params.channel_id, 'Invalid channel id');
    const limit = parseLimit(query.limit);
    const beforeId = parseOptionalPositiveInt(query.before_id, 'before_id must be a positive integer');
    const afterId = parseOptionalPositiveInt(query.after_id, 'after_id must be a positive integer');

    if (beforeId && afterId) {
      badRequest('Cannot use before_id and after_id together');
    }

    await requireChannelAccess(request.currentUser!, channelId);

    const where: {
      channel_id: number;
      id?: { lt?: number; gt?: number };
    } = { channel_id: channelId };

    if (beforeId) {
      where.id = { lt: beforeId };
    } else if (afterId) {
      where.id = { gt: afterId };
    }

    const descendingOrder = beforeId !== undefined || afterId === undefined;
    const messages = await prisma.chatMessage.findMany({
      where,
      orderBy: { id: descendingOrder ? 'desc' : 'asc' },
      take: limit,
      include: {
        sender: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            role: true,
            avatar_url: true,
          },
        },
      },
    });

    const ordered = descendingOrder ? [...messages].reverse() : messages;
    return ordered.map((message) => serializeChatMessage(message, message.sender));
  });

  fastify.post('/channels/:channel_id/messages', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const params = request.params as { channel_id: string };
    const body = request.body as { body?: string };
    const channelId = parsePositiveInt(params.channel_id, 'Invalid channel id');
    const currentUser = request.currentUser!;

    const channel = await requireChannelAccess(currentUser, channelId);

    const content = typeof body.body === 'string' ? body.body.trim() : '';
    if (content.length === 0 || content.length > 2000) {
      badRequest('body must contain between 1 and 2000 characters');
    }

    const createdMessage = await prisma.$transaction(async (tx) => {
      const message = await tx.chatMessage.create({
        data: {
          channel_id: channel.id,
          sender_user_id: currentUser.id,
          body: content,
        },
      });

      await tx.chatChannel.update({
        where: { id: channel.id },
        data: {
          last_message_id: message.id,
          last_message_at: message.created_at,
        },
      });

      return message;
    });

    return reply.status(201).send(serializeChatMessage(createdMessage, currentUser));
  });

  fastify.post('/channels/:channel_id/read', { preHandler: [fastify.authenticate] }, async (request) => {
    const params = request.params as { channel_id: string };
    const body = (request.body ?? {}) as { message_id?: number };
    const channelId = parsePositiveInt(params.channel_id, 'Invalid channel id');
    const currentUser = request.currentUser!;

    const channel = await requireChannelAccess(currentUser, channelId);
    const explicitMessageId = parseOptionalPositiveInt(body.message_id, 'message_id must be a positive integer');

    if (explicitMessageId) {
      const message = await prisma.chatMessage.findFirst({
        where: {
          id: explicitMessageId,
          channel_id: channel.id,
        },
        select: { id: true },
      });
      if (!message) {
        badRequest('message_id does not belong to this channel');
      }
    }

    const lastReadMessageId = explicitMessageId ?? channel.last_message_id ?? null;

    await prisma.chatChannelRead.upsert({
      where: {
        user_id_channel_id: {
          user_id: currentUser.id,
          channel_id: channel.id,
        },
      },
      create: {
        user_id: currentUser.id,
        channel_id: channel.id,
        last_read_message_id: lastReadMessageId,
      },
      update: {
        last_read_message_id: lastReadMessageId,
      },
    });

    return {
      channel_id: channel.id,
      last_read_message_id: lastReadMessageId,
    };
  });

  fastify.delete('/messages/:message_id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const params = request.params as { message_id: string };
    const messageId = parsePositiveInt(params.message_id, 'Invalid message id');
    const currentUser = request.currentUser!;

    const message = await prisma.chatMessage.findUnique({ where: { id: messageId } });
    if (!message) {
      notFound('Message not found');
    }

    await requireChannelAccess(currentUser, message.channel_id);

    if (message.sender_user_id !== currentUser.id && !ADMIN_ROLES.includes(currentUser.role)) {
      forbidden('Only author, director, or admin can delete this message');
    }

    if (!message.deleted_at) {
      await prisma.chatMessage.update({
        where: { id: message.id },
        data: {
          body: null,
          deleted_at: new Date(),
        },
      });
    }

    return reply.status(204).send();
  });
};

export default chatRoutes;
