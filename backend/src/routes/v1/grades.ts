import type { FastifyPluginAsync } from 'fastify';

import { TEACHER_PLUS_ROLES } from '../../lib/auth.js';
import { badRequest, forbidden, notFound } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';
import { serializeGrade } from '../../lib/serializers.js';
import { parseDateOnly } from '../../lib/time.js';

const GRADE_BONUS_THRESHOLDS: Array<{ threshold: number; points: number }> = [
  { threshold: 90, points: 10 },
  { threshold: 80, points: 5 },
  { threshold: 70, points: 2 },
];

async function awardBonusPoints(studentId: number, gradeValue: number, maxValue: number): Promise<number> {
  if (maxValue <= 0) {
    return 0;
  }

  const percentage = (gradeValue / maxValue) * 100;
  for (const { threshold, points } of GRADE_BONUS_THRESHOLDS) {
    if (percentage >= threshold) {
      await prisma.studentProfile.update({
        where: { id: studentId },
        data: {
          bonus_points: {
            increment: points,
          },
        },
      });
      return points;
    }
  }
  return 0;
}

const gradesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('', { preHandler: [fastify.authenticate] }, async (request) => {
    const query = request.query as { student_id?: string | number; subject_id?: string | number };

    const grades = await prisma.grade.findMany({
      where: {
        ...(query.student_id ? { student_id: Number(query.student_id) } : {}),
        ...(query.subject_id ? { subject_id: Number(query.subject_id) } : {}),
      },
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

    const grade = await prisma.grade.create({
      data: {
        student_id: body.student_id,
        subject_id: body.subject_id,
        teacher_id: teacher.id,
        grade_value: body.grade_value,
        max_value: body.max_value ?? 100,
        grade_type: body.grade_type,
        reference_id: body.reference_id ?? null,
        date: parseDateOnly(body.date),
        comment: body.comment ?? null,
      },
    });

    await awardBonusPoints(grade.student_id, grade.grade_value, grade.max_value);
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

      const updated = await prisma.grade.update({
        where: { id: gradeId },
        data: {
          ...(body.grade_value !== undefined ? { grade_value: body.grade_value } : {}),
          ...(body.max_value !== undefined ? { max_value: body.max_value } : {}),
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
