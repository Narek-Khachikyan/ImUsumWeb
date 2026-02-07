import type { FastifyPluginAsync } from 'fastify';
import type { UserRole } from '@prisma/client';

import { forbidden, notFound, badRequest, conflict } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';
import { getPasswordHash } from '../../lib/security.js';
import { serializeUser } from '../../lib/serializers.js';
import { DIRECTOR_PLUS_ROLES } from '../../lib/auth.js';

const ALL_ROLES: UserRole[] = ['student', 'teacher', 'director', 'admin'];
const DIRECTOR_MANAGEABLE_ROLES: UserRole[] = ['student', 'teacher'];

function assertCanManageRole(currentUserRole: UserRole, targetRole: UserRole) {
  if (currentUserRole === 'admin') {
    return;
  }

  if (currentUserRole === 'director' && DIRECTOR_MANAGEABLE_ROLES.includes(targetRole)) {
    return;
  }

  forbidden('Directors can only manage students and teachers');
}

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

  fastify.post(
    '',
    { preHandler: [fastify.requireRoles(DIRECTOR_PLUS_ROLES, 'Director access required')] },
    async (request, reply) => {
      const now = new Date();
      const body = request.body as {
        email?: string;
        password?: string;
        first_name?: string;
        last_name?: string;
        phone?: string | null;
        role?: UserRole;
        is_active?: boolean;
      };
      const currentUser = request.currentUser!;

      const email = body.email?.trim();
      if (!email) {
        badRequest('Email is required');
      }

      if (typeof body.password !== 'string' || body.password.length < 6) {
        badRequest('Password should have at least 6 characters');
      }

      const firstName = body.first_name?.trim();
      if (!firstName) {
        badRequest('First name is required');
      }

      const lastName = body.last_name?.trim();
      if (!lastName) {
        badRequest('Last name is required');
      }

      if (!body.role || !ALL_ROLES.includes(body.role)) {
        badRequest('Invalid role');
      }

      assertCanManageRole(currentUser.role, body.role);

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        conflict('Email already registered');
      }

      const createdUser = await prisma.user.create({
        data: {
          email,
          hashed_password: await getPasswordHash(body.password),
          first_name: firstName,
          last_name: lastName,
          role: body.role,
          is_active: body.is_active ?? true,
          is_verified: false,
          token_version: 0,
          phone: body.phone ?? null,
          avatar_url: null,
          school_id: null,
          created_at: now,
        },
      });

      if (createdUser.role === 'student') {
        await prisma.studentProfile.create({ data: { user_id: createdUser.id, created_at: now } });
      } else if (createdUser.role === 'teacher') {
        await prisma.teacherProfile.create({ data: { user_id: createdUser.id, created_at: now } });
      }

      return reply.status(201).send(serializeUser(createdUser));
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
      is_active?: boolean;
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

    if (currentUser.id !== userId) {
      assertCanManageRole(currentUser.role, existing.role);
    }

    if (body.is_active !== undefined) {
      if (!DIRECTOR_PLUS_ROLES.includes(currentUser.role)) {
        forbidden('Only director or admin can change active status');
      }

      if (currentUser.id === userId && body.is_active === false) {
        badRequest('Cannot deactivate your own account');
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(body.first_name !== undefined ? { first_name: body.first_name } : {}),
        ...(body.last_name !== undefined ? { last_name: body.last_name } : {}),
        ...(body.phone !== undefined ? { phone: body.phone } : {}),
        ...(body.avatar_url !== undefined ? { avatar_url: body.avatar_url } : {}),
        ...(body.school_id !== undefined ? { school_id: body.school_id } : {}),
        ...(body.is_active !== undefined ? { is_active: body.is_active } : {}),
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

      assertCanManageRole(currentUser.role, user.role);

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

      assertCanManageRole(currentUser.role, user.role);
      assertCanManageRole(currentUser.role, role);

      const updated = await prisma.user.update({ where: { id: user.id }, data: { role } });
      return serializeUser(updated);
    }
  );
};

export default usersRoutes;
