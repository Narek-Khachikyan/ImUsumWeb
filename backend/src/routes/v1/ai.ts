import type { DayOfWeek } from '@prisma/client';
import type { FastifyPluginAsync } from 'fastify';

import { DIRECTOR_PLUS_ROLES, TEACHER_PLUS_ROLES } from '../../lib/auth.js';
import { badRequest, notFound } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';
import { serializeSchedule } from '../../lib/serializers.js';
import { parseTimeOnly } from '../../lib/time.js';
import { generateTestDraftWithAi, optimizeScheduleWithAi } from '../../services/openaiService.js';

const DAY_OF_WEEK_VALUES: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

function parsePositiveInt(value: string, detail: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    badRequest(detail);
  }
  return parsed;
}

function parseDayOfWeek(value: unknown, detail: string): DayOfWeek {
  if (typeof value !== 'string') {
    badRequest(detail);
  }
  const normalized = value.toUpperCase();
  if (!DAY_OF_WEEK_VALUES.includes(normalized as DayOfWeek)) {
    badRequest(detail);
  }
  return normalized as DayOfWeek;
}

const aiRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/tests/generate-draft', { preHandler: [fastify.requireRoles(TEACHER_PLUS_ROLES, 'Teacher access required')] }, async (request, reply) => {
    const body = request.body as {
      topic?: string;
      question_count?: number;
      difficulty?: string;
      subject_id?: number;
      class_id?: number;
    };

    const topic = body.topic?.trim();
    if (!topic) {
      badRequest('topic is required');
    }

    const questions = await generateTestDraftWithAi({
      topic,
      question_count: body.question_count ?? 5,
      difficulty: body.difficulty,
    });

    const workflow = await prisma.aiWorkflowRun.create({
      data: {
        workflow_type: 'TEST_GENERATION',
        status: 'DRAFT',
        input_json: {
          topic,
          question_count: body.question_count ?? 5,
          difficulty: body.difficulty ?? 'medium',
          subject_id: body.subject_id ?? null,
          class_id: body.class_id ?? null,
        },
        output_json: {
          questions,
        },
        created_by_user_id: request.currentUser!.id,
      },
    });

    return reply.status(201).send({
      workflow_id: workflow.id,
      workflow_type: workflow.workflow_type,
      status: workflow.status,
      questions,
      created_at: workflow.created_at.toISOString(),
    });
  });

  fastify.post(
    '/schedules/optimize-draft',
    { preHandler: [fastify.requireRoles(DIRECTOR_PLUS_ROLES, 'Director access required')] },
    async (request, reply) => {
      const body = request.body as { class_id?: number };
      const classId = Number(body.class_id);
      if (!Number.isInteger(classId) || classId <= 0) {
        badRequest('class_id must be a positive integer');
      }

      const classEntity = await prisma.class.findUnique({ where: { id: classId } });
      if (!classEntity) {
        notFound('Class not found');
      }

      const schedules = await prisma.schedule.findMany({
        where: { class_id: classId },
        orderBy: [{ day_of_week: 'asc' }, { start_time: 'asc' }],
      });

      const scheduleDraftPayload = schedules.map((schedule) => ({
        schedule_id: schedule.id,
        day_of_week: schedule.day_of_week,
        start_time: schedule.start_time.toISOString().slice(11, 19),
        end_time: schedule.end_time.toISOString().slice(11, 19),
        room: schedule.room,
        teacher_id: schedule.teacher_id,
      }));

      const draft = await optimizeScheduleWithAi({
        class_name: classEntity.name,
        schedules: scheduleDraftPayload,
      });

      const workflow = await prisma.aiWorkflowRun.create({
        data: {
          workflow_type: 'SCHEDULE_OPTIMIZATION',
          status: 'DRAFT',
          input_json: {
            class_id: classId,
            class_name: classEntity.name,
          },
          output_json: draft,
          created_by_user_id: request.currentUser!.id,
        },
      });

      return reply.status(201).send({
        workflow_id: workflow.id,
        workflow_type: workflow.workflow_type,
        status: workflow.status,
        class_id: classId,
        draft,
      });
    }
  );

  fastify.post(
    '/schedules/workflows/:workflow_id/apply',
    { preHandler: [fastify.requireRoles(DIRECTOR_PLUS_ROLES, 'Director access required')] },
    async (request) => {
      const params = request.params as { workflow_id: string };
      const workflowId = parsePositiveInt(params.workflow_id, 'Invalid workflow id');

      const workflow = await prisma.aiWorkflowRun.findUnique({ where: { id: workflowId } });
      if (!workflow || workflow.workflow_type !== 'SCHEDULE_OPTIMIZATION') {
        notFound('Schedule optimization workflow not found');
      }
      if (workflow.status !== 'DRAFT') {
        badRequest('Workflow is not in draft status');
      }

      const output = workflow.output_json as {
        updates?: Array<{
          schedule_id: number;
          day_of_week: string;
          start_time: string;
          end_time: string;
          room?: string | null;
          teacher_id: number;
        }>;
      };
      if (!Array.isArray(output.updates) || output.updates.length === 0) {
        badRequest('Workflow draft does not contain schedule updates');
      }

      const updates = output.updates.map((update) => {
        const scheduleId = Number(update.schedule_id);
        const teacherId = Number(update.teacher_id);
        if (!Number.isInteger(scheduleId) || scheduleId <= 0 || !Number.isInteger(teacherId) || teacherId <= 0) {
          badRequest('Draft contains invalid schedule update values');
        }
        return {
          schedule_id: scheduleId,
          day_of_week: parseDayOfWeek(update.day_of_week, 'day_of_week must be a valid enum value'),
          start_time: parseTimeOnly(update.start_time),
          end_time: parseTimeOnly(update.end_time),
          room: update.room ?? null,
          teacher_id: teacherId,
        };
      });

      const schedules = await prisma.schedule.findMany({
        where: {
          id: {
            in: updates.map((item) => item.schedule_id),
          },
        },
      });
      if (schedules.length !== updates.length) {
        badRequest('Draft references unknown schedule rows');
      }

      const classIdSet = new Set(schedules.map((item) => item.class_id));
      if (classIdSet.size > 1) {
        badRequest('Draft must reference schedules from a single class');
      }

      for (const update of updates) {
        const row = schedules.find((schedule) => schedule.id === update.schedule_id);
        if (!row) {
          badRequest('Schedule not found');
        }

        const teacherConflict = await prisma.schedule.count({
          where: {
            id: { not: update.schedule_id },
            teacher_id: update.teacher_id,
            day_of_week: update.day_of_week,
            start_time: update.start_time,
          },
        });
        if (teacherConflict > 0) {
          badRequest(`Teacher conflict for schedule ${update.schedule_id}`);
        }

        const classConflict = await prisma.schedule.count({
          where: {
            id: { not: update.schedule_id },
            class_id: row.class_id,
            day_of_week: update.day_of_week,
            start_time: update.start_time,
          },
        });
        if (classConflict > 0) {
          badRequest(`Class conflict for schedule ${update.schedule_id}`);
        }
      }

      const appliedRows = await prisma.$transaction(async (tx) => {
        const updatedRows = [];
        for (const update of updates) {
          const updated = await tx.schedule.update({
            where: { id: update.schedule_id },
            data: {
              day_of_week: update.day_of_week,
              start_time: update.start_time,
              end_time: update.end_time,
              room: update.room,
              teacher_id: update.teacher_id,
            },
          });
          updatedRows.push(updated);
        }

        await tx.aiWorkflowRun.update({
          where: { id: workflow.id },
          data: {
            status: 'APPLIED',
            applied_at: new Date(),
          },
        });
        return updatedRows;
      });

      return {
        workflow_id: workflow.id,
        status: 'APPLIED',
        updated_schedules: appliedRows.map(serializeSchedule),
      };
    }
  );
};

export default aiRoutes;
