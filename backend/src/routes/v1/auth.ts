import type { FastifyPluginAsync } from 'fastify';
import type { UserRole } from '@prisma/client';

import { env } from '../../config/env.js';
import { conflict, unauthorized, badRequest, forbidden } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';
import { getPasswordHash, verifyPassword } from '../../lib/security.js';
import { serializeUser } from '../../lib/serializers.js';
import { requestPasswordReset, resetPasswordWithToken } from '../../services/passwordResetService.js';

const GENERIC_RESET_MESSAGE = 'If an account exists, reset instructions have been sent.';

function createAccessToken(fastify: any, userId: number, tokenVersion: number): string {
  return fastify.jwt.sign(
    {
      sub: String(userId),
      type: 'access',
      ver: tokenVersion,
    },
    {
      expiresIn: `${env.ACCESS_TOKEN_EXPIRE_MINUTES}m`,
    }
  );
}

function createRefreshToken(fastify: any, userId: number, tokenVersion: number): string {
  return fastify.jwt.sign(
    {
      sub: String(userId),
      type: 'refresh',
      ver: tokenVersion,
    },
    {
      expiresIn: `${env.REFRESH_TOKEN_EXPIRE_DAYS}d`,
    }
  );
}

const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/register', async (request, reply) => {
    const now = new Date();
    const body = request.body as {
      email: string;
      password: string;
      first_name: string;
      last_name: string;
      role?: UserRole;
      phone?: string;
      avatar_url?: string;
      school_id?: number;
    };

    if (body.role && body.role !== 'student') {
      forbidden('Self-registration is only available for students');
    }

    const existingUser = await prisma.user.findUnique({ where: { email: body.email } });
    if (existingUser) {
      conflict('Email already registered');
    }

    const user = await prisma.user.create({
      data: {
        email: body.email,
        hashed_password: await getPasswordHash(body.password),
        first_name: body.first_name,
        last_name: body.last_name,
        role: body.role ?? 'student',
        is_active: true,
        is_verified: false,
        token_version: 0,
        phone: body.phone ?? null,
        avatar_url: body.avatar_url ?? null,
        school_id: body.school_id ?? null,
        created_at: now,
      },
    });

    if (user.role === 'student') {
      await prisma.studentProfile.create({ data: { user_id: user.id, created_at: now } });
    } else if (user.role === 'teacher') {
      await prisma.teacherProfile.create({ data: { user_id: user.id, created_at: now } });
    }

    const access_token = createAccessToken(fastify, user.id, user.token_version);
    const refresh_token = createRefreshToken(fastify, user.id, user.token_version);

    return reply.status(201).send({
      user: serializeUser(user),
      access_token,
      refresh_token,
      token_type: 'bearer',
    });
  });

  fastify.post('/login', async (request) => {
    const body = request.body as { email: string; password: string };

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    const validCredentials = user ? await verifyPassword(body.password, user.hashed_password) : false;

    if (!user || !validCredentials) {
      unauthorized('Incorrect email or password');
    }

    if (!user.is_active) {
      unauthorized('User account is inactive', {});
    }

    if (user.role === 'student') {
      const profile = await prisma.studentProfile.findUnique({ where: { user_id: user.id } });
      if (!profile) {
        await prisma.studentProfile.create({ data: { user_id: user.id, created_at: new Date() } });
      }
    } else if (user.role === 'teacher') {
      const profile = await prisma.teacherProfile.findUnique({ where: { user_id: user.id } });
      if (!profile) {
        await prisma.teacherProfile.create({ data: { user_id: user.id, created_at: new Date() } });
      }
    }

    const access_token = createAccessToken(fastify, user.id, user.token_version);
    const refresh_token = createRefreshToken(fastify, user.id, user.token_version);

    return {
      user: serializeUser(user),
      access_token,
      refresh_token,
      token_type: 'bearer',
    };
  });

  fastify.post('/refresh', async (request) => {
    const body = (request.body ?? {}) as { refresh_token?: unknown };
    if (typeof body.refresh_token !== 'string' || body.refresh_token.length === 0) {
      unauthorized('Invalid refresh token', {});
    }

    let payload;
    try {
      payload = fastify.jwt.verify(body.refresh_token as string) as {
        sub?: string;
        type?: string;
        ver?: number;
      };
    } catch {
      unauthorized('Invalid refresh token', {});
    }

    if (!payload || payload.type !== 'refresh') {
      unauthorized('Invalid refresh token', {});
    }

    const userId = Number(payload.sub);
    if (!Number.isFinite(userId)) {
      unauthorized('Invalid refresh token', {});
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.is_active) {
      unauthorized('User not found or inactive', {});
    }

    const tokenVersion = Number(payload.ver ?? 0);
    if (!Number.isFinite(tokenVersion) || tokenVersion !== user.token_version) {
      unauthorized('Invalid refresh token', {});
    }

    return {
      access_token: createAccessToken(fastify, user.id, user.token_version),
      refresh_token: createRefreshToken(fastify, user.id, user.token_version),
      token_type: 'bearer',
    };
  });

  fastify.post(
    '/forgot-password',
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: 15 * 60 * 1000,
        },
      },
    },
    async (request) => {
      const body = request.body as { email: string };
      const user = await prisma.user.findUnique({ where: { email: body.email } });

      if (user && user.is_active) {
        try {
          await requestPasswordReset({
            userId: user.id,
            email: user.email,
            requestedIp: request.ip,
            requestedUserAgent: request.headers['user-agent'],
          });
        } catch (error) {
          request.log.error({ err: error }, 'Failed to process forgot-password request');
        }
      }

      return { message: GENERIC_RESET_MESSAGE };
    }
  );

  fastify.post('/reset-password', async (request) => {
    const body = request.body as { token: string; new_password: string };
    if (!body.new_password || body.new_password.length < 6) {
      badRequest('String should have at least 6 characters');
    }

    const success = await resetPasswordWithToken(body.token, body.new_password);
    if (!success) {
      badRequest('Invalid, expired, or already used reset token');
    }

    return { message: 'Password has been reset successfully.' };
  });

  fastify.get('/me', { preHandler: [fastify.authenticate] }, async (request) => {
    return serializeUser(request.currentUser!);
  });

  fastify.post('/logout', { preHandler: [fastify.authenticate] }, async (_request, reply) => {
    return reply.status(204).send();
  });
};

export default authRoutes;
