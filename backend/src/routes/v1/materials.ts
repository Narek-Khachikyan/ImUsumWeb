import type { FastifyPluginAsync } from 'fastify';

import { DIRECTOR_PLUS_ROLES } from '../../lib/auth.js';
import { notFound } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';
import { serializeLearningMaterial } from '../../lib/serializers.js';
import {
  assertCanReadMaterial,
  buildMaterialsListWhere,
  parseCreateMaterialInput,
  parseMaterialId,
  parseMaterialsListQuery,
  parseUpdateMaterialInput,
} from '../../services/materialsService.js';

const materialsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('', { preHandler: [fastify.authenticate] }, async (request) => {
    const currentUser = request.currentUser!;
    const query = parseMaterialsListQuery(request.query);
    const where = await buildMaterialsListWhere(currentUser, query);

    const materials = await prisma.learningMaterial.findMany({
      where,
      skip: query.skip,
      take: query.limit,
      orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
    });

    return materials.map(serializeLearningMaterial);
  });

  fastify.get('/:material_id', { preHandler: [fastify.authenticate] }, async (request) => {
    const params = request.params as { material_id: string };
    const materialId = parseMaterialId(params.material_id);

    const material = await prisma.learningMaterial.findUnique({ where: { id: materialId } });
    if (!material) {
      notFound('Material not found');
    }

    const currentUser = request.currentUser!;
    await assertCanReadMaterial(currentUser, material);

    return serializeLearningMaterial(material);
  });

  fastify.post(
    '',
    { preHandler: [fastify.requireRoles(DIRECTOR_PLUS_ROLES, 'Director access required')] },
    async (request, reply) => {
      const currentUser = request.currentUser!;
      const data = parseCreateMaterialInput(currentUser, request.body);

      const material = await prisma.learningMaterial.create({ data });
      return reply.status(201).send(serializeLearningMaterial(material));
    }
  );

  fastify.put(
    '/:material_id',
    { preHandler: [fastify.requireRoles(DIRECTOR_PLUS_ROLES, 'Director access required')] },
    async (request) => {
      const params = request.params as { material_id: string };
      const materialId = parseMaterialId(params.material_id);

      const existing = await prisma.learningMaterial.findUnique({ where: { id: materialId } });
      if (!existing) {
        notFound('Material not found');
      }

      const data = parseUpdateMaterialInput(request.body);

      const material = await prisma.learningMaterial.update({
        where: { id: materialId },
        data,
      });

      return serializeLearningMaterial(material);
    }
  );

  fastify.delete(
    '/:material_id',
    { preHandler: [fastify.requireRoles(DIRECTOR_PLUS_ROLES, 'Director access required')] },
    async (request, reply) => {
      const params = request.params as { material_id: string };
      const materialId = parseMaterialId(params.material_id);

      const existing = await prisma.learningMaterial.findUnique({ where: { id: materialId } });
      if (!existing) {
        notFound('Material not found');
      }

      await prisma.learningMaterial.delete({ where: { id: materialId } });
      return reply.status(204).send();
    }
  );
};

export default materialsRoutes;
