import crypto from 'crypto';

import type { FastifyPluginAsync } from 'fastify';

import { DIRECTOR_PLUS_ROLES } from '../../lib/auth.js';
import { badRequest, forbidden, internalServerError, notFound } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';
import { serializeOffer, serializeOfferListItem, serializePurchase } from '../../lib/serializers.js';

const offersRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('', { preHandler: [fastify.authenticate] }, async (request) => {
    const query = request.query as { category?: string };

    const offers = await prisma.offer.findMany({
      where: {
        is_active: true,
        ...(query.category ? { category: query.category } : {}),
      },
      orderBy: { created_at: 'desc' },
    });

    return offers.map(serializeOfferListItem);
  });

  fastify.get('/balance', { preHandler: [fastify.authenticate] }, async (request) => {
    const currentUser = request.currentUser!;
    if (currentUser.role !== 'student') {
      forbidden('Only students can view balance');
    }

    const student = await prisma.studentProfile.findUnique({ where: { user_id: currentUser.id } });
    if (!student) {
      notFound('Student profile not found');
    }

    return { bonus_points: student.bonus_points ?? 0 };
  });

  fastify.get('/:offer_id', { preHandler: [fastify.authenticate] }, async (request) => {
    const params = request.params as { offer_id: string };
    const offerId = Number(params.offer_id);

    const offer = await prisma.offer.findUnique({ where: { id: offerId } });
    if (!offer) {
      notFound('Offer not found');
    }

    return serializeOffer(offer);
  });

  fastify.post('', { preHandler: [fastify.requireRoles(DIRECTOR_PLUS_ROLES, 'Director access required')] }, async (request, reply) => {
    const body = request.body as {
      name: string;
      description?: string;
      price: number;
      image_url?: string;
      brand_name: string;
      category?: string;
      stock_quantity?: number;
    };

    const offer = await prisma.offer.create({
      data: {
        name: body.name,
        description: body.description ?? null,
        price: body.price,
        image_url: body.image_url ?? null,
        brand_name: body.brand_name,
        category: body.category ?? 'other',
        stock_quantity: body.stock_quantity ?? null,
        created_at: new Date(),
      },
    });

    return reply.status(201).send(serializeOffer(offer));
  });

  fastify.put(
    '/:offer_id',
    { preHandler: [fastify.requireRoles(DIRECTOR_PLUS_ROLES, 'Director access required')] },
    async (request) => {
      const params = request.params as { offer_id: string };
      const body = request.body as {
        name?: string;
        description?: string;
        price?: number;
        image_url?: string;
        brand_name?: string;
        category?: string;
        stock_quantity?: number | null;
        is_active?: boolean;
      };

      const offerId = Number(params.offer_id);
      const existing = await prisma.offer.findUnique({ where: { id: offerId } });
      if (!existing) {
        notFound('Offer not found');
      }

      const offer = await prisma.offer.update({
        where: { id: offerId },
        data: {
          ...(body.name !== undefined ? { name: body.name } : {}),
          ...(body.description !== undefined ? { description: body.description } : {}),
          ...(body.price !== undefined ? { price: body.price } : {}),
          ...(body.image_url !== undefined ? { image_url: body.image_url } : {}),
          ...(body.brand_name !== undefined ? { brand_name: body.brand_name } : {}),
          ...(body.category !== undefined ? { category: body.category } : {}),
          ...(body.stock_quantity !== undefined ? { stock_quantity: body.stock_quantity } : {}),
          ...(body.is_active !== undefined ? { is_active: body.is_active } : {}),
        },
      });

      return serializeOffer(offer);
    }
  );

  fastify.delete(
    '/:offer_id',
    { preHandler: [fastify.requireRoles(DIRECTOR_PLUS_ROLES, 'Director access required')] },
    async (request, reply) => {
      const params = request.params as { offer_id: string };
      const offerId = Number(params.offer_id);

      const existing = await prisma.offer.findUnique({ where: { id: offerId } });
      if (!existing) {
        notFound('Offer not found');
      }

      await prisma.offer.update({ where: { id: offerId }, data: { is_active: false } });
      return reply.status(204).send();
    }
  );

  fastify.post('/:offer_id/purchase', { preHandler: [fastify.authenticate] }, async (request) => {
    const params = request.params as { offer_id: string };
    const offerId = Number(params.offer_id);
    const currentUser = request.currentUser!;

    if (currentUser.role !== 'student') {
      forbidden('Only students can make purchases');
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        const student = await tx.studentProfile.findUnique({ where: { user_id: currentUser.id } });
        if (!student) {
          notFound('Student profile not found');
        }

        await tx.$queryRaw`SELECT id FROM student_profiles WHERE id = ${student.id} FOR UPDATE`;

        const offer = await tx.offer.findFirst({ where: { id: offerId, is_active: true } });
        if (!offer) {
          notFound('Offer not found or inactive');
        }

        await tx.$queryRaw`SELECT id FROM offers WHERE id = ${offer.id} FOR UPDATE`;

        if (offer.stock_quantity !== null && offer.stock_quantity <= 0) {
          badRequest('Offer out of stock');
        }

        const currentBalance = student.bonus_points ?? 0;
        if (currentBalance < offer.price) {
          badRequest(`Insufficient balance. Need ${offer.price}, have ${currentBalance}`);
        }

        const qrCode = `IMUSUM-${crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`;

        await tx.studentProfile.update({
          where: { id: student.id },
          data: { bonus_points: currentBalance - offer.price },
        });

        if (offer.stock_quantity !== null) {
          await tx.offer.update({
            where: { id: offer.id },
            data: { stock_quantity: offer.stock_quantity - 1 },
          });
        }

        const purchase = await tx.purchase.create({
          data: {
            student_id: student.id,
            offer_id: offer.id,
            points_spent: offer.price,
            qr_code: qrCode,
            status: 'pending',
            created_at: new Date(),
          },
        });

        return { purchase, offer };
      });

      return serializePurchase(result.purchase, {
        name: result.offer.name,
        brand_name: result.offer.brand_name,
        image_url: result.offer.image_url,
      });
    } catch (error) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error;
      }
      request.log.error({ err: error }, 'Purchase failed');
      internalServerError('Purchase failed. Please try again.');
    }
  });
};

export default offersRoutes;
