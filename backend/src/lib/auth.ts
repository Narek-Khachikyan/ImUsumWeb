import type { UserRole } from '@prisma/client';

export type JwtPayload = {
  sub: string;
  type: 'access' | 'refresh';
  ver: number;
  exp?: number;
  iat?: number;
};

export const STUDENT_PLUS_ROLES: UserRole[] = ['student', 'teacher', 'director', 'admin'];
export const TEACHER_PLUS_ROLES: UserRole[] = ['teacher', 'director', 'admin'];
export const DIRECTOR_PLUS_ROLES: UserRole[] = ['director', 'admin'];
