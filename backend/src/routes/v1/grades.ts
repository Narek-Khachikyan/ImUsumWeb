import type { FastifyPluginAsync } from 'fastify';

import { TEACHER_PLUS_ROLES } from '../../lib/auth.js';
import { badRequest, forbidden, notFound } from '../../lib/errors.js';
import { awardBonusPoints } from '../../lib/gradeBonus.js';
import { assertTenGrade, tenToRatio } from '../../lib/gradingScale.js';
import { prisma } from '../../lib/prisma.js';
import { serializeGrade } from '../../lib/serializers.js';
import { parseDateOnly } from '../../lib/time.js';

const TEN_SCALE_MAX_VALUE = 10;

function parseTenScaleGrade(value: unknown, fieldName = 'grade_value'): number {
  const parsed = Number(value);
  try {
    assertTenGrade(parsed);
  } catch {
    badRequest(`${fieldName} must be an integer between 2 and 10`);
  }
  return parsed;
}

function assertTenScaleMaxValue(value: unknown): void {
  if (value === undefined || value === null) {
    return;
  }

  if (Number(value) !== TEN_SCALE_MAX_VALUE) {
    badRequest('max_value must be 10');
  }
}

const gradesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('', { preHandler: [fastify.authenticate] }, async (request) => {
    const query = request.query as { student_id?: string | number; subject_id?: string | number };
    const currentUser = request.currentUser!;
    const where: Record<string, unknown> = {
      ...(query.subject_id ? { subject_id: Number(query.subject_id) } : {}),
    };

    if (currentUser.role === 'student') {
      const student = await prisma.studentProfile.findUnique({ where: { user_id: currentUser.id } });
      if (!student) {
        badRequest('Student profile not found');
      }
      where.student_id = student.id;
    } else if (query.student_id) {
      where.student_id = Number(query.student_id);
    }

    const grades = await prisma.grade.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    return grades.map(serializeGrade);
  });

  fastify.get('/my', { preHandler: [fastify.authenticate] }, async (request) => {
    const query = request.query as { subject_id?: string | number };
    const currentUser = request.currentUser!;

    if (currentUser.role !== 'student') {
      forbidden('Only students can view their grades');
    }

    const student = await prisma.studentProfile.findUnique({ where: { user_id: currentUser.id } });
    if (!student) {
      badRequest('Student profile not found');
    }

    const grades = await prisma.grade.findMany({
      where: {
        student_id: student.id,
        ...(query.subject_id ? { subject_id: Number(query.subject_id) } : {}),
      },
      orderBy: { date: 'desc' },
    });

    return grades.map(serializeGrade);
  });

  fastify.get('/summary', { preHandler: [fastify.authenticate] }, async (request) => {
    const currentUser = request.currentUser!;

    if (currentUser.role !== 'student') {
      forbidden('Only students can view grade summary');
    }

    const student = await prisma.studentProfile.findUnique({ where: { user_id: currentUser.id } });
    if (!student) {
      badRequest('Student profile not found');
    }

    const grades = await prisma.grade.findMany({
      where: { student_id: student.id },
      include: { subject: true },
    });

    const grouped = new Map<number, { subject_name: string; values: number[] }>();
    for (const grade of grades) {
      const entry = grouped.get(grade.subject_id) ?? {
        subject_name: grade.subject.name,
        values: [],
      };
      entry.values.push(grade.grade_value);
      grouped.set(grade.subject_id, entry);
    }

    return Array.from(grouped.entries()).map(([subject_id, value]) => {
      const total_grades = value.values.length;
      const average = total_grades > 0 ? value.values.reduce((acc, item) => acc + item, 0) / total_grades : 0;
      const highest = total_grades > 0 ? Math.max(...value.values) : 0;
      const lowest = total_grades > 0 ? Math.min(...value.values) : 0;

      return {
        subject_id,
        subject_name: value.subject_name,
        average: Math.round(average * 100) / 100,
        total_grades,
        highest,
        lowest,
      };
    });
  });

  fastify.post('', { preHandler: [fastify.requireRoles(TEACHER_PLUS_ROLES, 'Teacher access required')] }, async (request, reply) => {
    const body = request.body as {
      student_id: number;
      subject_id: number;
      grade_value: number;
      max_value?: number;
      grade_type: string;
      reference_id?: number;
      date: string;
      comment?: string;
    };

    const currentUser = request.currentUser!;
    const teacher = await prisma.teacherProfile.findUnique({ where: { user_id: currentUser.id } });
    if (!teacher) {
      badRequest('Teacher profile not found');
    }
    assertTenScaleMaxValue(body.max_value);
    const gradeValue = parseTenScaleGrade(body.grade_value);

    const grade = await prisma.grade.create({
      data: {
        student_id: body.student_id,
        subject_id: body.subject_id,
        teacher_id: teacher.id,
        grade_value: gradeValue,
        max_value: TEN_SCALE_MAX_VALUE,
        grade_type: body.grade_type,
        reference_id: body.reference_id ?? null,
        date: parseDateOnly(body.date),
        comment: body.comment ?? null,
      },
    });

    await awardBonusPoints(grade.student_id, tenToRatio(grade.grade_value) * 100);
    return reply.status(201).send(serializeGrade(grade));
  });

  fastify.put(
    '/:grade_id',
    { preHandler: [fastify.requireRoles(TEACHER_PLUS_ROLES, 'Teacher access required')] },
    async (request) => {
      const params = request.params as { grade_id: string };
      const body = request.body as {
        grade_value?: number;
        max_value?: number;
        comment?: string;
      };

      const gradeId = Number(params.grade_id);
      const grade = await prisma.grade.findUnique({ where: { id: gradeId } });
      if (!grade) {
        notFound('Grade not found');
      }
      assertTenScaleMaxValue(body.max_value);
      const nextGradeValue = body.grade_value !== undefined ? parseTenScaleGrade(body.grade_value) : undefined;

      const updated = await prisma.grade.update({
        where: { id: gradeId },
        data: {
          max_value: TEN_SCALE_MAX_VALUE,
          ...(nextGradeValue !== undefined ? { grade_value: nextGradeValue } : {}),
          ...(body.comment !== undefined ? { comment: body.comment } : {}),
        },
      });

      return serializeGrade(updated);
    }
  );

  fastify.delete(
    '/:grade_id',
    { preHandler: [fastify.requireRoles(TEACHER_PLUS_ROLES, 'Teacher access required')] },
    async (request, reply) => {
      const params = request.params as { grade_id: string };
      const gradeId = Number(params.grade_id);

      const grade = await prisma.grade.findUnique({ where: { id: gradeId } });
      if (!grade) {
        notFound('Grade not found');
      }

      await prisma.grade.delete({ where: { id: gradeId } });
      return reply.status(204).send();
    }
  );
};

export default gradesRoutes;
