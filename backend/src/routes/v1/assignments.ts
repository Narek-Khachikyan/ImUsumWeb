import { Prisma, type Assignment, type AssignmentType, type User } from '@prisma/client';
import type { FastifyPluginAsync } from 'fastify';

import { TEACHER_PLUS_ROLES } from '../../lib/auth.js';
import { badRequest, conflict, forbidden, notFound } from '../../lib/errors.js';
import { awardBonusPoints } from '../../lib/gradeBonus.js';
import { prisma } from '../../lib/prisma.js';
import { serializeAssignment, serializeSubmission } from '../../lib/serializers.js';

function parsePositiveInt(value: string, detail: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    badRequest(detail);
  }
  return parsed;
}

async function getTeacherProfileId(userId: number): Promise<number | null> {
  const teacher = await prisma.teacherProfile.findUnique({ where: { user_id: userId } });
  return teacher?.id ?? null;
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

    if (student.class_id !== assignment.class_id) {
      forbidden('Assignment is not available for this class');
    }
    return;
  }

  forbidden('Not authorized to view this assignment');
}

const assignmentsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('', { preHandler: [fastify.authenticate] }, async (request) => {
    const query = request.query as {
      class_id?: string | number;
      subject_id?: string | number;
      is_published?: string | boolean;
    };
    const currentUser = request.currentUser!;

    const where: Record<string, unknown> = {
      ...(query.class_id ? { class_id: Number(query.class_id) } : {}),
      ...(query.subject_id ? { subject_id: Number(query.subject_id) } : {}),
      ...(query.is_published !== undefined
        ? { is_published: query.is_published === true || query.is_published === 'true' || query.is_published === '1' }
        : {}),
    };

    if (currentUser.role === 'student') {
      where.is_published = true;
    }

    const assignments = await prisma.assignment.findMany({
      where,
      orderBy: { due_date: 'desc' },
    });

    return assignments.map(serializeAssignment);
  });

  fastify.get('/my', { preHandler: [fastify.authenticate] }, async (request) => {
    const currentUser = request.currentUser!;
    const where: Record<string, unknown> = {};

    if (currentUser.role === 'student') {
      const student = await prisma.studentProfile.findUnique({ where: { user_id: currentUser.id } });
      if (!student || !student.class_id) {
        return [];
      }
      where.class_id = student.class_id;
      where.is_published = true;
    } else if (currentUser.role === 'teacher') {
      const teacher = await prisma.teacherProfile.findUnique({ where: { user_id: currentUser.id } });
      if (!teacher) {
        return [];
      }
      where.teacher_id = teacher.id;
    }

    const assignments = await prisma.assignment.findMany({ where, orderBy: { due_date: 'desc' } });
    return assignments.map(serializeAssignment);
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

    return serializeAssignment(assignment);
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
    };

    const currentUser = request.currentUser!;
    const teacher = await prisma.teacherProfile.findUnique({ where: { user_id: currentUser.id } });
    if (!teacher) {
      badRequest('Teacher profile not found');
    }

    const assignment = await prisma.assignment.create({
      data: {
        title: body.title,
        description: body.description ?? null,
        assignment_type: body.assignment_type ?? 'INDIVIDUAL',
        subject_id: body.subject_id,
        class_id: body.class_id,
        teacher_id: teacher.id,
        due_date: new Date(body.due_date),
        max_points: body.max_points ?? 100,
        is_published: body.is_published ?? false,
        created_at: new Date(),
      },
    });

    return reply.status(201).send(serializeAssignment(assignment));
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
      };

      const assignmentId = parsePositiveInt(params.assignment_id, 'Invalid assignment id');
      const currentUser = request.currentUser!;

      const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
      if (!assignment) {
        notFound('Assignment not found');
      }

      await assertTeacherOwnsAssignment(currentUser, assignment, 'Not authorized to update this assignment');

      const updated = await prisma.assignment.update({
        where: { id: assignmentId },
        data: {
          ...(body.title !== undefined ? { title: body.title } : {}),
          ...(body.description !== undefined ? { description: body.description } : {}),
          ...(body.assignment_type !== undefined ? { assignment_type: body.assignment_type } : {}),
          ...(body.due_date !== undefined ? { due_date: new Date(body.due_date) } : {}),
          ...(body.max_points !== undefined ? { max_points: body.max_points } : {}),
          ...(body.is_published !== undefined ? { is_published: body.is_published } : {}),
        },
      });

      return serializeAssignment(updated);
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

      await prisma.assignment.delete({ where: { id: assignmentId } });
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

    if (student.class_id !== assignment.class_id) {
      forbidden('Assignment is not available for this class');
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

      const maxPoints = assignment.max_points ?? 100;
      const pointsEarned = Number(body.points_earned);
      if (!Number.isFinite(pointsEarned) || pointsEarned < 0 || pointsEarned > maxPoints) {
        badRequest(`points_earned must be between 0 and ${maxPoints}`);
      }

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
        await awardBonusPoints(createdGrade.student_id, createdGrade.grade_value, createdGrade.max_value ?? maxPoints);
      }

      return serializeSubmission(updatedSubmission);
    }
  );
};

export default assignmentsRoutes;
