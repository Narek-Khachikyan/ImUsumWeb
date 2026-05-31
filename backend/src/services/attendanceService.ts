import type { AttendanceRecord, AttendanceStatus, DayOfWeek, User } from '@prisma/client';

import { env } from '../config/env.js';
import { badRequest, conflict, forbidden, notFound } from '../lib/errors.js';
import { prisma } from '../lib/prisma.js';
import { parseDateOnly, toDateOnlyString, toTimeOnlyString } from '../lib/time.js';

type GeoCheckInPayload = {
  latitude: number;
  longitude: number;
  accuracy_m?: number;
};

type AttendanceDay = {
  schedule_id: number;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  room: string | null;
  status: AttendanceStatus | 'PENDING';
  source: 'GEOLOCATION' | 'SYSTEM' | 'MANUAL_OVERRIDE' | null;
  checked_in_at: string | null;
  distance_m: number | null;
};

const DAY_BY_INDEX: DayOfWeek[] = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];

function dateOnlyUtc(value: Date): Date {
  return parseDateOnly(toDateOnlyString(value));
}

function combineDateAndTime(date: Date, time: Date): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      time.getUTCHours(),
      time.getUTCMinutes(),
      time.getUTCSeconds(),
      time.getUTCMilliseconds()
    )
  );
}

function minutesDiff(left: Date, right: Date): number {
  return (left.getTime() - right.getTime()) / 60000;
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const earthRadiusMeters = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMeters * c;
}

function resolveDayOfWeek(date: Date): DayOfWeek {
  return DAY_BY_INDEX[date.getUTCDay()]!;
}

function validateCoordinates(payload: GeoCheckInPayload): void {
  if (!Number.isFinite(payload.latitude) || payload.latitude < -90 || payload.latitude > 90) {
    badRequest('latitude must be a number between -90 and 90');
  }

  if (!Number.isFinite(payload.longitude) || payload.longitude < -180 || payload.longitude > 180) {
    badRequest('longitude must be a number between -180 and 180');
  }

  if (payload.accuracy_m !== undefined && (!Number.isFinite(payload.accuracy_m) || payload.accuracy_m < 0)) {
    badRequest('accuracy_m must be a positive number');
  }
}

async function getStudentContextByUserId(userId: number) {
  const student = await prisma.studentProfile.findUnique({
    where: { user_id: userId },
    include: {
      class_: {
        include: {
          school: true,
        },
      },
    },
  });

  if (!student || !student.class_id || !student.class_) {
    badRequest('Student profile not found');
  }

  const school = student.class_.school;
  if (!school || school.latitude === null || school.longitude === null) {
    badRequest('School geolocation is not configured');
  }

  return { student, school };
}

async function resolveTeacherProfileId(userId: number): Promise<number | null> {
  const teacher = await prisma.teacherProfile.findUnique({ where: { user_id: userId } });
  return teacher?.id ?? null;
}

async function assertCanAccessClass(user: User, classId: number): Promise<void> {
  if (user.role === 'director' || user.role === 'admin') {
    return;
  }

  if (user.role !== 'teacher') {
    forbidden('Not authorized to access class attendance');
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
    forbidden('Not authorized to access this class attendance');
  }
}

async function getClassSchedulesForDate(classId: number, attendanceDate: Date) {
  const dayOfWeek = resolveDayOfWeek(attendanceDate);
  return prisma.schedule.findMany({
    where: {
      class_id: classId,
      day_of_week: dayOfWeek,
      effective_from: { lte: attendanceDate },
      OR: [{ effective_to: null }, { effective_to: { gte: attendanceDate } }],
    },
    orderBy: { start_time: 'asc' },
  });
}

function getWindowCloseAt(scheduleStartAt: Date): Date {
  return new Date(scheduleStartAt.getTime() + env.GEOLOCATION_CHECKIN_AFTER_MINUTES * 60_000);
}

