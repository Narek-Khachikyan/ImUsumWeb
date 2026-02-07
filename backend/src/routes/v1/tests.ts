import { Prisma, type Test, type User, type UserRole } from '@prisma/client';
import type { FastifyPluginAsync } from 'fastify';

import { TEACHER_PLUS_ROLES } from '../../lib/auth.js';
import { awardBonusPoints } from '../../lib/gradeBonus.js';
import { badRequest, conflict, forbidden, notFound } from '../../lib/errors.js';
import { normalizeToTen } from '../../lib/gradingScale.js';
import { prisma } from '../../lib/prisma.js';
import {
  serializeTest,
  serializeTestAnswer,
  serializeTestAttempt,
  serializeTestOption,
  serializeTestQuestion,
} from '../../lib/serializers.js';

function parsePositiveInt(value: string, detail: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    badRequest(detail);
  }
  return parsed;
}

function parseOptionalPositiveInt(value: unknown, detail: string): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    badRequest(detail);
  }

  return parsed;
}

function parseDueDate(value: string | undefined): Date | undefined {
  if (value === undefined) {
    return undefined;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    badRequest('Invalid due_date');
  }
  return parsed;
}

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

const TEN_SCALE_MAX_POINTS = 10;

function ensureNonEmptyText(value: unknown, detail: string): string {
  if (typeof value !== 'string') {
    badRequest(detail);
  }

  const trimmed = value.trim();
  if (!trimmed) {
    badRequest(detail);
  }

  return trimmed;
}

function getScoreBucketKey(percentage: number): '0_20' | '21_40' | '41_60' | '61_80' | '81_100' {
  if (percentage <= 20) {
    return '0_20';
  }
  if (percentage <= 40) {
    return '21_40';
  }
  if (percentage <= 60) {
    return '41_60';
  }
  if (percentage <= 80) {
    return '61_80';
  }
  return '81_100';
}

type McqOptionInput = {
  option_text: string;
  is_correct: boolean;
  order_index?: number;
};

type McqQuestionInput = {
  question_text: string;
  order_index?: number;
  points?: number;
  options: McqOptionInput[];
};

function validateMcqQuestionPayload(
  question: McqQuestionInput,
  questionIndex: number
): {
  question_text: string;
  order_index: number;
  points: number;
  options: Array<{
    option_text: string;
    is_correct: boolean;
    order_index: number;
  }>;
} {
  const questionText = ensureNonEmptyText(
    question.question_text,
    `Question #${questionIndex + 1}: question_text is required`
  );

  const points = parseOptionalPositiveInt(question.points, `Question #${questionIndex + 1}: points must be a positive integer`) ?? 1;
  const orderIndex = parseOptionalPositiveInt(
    question.order_index,
    `Question #${questionIndex + 1}: order_index must be a positive integer`
  ) ?? questionIndex + 1;

  if (!Array.isArray(question.options) || question.options.length !== 4) {
    badRequest(`Question #${questionIndex + 1}: exactly 4 options are required`);
  }

  const normalizedOptions = question.options.map((option, optionIndex) => ({
    option_text: ensureNonEmptyText(
      option.option_text,
      `Question #${questionIndex + 1}, option #${optionIndex + 1}: option_text is required`
    ),
    is_correct: Boolean(option.is_correct),
    order_index:
      parseOptionalPositiveInt(
        option.order_index,
        `Question #${questionIndex + 1}, option #${optionIndex + 1}: order_index must be a positive integer`
      ) ??
      optionIndex + 1,
  }));

  const correctOptionsCount = normalizedOptions.filter((option) => option.is_correct).length;
  if (correctOptionsCount !== 1) {
    badRequest(`Question #${questionIndex + 1}: exactly 1 correct option is required`);
  }

  const uniqueOptionOrders = new Set(normalizedOptions.map((option) => option.order_index));
  if (uniqueOptionOrders.size !== normalizedOptions.length) {
    badRequest(`Question #${questionIndex + 1}: option order_index values must be unique`);
  }

  return {
    question_text: questionText,
    order_index: orderIndex,
    points,
    options: normalizedOptions,
  };
}

