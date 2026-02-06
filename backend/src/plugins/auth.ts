import type { UserRole } from '@prisma/client';
import fp from 'fastify-plugin';

import type { JwtPayload } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';
import { forbidden, unauthorized } from '../lib/errors.js';

export default fp(async (fastify) => {
  fastify.decorate('authenticate', async (request) => {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      forbidden('Not authenticated');
    }

    let payload: JwtPayload;
    try {
      payload = (await request.jwtVerify()) as JwtPayload;
    } catch {
      unauthorized('Could not validate credentials');
    }

    if (!payload || payload.type !== 'access') {
      unauthorized('Could not validate credentials');
    }

    const userId = Number(payload.sub);
    if (!Number.isFinite(userId)) {
      unauthorized('Could not validate credentials');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      unauthorized('Could not validate credentials');
    }

    const tokenVersion = Number(payload.ver ?? 0);
    if (!Number.isFinite(tokenVersion) || tokenVersion !== user.token_version) {
      unauthorized('Could not validate credentials');
    }

    if (!user.is_active) {
      unauthorized('User account is inactive');
    }

    request.currentUser = user;
  });

  fastify.decorate('requireRoles', (roles: UserRole[], detail = 'Access denied') => {
    return async (request) => {
      await fastify.authenticate(request);
      const user = request.currentUser;
      if (!user || !roles.includes(user.role)) {
        forbidden(detail);
      }
    };
  });
});
