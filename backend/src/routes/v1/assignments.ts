import { Prisma, type Assignment, type AssignmentTargetScope, type AssignmentType, type User } from '@prisma/client';
import type { FastifyPluginAsync } from 'fastify';

import { TEACHER_PLUS_ROLES } from '../../lib/auth.js';
import { badRequest, conflict, forbidden, notFound } from '../../lib/errors.js';
import { awardBonusPoints } from '../../lib/gradeBonus.js';
import { assertTenGrade, tenToRatio } from '../../lib/gradingScale.js';
import { prisma } from '../../lib/prisma.js';
import { serializeAssignment, serializeSubmission } from '../../lib/serializers.js';

const TEN_SCALE_MAX_POINTS = 10;

function parsePositiveInt(value: string, detail: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    badRequest(detail);
  }
  return parsed;
}

function parseTenScalePoints(value: unknown, fieldName = 'points_earned'): number {
  const parsed = Number(value);
  try {
    assertTenGrade(parsed);
  } catch {
    badRequest(`${fieldName} must be an integer between 2 and 10`);
  }
  return parsed;
}

function parseTargetScope(value: unknown): AssignmentTargetScope {
  if (value === undefined || value === null) {
    return 'CLASS';
  }

  if (value === 'CLASS' || value === 'GROUPS' || value === 'STUDENTS') {
    return value;
  }

  const normalized = String(value).toUpperCase();
  if (normalized === 'CLASS' || normalized === 'GROUPS' || normalized === 'STUDENTS') {
    return normalized as AssignmentTargetScope;
  }

  badRequest('target_scope must be CLASS, GROUPS, or STUDENTS');
}

function parseIdArray(value: unknown, fieldName: string): number[] {
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    badRequest(`${fieldName} must be an array of positive integers`);
  }

  const ids = Array.from(
    new Set(
      value
        .map((item) => Number(item))
        .filter((item) => Number.isInteger(item) && item > 0)
    )
  );

  if (ids.length !== value.length) {
    badRequest(`${fieldName} must contain only positive integers`);
  }

  return ids;
}

async function getTeacherProfileId(userId: number): Promise<number | null> {
  const teacher = await prisma.teacherProfile.findUnique({ where: { user_id: userId } });
  return teacher?.id ?? null;
}

async function assertTeacherHasClassAccess(currentUser: User, classId: number): Promise<void> {
  if (currentUser.role === 'director' || currentUser.role === 'admin') {
    return;
  }

  if (currentUser.role !== 'teacher') {
    forbidden('Not authorized for this class');
  }

  const teacherId = await getTeacherProfileId(currentUser.id);
  if (!teacherId) {
    forbidden('Teacher profile not found');
  }

  const count = await prisma.schedule.count({
    where: {
      class_id: classId,
      teacher_id: teacherId,
    },
  });

  if (count === 0) {
    forbidden('Not authorized for this class');
  }
}

async function assertTeacherOwnsAssignment(
  currentUser: User,
  assignment: Assignment,
  detail = 'Not authorized to access this assignment'
): Promise<void> {
  if (currentUser.role === 'director' || currentUser.role === 'admin') {
    return;
  }

  if (currentUser.role !== 'teacher') {
    forbidden(detail);
  }

  const teacherId = await getTeacherProfileId(currentUser.id);
  if (!teacherId || teacherId !== assignment.teacher_id) {
    forbidden(detail);
  }
}

async function isAssignmentVisibleForStudent(assignment: Assignment, studentId: number, studentClassId: number): Promise<boolean> {
  if (assignment.target_scope === 'CLASS') {
    return assignment.class_id === studentClassId;
  }

  if (assignment.target_scope === 'GROUPS') {
    const matches = await prisma.assignmentTargetGroup.count({
      where: {
        assignment_id: assignment.id,
        group: {
          class_id: studentClassId,
          members: {
            some: {
              student_id: studentId,
            },
          },
        },
      },
    });
    return matches > 0;
  }

  const matches = await prisma.assignmentTargetStudent.count({
    where: {
      assignment_id: assignment.id,
      student_id: studentId,
    },
  });
  return matches > 0;
}

