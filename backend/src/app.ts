import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { Prisma } from '@prisma/client';
import Fastify from 'fastify';

import { env } from './config/env.js';
import { ApiError } from './lib/errors.js';
import authPlugin from './plugins/auth.js';
import metricsPlugin from './plugins/metrics.js';
import v1Routes from './routes/v1/index.js';

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

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  app.register(cors, {
    origin: env.CORS_ORIGINS,
    credentials: true,
  });

  app.register(jwt, {
    secret: env.SECRET_KEY,
  });

  app.register(rateLimit, {
    global: false,
    keyGenerator: (request) => request.ip,
  });

  if (process.env.NODE_ENV !== 'test' && process.env.VITEST !== 'true') {
    app.register(metricsPlugin);
  }
  app.register(authPlugin);

  app.setErrorHandler((error, _request, reply) => {
    const normalizedError = error as {
      statusCode?: number;
      message?: string;
      validation?: unknown;
    };

    if (error instanceof ApiError) {
      if (error.headers) {
        Object.entries(error.headers).forEach(([key, value]) => {
          reply.header(key, value);
        });
      }
      return reply.status(error.statusCode).send({ detail: error.detail });
    }

    if (normalizedError.statusCode === 429) {
      return reply.status(429).send({ detail: 'Rate limit exceeded' });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return reply.status(409).send({ detail: 'Resource already exists' });
    }

    if (isDatabaseUnavailableError(error)) {
      const detail =
        env.NODE_ENV === 'development'
          ? 'Database unavailable. Start PostgreSQL on localhost:5432 (or run: cd backend && docker-compose up -d db).'
          : 'Database unavailable.';
      return reply.status(503).send({ detail });
    }

    if (normalizedError.validation) {
      return reply.status(400).send({ detail: normalizedError.message ?? 'Validation error' });
    }

    app.log.error(error);
    const statusCode = normalizedError.statusCode ?? 500;
    const detail =
      statusCode === 500
        ? String(normalizedError.message ?? 'Internal Server Error')
        : normalizedError.message ?? 'Request failed';

    return reply.status(statusCode).send({ detail });
  });

  app.get('/health', async () => {
    return { status: 'healthy', app: env.APP_NAME };
  });

  app.get('/', async () => {
    return {
      app: env.APP_NAME,
      docs: `${env.API_V1_PREFIX}/docs`,
      health: '/health',
    };
  });

  app.register(v1Routes, { prefix: env.API_V1_PREFIX });

  return app;
}