async function materializeAbsencesForClass(classId: number, attendanceDate: Date, now: Date): Promise<void> {
  const schedules = await getClassSchedulesForDate(classId, attendanceDate);
  if (schedules.length === 0) {
    return;
  }

  const students = await prisma.studentProfile.findMany({
    where: { class_id: classId },
    select: { id: true },
  });
  if (students.length === 0) {
    return;
  }

  const attendanceDateOnly = dateOnlyUtc(attendanceDate);
  const scheduleIds = schedules.map((item) => item.id);
  const studentIds = students.map((item) => item.id);

  const existing = await prisma.attendanceRecord.findMany({
    where: {
      attendance_date: attendanceDateOnly,
      schedule_id: { in: scheduleIds },
      student_id: { in: studentIds },
    },
    select: {
      schedule_id: true,
      student_id: true,
    },
  });

  const existingSet = new Set(existing.map((item) => `${item.student_id}:${item.schedule_id}`));
  const today = dateOnlyUtc(now);
  const isPastDate = attendanceDateOnly.getTime() < today.getTime();

  const rowsToCreate: Array<{
    student_id: number;
    schedule_id: number;
    attendance_date: Date;
    status: AttendanceStatus;
    source: 'SYSTEM';
  }> = [];

  for (const schedule of schedules) {
    const scheduleStartAt = combineDateAndTime(attendanceDateOnly, schedule.start_time);
    const shouldMaterializeForSchedule = isPastDate || now.getTime() >= getWindowCloseAt(scheduleStartAt).getTime();
    if (!shouldMaterializeForSchedule) {
      continue;
    }

    for (const studentId of studentIds) {
      const key = `${studentId}:${schedule.id}`;
      if (existingSet.has(key)) {
        continue;
      }
      rowsToCreate.push({
        student_id: studentId,
        schedule_id: schedule.id,
        attendance_date: attendanceDateOnly,
        status: 'ABSENT',
        source: 'SYSTEM',
      });
    }
  }

  if (rowsToCreate.length > 0) {
    await prisma.attendanceRecord.createMany({
      data: rowsToCreate,
      skipDuplicates: true,
    });
  }
}

export async function checkInByGeolocation(currentUser: User, payload: GeoCheckInPayload): Promise<AttendanceRecord> {
  if (currentUser.role !== 'student') {
    forbidden('Only students can check in attendance');
  }

  validateCoordinates(payload);

  const now = new Date();
  const nowDateOnly = dateOnlyUtc(now);

  const { student, school } = await getStudentContextByUserId(currentUser.id);
  const schedules = await getClassSchedulesForDate(student.class_id!, nowDateOnly);
  if (schedules.length === 0) {
    badRequest('No active schedule found for attendance check-in');
  }

  const candidate = schedules
    .map((schedule) => {
      const scheduleStartAt = combineDateAndTime(nowDateOnly, schedule.start_time);
      const diffMin = minutesDiff(now, scheduleStartAt);
      return {
        schedule,
        scheduleStartAt,
        diffMin,
      };
    })
    .filter(
      (item) =>
        item.diffMin >= -env.GEOLOCATION_CHECKIN_BEFORE_MINUTES && item.diffMin <= env.GEOLOCATION_CHECKIN_AFTER_MINUTES
    )
    .sort((left, right) => Math.abs(left.diffMin) - Math.abs(right.diffMin))[0];

  if (!candidate) {
    badRequest('Check-in is only available around lesson start time');
  }

  const distanceMeters = haversineDistanceMeters(payload.latitude, payload.longitude, school.latitude!, school.longitude!);
  if (distanceMeters > env.GEOLOCATION_RADIUS_METERS) {
    badRequest('Outside school geolocation radius');
  }

  const existing = await prisma.attendanceRecord.findFirst({
    where: {
      student_id: student.id,
      schedule_id: candidate.schedule.id,
      attendance_date: nowDateOnly,
    },
  });
  if (existing) {
    conflict('Attendance already checked in for this lesson');
  }

  return prisma.attendanceRecord.create({
    data: {
      student_id: student.id,
      schedule_id: candidate.schedule.id,
      attendance_date: nowDateOnly,
      checked_in_at: now,
      status: candidate.diffMin > 0 ? 'LATE' : 'PRESENT',
      source: 'GEOLOCATION',
      latitude: payload.latitude,
      longitude: payload.longitude,
      accuracy_m: payload.accuracy_m ?? null,
      distance_m: Math.round(distanceMeters * 100) / 100,
    },
  });
}

