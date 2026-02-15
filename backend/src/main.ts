import { buildApp } from './app.js';
import { prisma } from './lib/prisma.js';
import { Prisma } from '@prisma/client';

const app = buildApp();

const port = Number(process.env.PORT ?? 8000);
const host = process.env.HOST ?? '0.0.0.0';

function describeDatabaseTarget(databaseUrl: string | undefined): string {
  if (!databaseUrl) {
    return 'DATABASE_URL is not set';
  }

  try {
    const parsed = new URL(databaseUrl);
    const portPart = parsed.port ? `:${parsed.port}` : '';
    return `${parsed.hostname}${portPart}${parsed.pathname}`;
  } catch {
    return 'DATABASE_URL is invalid';
  }
}

function isDatabaseUnavailableError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    const prismaError = error as Prisma.PrismaClientInitializationError & {
      errorCode?: string;
      code?: string;
    };
    return (prismaError.errorCode ?? prismaError.code) === 'P1001';
  }

  const message = error instanceof Error ? error.message : String(error);
  return message.includes("Can't reach database server") || message.includes('P1001');
}

const start = async () => {
  try {
    await prisma.$connect();
    await app.listen({ port, host });
    app.log.info(`Server running on http://${host}:${port}`);
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      app.log.error(error);
      app.log.error(
        `Database is unreachable (${describeDatabaseTarget(process.env.DATABASE_URL)}). Start Postgres (Docker): cd backend && docker-compose up -d db`
      );
      process.exit(1);
    }

    app.log.error(error);
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  await app.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await app.close();
  await prisma.$disconnect();
  process.exit(0);
});

void start();
