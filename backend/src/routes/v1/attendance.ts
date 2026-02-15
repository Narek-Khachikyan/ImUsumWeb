import type { AttendanceStatus } from '@prisma/client';
import type { FastifyPluginAsync } from 'fastify';

import { TEACHER_PLUS_ROLES } from '../../lib/auth.js';
import { badRequest } from '../../lib/errors.js';
import {
  checkInByGeolocation,
  getClassAttendanceForDate,
  getMyAttendanceForDate,
  overrideAttendanceStatus,
} from '../../services/attendanceService.js';

function parsePositiveInt(value: string, detail: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    badRequest(detail);
  }
  return parsed;
}

function parseDateParam(value: unknown): Date {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return new Date();
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    badRequest('date must be in YYYY-MM-DD format');
  }
  return parsed;
}

function parseAttendanceStatus(value: unknown): AttendanceStatus {
  if (value === 'PRESENT' || value === 'LATE' || value === 'ABSENT' || value === 'EXCUSED') {
    return value;
  }
  badRequest('status must be one of PRESENT, LATE, ABSENT, EXCUSED');
}

const attendanceRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/check-in', { preHandler: [fastify.authenticate] }, async (request) => {
    const body = request.body as {
      latitude: number;
      longitude: number;
      accuracy_m?: number;
    };

    const created = await checkInByGeolocation(request.currentUser!, body);
    return {
      id: created.id,
      student_id: created.student_id,
      schedule_id: created.schedule_id,
      attendance_date: created.attendance_date.toISOString().slice(0, 10),
      checked_in_at: created.checked_in_at ? created.checked_in_at.toISOString() : null,
      status: created.status,
      source: created.source,
      distance_m: created.distance_m,
      accuracy_m: created.accuracy_m,
    };
  });

  fastify.get('/my', { preHandler: [fastify.authenticate] }, async (request) => {
    const query = request.query as { date?: string };
    const attendanceDate = parseDateParam(query.date);
    return getMyAttendanceForDate(request.currentUser!, attendanceDate);
  });

  fastify.get('/class', { preHandler: [fastify.requireRoles(TEACHER_PLUS_ROLES, 'Teacher access required')] }, async (request) => {
    const query = request.query as { class_id?: string; date?: string };
    const classId = parsePositiveInt(query.class_id ?? '', 'class_id is required');
    const attendanceDate = parseDateParam(query.date);
    return getClassAttendanceForDate(request.currentUser!, classId, attendanceDate);
  });

  fastify.post(
    '/:record_id/override',
    { preHandler: [fastify.requireRoles(TEACHER_PLUS_ROLES, 'Teacher access required')] },
    async (request) => {
      const params = request.params as { record_id: string };
      const body = request.body as { status: AttendanceStatus; reason?: string };
      const recordId = parsePositiveInt(params.record_id, 'Invalid attendance record id');
      const status = parseAttendanceStatus(body.status);

      const updated = await overrideAttendanceStatus(request.currentUser!, recordId, status, body.reason);
      return {
        id: updated.id,
        student_id: updated.student_id,
        schedule_id: updated.schedule_id,
        attendance_date: updated.attendance_date.toISOString().slice(0, 10),
        checked_in_at: updated.checked_in_at ? updated.checked_in_at.toISOString() : null,
        status: updated.status,
        source: updated.source,
      };
    }
  );
};

export default attendanceRoutes;
