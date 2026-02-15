import type { StudentProfile, User } from '@prisma/client';

import { env } from '../config/env.js';
import { badRequest, forbidden } from '../lib/errors.js';
import { prisma } from '../lib/prisma.js';
import { parseDateOnly } from '../lib/time.js';

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

function resolveLookbackStartDate(now: Date): Date {
  const lookbackMs = env.BEST_STUDENT_LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
  return parseDateOnly(new Date(now.getTime() - lookbackMs).toISOString().slice(0, 10));
}

export async function getStudentProfileByUser(user: User): Promise<StudentProfile> {
  if (user.role !== 'student') {
    forbidden('Only students can access this endpoint');
  }

  const profile = await prisma.studentProfile.findUnique({ where: { user_id: user.id } });
  if (!profile) {
    badRequest('Student profile not found');
  }
  return profile;
}

export async function resolveStudentEligibility(studentId: number): Promise<{
  eligible: boolean;
  source: 'auto' | 'manual_override';
  average_grade: number | null;
  grade_count: number;
  threshold: number;
  lookback_days: number;
  minimum_grades: number;
  reason: string;
}> {
  const override = await prisma.jobEligibilityOverride.findUnique({
    where: { student_id: studentId },
  });
  if (override) {
    return {
      eligible: override.eligible,
      source: 'manual_override',
      average_grade: null,
      grade_count: 0,
      threshold: env.BEST_STUDENT_GRADE_THRESHOLD,
      lookback_days: env.BEST_STUDENT_LOOKBACK_DAYS,
      minimum_grades: env.BEST_STUDENT_MIN_GRADES,
      reason: override.reason?.trim() || 'Eligibility set manually',
    };
  }

  const now = new Date();
  const lookbackStart = resolveLookbackStartDate(now);
  const grades = await prisma.grade.findMany({
    where: {
      student_id: studentId,
      date: {
        gte: lookbackStart,
      },
    },
    select: {
      grade_value: true,
    },
  });
  const gradeCount = grades.length;
  const average = gradeCount > 0 ? roundTo2(grades.reduce((sum, item) => sum + item.grade_value, 0) / gradeCount) : null;
  const hasEnoughGrades = gradeCount >= env.BEST_STUDENT_MIN_GRADES;
  const isEligible = hasEnoughGrades && average !== null && average >= env.BEST_STUDENT_GRADE_THRESHOLD;

  return {
    eligible: isEligible,
    source: 'auto',
    average_grade: average,
    grade_count: gradeCount,
    threshold: env.BEST_STUDENT_GRADE_THRESHOLD,
    lookback_days: env.BEST_STUDENT_LOOKBACK_DAYS,
    minimum_grades: env.BEST_STUDENT_MIN_GRADES,
    reason: isEligible
      ? 'Student meets automatic eligibility requirements'
      : hasEnoughGrades
        ? `Average grade is below ${env.BEST_STUDENT_GRADE_THRESHOLD}`
        : `At least ${env.BEST_STUDENT_MIN_GRADES} grades are required in the lookback period`,
  };
}
