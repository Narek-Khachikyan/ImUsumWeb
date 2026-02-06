import type { DayOfWeek } from '@prisma/client';
import type { FastifyPluginAsync } from 'fastify';

import { DIRECTOR_PLUS_ROLES } from '../../lib/auth.js';
import { conflict, notFound } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';
import { serializeSchedule } from '../../lib/serializers.js';
import { parseDateOnly, parseTimeOnly } from '../../lib/time.js';

const schedulesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('', { preHandler: [fastify.authenticate] }, async (request) => {
    const query = request.query as {
      class_id?: string | number;
      teacher_id?: string | number;
      day_of_week?: DayOfWeek;
    };

    const today = new Date();
    const startOfToday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

    const schedules = await prisma.schedule.findMany({
      where: {
        ...(query.class_id ? { class_id: Number(query.class_id) } : {}),
        ...(query.teacher_id ? { teacher_id: Number(query.teacher_id) } : {}),
        ...(query.day_of_week ? { day_of_week: query.day_of_week } : {}),
        effective_from: { lte: startOfToday },
        OR: [{ effective_to: null }, { effective_to: { gte: startOfToday } }],
      },
      orderBy: [{ day_of_week: 'asc' }, { start_time: 'asc' }],
    });

    return schedules.map(serializeSchedule);
  });

  fastify.get('/my', { preHandler: [fastify.authenticate] }, async (request) => {
    const currentUser = request.currentUser!;

    const today = new Date();
    const startOfToday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

    let where: Record<string, unknown> = {
      effective_from: { lte: startOfToday },
      OR: [{ effective_to: null }, { effective_to: { gte: startOfToday } }],
    };

    if (currentUser.role === 'student') {
      const student = await prisma.studentProfile.findUnique({ where: { user_id: currentUser.id } });
      if (!student || !student.class_id) {
        return [];
      }
      where = { ...where, class_id: student.class_id };
    } else if (currentUser.role === 'teacher') {
      const teacher = await prisma.teacherProfile.findUnique({ where: { user_id: currentUser.id } });
      if (!teacher) {
        return [];
      }
      where = { ...where, teacher_id: teacher.id };
    }

    const schedules = await prisma.schedule.findMany({
      where,
      orderBy: [{ day_of_week: 'asc' }, { start_time: 'asc' }],
    });

    return schedules.map(serializeSchedule);
  });

  fastify.post('', { preHandler: [fastify.requireRoles(DIRECTOR_PLUS_ROLES, 'Director access required')] }, async (request, reply) => {
    const body = request.body as {
      class_id: number;
      subject_id: number;
      teacher_id: number;
      day_of_week: DayOfWeek;
      start_time: string;
      end_time: string;
      room?: string | null;
      effective_from: string;
      effective_to?: string | null;
    };

    const existing = await prisma.schedule.findFirst({
      where: {
        class_id: body.class_id,
        day_of_week: body.day_of_week,
        start_time: parseTimeOnly(body.start_time),
      },
    });

    if (existing) {
      conflict('Schedule conflict: class already has a lesson at this time');
    }

    const created = await prisma.schedule.create({
      data: {
        class_id: body.class_id,
        subject_id: body.subject_id,
        teacher_id: body.teacher_id,
        day_of_week: body.day_of_week,
        start_time: parseTimeOnly(body.start_time),
        end_time: parseTimeOnly(body.end_time),
        room: body.room ?? null,
        effective_from: parseDateOnly(body.effective_from),
        effective_to: body.effective_to ? parseDateOnly(body.effective_to) : null,
      },
    });

    return reply.status(201).send(serializeSchedule(created));
  });

  fastify.put(
    '/:schedule_id',
    { preHandler: [fastify.requireRoles(DIRECTOR_PLUS_ROLES, 'Director access required')] },
    async (request) => {
      const params = request.params as { schedule_id: string };
      const body = request.body as {
        class_id?: number;
        subject_id?: number;
        teacher_id?: number;
        day_of_week?: DayOfWeek;
        start_time?: string;
        end_time?: string;
        room?: string | null;
        effective_from?: string;
        effective_to?: string | null;
      };

      const scheduleId = Number(params.schedule_id);
      const existing = await prisma.schedule.findUnique({ where: { id: scheduleId } });
      if (!existing) {
        notFound('Schedule not found');
      }

      const updated = await prisma.schedule.update({
        where: { id: scheduleId },
        data: {
          ...(body.class_id !== undefined ? { class_id: body.class_id } : {}),
          ...(body.subject_id !== undefined ? { subject_id: body.subject_id } : {}),
          ...(body.teacher_id !== undefined ? { teacher_id: body.teacher_id } : {}),
          ...(body.day_of_week !== undefined ? { day_of_week: body.day_of_week } : {}),
          ...(body.start_time !== undefined ? { start_time: parseTimeOnly(body.start_time) } : {}),
          ...(body.end_time !== undefined ? { end_time: parseTimeOnly(body.end_time) } : {}),
          ...(body.room !== undefined ? { room: body.room } : {}),
          ...(body.effective_from !== undefined ? { effective_from: parseDateOnly(body.effective_from) } : {}),
          ...(body.effective_to !== undefined
            ? { effective_to: body.effective_to ? parseDateOnly(body.effective_to) : null }
            : {}),
        },
      });

      return serializeSchedule(updated);
    }
  );

  fastify.delete(
    '/:schedule_id',
    { preHandler: [fastify.requireRoles(DIRECTOR_PLUS_ROLES, 'Director access required')] },
    async (request, reply) => {
      const params = request.params as { schedule_id: string };
      const scheduleId = Number(params.schedule_id);

      const existing = await prisma.schedule.findUnique({ where: { id: scheduleId } });
      if (!existing) {
        notFound('Schedule not found');
      }

      await prisma.schedule.delete({ where: { id: scheduleId } });
      return reply.status(204).send();
    }
  );
};

export default schedulesRoutes;
