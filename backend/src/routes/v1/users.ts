import type { FastifyPluginAsync } from 'fastify';
import type { UserRole } from '@prisma/client';

import { forbidden, notFound, badRequest } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';
import { serializeUser } from '../../lib/serializers.js';
import { DIRECTOR_PLUS_ROLES } from '../../lib/auth.js';

const ALL_ROLES: UserRole[] = ['student', 'teacher', 'director', 'admin'];

const usersRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '',
    { preHandler: [fastify.requireRoles(DIRECTOR_PLUS_ROLES, 'Director access required')] },
    async (request) => {
      const query = request.query as { skip?: string | number; limit?: string | number; role?: UserRole };
      const skip = Math.max(Number(query.skip ?? 0), 0);
      const limit = Math.min(Math.max(Number(query.limit ?? 100), 1), 100);

      const where = query.role && ALL_ROLES.includes(query.role) ? { role: query.role } : undefined;
      const users = await prisma.user.findMany({ where, skip, take: limit, orderBy: { id: 'asc' } });
      return users.map(serializeUser);
    }
  );

  fastify.get('/:user_id', { preHandler: [fastify.authenticate] }, async (request) => {
    const params = request.params as { user_id: string };
    const userId = Number(params.user_id);
    const currentUser = request.currentUser!;

    if (currentUser.id !== userId && !DIRECTOR_PLUS_ROLES.includes(currentUser.role)) {
      forbidden('Access denied');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      notFound('User not found');
    }

    return serializeUser(user);
  });

  fastify.put('/:user_id', { preHandler: [fastify.authenticate] }, async (request) => {
    const params = request.params as { user_id: string };
    const body = request.body as {
      first_name?: string;
      last_name?: string;
      phone?: string | null;
      avatar_url?: string | null;
      school_id?: number | null;
    };

    const userId = Number(params.user_id);
    const currentUser = request.currentUser!;

    if (currentUser.id !== userId && !DIRECTOR_PLUS_ROLES.includes(currentUser.role)) {
      forbidden('Access denied');
    }

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      notFound('User not found');
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(body.first_name !== undefined ? { first_name: body.first_name } : {}),
        ...(body.last_name !== undefined ? { last_name: body.last_name } : {}),
        ...(body.phone !== undefined ? { phone: body.phone } : {}),
        ...(body.avatar_url !== undefined ? { avatar_url: body.avatar_url } : {}),
        ...(body.school_id !== undefined ? { school_id: body.school_id } : {}),
      },
    });

    return serializeUser(updated);
  });

  fastify.delete(
    '/:user_id',
    { preHandler: [fastify.requireRoles(DIRECTOR_PLUS_ROLES, 'Director access required')] },
    async (request, reply) => {
      const params = request.params as { user_id: string };
      const userId = Number(params.user_id);
      const currentUser = request.currentUser!;

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        notFound('User not found');
      }

      if (user.id === currentUser.id) {
        badRequest('Cannot delete your own account');
      }

      await prisma.user.delete({ where: { id: user.id } });
      return reply.status(204).send();
    }
  );

  fastify.put(
    '/:user_id/role',
    { preHandler: [fastify.requireRoles(DIRECTOR_PLUS_ROLES, 'Director access required')] },
    async (request) => {
      const params = request.params as { user_id: string };
      const query = request.query as { role?: UserRole };
      const userId = Number(params.user_id);
      const role = query.role;
      const currentUser = request.currentUser!;

      if (!role || !ALL_ROLES.includes(role)) {
        badRequest('Invalid role');
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        notFound('User not found');
      }

      if (user.id === currentUser.id) {
        badRequest('Cannot change your own role');
      }

      const updated = await prisma.user.update({ where: { id: user.id }, data: { role } });
      return serializeUser(updated);
    }
  );
};

export default usersRoutes;
