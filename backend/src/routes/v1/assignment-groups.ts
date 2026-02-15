import type { User } from '@prisma/client';
import type { FastifyPluginAsync } from 'fastify';

import { TEACHER_PLUS_ROLES } from '../../lib/auth.js';
import { badRequest, forbidden, notFound } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';

function parsePositiveInt(value: string, detail: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    badRequest(detail);
  }
  return parsed;
}

async function resolveTeacherProfileId(userId: number): Promise<number | null> {
  const teacher = await prisma.teacherProfile.findUnique({ where: { user_id: userId } });
  return teacher?.id ?? null;
}

async function assertCanManageClassGroups(user: User, classId: number): Promise<void> {
  if (user.role === 'director' || user.role === 'admin') {
    return;
  }
  if (user.role !== 'teacher') {
    forbidden('Not authorized to manage assignment groups');
  }

  const teacherId = await resolveTeacherProfileId(user.id);
  if (!teacherId) {
    forbidden('Teacher profile not found');
  }

  const hasSchedule = await prisma.schedule.count({
    where: {
      class_id: classId,
      teacher_id: teacherId,
    },
  });
  if (hasSchedule === 0) {
    forbidden('Not authorized to manage groups for this class');
  }
}

const assignmentGroupsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('', { preHandler: [fastify.requireRoles(TEACHER_PLUS_ROLES, 'Teacher access required')] }, async (request) => {
    const query = request.query as { class_id?: string };
    const currentUser = request.currentUser!;

    const classId = query.class_id ? parsePositiveInt(query.class_id, 'Invalid class_id') : undefined;

    if (classId) {
      await assertCanManageClassGroups(currentUser, classId);
    }

    const where: Record<string, unknown> = {};
    if (classId) {
      where.class_id = classId;
    } else if (currentUser.role === 'teacher') {
      const teacherId = await resolveTeacherProfileId(currentUser.id);
      if (!teacherId) {
        return [];
      }
      const teacherSchedules = await prisma.schedule.findMany({
        where: { teacher_id: teacherId },
        select: { class_id: true },
      });
      const classIds = Array.from(new Set(teacherSchedules.map((item) => item.class_id)));
      where.class_id = {
        in: classIds.length > 0 ? classIds : [-1],
      };
    }

    const groups = await prisma.assignmentGroup.findMany({
      where,
      include: {
        members: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    first_name: true,
                    last_name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [{ class_id: 'asc' }, { name: 'asc' }],
    });

    return groups.map((group) => ({
      id: group.id,
      name: group.name,
      class_id: group.class_id,
      created_by_user_id: group.created_by_user_id,
      created_at: group.created_at.toISOString(),
      updated_at: group.updated_at.toISOString(),
      members: group.members.map((member) => ({
        id: member.id,
        student_id: member.student_id,
        student_first_name: member.student.user.first_name,
        student_last_name: member.student.user.last_name,
      })),
    }));
  });

  fastify.post('', { preHandler: [fastify.requireRoles(TEACHER_PLUS_ROLES, 'Teacher access required')] }, async (request, reply) => {
    const body = request.body as { name?: string; class_id?: number };
    const currentUser = request.currentUser!;
    const name = body.name?.trim();
    const classId = Number(body.class_id);

    if (!name) {
      badRequest('name is required');
    }
    if (!Number.isInteger(classId) || classId <= 0) {
      badRequest('class_id must be a positive integer');
    }

    await assertCanManageClassGroups(currentUser, classId);

    const group = await prisma.assignmentGroup.create({
      data: {
        name,
        class_id: classId,
        created_by_user_id: currentUser.id,
      },
    });

    return reply.status(201).send({
      id: group.id,
      name: group.name,
      class_id: group.class_id,
      created_by_user_id: group.created_by_user_id,
      created_at: group.created_at.toISOString(),
      updated_at: group.updated_at.toISOString(),
      members: [],
    });
  });

  fastify.put('/:group_id', { preHandler: [fastify.requireRoles(TEACHER_PLUS_ROLES, 'Teacher access required')] }, async (request) => {
    const params = request.params as { group_id: string };
    const body = request.body as { name?: string };
    const groupId = parsePositiveInt(params.group_id, 'Invalid group id');
    const currentUser = request.currentUser!;

    const group = await prisma.assignmentGroup.findUnique({ where: { id: groupId } });
    if (!group) {
      notFound('Assignment group not found');
    }

    await assertCanManageClassGroups(currentUser, group.class_id);

    const updated = await prisma.assignmentGroup.update({
      where: { id: group.id },
      data: {
        ...(body.name !== undefined ? { name: body.name.trim() || group.name } : {}),
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      class_id: updated.class_id,
      created_by_user_id: updated.created_by_user_id,
      created_at: updated.created_at.toISOString(),
      updated_at: updated.updated_at.toISOString(),
    };
  });

  fastify.put(
    '/:group_id/members',
    { preHandler: [fastify.requireRoles(TEACHER_PLUS_ROLES, 'Teacher access required')] },
    async (request) => {
      const params = request.params as { group_id: string };
      const body = request.body as { student_ids?: number[] };
      const groupId = parsePositiveInt(params.group_id, 'Invalid group id');
      const currentUser = request.currentUser!;

      const group = await prisma.assignmentGroup.findUnique({ where: { id: groupId } });
      if (!group) {
        notFound('Assignment group not found');
      }

      await assertCanManageClassGroups(currentUser, group.class_id);

      const studentIds = Array.isArray(body.student_ids)
        ? Array.from(new Set(body.student_ids.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0)))
        : [];

      const studentsCount = await prisma.studentProfile.count({
        where: {
          id: { in: studentIds },
          class_id: group.class_id,
        },
      });
      if (studentsCount !== studentIds.length) {
        badRequest('All student_ids must belong to the group class');
      }

      await prisma.$transaction(async (tx) => {
        await tx.assignmentGroupMember.deleteMany({
          where: { group_id: group.id },
        });
        if (studentIds.length > 0) {
          await tx.assignmentGroupMember.createMany({
            data: studentIds.map((studentId) => ({
              group_id: group.id,
              student_id: studentId,
            })),
            skipDuplicates: true,
          });
        }
      });

      const members = await prisma.assignmentGroupMember.findMany({
        where: { group_id: group.id },
        include: {
          student: {
            include: {
              user: {
                select: {
                  first_name: true,
                  last_name: true,
                },
              },
            },
          },
        },
      });

      return {
        id: group.id,
        class_id: group.class_id,
        members: members.map((member) => ({
          id: member.id,
          student_id: member.student_id,
          student_first_name: member.student.user.first_name,
          student_last_name: member.student.user.last_name,
        })),
      };
    }
  );

  fastify.delete('/:group_id', { preHandler: [fastify.requireRoles(TEACHER_PLUS_ROLES, 'Teacher access required')] }, async (request, reply) => {
    const params = request.params as { group_id: string };
    const groupId = parsePositiveInt(params.group_id, 'Invalid group id');
    const currentUser = request.currentUser!;

    const group = await prisma.assignmentGroup.findUnique({ where: { id: groupId } });
    if (!group) {
      notFound('Assignment group not found');
    }

    await assertCanManageClassGroups(currentUser, group.class_id);

    await prisma.$transaction(async (tx) => {
      await tx.assignmentTargetGroup.deleteMany({
        where: { group_id: group.id },
      });
      await tx.assignmentGroupMember.deleteMany({
        where: { group_id: group.id },
      });
      await tx.assignmentGroup.delete({
        where: { id: group.id },
      });
    });

    return reply.status(204).send();
  });
};

export default assignmentGroupsRoutes;
