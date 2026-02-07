import { prisma } from './prisma.js';

const GRADE_BONUS_THRESHOLDS: Array<{ threshold: number; points: number }> = [
  { threshold: 90, points: 10 },
  { threshold: 80, points: 5 },
  { threshold: 70, points: 2 },
];

export async function awardBonusPoints(studentId: number, gradeValue: number, maxValue: number): Promise<number> {
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
