import type { FastifyPluginAsync } from 'fastify';

import { DIRECTOR_PLUS_ROLES } from '../../lib/auth.js';
import { notFound } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';
import { serializeBlogPost } from '../../lib/serializers.js';
import { parseDateOnly } from '../../lib/time.js';

const blogsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('', async (request) => {
    const query = request.query as { skip?: string | number; limit?: string | number; hot?: string | boolean };
    const skip = Math.max(Number(query.skip ?? 0), 0);
    const limit = Math.min(Math.max(Number(query.limit ?? 100), 1), 100);

    const where =
      query.hot === undefined
        ? undefined
        : { hot: query.hot === true || query.hot === 'true' || query.hot === '1' };

    const blogs = await prisma.blogPost.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: 'desc' },
    });

    return blogs.map(serializeBlogPost);
  });

  fastify.get('/:blog_id', async (request) => {
    const params = request.params as { blog_id: string };
    const blogId = Number(params.blog_id);

    const blog = await prisma.blogPost.findUnique({ where: { id: blogId } });
    if (!blog) {
      notFound('Blog post not found');
    }

    return serializeBlogPost(blog);
  });

  fastify.post('', { preHandler: [fastify.requireRoles(DIRECTOR_PLUS_ROLES, 'Director access required')] }, async (request, reply) => {
    const body = request.body as {
      title: string;
      image?: string | null;
      letter: string;
      date: string;
      hot?: boolean;
    };

    const blog = await prisma.blogPost.create({
      data: {
        title: body.title,
        image: body.image ?? null,
        letter: body.letter,
        date: parseDateOnly(body.date),
        hot: body.hot ?? false,
        created_at: new Date(),
      },
    });

    return reply.status(201).send(serializeBlogPost(blog));
  });

  fastify.put(
    '/:blog_id',
    { preHandler: [fastify.requireRoles(DIRECTOR_PLUS_ROLES, 'Director access required')] },
    async (request) => {
      const params = request.params as { blog_id: string };
      const body = request.body as {
        title?: string;
        image?: string | null;
        letter?: string;
        date?: string;
        hot?: boolean;
      };

      const blogId = Number(params.blog_id);
      const existing = await prisma.blogPost.findUnique({ where: { id: blogId } });
      if (!existing) {
        notFound('Blog post not found');
      }

      const blog = await prisma.blogPost.update({
        where: { id: blogId },
        data: {
          ...(body.title !== undefined ? { title: body.title } : {}),
          ...(body.image !== undefined ? { image: body.image } : {}),
          ...(body.letter !== undefined ? { letter: body.letter } : {}),
          ...(body.date !== undefined ? { date: parseDateOnly(body.date) } : {}),
          ...(body.hot !== undefined ? { hot: body.hot } : {}),
        },
      });

      return serializeBlogPost(blog);
    }
  );

  fastify.delete(
    '/:blog_id',
    { preHandler: [fastify.requireRoles(DIRECTOR_PLUS_ROLES, 'Director access required')] },
    async (request, reply) => {
      const params = request.params as { blog_id: string };
      const blogId = Number(params.blog_id);

      const blog = await prisma.blogPost.findUnique({ where: { id: blogId } });
      if (!blog) {
        notFound('Blog post not found');
      }

      await prisma.blogPost.delete({ where: { id: blogId } });
      return reply.status(204).send();
    }
  );
};

export default blogsRoutes;
