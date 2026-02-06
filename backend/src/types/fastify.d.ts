import type { User, UserRole } from '@prisma/client';
import type { JwtPayload } from '../lib/auth.js';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    currentUser?: User;
  }

  interface FastifyInstance {
    authenticate: (request: FastifyRequest) => Promise<void>;
    requireRoles: (roles: UserRole[], detail?: string) => (request: FastifyRequest) => Promise<void>;
  }
}
