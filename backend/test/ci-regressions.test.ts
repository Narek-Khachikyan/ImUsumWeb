import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const backendRoot = new URL('..', import.meta.url).pathname;
const repoRoot = new URL('../..', import.meta.url).pathname;

describe('CI regression guardrails', () => {
  it('starts Prisma migrations with a baseline that creates core auth tables', () => {
    const migrationsDir = join(backendRoot, 'prisma', 'migrations');
    const migrationNames = readdirSync(migrationsDir)
      .filter((entry) => !entry.startsWith('.'))
      .sort();

    expect(migrationNames[0]).toBeDefined();

    const firstMigration = readFileSync(join(migrationsDir, migrationNames[0]!, 'migration.sql'), 'utf8');

    expect(firstMigration).toContain('CREATE TABLE IF NOT EXISTS "users"');
    expect(firstMigration).toContain('CREATE TABLE IF NOT EXISTS "student_profiles"');
    expect(firstMigration).toContain('CREATE TABLE IF NOT EXISTS "teacher_profiles"');
    expect(firstMigration).toContain('CREATE TABLE IF NOT EXISTS "password_reset_tokens"');
  });

  it('keeps the Prisma baseline safe for databases that already have legacy tables', () => {
    const migrationsDir = join(backendRoot, 'prisma', 'migrations');
    const migrationNames = readdirSync(migrationsDir)
      .filter((entry) => !entry.startsWith('.'))
      .sort();
    const firstMigration = readFileSync(join(migrationsDir, migrationNames[0]!, 'migration.sql'), 'utf8');

    expect(firstMigration).toContain('pg_type');
    expect(firstMigration).toContain('CREATE TABLE IF NOT EXISTS "users"');
    expect(firstMigration).toContain('CREATE UNIQUE INDEX IF NOT EXISTS "ix_users_email"');
    expect(firstMigration).toContain('pg_constraint');
    expect(firstMigration).not.toMatch(/^CREATE TYPE /m);
    expect(firstMigration).not.toMatch(/^CREATE TABLE "/m);
    expect(firstMigration).not.toMatch(/^CREATE(?: UNIQUE)? INDEX "/m);
    expect(firstMigration).not.toMatch(/^ALTER TABLE .* ADD CONSTRAINT/m);
  });

  it('does not rely on Prisma DayOfWeek as a runtime export in attendance service', () => {
    const attendanceService = readFileSync(join(repoRoot, 'backend', 'src', 'services', 'attendanceService.ts'), 'utf8');

    expect(attendanceService).toContain('import type {');
    expect(attendanceService).toContain('DayOfWeek');
    expect(attendanceService).not.toMatch(/import\s*\{\s*DayOfWeek\s*,/);
    expect(attendanceService).not.toContain('DayOfWeek.SUNDAY');
  });
});
