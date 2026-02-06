import type { FastifyPluginAsync } from 'fastify';

import { forbidden, notFound } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';
import { serializePurchase } from '../../lib/serializers.js';

const purchasesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('', { preHandler: [fastify.authenticate] }, async (request) => {
    const currentUser = request.currentUser!;

    if (currentUser.role !== 'student') {
      forbidden('Only students can view purchases');
    }

    const student = await prisma.studentProfile.findUnique({ where: { user_id: currentUser.id } });
    if (!student) {
      notFound('Student profile not found');
    }

    const purchases = await prisma.purchase.findMany({
      where: { student_id: student.id },
      include: { offer: true },
      orderBy: { created_at: 'desc' },
    });

    return purchases.map((item) =>
      serializePurchase(item, {
        name: item.offer.name,
        brand_name: item.offer.brand_name,
        image_url: item.offer.image_url,
      })
    );
  });

  fastify.get('/:purchase_id', { preHandler: [fastify.authenticate] }, async (request) => {
    const currentUser = request.currentUser!;
    const params = request.params as { purchase_id: string };
    const purchaseId = Number(params.purchase_id);

    if (currentUser.role !== 'student') {
      forbidden('Only students can view purchases');
    }

    const student = await prisma.studentProfile.findUnique({ where: { user_id: currentUser.id } });
    if (!student) {
      notFound('Student profile not found');
    }

    const purchase = await prisma.purchase.findFirst({
      where: { id: purchaseId, student_id: student.id },
      include: { offer: true },
    });

    if (!purchase) {
      notFound('Purchase not found');
    }

    return serializePurchase(purchase, {
      name: purchase.offer.name,
      brand_name: purchase.offer.brand_name,
      image_url: purchase.offer.image_url,
    });
  });

  fastify.post('/:purchase_id/redeem', { preHandler: [fastify.authenticate] }, async (request) => {
    const params = request.params as { purchase_id: string };
    const purchaseId = Number(params.purchase_id);

    const purchase = await prisma.purchase.findUnique({ where: { id: purchaseId } });
    if (!purchase) {
      notFound('Purchase not found');
    }

    if (purchase.status === 'redeemed') {
      return { success: false, message: 'Already redeemed' };
    }

    if (purchase.status === 'expired') {
      return { success: false, message: 'Purchase expired' };
    }

    await prisma.purchase.update({
      where: { id: purchaseId },
      data: {
        status: 'redeemed',
        redeemed_at: new Date(),
      },
    });

    return { success: true, message: 'Successfully redeemed' };
  });
};

export default purchasesRoutes;
