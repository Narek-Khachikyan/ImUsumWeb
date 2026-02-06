import type { AssignmentType } from '@prisma/client';
import type { FastifyPluginAsync } from 'fastify';

import { TEACHER_PLUS_ROLES } from '../../lib/auth.js';
import { badRequest, conflict, forbidden, notFound } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';
import { serializeAssignment, serializeSubmission } from '../../lib/serializers.js';

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

  fastify.get('/:assignment_id', { preHandler: [fastify.authenticate] }, async (request) => {
    const params = request.params as { assignment_id: string };
    const assignmentId = Number(params.assignment_id);

    const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) {
      notFound('Assignment not found');
    }

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
        assignment_type: body.assignment_type ?? 'individual',
        subject_id: body.subject_id,
        class_id: body.class_id,
        teacher_id: teacher.id,
        due_date: new Date(body.due_date),
        max_points: body.max_points ?? 100,
        is_published: body.is_published ?? false,
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

      const assignmentId = Number(params.assignment_id);
      const currentUser = request.currentUser!;

      const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
      if (!assignment) {
        notFound('Assignment not found');
      }

      const teacher = await prisma.teacherProfile.findUnique({ where: { user_id: currentUser.id } });
      if (teacher && assignment.teacher_id !== teacher.id && !['director', 'admin'].includes(currentUser.role)) {
        forbidden('Not authorized to update this assignment');
      }

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
      const assignmentId = Number(params.assignment_id);

      const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
      if (!assignment) {
        notFound('Assignment not found');
      }

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

    const assignmentId = Number(params.assignment_id);
    const student = await prisma.studentProfile.findUnique({ where: { user_id: currentUser.id } });
    if (!student) {
      badRequest('Student profile not found');
    }

    const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) {
      notFound('Assignment not found');
    }

    const existing = await prisma.assignmentSubmission.findFirst({
      where: { assignment_id: assignmentId, student_id: student.id },
    });
    if (existing) {
      conflict('Already submitted this assignment');
    }

    const submission = await prisma.assignmentSubmission.create({
      data: {
        assignment_id: assignmentId,
        student_id: student.id,
        content: body.content ?? null,
        file_url: body.file_url ?? null,
        submitted_at: new Date(),
      },
    });

    return serializeSubmission(submission);
  });

  fastify.get(
    '/:assignment_id/submissions',
    { preHandler: [fastify.requireRoles(TEACHER_PLUS_ROLES, 'Teacher access required')] },
    async (request) => {
      const params = request.params as { assignment_id: string };
      const assignmentId = Number(params.assignment_id);

      const submissions = await prisma.assignmentSubmission.findMany({ where: { assignment_id: assignmentId } });
      return submissions.map(serializeSubmission);
    }
  );

  fastify.put(
    '/:assignment_id/submissions/:submission_id',
    { preHandler: [fastify.requireRoles(TEACHER_PLUS_ROLES, 'Teacher access required')] },
    async (request) => {
      const params = request.params as { assignment_id: string; submission_id: string };
      const body = request.body as { points_earned: number; feedback?: string };

      const assignmentId = Number(params.assignment_id);
      const submissionId = Number(params.submission_id);

      const submission = await prisma.assignmentSubmission.findFirst({
        where: {
          id: submissionId,
          assignment_id: assignmentId,
        },
      });
      if (!submission) {
        notFound('Submission not found');
      }

      const updated = await prisma.assignmentSubmission.update({
        where: { id: submissionId },
        data: {
          points_earned: body.points_earned,
          feedback: body.feedback ?? null,
          is_graded: true,
        },
      });

      return serializeSubmission(updated);
    }
  );
};

export default assignmentsRoutes;