async function getTeacherProfileId(userId: number): Promise<number | null> {
  const teacher = await prisma.teacherProfile.findUnique({ where: { user_id: userId } });
  return teacher?.id ?? null;
}

async function assertTeacherOwnsTest(currentUser: User, test: Test, detail = 'Not authorized to access this test'): Promise<void> {
  if (currentUser.role === 'director' || currentUser.role === 'admin') {
    return;
  }

  if (currentUser.role !== 'teacher') {
    forbidden(detail);
  }

  const teacherId = await getTeacherProfileId(currentUser.id);
  if (!teacherId || teacherId !== test.teacher_id) {
    forbidden(detail);
  }
}

async function assertCanViewTest(currentUser: User, test: Test): Promise<void> {
  if (currentUser.role === 'director' || currentUser.role === 'admin') {
    return;
  }

  if (currentUser.role === 'teacher') {
    await assertTeacherOwnsTest(currentUser, test, 'Not authorized to view this test');
    return;
  }

  if (currentUser.role === 'student') {
    const student = await prisma.studentProfile.findUnique({ where: { user_id: currentUser.id } });
    if (!student || !student.class_id) {
      badRequest('Student profile not found');
    }

    if (!test.is_published) {
      forbidden('Test is not published');
    }

    if (student.class_id !== test.class_id) {
      forbidden('Test is not available for this class');
    }

    return;
  }

  forbidden('Not authorized to view this test');
}

async function assertNoAttempts(testId: number, detail = 'Cannot modify test after first attempt'): Promise<void> {
  const attemptsCount = await prisma.testAttempt.count({ where: { test_id: testId } });
  if (attemptsCount > 0) {
    badRequest(detail);
  }
}

async function resolveOwnerTeacherId(
  currentUser: User,
  requestedTeacherId?: number
): Promise<number> {
  const ownTeacherId = await getTeacherProfileId(currentUser.id);

  if (currentUser.role === 'teacher') {
    if (!ownTeacherId) {
      badRequest('Teacher profile not found');
    }

    if (requestedTeacherId !== undefined && requestedTeacherId !== ownTeacherId) {
      forbidden('Teacher can create tests only for themselves');
    }

    return ownTeacherId;
  }

  if (currentUser.role === 'director' || currentUser.role === 'admin') {
    if (requestedTeacherId !== undefined) {
      const targetTeacher = await prisma.teacherProfile.findUnique({ where: { id: requestedTeacherId } });
      if (!targetTeacher) {
        badRequest('teacher_id is invalid');
      }
      return requestedTeacherId;
    }

    if (ownTeacherId) {
      return ownTeacherId;
    }

    badRequest('teacher_id is required for director/admin without teacher profile');
  }

  forbidden('Not authorized to create tests');
}

type AttemptAnswerInput = {
  question_id: number;
  selected_option_id: number;
};

const testsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/my', { preHandler: [fastify.authenticate] }, async (request) => {
    const currentUser = request.currentUser!;

    if (currentUser.role === 'student') {
      const student = await prisma.studentProfile.findUnique({ where: { user_id: currentUser.id } });
      if (!student || !student.class_id) {
        return [];
      }

      const tests = await prisma.test.findMany({
        where: {
          class_id: student.class_id,
          is_published: true,
        },
        include: {
          attempts: {
            where: { student_id: student.id },
            orderBy: { submitted_at: 'desc' },
            take: 1,
          },
          _count: {
            select: { questions: true },
          },
        },
        orderBy: [{ due_date: 'asc' }, { id: 'desc' }],
      });

      return tests.map((test) => ({
        ...serializeTest(test),
        questions_count: test._count.questions,
        is_closed: new Date() > test.due_date,
        attempt: test.attempts[0] ? serializeTestAttempt(test.attempts[0]) : null,
      }));
    }

    const where: Prisma.TestWhereInput = {};

    if (currentUser.role === 'teacher') {
      const teacherId = await getTeacherProfileId(currentUser.id);
      if (!teacherId) {
        return [];
      }
      where.teacher_id = teacherId;
    }

    const tests = await prisma.test.findMany({
      where,
      include: {
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
      },
      orderBy: [{ due_date: 'desc' }, { id: 'desc' }],
    });

    return tests.map((test) => ({
      ...serializeTest(test),
      questions_count: test._count.questions,
      attempts_count: test._count.attempts,
      is_closed: new Date() > test.due_date,
    }));
  });

  fastify.get('/:test_id', { preHandler: [fastify.authenticate] }, async (request) => {
    const params = request.params as { test_id: string };
    const testId = parsePositiveInt(params.test_id, 'Invalid test id');

    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        questions: {
          include: {
            options: {
              orderBy: { order_index: 'asc' },
            },
          },
          orderBy: { order_index: 'asc' },
        },
      },
    });

    if (!test) {
      notFound('Test not found');
    }

    const currentUser = request.currentUser!;
    await assertCanViewTest(currentUser, test);

    const includeCorrectAnswers = currentUser.role !== 'student';
    const questionPayload = test.questions.map((question) => ({
      ...serializeTestQuestion(question),
      options: question.options.map((option) => serializeTestOption(option, includeCorrectAnswers)),
    }));

    if (currentUser.role === 'student') {
      const student = await prisma.studentProfile.findUnique({ where: { user_id: currentUser.id } });
      if (!student) {
        badRequest('Student profile not found');
      }

      const attempt = await prisma.testAttempt.findUnique({
        where: {
          test_id_student_id: {
            test_id: test.id,
            student_id: student.id,
          },
        },
      });

      return {
        ...serializeTest(test),
        questions: questionPayload,
        has_attempted: Boolean(attempt),
        attempt: attempt ? serializeTestAttempt(attempt) : null,
      };
    }

    return {
      ...serializeTest(test),
      questions: questionPayload,
    };
  });

  fastify.post('', { preHandler: [fastify.requireRoles(TEACHER_PLUS_ROLES, 'Teacher access required')] }, async (request, reply) => {
    const body = request.body as {
      title?: string;
      description?: string;
      subject_id?: number;
      class_id?: number;
      teacher_id?: number;
      due_date?: string;
      is_published?: boolean;
    };

    const currentUser = request.currentUser!;
    const title = ensureNonEmptyText(body.title, 'title is required');
    const subjectId = parseOptionalPositiveInt(body.subject_id, 'subject_id must be a positive integer');
    const classId = parseOptionalPositiveInt(body.class_id, 'class_id must be a positive integer');

    if (!subjectId) {
      badRequest('subject_id is required');
    }

    if (!classId) {
      badRequest('class_id is required');
    }

    const dueDate = parseDueDate(body.due_date);
    if (!dueDate) {
      badRequest('due_date is required');
    }

    const teacherId = await resolveOwnerTeacherId(currentUser, parseOptionalPositiveInt(body.teacher_id, 'teacher_id must be a positive integer'));

    const created = await prisma.test.create({
      data: {
        title,
        description: body.description?.trim() ? body.description.trim() : null,
        subject_id: subjectId,
        class_id: classId,
        teacher_id: teacherId,
        due_date: dueDate,
        is_published: body.is_published ?? false,
      },
    });

    return reply.status(201).send(serializeTest(created));
  });

  fastify.put('/:test_id', { preHandler: [fastify.requireRoles(TEACHER_PLUS_ROLES, 'Teacher access required')] }, async (request) => {
    const params = request.params as { test_id: string };
    const body = request.body as {
      title?: string;
      description?: string;
      subject_id?: number;
      class_id?: number;
      due_date?: string;
    };

    const testId = parsePositiveInt(params.test_id, 'Invalid test id');
    const test = await prisma.test.findUnique({ where: { id: testId } });
    if (!test) {
      notFound('Test not found');
    }

    const currentUser = request.currentUser!;
    await assertTeacherOwnsTest(currentUser, test, 'Not authorized to update this test');
    await assertNoAttempts(test.id, 'Cannot update test after first attempt');

    const dueDate = parseDueDate(body.due_date);

    const updated = await prisma.test.update({
      where: { id: test.id },
      data: {
        ...(body.title !== undefined ? { title: ensureNonEmptyText(body.title, 'title cannot be empty') } : {}),
        ...(body.description !== undefined
          ? { description: body.description?.trim() ? body.description.trim() : null }
          : {}),
        ...(body.subject_id !== undefined
          ? { subject_id: parseOptionalPositiveInt(body.subject_id, 'subject_id must be a positive integer') }
          : {}),
        ...(body.class_id !== undefined
          ? { class_id: parseOptionalPositiveInt(body.class_id, 'class_id must be a positive integer') }
          : {}),
        ...(dueDate !== undefined ? { due_date: dueDate } : {}),
      },
    });

    return serializeTest(updated);
  });

  fastify.delete('/:test_id', { preHandler: [fastify.requireRoles(TEACHER_PLUS_ROLES, 'Teacher access required')] }, async (request, reply) => {
    const params = request.params as { test_id: string };
    const testId = parsePositiveInt(params.test_id, 'Invalid test id');

    const test = await prisma.test.findUnique({ where: { id: testId } });
    if (!test) {
      notFound('Test not found');
    }

    const currentUser = request.currentUser!;
    await assertTeacherOwnsTest(currentUser, test, 'Not authorized to delete this test');
    await assertNoAttempts(test.id, 'Cannot delete test after first attempt');

    await prisma.$transaction(async (tx) => {
      const questionIds = (await tx.testQuestion.findMany({ where: { test_id: test.id }, select: { id: true } })).map((item) => item.id);

      if (questionIds.length > 0) {
        await tx.testOption.deleteMany({ where: { question_id: { in: questionIds } } });
      }
      await tx.testQuestion.deleteMany({ where: { test_id: test.id } });
      await tx.test.delete({ where: { id: test.id } });
    });

    return reply.status(204).send();
  });

  fastify.post('/:test_id/publish', { preHandler: [fastify.requireRoles(TEACHER_PLUS_ROLES, 'Teacher access required')] }, async (request) => {
    const params = request.params as { test_id: string };
    const testId = parsePositiveInt(params.test_id, 'Invalid test id');

    const test = await prisma.test.findUnique({ where: { id: testId } });
    if (!test) {
      notFound('Test not found');
    }

    const currentUser = request.currentUser!;
    await assertTeacherOwnsTest(currentUser, test, 'Not authorized to publish this test');

    const updated = await prisma.test.update({
      where: { id: test.id },
      data: { is_published: true },
    });

    return serializeTest(updated);
  });

  fastify.post('/:test_id/unpublish', { preHandler: [fastify.requireRoles(TEACHER_PLUS_ROLES, 'Teacher access required')] }, async (request) => {
    const params = request.params as { test_id: string };
    const testId = parsePositiveInt(params.test_id, 'Invalid test id');

    const test = await prisma.test.findUnique({ where: { id: testId } });
    if (!test) {
      notFound('Test not found');
    }

    const currentUser = request.currentUser!;
    await assertTeacherOwnsTest(currentUser, test, 'Not authorized to unpublish this test');
    await assertNoAttempts(test.id, 'Cannot unpublish test after first attempt');

    const updated = await prisma.test.update({
      where: { id: test.id },
      data: { is_published: false },
    });

    return serializeTest(updated);
  });

  fastify.post('/:test_id/questions', { preHandler: [fastify.requireRoles(TEACHER_PLUS_ROLES, 'Teacher access required')] }, async (request, reply) => {
    const params = request.params as { test_id: string };
    const body = request.body as { questions?: McqQuestionInput[] };
    const testId = parsePositiveInt(params.test_id, 'Invalid test id');

    const test = await prisma.test.findUnique({ where: { id: testId } });
    if (!test) {
      notFound('Test not found');
    }

    const currentUser = request.currentUser!;
    await assertTeacherOwnsTest(currentUser, test, 'Not authorized to edit this test');
    await assertNoAttempts(test.id);

    if (!Array.isArray(body.questions) || body.questions.length === 0) {
      badRequest('questions must be a non-empty array');
    }

    const normalizedQuestions = body.questions.map((question, index) => validateMcqQuestionPayload(question, index));
    const uniqueQuestionOrderIndexes = new Set(normalizedQuestions.map((question) => question.order_index));
    if (uniqueQuestionOrderIndexes.size !== normalizedQuestions.length) {
      badRequest('Question order_index values must be unique');
    }

    try {
      const createdQuestions = await prisma.$transaction(async (tx) => {
        const created: Array<Prisma.TestQuestionGetPayload<{ include: { options: true } }>> = [];

        for (const question of normalizedQuestions) {
          const createdQuestion = await tx.testQuestion.create({
            data: {
              test_id: test.id,
              question_text: question.question_text,
              order_index: question.order_index,
              points: question.points,
              options: {
                create: question.options.map((option) => ({
                  option_text: option.option_text,
                  order_index: option.order_index,
                  is_correct: option.is_correct,
                })),
              },
            },
            include: {
              options: {
                orderBy: { order_index: 'asc' },
              },
            },
          });
          created.push(createdQuestion);
        }

        return created;
      });

      return reply.status(201).send(
        createdQuestions.map((question) => ({
          ...serializeTestQuestion(question),
          options: question.options.map((option) => serializeTestOption(option, true)),
        }))
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        conflict('Question order_index must be unique within test');
      }
      throw error;
    }
  });

  fastify.put('/:test_id/questions/:question_id', { preHandler: [fastify.requireRoles(TEACHER_PLUS_ROLES, 'Teacher access required')] }, async (request) => {
    const params = request.params as { test_id: string; question_id: string };
    const body = request.body as {
      question_text?: string;
      order_index?: number;
      points?: number;
      options?: McqOptionInput[];
    };

    const testId = parsePositiveInt(params.test_id, 'Invalid test id');
    const questionId = parsePositiveInt(params.question_id, 'Invalid question id');

    const test = await prisma.test.findUnique({ where: { id: testId } });
    if (!test) {
      notFound('Test not found');
    }

    const currentUser = request.currentUser!;
    await assertTeacherOwnsTest(currentUser, test, 'Not authorized to edit this test');
    await assertNoAttempts(test.id);

    const existingQuestion = await prisma.testQuestion.findFirst({
      where: {
        id: questionId,
        test_id: test.id,
      },
    });

    if (!existingQuestion) {
      notFound('Question not found');
    }

    const hasAnyUpdate =
      body.question_text !== undefined ||
      body.order_index !== undefined ||
      body.points !== undefined ||
      body.options !== undefined;

    if (!hasAnyUpdate) {
      badRequest('Nothing to update');
    }

    let normalizedOptions:
      | Array<{
          option_text: string;
          order_index: number;
          is_correct: boolean;
        }>
      | undefined;

    if (body.options !== undefined) {
      if (!Array.isArray(body.options) || body.options.length !== 4) {
        badRequest('Exactly 4 options are required');
      }

      normalizedOptions = body.options.map((option, index) => ({
        option_text: ensureNonEmptyText(option.option_text, `Option #${index + 1}: option_text is required`),
        order_index:
          parseOptionalPositiveInt(option.order_index, `Option #${index + 1}: order_index must be a positive integer`) ??
          index + 1,
        is_correct: Boolean(option.is_correct),
      }));

      const correctCount = normalizedOptions.filter((option) => option.is_correct).length;
      if (correctCount !== 1) {
        badRequest('Exactly 1 correct option is required');
      }

      const uniqueOptionOrderIndexes = new Set(normalizedOptions.map((option) => option.order_index));
      if (uniqueOptionOrderIndexes.size !== normalizedOptions.length) {
        badRequest('Option order_index values must be unique');
      }
    }

    try {
      const updatedQuestion = await prisma.$transaction(async (tx) => {
        const question = await tx.testQuestion.update({
          where: { id: existingQuestion.id },
          data: {
            ...(body.question_text !== undefined
              ? { question_text: ensureNonEmptyText(body.question_text, 'question_text cannot be empty') }
              : {}),
            ...(body.order_index !== undefined
              ? {
                  order_index: parseOptionalPositiveInt(
                    body.order_index,
                    'order_index must be a positive integer'
                  ),
                }
              : {}),
            ...(body.points !== undefined
              ? { points: parseOptionalPositiveInt(body.points, 'points must be a positive integer') }
              : {}),
          },
        });

        if (normalizedOptions) {
          await tx.testOption.deleteMany({ where: { question_id: question.id } });
          await tx.testOption.createMany({
            data: normalizedOptions.map((option) => ({
              question_id: question.id,
              option_text: option.option_text,
              order_index: option.order_index,
              is_correct: option.is_correct,
            })),
          });
        }

        return tx.testQuestion.findUnique({
          where: { id: question.id },
          include: {
            options: {
              orderBy: { order_index: 'asc' },
            },
          },
        });
      });

      if (!updatedQuestion) {
        notFound('Question not found');
      }

      return {
        ...serializeTestQuestion(updatedQuestion),
        options: updatedQuestion.options.map((option) => serializeTestOption(option, true)),
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        conflict('Question order_index must be unique within test');
      }
      throw error;
    }
  });

  fastify.delete('/:test_id/questions/:question_id', { preHandler: [fastify.requireRoles(TEACHER_PLUS_ROLES, 'Teacher access required')] }, async (request, reply) => {
    const params = request.params as { test_id: string; question_id: string };
    const testId = parsePositiveInt(params.test_id, 'Invalid test id');
    const questionId = parsePositiveInt(params.question_id, 'Invalid question id');

    const test = await prisma.test.findUnique({ where: { id: testId } });
    if (!test) {
      notFound('Test not found');
    }

    const currentUser = request.currentUser!;
    await assertTeacherOwnsTest(currentUser, test, 'Not authorized to edit this test');
    await assertNoAttempts(test.id);

    const question = await prisma.testQuestion.findFirst({
      where: {
        id: questionId,
        test_id: test.id,
      },
    });
    if (!question) {
      notFound('Question not found');
    }

    await prisma.$transaction(async (tx) => {
      await tx.testOption.deleteMany({ where: { question_id: question.id } });
      await tx.testQuestion.delete({ where: { id: question.id } });
    });

    return reply.status(204).send();
  });

  fastify.post('/:test_id/submit', { preHandler: [fastify.authenticate] }, async (request) => {
    const params = request.params as { test_id: string };
    const body = request.body as { answers?: AttemptAnswerInput[] };
    const testId = parsePositiveInt(params.test_id, 'Invalid test id');

    const currentUser = request.currentUser!;
    if (currentUser.role !== 'student') {
      forbidden('Only students can submit tests');
    }

    const student = await prisma.studentProfile.findUnique({ where: { user_id: currentUser.id } });
    if (!student || !student.class_id) {
      badRequest('Student profile not found');
    }

    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        questions: {
          include: {
            options: true,
          },
          orderBy: { order_index: 'asc' },
        },
      },
    });

    if (!test) {
      notFound('Test not found');
    }

    if (!test.is_published) {
      forbidden('Test is not published');
    }

    if (test.class_id !== student.class_id) {
      forbidden('Test is not available for this class');
    }

    if (new Date() > test.due_date) {
      badRequest('Test submission deadline has passed');
    }

    if (!Array.isArray(body.answers) || body.answers.length === 0) {
      badRequest('answers must be a non-empty array');
    }

    const existingAttempt = await prisma.testAttempt.findUnique({
      where: {
        test_id_student_id: {
          test_id: test.id,
          student_id: student.id,
        },
      },
    });

    if (existingAttempt) {
      conflict('Already submitted this test');
    }

    if (test.questions.length === 0) {
      badRequest('Test has no questions');
    }

    if (body.answers.length !== test.questions.length) {
      badRequest('All questions must be answered');
    }

    const questionById = new Map(test.questions.map((question) => [question.id, question]));
    const seenQuestionIds = new Set<number>();

    const normalizedAnswers = body.answers.map((answer, index) => {
      const questionId = Number(answer.question_id);
      const selectedOptionId = Number(answer.selected_option_id);

      if (!Number.isInteger(questionId) || questionId <= 0) {
        badRequest(`Answer #${index + 1}: question_id must be a positive integer`);
      }

      if (!Number.isInteger(selectedOptionId) || selectedOptionId <= 0) {
        badRequest(`Answer #${index + 1}: selected_option_id must be a positive integer`);
      }

      if (seenQuestionIds.has(questionId)) {
        badRequest(`Answer #${index + 1}: duplicated question_id`);
      }
      seenQuestionIds.add(questionId);

      const question = questionById.get(questionId);
      if (!question) {
        badRequest(`Answer #${index + 1}: question does not belong to this test`);
      }

      const selectedOption = question.options.find((option) => option.id === selectedOptionId);
      if (!selectedOption) {
        badRequest(`Answer #${index + 1}: selected option does not belong to the question`);
      }

      const awardedPoints = selectedOption.is_correct ? question.points : 0;

      return {
        question_id: question.id,
        selected_option_id: selectedOption.id,
        is_correct: selectedOption.is_correct,
        awarded_points: awardedPoints,
      };
    });

    const rawScorePoints = normalizedAnswers.reduce((acc, answer) => acc + answer.awarded_points, 0);
    const rawMaxPoints = test.questions.reduce((acc, question) => acc + question.points, 0);
    const scorePoints = normalizeToTen(rawScorePoints, rawMaxPoints);
    const percentage = rawMaxPoints > 0 ? roundTo2((rawScorePoints / rawMaxPoints) * 100) : 0;

    try {
      const { attempt, createdGrade } = await prisma.$transaction(async (tx) => {
        const createdAttempt = await tx.testAttempt.create({
          data: {
            test_id: test.id,
            student_id: student.id,
            submitted_at: new Date(),
            score_points: scorePoints,
            max_points: TEN_SCALE_MAX_POINTS,
            percentage,
            answers: {
              create: normalizedAnswers,
            },
          },
          include: {
            answers: {
              orderBy: { question_id: 'asc' },
            },
          },
        });

        const existingGrade = await tx.grade.findFirst({
          where: {
            student_id: student.id,
            reference_id: test.id,
            grade_type: 'Test',
          },
        });

        let nextCreatedGrade: { student_id: number; percentage: number } | null = null;

        if (existingGrade) {
          await tx.grade.update({
            where: { id: existingGrade.id },
            data: {
              grade_value: scorePoints,
              max_value: TEN_SCALE_MAX_POINTS,
              comment: `Test result: ${percentage}%`,
              date: new Date(),
              subject_id: test.subject_id,
              teacher_id: test.teacher_id,
            },
          });
        } else {
          const grade = await tx.grade.create({
            data: {
              student_id: student.id,
              subject_id: test.subject_id,
              teacher_id: test.teacher_id,
              grade_value: scorePoints,
              max_value: TEN_SCALE_MAX_POINTS,
              grade_type: 'Test',
              reference_id: test.id,
              date: new Date(),
              comment: `Test result: ${percentage}%`,
              created_at: new Date(),
            },
          });

          nextCreatedGrade = {
            student_id: grade.student_id,
            percentage,
          };
        }

        return { attempt: createdAttempt, createdGrade: nextCreatedGrade };
      });

      if (createdGrade) {
        await awardBonusPoints(createdGrade.student_id, createdGrade.percentage);
      }

      return {
        attempt: serializeTestAttempt(attempt),
        answers: attempt.answers.map((answer) => serializeTestAnswer(answer)),
      };
    } catch (error) {
      const isKnownRequestError =
        error instanceof Prisma.PrismaClientKnownRequestError ||
        (typeof error === 'object' && error !== null && 'code' in error);

      if (isKnownRequestError && (error as { code?: string }).code === 'P2002') {
        conflict('Already submitted this test');
      }

      throw error;
    }
  });

  fastify.get('/:test_id/attempt', { preHandler: [fastify.authenticate] }, async (request) => {
    const params = request.params as { test_id: string };
    const testId = parsePositiveInt(params.test_id, 'Invalid test id');

    const currentUser = request.currentUser!;
    if (currentUser.role !== 'student') {
      forbidden('Only students can view their test attempt');
    }

    const student = await prisma.studentProfile.findUnique({ where: { user_id: currentUser.id } });
    if (!student) {
      badRequest('Student profile not found');
    }

    const test = await prisma.test.findUnique({ where: { id: testId } });
    if (!test) {
      notFound('Test not found');
    }

    await assertCanViewTest(currentUser, test);

    const attempt = await prisma.testAttempt.findUnique({
      where: {
        test_id_student_id: {
          test_id: test.id,
          student_id: student.id,
        },
      },
      include: {
        answers: {
          include: {
            question: {
              select: {
                question_text: true,
              },
            },
            selected_option: {
              select: {
                option_text: true,
              },
            },
          },
          orderBy: {
            question_id: 'asc',
          },
        },
      },
    });

    if (!attempt) {
      notFound('Test attempt not found');
    }

    return {
      attempt: serializeTestAttempt(attempt),
      answers: attempt.answers.map((answer) => ({
        ...serializeTestAnswer(answer),
        question_text: answer.question.question_text,
        selected_option_text: answer.selected_option.option_text,
      })),
    };
  });

  fastify.get('/:test_id/results', { preHandler: [fastify.requireRoles(TEACHER_PLUS_ROLES, 'Teacher access required')] }, async (request) => {
    const params = request.params as { test_id: string };
    const testId = parsePositiveInt(params.test_id, 'Invalid test id');

    const test = await prisma.test.findUnique({ where: { id: testId } });
    if (!test) {
      notFound('Test not found');
    }

    const currentUser = request.currentUser!;
    await assertTeacherOwnsTest(currentUser, test, 'Not authorized to view test results');

    const attempts = await prisma.testAttempt.findMany({
      where: { test_id: test.id },
      include: {
        student: {
          include: {
            user: {
              select: {
                first_name: true,
                last_name: true,
              },
            },
          },
        },
      },
      orderBy: [{ submitted_at: 'desc' }, { id: 'desc' }],
    });

    return attempts.map((attempt) =>
      serializeTestAttempt(attempt, {
        student_first_name: attempt.student.user.first_name,
        student_last_name: attempt.student.user.last_name,
      })
    );
  });

  fastify.get('/:test_id/analytics', { preHandler: [fastify.requireRoles(TEACHER_PLUS_ROLES, 'Teacher access required')] }, async (request) => {
    const params = request.params as { test_id: string };
    const testId = parsePositiveInt(params.test_id, 'Invalid test id');

    const test = await prisma.test.findUnique({ where: { id: testId } });
    if (!test) {
      notFound('Test not found');
    }

    const currentUser = request.currentUser!;
    await assertTeacherOwnsTest(currentUser, test, 'Not authorized to view test analytics');

    const [studentsTotal, attempts, questions] = await Promise.all([
      prisma.studentProfile.count({ where: { class_id: test.class_id } }),
      prisma.testAttempt.findMany({ where: { test_id: test.id } }),
      prisma.testQuestion.findMany({ where: { test_id: test.id }, orderBy: { order_index: 'asc' } }),
    ]);

    const attemptsTotal = attempts.length;
    const completionRate = studentsTotal > 0 ? roundTo2((attemptsTotal / studentsTotal) * 100) : 0;
    const averageScore =
      attemptsTotal > 0
        ? roundTo2(attempts.reduce((acc, attempt) => acc + attempt.percentage, 0) / attemptsTotal)
        : 0;

    const distribution = {
      '0_20': 0,
      '21_40': 0,
      '41_60': 0,
      '61_80': 0,
      '81_100': 0,
    };

    for (const attempt of attempts) {
      distribution[getScoreBucketKey(attempt.percentage)] += 1;
    }

    const questionIds = questions.map((question) => question.id);
    const answers =
      questionIds.length > 0
        ? await prisma.testAnswer.findMany({
            where: {
              question_id: {
                in: questionIds,
              },
            },
            select: {
              question_id: true,
              is_correct: true,
            },
          })
        : [];

    const statsByQuestionId = new Map<number, { total: number; wrong: number }>();
    for (const answer of answers) {
      const current = statsByQuestionId.get(answer.question_id) ?? { total: 0, wrong: 0 };
      current.total += 1;
      if (!answer.is_correct) {
        current.wrong += 1;
      }
      statsByQuestionId.set(answer.question_id, current);
    }

    const questionStats = questions.map((question) => {
      const stats = statsByQuestionId.get(question.id) ?? { total: 0, wrong: 0 };
      const correctAnswers = stats.total - stats.wrong;
      const correctRate = stats.total > 0 ? roundTo2((correctAnswers / stats.total) * 100) : 0;

      return {
        question_id: question.id,
        correct_rate: correctRate,
        wrong_count: stats.wrong,
      };
    });

    return {
      students_total: studentsTotal,
      attempts_total: attemptsTotal,
      completion_rate: completionRate,
      average_score: averageScore,
      score_distribution: distribution,
      question_stats: questionStats,
    };
  });
};

export default testsRoutes;