export async function getMyAttendanceForDate(currentUser: User, date: Date): Promise<AttendanceDay[]> {
  if (currentUser.role !== 'student') {
    forbidden('Only students can view own attendance');
  }

  const attendanceDate = dateOnlyUtc(date);
  const { student } = await getStudentContextByUserId(currentUser.id);
  await materializeAbsencesForClass(student.class_id!, attendanceDate, new Date());

  const schedules = await getClassSchedulesForDate(student.class_id!, attendanceDate);
  if (schedules.length === 0) {
    return [];
  }

  const records = await prisma.attendanceRecord.findMany({
    where: {
      student_id: student.id,
      attendance_date: attendanceDate,
      schedule_id: { in: schedules.map((item) => item.id) },
    },
  });
  const byScheduleId = new Map(records.map((item) => [item.schedule_id, item]));

  return schedules.map((schedule) => {
    const record = byScheduleId.get(schedule.id);
    return {
      schedule_id: schedule.id,
      day_of_week: schedule.day_of_week,
      start_time: toTimeOnlyString(schedule.start_time),
      end_time: toTimeOnlyString(schedule.end_time),
      room: schedule.room,
      status: record?.status ?? 'PENDING',
      source: record?.source ?? null,
      checked_in_at: record?.checked_in_at ? record.checked_in_at.toISOString() : null,
      distance_m: record?.distance_m ?? null,
    };
  });
}

export async function getClassAttendanceForDate(currentUser: User, classId: number, date: Date) {
  await assertCanAccessClass(currentUser, classId);

  const attendanceDate = dateOnlyUtc(date);
  await materializeAbsencesForClass(classId, attendanceDate, new Date());

  const rows = await prisma.attendanceRecord.findMany({
    where: {
      attendance_date: attendanceDate,
      schedule: {
        class_id: classId,
      },
    },
    include: {
      schedule: true,
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
    orderBy: [{ schedule_id: 'asc' }, { student_id: 'asc' }],
  });

  return rows.map((row) => ({
    id: row.id,
    student_id: row.student_id,
    student_first_name: row.student.user.first_name,
    student_last_name: row.student.user.last_name,
    schedule_id: row.schedule_id,
    day_of_week: row.schedule.day_of_week,
    start_time: toTimeOnlyString(row.schedule.start_time),
    end_time: toTimeOnlyString(row.schedule.end_time),
    room: row.schedule.room,
    attendance_date: toDateOnlyString(row.attendance_date),
    checked_in_at: row.checked_in_at ? row.checked_in_at.toISOString() : null,
    status: row.status,
    source: row.source,
    distance_m: row.distance_m,
    accuracy_m: row.accuracy_m,
  }));
}

export async function overrideAttendanceStatus(
  currentUser: User,
  recordId: number,
  nextStatus: AttendanceStatus,
  reason?: string
) {
  const record = await prisma.attendanceRecord.findUnique({
    where: { id: recordId },
    include: {
      schedule: true,
    },
  });
  if (!record) {
    notFound('Attendance record not found');
  }

  await assertCanAccessClass(currentUser, record.schedule.class_id);

  const trimmedReason = reason?.trim() || null;
  const previousStatus = record.status;

  return prisma.$transaction(async (tx) => {
    await tx.attendanceOverride.create({
      data: {
        attendance_record_id: record.id,
        changed_by_user_id: currentUser.id,
        previous_status: previousStatus,
        new_status: nextStatus,
        reason: trimmedReason,
      },
    });

    return tx.attendanceRecord.update({
      where: { id: record.id },
      data: {
        status: nextStatus,
        source: 'MANUAL_OVERRIDE',
      },
    });
  });
}