async function assertCanViewAssignment(currentUser: User, assignment: Assignment): Promise<void> {
  if (currentUser.role === 'director' || currentUser.role === 'admin') {
    return;
  }

  if (currentUser.role === 'teacher') {
    await assertTeacherOwnsAssignment(currentUser, assignment, 'Not authorized to view this assignment');
    return;
  }

  if (currentUser.role === 'student') {
    const student = await prisma.studentProfile.findUnique({ where: { user_id: currentUser.id } });
    if (!student || !student.class_id) {
      badRequest('Student profile not found');
    }

    if (assignment.is_published !== true) {
      forbidden('Assignment is not published');
    }

    if (assignment.target_scope === 'CLASS' && assignment.class_id !== student.class_id) {
      forbidden('Assignment is not available for this class');
    }

    const canAccess = await isAssignmentVisibleForStudent(assignment, student.id, student.class_id);
    if (!canAccess) {
      forbidden('Assignment is not targeted to this student');
    }
    return;
  }

  forbidden('Not authorized to view this assignment');
}

async function loadAssignmentTargetMaps(assignmentIds: number[]): Promise<{
  groupIdsByAssignment: Map<number, number[]>;
  studentIdsByAssignment: Map<number, number[]>;
}> {
  if (assignmentIds.length === 0) {
    return {
      groupIdsByAssignment: new Map(),
      studentIdsByAssignment: new Map(),
    };
  }

  const [groupRows, studentRows] = await Promise.all([
    prisma.assignmentTargetGroup.findMany({
      where: { assignment_id: { in: assignmentIds } },
      select: { assignment_id: true, group_id: true },
    }),
    prisma.assignmentTargetStudent.findMany({
      where: { assignment_id: { in: assignmentIds } },
      select: { assignment_id: true, student_id: true },
    }),
  ]);

  const groupIdsByAssignment = new Map<number, number[]>();
  for (const row of groupRows) {
    const current = groupIdsByAssignment.get(row.assignment_id) ?? [];
    current.push(row.group_id);
    groupIdsByAssignment.set(row.assignment_id, current);
  }

  const studentIdsByAssignment = new Map<number, number[]>();
  for (const row of studentRows) {
    const current = studentIdsByAssignment.get(row.assignment_id) ?? [];
    current.push(row.student_id);
    studentIdsByAssignment.set(row.assignment_id, current);
  }

  return {
    groupIdsByAssignment,
    studentIdsByAssignment,
  };
}

async function serializeAssignmentsWithTargets(assignments: Assignment[]) {
  const { groupIdsByAssignment, studentIdsByAssignment } = await loadAssignmentTargetMaps(assignments.map((item) => item.id));

  return assignments.map((assignment) =>
    serializeAssignment(assignment, {
      target_group_ids: groupIdsByAssignment.get(assignment.id) ?? [],
      target_student_ids: studentIdsByAssignment.get(assignment.id) ?? [],
    })
  );
}

async function getAssignmentTargetPayload(assignmentId: number): Promise<{
  target_group_ids: number[];
  target_student_ids: number[];
}> {
  const { groupIdsByAssignment, studentIdsByAssignment } = await loadAssignmentTargetMaps([assignmentId]);
  return {
    target_group_ids: groupIdsByAssignment.get(assignmentId) ?? [],
    target_student_ids: studentIdsByAssignment.get(assignmentId) ?? [],
  };
}

async function validateAssignmentTargets(params: {
  scope: AssignmentTargetScope;
  classId: number;
  targetGroupIds: number[];
  targetStudentIds: number[];
}): Promise<void> {
  const { scope, classId, targetGroupIds, targetStudentIds } = params;

  if (scope === 'CLASS') {
    if (targetGroupIds.length > 0 || targetStudentIds.length > 0) {
      badRequest('CLASS target scope cannot include explicit groups or students');
    }
    return;
  }

  if (scope === 'GROUPS') {
    if (targetGroupIds.length === 0) {
      badRequest('GROUPS target scope requires target_group_ids');
    }

    const groupsCount = await prisma.assignmentGroup.count({
      where: {
        id: { in: targetGroupIds },
        class_id: classId,
      },
    });

    if (groupsCount !== targetGroupIds.length) {
      badRequest('All target groups must belong to assignment class');
    }

    if (targetStudentIds.length > 0) {
      badRequest('GROUPS target scope cannot include target_student_ids');
    }
    return;
  }

  if (targetStudentIds.length === 0) {
    badRequest('STUDENTS target scope requires target_student_ids');
  }

  const studentsCount = await prisma.studentProfile.count({
    where: {
      id: { in: targetStudentIds },
      class_id: classId,
    },
  });

  if (studentsCount !== targetStudentIds.length) {
    badRequest('All target students must belong to assignment class');
  }

  if (targetGroupIds.length > 0) {
    badRequest('STUDENTS target scope cannot include target_group_ids');
  }
}

const assignmentsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('', { preHandler: [fastify.authenticate] }, async (request) => {
    const query = request.query as {
      class_id?: string | number;
      subject_id?: string | number;
      is_published?: string | boolean;
    };
    const currentUser = request.currentUser!;

    if (currentUser.role === 'student') {
      const student = await prisma.studentProfile.findUnique({ where: { user_id: currentUser.id } });
      if (!student || !student.class_id) {
        return [];
      }

      const assignments = await prisma.assignment.findMany({
        where: {
          ...(query.subject_id ? { subject_id: Number(query.subject_id) } : {}),
          ...(query.class_id ? { class_id: Number(query.class_id) } : {}),
          is_published: true,
          OR: [
            {
              target_scope: 'CLASS',
              class_id: student.class_id,
            },
            {
              target_scope: 'GROUPS',
              target_groups: {
                some: {
                  group: {
                    class_id: student.class_id,
                    members: {
                      some: {
                        student_id: student.id,
                      },
                    },
                  },
                },
              },
            },
            {
              target_scope: 'STUDENTS',
              target_students: {
                some: {
                  student_id: student.id,
                },
              },
            },
          ],
        },
        orderBy: { due_date: 'desc' },
      });

      return serializeAssignmentsWithTargets(assignments);
    }

    const where: Record<string, unknown> = {
      ...(query.class_id ? { class_id: Number(query.class_id) } : {}),
      ...(query.subject_id ? { subject_id: Number(query.subject_id) } : {}),
      ...(query.is_published !== undefined
        ? { is_published: query.is_published === true || query.is_published === 'true' || query.is_published === '1' }
        : {}),
    };

    const assignments = await prisma.assignment.findMany({ where, orderBy: { due_date: 'desc' } });
    return serializeAssignmentsWithTargets(assignments);
  });

  fastify.get('/my', { preHandler: [fastify.authenticate] }, async (request) => {
    const currentUser = request.currentUser!;

    if (currentUser.role === 'student') {
      const student = await prisma.studentProfile.findUnique({ where: { user_id: currentUser.id } });
      if (!student || !student.class_id) {
        return [];
      }

      const assignments = await prisma.assignment.findMany({
        where: {
          is_published: true,
          OR: [
            { target_scope: 'CLASS', class_id: student.class_id },
            {
              target_scope: 'GROUPS',
              target_groups: {
                some: {
                  group: {
                    class_id: student.class_id,
                    members: {
                      some: {
                        student_id: student.id,
                      },
                    },
                  },
                },
              },
            },
            {
              target_scope: 'STUDENTS',
              target_students: {
                some: {
                  student_id: student.id,
                },
              },
            },
          ],
        },
        orderBy: { due_date: 'desc' },
      });

      return serializeAssignmentsWithTargets(assignments);
    }

    const where: Record<string, unknown> = {};
    if (currentUser.role === 'teacher') {
      const teacher = await prisma.teacherProfile.findUnique({ where: { user_id: currentUser.id } });
      if (!teacher) {
        return [];
      }
      where.teacher_id = teacher.id;
    }

    const assignments = await prisma.assignment.findMany({ where, orderBy: { due_date: 'desc' } });
    return serializeAssignmentsWithTargets(assignments);
  });

  fastify.get('/targeting-options', { preHandler: [fastify.requireRoles(TEACHER_PLUS_ROLES, 'Teacher access required')] }, async (request) => {
    const query = request.query as { class_id?: string };
    const classId = parsePositiveInt(query.class_id ?? '', 'class_id is required');
    await assertTeacherHasClassAccess(request.currentUser!, classId);

    const [groups, students] = await Promise.all([
      prisma.assignmentGroup.findMany({
        where: { class_id: classId },
        include: {
          _count: {
            select: {
              members: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.studentProfile.findMany({
        where: { class_id: classId },
        include: {
          user: {
            select: {
              first_name: true,
              last_name: true,
            },
          },
        },
        orderBy: { id: 'asc' },
      }),
    ]);

    return {
      groups: groups.map((group) => ({
        id: group.id,
        name: group.name,
        members_count: group._count.members,
      })),
      students: students.map((student) => ({
        id: student.id,
        first_name: student.user.first_name,
        last_name: student.user.last_name,
      })),
    };
  });

  fastify.get('/my/submissions', { preHandler: [fastify.authenticate] }, async (request) => {
    const currentUser = request.currentUser!;
    if (currentUser.role !== 'student') {
      forbidden('Only students can view their submissions');
    }

    const student = await prisma.studentProfile.findUnique({ where: { user_id: currentUser.id } });
    if (!student) {
      badRequest('Student profile not found');
    }

    const submissions = await prisma.assignmentSubmission.findMany({
      where: { student_id: student.id },
      orderBy: [{ submitted_at: 'desc' }, { id: 'desc' }],
    });
    return submissions.map((submission) => serializeSubmission(submission));
  });

  fastify.get('/:assignment_id', { preHandler: [fastify.authenticate] }, async (request) => {
    const params = request.params as { assignment_id: string };
    const assignmentId = parsePositiveInt(params.assignment_id, 'Invalid assignment id');

    const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) {
      notFound('Assignment not found');
    }

    const currentUser = request.currentUser!;
    await assertCanViewAssignment(currentUser, assignment);

    const targets = await getAssignmentTargetPayload(assignment.id);
    return serializeAssignment(assignment, targets);
  });

  fastify.post('', { preHandler: [fastify.requireRoles(TEACHER_PLUS_ROLES, 'Teacher access required')] }, async (request, reply) => {
    const body = request.body as {
      title: string;
      description?: string;
      assignment_type?: AssignmentType;
      subject_id: number;
      class_id: number;
      due_date: string;
      max_points?: number;
      is_published?: boolean;
      target_scope?: AssignmentTargetScope;
      target_group_ids?: number[];
      target_student_ids?: number[];
    };

    const currentUser = request.currentUser!;
    const teacher = await prisma.teacherProfile.findUnique({ where: { user_id: currentUser.id } });
    if (!teacher) {
      badRequest('Teacher profile not found');
    }

    const targetScope = parseTargetScope(body.target_scope);
    const targetGroupIds = parseIdArray(body.target_group_ids, 'target_group_ids');
    const targetStudentIds = parseIdArray(body.target_student_ids, 'target_student_ids');
    await validateAssignmentTargets({
      scope: targetScope,
      classId: body.class_id,
      targetGroupIds,
      targetStudentIds,
    });

    const assignment = await prisma.assignment.create({
      data: {
        title: body.title,
        description: body.description ?? null,
        assignment_type: body.assignment_type ?? 'INDIVIDUAL',
        target_scope: targetScope,
        subject_id: body.subject_id,
        class_id: body.class_id,
        teacher_id: teacher.id,
        due_date: new Date(body.due_date),
        max_points: TEN_SCALE_MAX_POINTS,
        is_published: body.is_published ?? false,
        created_at: new Date(),
      },
    });

    if (targetScope === 'GROUPS' && targetGroupIds.length > 0) {
      await prisma.assignmentTargetGroup.createMany({
        data: targetGroupIds.map((groupId) => ({
          assignment_id: assignment.id,
          group_id: groupId,
        })),
        skipDuplicates: true,
      });
    }

    if (targetScope === 'STUDENTS' && targetStudentIds.length > 0) {
      await prisma.assignmentTargetStudent.createMany({
        data: targetStudentIds.map((studentId) => ({
          assignment_id: assignment.id,
          student_id: studentId,
        })),
        skipDuplicates: true,
      });
    }

    return reply.status(201).send(
      serializeAssignment(assignment, {
        target_group_ids: targetScope === 'GROUPS' ? targetGroupIds : [],
        target_student_ids: targetScope === 'STUDENTS' ? targetStudentIds : [],
      })
    );
  });

  fastify.put(
    '/:assignment_id',
    { preHandler: [fastify.requireRoles(TEACHER_PLUS_ROLES, 'Teacher access required')] },
    async (request) => {
      const params = request.params as { assignment_id: string };
      const body = request.body as {
        title?: string;
        description?: string;
        assignment_type?: AssignmentType;
        due_date?: string;
        max_points?: number;
        is_published?: boolean;
        target_scope?: AssignmentTargetScope;
        target_group_ids?: number[];
        target_student_ids?: number[];
      };

      const assignmentId = parsePositiveInt(params.assignment_id, 'Invalid assignment id');
      const currentUser = request.currentUser!;

      const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
      if (!assignment) {
        notFound('Assignment not found');
      }

      await assertTeacherOwnsAssignment(currentUser, assignment, 'Not authorized to update this assignment');

      const currentTargets = await getAssignmentTargetPayload(assignment.id);
      const nextScope = body.target_scope !== undefined ? parseTargetScope(body.target_scope) : assignment.target_scope;
      const nextGroupIds =
        body.target_group_ids !== undefined
          ? parseIdArray(body.target_group_ids, 'target_group_ids')
          : nextScope === 'GROUPS'
            ? currentTargets.target_group_ids
            : [];
      const nextStudentIds =
        body.target_student_ids !== undefined
          ? parseIdArray(body.target_student_ids, 'target_student_ids')
          : nextScope === 'STUDENTS'
            ? currentTargets.target_student_ids
            : [];

      await validateAssignmentTargets({
        scope: nextScope,
        classId: assignment.class_id,
        targetGroupIds: nextGroupIds,
        targetStudentIds: nextStudentIds,
      });

      const updated = await prisma.$transaction(async (tx) => {
        const saved = await tx.assignment.update({
          where: { id: assignmentId },
          data: {
            ...(body.title !== undefined ? { title: body.title } : {}),
            ...(body.description !== undefined ? { description: body.description } : {}),
            ...(body.assignment_type !== undefined ? { assignment_type: body.assignment_type } : {}),
            ...(body.due_date !== undefined ? { due_date: new Date(body.due_date) } : {}),
            target_scope: nextScope,
            max_points: TEN_SCALE_MAX_POINTS,
            ...(body.is_published !== undefined ? { is_published: body.is_published } : {}),
          },
        });

        await tx.assignmentTargetGroup.deleteMany({
          where: { assignment_id: assignmentId },
        });
        await tx.assignmentTargetStudent.deleteMany({
          where: { assignment_id: assignmentId },
        });

        if (nextScope === 'GROUPS' && nextGroupIds.length > 0) {
          await tx.assignmentTargetGroup.createMany({
            data: nextGroupIds.map((groupId) => ({
              assignment_id: assignmentId,
              group_id: groupId,
            })),
            skipDuplicates: true,
          });
        }

        if (nextScope === 'STUDENTS' && nextStudentIds.length > 0) {
          await tx.assignmentTargetStudent.createMany({
            data: nextStudentIds.map((studentId) => ({
              assignment_id: assignmentId,
              student_id: studentId,
            })),
            skipDuplicates: true,
          });
        }

        return saved;
      });

      return serializeAssignment(updated, {
        target_group_ids: nextScope === 'GROUPS' ? nextGroupIds : [],
        target_student_ids: nextScope === 'STUDENTS' ? nextStudentIds : [],
      });
    }
  );

  fastify.delete(
    '/:assignment_id',
    { preHandler: [fastify.requireRoles(TEACHER_PLUS_ROLES, 'Teacher access required')] },
    async (request, reply) => {
      const params = request.params as { assignment_id: string };
      const assignmentId = parsePositiveInt(params.assignment_id, 'Invalid assignment id');
      const currentUser = request.currentUser!;

      const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
      if (!assignment) {
        notFound('Assignment not found');
      }

      await assertTeacherOwnsAssignment(currentUser, assignment, 'Not authorized to delete this assignment');

      await prisma.$transaction(async (tx) => {
        await tx.assignmentTargetGroup.deleteMany({ where: { assignment_id: assignmentId } });
        await tx.assignmentTargetStudent.deleteMany({ where: { assignment_id: assignmentId } });
        await tx.assignment.delete({ where: { id: assignmentId } });
      });
      return reply.status(204).send();
    }
  );

  fastify.post('/:assignment_id/submit', { preHandler: [fastify.authenticate] }, async (request) => {
    const params = request.params as { assignment_id: string };
    const body = request.body as { content?: string; file_url?: string };

    const currentUser = request.currentUser!;
    if (currentUser.role !== 'student') {
      forbidden('Only students can submit assignments');
    }

    const assignmentId = parsePositiveInt(params.assignment_id, 'Invalid assignment id');
    const student = await prisma.studentProfile.findUnique({ where: { user_id: currentUser.id } });
    if (!student || !student.class_id) {
      badRequest('Student profile not found');
    }

    const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) {
      notFound('Assignment not found');
    }

    if (assignment.is_published !== true) {
      forbidden('Assignment is not published');
    }

    if (assignment.target_scope === 'CLASS' && assignment.class_id !== student.class_id) {
      forbidden('Assignment is not available for this class');
    }

    const canAccess = await isAssignmentVisibleForStudent(assignment, student.id, student.class_id);
    if (!canAccess) {
      forbidden('Assignment is not targeted to this student');
    }

    if (new Date() > assignment.due_date) {
      badRequest('Assignment submission deadline has passed');
    }

    const existing = await prisma.assignmentSubmission.findFirst({
      where: { assignment_id: assignmentId, student_id: student.id },
    });
    if (existing) {
      conflict('Already submitted this assignment');
    }

    try {
      const submission = await prisma.assignmentSubmission.create({
        data: {
          assignment_id: assignmentId,
          student_id: student.id,
          content: body.content ?? null,
          file_url: body.file_url ?? null,
          submitted_at: new Date(),
          created_at: new Date(),
        },
      });

      return serializeSubmission(submission);
    } catch (error) {
      const knownRequestError =
        error instanceof Prisma.PrismaClientKnownRequestError ||
        (typeof error === 'object' && error !== null && 'code' in error);
      if (knownRequestError && (error as { code?: string }).code === 'P2002') {
        conflict('Already submitted this assignment');
      }
      throw error;
    }
  });

  fastify.get(
    '/:assignment_id/submissions',
    { preHandler: [fastify.requireRoles(TEACHER_PLUS_ROLES, 'Teacher access required')] },
    async (request) => {
      const params = request.params as { assignment_id: string };
      const assignmentId = parsePositiveInt(params.assignment_id, 'Invalid assignment id');

      const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
      if (!assignment) {
        notFound('Assignment not found');
      }

      const currentUser = request.currentUser!;
      await assertTeacherOwnsAssignment(currentUser, assignment, 'Not authorized to view submissions for this assignment');

      const submissions = await prisma.assignmentSubmission.findMany({
        where: { assignment_id: assignmentId },
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
        orderBy: [{ submitted_at: 'desc' }, { id: 'desc' }],
      });
      return submissions.map((submission) =>
        serializeSubmission(submission, {
          student_first_name: submission.student.user.first_name,
          student_last_name: submission.student.user.last_name,
        })
      );
    }
  );

  fastify.put(
    '/:assignment_id/submissions/:submission_id',
    { preHandler: [fastify.requireRoles(TEACHER_PLUS_ROLES, 'Teacher access required')] },
    async (request) => {
      const params = request.params as { assignment_id: string; submission_id: string };
      const body = request.body as { points_earned: number; feedback?: string };

      const assignmentId = parsePositiveInt(params.assignment_id, 'Invalid assignment id');
      const submissionId = parsePositiveInt(params.submission_id, 'Invalid submission id');

      const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
      if (!assignment) {
        notFound('Assignment not found');
      }

      const currentUser = request.currentUser!;
      await assertTeacherOwnsAssignment(currentUser, assignment, 'Not authorized to grade submissions for this assignment');

      const maxPoints = TEN_SCALE_MAX_POINTS;
      const pointsEarned = parseTenScalePoints(body.points_earned);

      const submission = await prisma.assignmentSubmission.findFirst({
        where: {
          id: submissionId,
          assignment_id: assignmentId,
        },
      });
      if (!submission) {
        notFound('Submission not found');
      }

      const feedback = body.feedback?.trim() ? body.feedback.trim() : null;

      const updatedSubmission = await prisma.assignmentSubmission.update({
        where: { id: submissionId },
        data: {
          points_earned: pointsEarned,
          feedback,
          is_graded: true,
        },
      });

      const existingGrade = await prisma.grade.findFirst({
        where: {
          student_id: submission.student_id,
          reference_id: assignment.id,
          grade_type: 'Assignment',
        },
      });

      if (existingGrade) {
        await prisma.grade.update({
          where: { id: existingGrade.id },
          data: {
            grade_value: pointsEarned,
            max_value: maxPoints,
            comment: feedback,
            date: new Date(),
            subject_id: assignment.subject_id,
            teacher_id: assignment.teacher_id,
          },
        });
      } else {
        const createdGrade = await prisma.grade.create({
          data: {
            student_id: submission.student_id,
            subject_id: assignment.subject_id,
            teacher_id: assignment.teacher_id,
            grade_value: pointsEarned,
            max_value: maxPoints,
            grade_type: 'Assignment',
            reference_id: assignment.id,
            date: new Date(),
            comment: feedback,
            created_at: new Date(),
          },
        });
        await awardBonusPoints(createdGrade.student_id, tenToRatio(createdGrade.grade_value) * 100);
      }

      return serializeSubmission(updatedSubmission);
    }
  );
};

export default assignmentsRoutes;
