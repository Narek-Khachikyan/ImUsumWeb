import type { FastifyPluginAsync } from 'fastify';

import { DIRECTOR_PLUS_ROLES, TEACHER_PLUS_ROLES } from '../../lib/auth.js';
import { badRequest, conflict, forbidden, notFound } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';
import { getStudentProfileByUser, resolveStudentEligibility } from '../../services/jobsService.js';

function parsePositiveInt(value: string, detail: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    badRequest(detail);
  }
  return parsed;
}

function parseIsActiveQuery(value: unknown): boolean | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (value === true || value === 'true' || value === '1') {
    return true;
  }
  if (value === false || value === 'false' || value === '0') {
    return false;
  }
  badRequest('is_active must be true or false');
}

const jobsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('', { preHandler: [fastify.authenticate] }, async (request) => {
    const query = request.query as { is_active?: string };
    const currentUser = request.currentUser!;
    const requestedIsActive = parseIsActiveQuery(query.is_active);

    const where =
      currentUser.role === 'student'
        ? { is_active: true }
        : requestedIsActive === undefined
          ? undefined
          : { is_active: requestedIsActive };

    const jobs = await prisma.jobPosting.findMany({
      where,
      orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
    });

    return jobs.map((job) => ({
      id: job.id,
      title: job.title,
      description: job.description,
      company_name: job.company_name,
      contact_email: job.contact_email,
      external_url: job.external_url,
      is_active: job.is_active,
      created_by_user_id: job.created_by_user_id,
      created_at: job.created_at.toISOString(),
      updated_at: job.updated_at.toISOString(),
    }));
  });

  fastify.get('/eligibility/me', { preHandler: [fastify.authenticate] }, async (request) => {
    const student = await getStudentProfileByUser(request.currentUser!);
    return resolveStudentEligibility(student.id);
  });

  fastify.get('/my/applications', { preHandler: [fastify.authenticate] }, async (request) => {
    const student = await getStudentProfileByUser(request.currentUser!);

    const applications = await prisma.jobApplication.findMany({
      where: { student_id: student.id },
      include: {
        job_posting: true,
      },
      orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
    });

    return applications.map((application) => ({
      id: application.id,
      job_posting_id: application.job_posting_id,
      student_id: application.student_id,
      status: application.status,
      cover_letter: application.cover_letter,
      created_at: application.created_at.toISOString(),
      updated_at: application.updated_at.toISOString(),
      job_posting: {
        id: application.job_posting.id,
        title: application.job_posting.title,
        company_name: application.job_posting.company_name,
        is_active: application.job_posting.is_active,
      },
    }));
  });

  fastify.post('/:job_id/apply', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const params = request.params as { job_id: string };
    const body = request.body as { cover_letter?: string };
    const jobId = parsePositiveInt(params.job_id, 'Invalid job id');
    const currentUser = request.currentUser!;
    const student = await getStudentProfileByUser(currentUser);

    const job = await prisma.jobPosting.findUnique({ where: { id: jobId } });
    if (!job || !job.is_active) {
      notFound('Job posting not found');
    }

    const eligibility = await resolveStudentEligibility(student.id);
    if (!eligibility.eligible) {
      forbidden('Student is not eligible for job applications');
    }

    const existing = await prisma.jobApplication.findFirst({
      where: { job_posting_id: jobId, student_id: student.id },
    });
    if (existing) {
      conflict('Already applied for this job');
    }

    const created = await prisma.jobApplication.create({
      data: {
        job_posting_id: jobId,
        student_id: student.id,
        status: 'PENDING',
        cover_letter: body.cover_letter?.trim() || null,
      },
    });

    return reply.status(201).send({
      id: created.id,
      job_posting_id: created.job_posting_id,
      student_id: created.student_id,
      status: created.status,
      cover_letter: created.cover_letter,
      created_at: created.created_at.toISOString(),
      updated_at: created.updated_at.toISOString(),
    });
  });

  fastify.post('', { preHandler: [fastify.requireRoles(DIRECTOR_PLUS_ROLES, 'Director access required')] }, async (request, reply) => {
    const body = request.body as {
      title: string;
      description: string;
      company_name: string;
      contact_email?: string;
      external_url?: string;
      is_active?: boolean;
    };

    const title = body.title?.trim();
    const description = body.description?.trim();
    const companyName = body.company_name?.trim();

    if (!title) {
      badRequest('title is required');
    }
    if (!description) {
      badRequest('description is required');
    }
    if (!companyName) {
      badRequest('company_name is required');
    }

    const created = await prisma.jobPosting.create({
      data: {
        title,
        description,
        company_name: companyName,
        contact_email: body.contact_email?.trim() || null,
        external_url: body.external_url?.trim() || null,
        is_active: body.is_active ?? true,
        created_by_user_id: request.currentUser!.id,
      },
    });

    return reply.status(201).send({
      id: created.id,
      title: created.title,
      description: created.description,
      company_name: created.company_name,
      contact_email: created.contact_email,
      external_url: created.external_url,
      is_active: created.is_active,
      created_by_user_id: created.created_by_user_id,
      created_at: created.created_at.toISOString(),
      updated_at: created.updated_at.toISOString(),
    });
  });

  fastify.put('/:job_id', { preHandler: [fastify.requireRoles(DIRECTOR_PLUS_ROLES, 'Director access required')] }, async (request) => {
    const params = request.params as { job_id: string };
    const body = request.body as {
      title?: string;
      description?: string;
      company_name?: string;
      contact_email?: string | null;
      external_url?: string | null;
      is_active?: boolean;
    };
    const jobId = parsePositiveInt(params.job_id, 'Invalid job id');

    const existing = await prisma.jobPosting.findUnique({ where: { id: jobId } });
    if (!existing) {
      notFound('Job posting not found');
    }

    const updated = await prisma.jobPosting.update({
      where: { id: jobId },
      data: {
        ...(body.title !== undefined ? { title: body.title.trim() || existing.title } : {}),
        ...(body.description !== undefined ? { description: body.description.trim() || existing.description } : {}),
        ...(body.company_name !== undefined ? { company_name: body.company_name.trim() || existing.company_name } : {}),
        ...(body.contact_email !== undefined ? { contact_email: body.contact_email?.trim() || null } : {}),
        ...(body.external_url !== undefined ? { external_url: body.external_url?.trim() || null } : {}),
        ...(body.is_active !== undefined ? { is_active: body.is_active } : {}),
      },
    });

    return {
      id: updated.id,
      title: updated.title,
      description: updated.description,
      company_name: updated.company_name,
      contact_email: updated.contact_email,
      external_url: updated.external_url,
      is_active: updated.is_active,
      created_by_user_id: updated.created_by_user_id,
      created_at: updated.created_at.toISOString(),
      updated_at: updated.updated_at.toISOString(),
    };
  });

  fastify.delete('/:job_id', { preHandler: [fastify.requireRoles(DIRECTOR_PLUS_ROLES, 'Director access required')] }, async (request, reply) => {
    const params = request.params as { job_id: string };
    const jobId = parsePositiveInt(params.job_id, 'Invalid job id');

    const existing = await prisma.jobPosting.findUnique({ where: { id: jobId } });
    if (!existing) {
      notFound('Job posting not found');
    }

    await prisma.jobPosting.update({
      where: { id: jobId },
      data: { is_active: false },
    });

    return reply.status(204).send();
  });

  fastify.put(
    '/eligibility/:student_id',
    { preHandler: [fastify.requireRoles(TEACHER_PLUS_ROLES, 'Teacher access required')] },
    async (request) => {
      const params = request.params as { student_id: string };
      const body = request.body as { eligible: boolean; reason?: string };
      const studentId = parsePositiveInt(params.student_id, 'Invalid student id');
      const student = await prisma.studentProfile.findUnique({ where: { id: studentId } });
      if (!student) {
        notFound('Student profile not found');
      }
      if (typeof body.eligible !== 'boolean') {
        badRequest('eligible must be boolean');
      }

      const override = await prisma.jobEligibilityOverride.upsert({
        where: { student_id: studentId },
        create: {
          student_id: studentId,
          eligible: body.eligible,
          reason: body.reason?.trim() || null,
          set_by_user_id: request.currentUser!.id,
        },
        update: {
          eligible: body.eligible,
          reason: body.reason?.trim() || null,
          set_by_user_id: request.currentUser!.id,
        },
      });

      return {
        id: override.id,
        student_id: override.student_id,
        eligible: override.eligible,
        reason: override.reason,
        set_by_user_id: override.set_by_user_id,
        created_at: override.created_at.toISOString(),
        updated_at: override.updated_at.toISOString(),
      };
    }
  );
};

export default jobsRoutes;
