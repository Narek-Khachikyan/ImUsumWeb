import type { FastifyPluginAsync } from 'fastify';

import assignmentsRoutes from './assignments.js';
import authRoutes from './auth.js';
import blogsRoutes from './blogs.js';
import chatRoutes from './chat.js';
import gradesRoutes from './grades.js';
import materialsRoutes from './materials.js';
import offersRoutes from './offers.js';
import purchasesRoutes from './purchases.js';
import schedulesRoutes from './schedules.js';
import testsRoutes from './tests.js';
import usersRoutes from './users.js';

const v1Routes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(authRoutes, { prefix: '/auth' });
  await fastify.register(usersRoutes, { prefix: '/users' });
  await fastify.register(blogsRoutes, { prefix: '/blogs' });
  await fastify.register(chatRoutes, { prefix: '/chat' });
  await fastify.register(schedulesRoutes, { prefix: '/schedules' });
  await fastify.register(assignmentsRoutes, { prefix: '/assignments' });
  await fastify.register(testsRoutes, { prefix: '/tests' });
  await fastify.register(gradesRoutes, { prefix: '/grades' });
  await fastify.register(materialsRoutes, { prefix: '/materials' });
  await fastify.register(offersRoutes, { prefix: '/offers' });
  await fastify.register(purchasesRoutes, { prefix: '/purchases' });
};

export default v1Routes;
