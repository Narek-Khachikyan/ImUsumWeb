import type {
  LearningMaterial,
  LearningMaterialType,
  Prisma,
  User,
} from '@prisma/client';

import { badRequest, forbidden } from '../lib/errors.js';
import { prisma } from '../lib/prisma.js';

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 100;

const LEARNING_MATERIAL_TYPES: LearningMaterialType[] = [
  'BOOK',
  'ARTICLE',
  'WORKSHEET',
  'VIDEO',
  'OTHER',
];

function asRecord(value: unknown, detail: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    badRequest(detail);
  }
  return value as Record<string, unknown>;
}

function parseNonNegativeInt(value: unknown, fieldName: string): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    badRequest(`${fieldName} must be a non-negative integer`);
  }

  return parsed;
}

function parsePositiveInt(value: unknown, fieldName: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    badRequest(`${fieldName} must be a positive integer`);
  }

  return parsed;
}

function parseOptionalPositiveInt(value: unknown, fieldName: string): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  return parsePositiveInt(value, fieldName);
}

function parseOptionalNullablePositiveInt(
  value: unknown,
  fieldName: string
): number | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  return parsePositiveInt(value, fieldName);
}

function parseOptionalBoolean(value: unknown, fieldName: string): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    badRequest(`${fieldName} must be a boolean`);
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    if (['true', '1'].includes(value.toLowerCase())) {
      return true;
    }

    if (['false', '0'].includes(value.toLowerCase())) {
      return false;
    }
  }

  badRequest(`${fieldName} must be a boolean`);
}

function parseRequiredString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string') {
    badRequest(`${fieldName} is required`);
  }

  const trimmed = value.trim();
  if (!trimmed) {
    badRequest(`${fieldName} is required`);
  }

  return trimmed;
}

function parseOptionalString(value: unknown, fieldName: string): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    badRequest(`${fieldName} must be a string`);
  }

  const trimmed = value.trim();
  if (!trimmed) {
    badRequest(`${fieldName} must not be empty`);
  }

  return trimmed;
}

function parseOptionalMaterialType(
  value: unknown,
  fieldName: string
): LearningMaterialType | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    badRequest(`${fieldName} must be one of: ${LEARNING_MATERIAL_TYPES.join(', ')}`);
  }

  if (typeof value !== 'string') {
    badRequest(`${fieldName} must be one of: ${LEARNING_MATERIAL_TYPES.join(', ')}`);
  }

  const normalized = value.trim().toUpperCase() as LearningMaterialType;
  if (!LEARNING_MATERIAL_TYPES.includes(normalized)) {
    badRequest(`${fieldName} must be one of: ${LEARNING_MATERIAL_TYPES.join(', ')}`);
  }

  return normalized;
}

export type MaterialsListQuery = {
  skip: number;
  limit: number;
  q?: string;
  material_type?: LearningMaterialType;
  subject_id?: number;
  class_id?: number;
  is_published?: boolean;
};

export function parseMaterialId(value: string): number {
  return parsePositiveInt(value, 'material_id');
}

export function parseMaterialsListQuery(queryValue: unknown): MaterialsListQuery {
  const query = asRecord(queryValue ?? {}, 'Invalid query parameters');

  const skip = parseNonNegativeInt(query.skip, 'skip') ?? 0;
  const limit = parsePositiveInt(query.limit ?? DEFAULT_LIMIT, 'limit');

  if (limit > MAX_LIMIT) {
    badRequest(`limit must be less than or equal to ${MAX_LIMIT}`);
  }

  const rawQuery = query.q;
  let q: string | undefined;
  if (rawQuery !== undefined) {
    if (typeof rawQuery !== 'string') {
      badRequest('q must be a string');
    }

    const trimmed = rawQuery.trim();
    if (!trimmed) {
      badRequest('q must not be empty');
    }

    q = trimmed;
  }

  return {
    skip,
    limit,
    q,
    material_type: parseOptionalMaterialType(query.material_type, 'material_type'),
    subject_id: parseOptionalPositiveInt(query.subject_id, 'subject_id'),
    class_id: parseOptionalPositiveInt(query.class_id, 'class_id'),
    is_published: parseOptionalBoolean(query.is_published, 'is_published'),
  };
}

export async function buildMaterialsListWhere(
  currentUser: User,
  query: MaterialsListQuery
): Promise<Prisma.LearningMaterialWhereInput> {
  const conditions: Prisma.LearningMaterialWhereInput[] = [];

  if (query.q) {
    conditions.push({
      OR: [
        { title: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
        { author: { contains: query.q, mode: 'insensitive' } },
      ],
    });
  }

  if (query.material_type) {
    conditions.push({ material_type: query.material_type });
  }

  if (query.subject_id !== undefined) {
    conditions.push({ subject_id: query.subject_id });
  }

  if (query.class_id !== undefined) {
    conditions.push({ class_id: query.class_id });
  }

  if (currentUser.role === 'director' || currentUser.role === 'admin') {
    if (query.is_published !== undefined) {
      conditions.push({ is_published: query.is_published });
    }
    return conditions.length > 0 ? { AND: conditions } : {};
  }

  if (currentUser.role === 'teacher') {
    conditions.push({ is_published: true });
    return { AND: conditions };
  }

  if (currentUser.role === 'student') {
    const student = await prisma.studentProfile.findUnique({ where: { user_id: currentUser.id } });
    if (!student) {
      badRequest('Student profile not found');
    }

    conditions.push({ is_published: true });

    if (student.class_id === null) {
      conditions.push({ class_id: null });
    } else {
      conditions.push({ OR: [{ class_id: student.class_id }, { class_id: null }] });
    }

    return { AND: conditions };
  }

  forbidden('Not authorized to view materials');
}

export async function assertCanReadMaterial(
  currentUser: User,
  material: Pick<LearningMaterial, 'is_published' | 'class_id'>
): Promise<void> {
  if (currentUser.role === 'director' || currentUser.role === 'admin') {
    return;
  }

  if (!material.is_published) {
    forbidden('Material is not published');
  }

  if (currentUser.role === 'teacher') {
    return;
  }

  if (currentUser.role === 'student') {
    const student = await prisma.studentProfile.findUnique({ where: { user_id: currentUser.id } });
    if (!student) {
      badRequest('Student profile not found');
    }

    if (material.class_id !== null && material.class_id !== student.class_id) {
      forbidden('Material is not available for this class');
    }

    return;
  }

  forbidden('Not authorized to access material');
}

export function parseCreateMaterialInput(
  currentUser: User,
  bodyValue: unknown
): Prisma.LearningMaterialUncheckedCreateInput {
  const body = asRecord(bodyValue, 'Invalid request body');

  return {
    title: parseRequiredString(body.title, 'title'),
    file_url: parseRequiredString(body.file_url, 'file_url'),
    description: parseOptionalString(body.description, 'description') ?? null,
    material_type: parseOptionalMaterialType(body.material_type, 'material_type') ?? 'BOOK',
    author: parseOptionalString(body.author, 'author') ?? null,
    thumbnail_url: parseOptionalString(body.thumbnail_url, 'thumbnail_url') ?? null,
    subject_id: parseOptionalNullablePositiveInt(body.subject_id, 'subject_id') ?? null,
    class_id: parseOptionalNullablePositiveInt(body.class_id, 'class_id') ?? null,
    is_published: parseOptionalBoolean(body.is_published, 'is_published') ?? true,
    uploaded_by_user_id: currentUser.id,
  };
}

export function parseUpdateMaterialInput(
  bodyValue: unknown
): Prisma.LearningMaterialUncheckedUpdateInput {
  const body = asRecord(bodyValue, 'Invalid request body');
  const data: Prisma.LearningMaterialUncheckedUpdateInput = {};

  if ('title' in body) {
    data.title = parseRequiredString(body.title, 'title');
  }

  if ('file_url' in body) {
    data.file_url = parseRequiredString(body.file_url, 'file_url');
  }

  if ('description' in body) {
    data.description = parseOptionalString(body.description, 'description') ?? null;
  }

  if ('material_type' in body) {
    const materialType = parseOptionalMaterialType(body.material_type, 'material_type');
    if (materialType !== undefined) {
      data.material_type = materialType;
    }
  }

  if ('author' in body) {
    data.author = parseOptionalString(body.author, 'author') ?? null;
  }

  if ('thumbnail_url' in body) {
    data.thumbnail_url = parseOptionalString(body.thumbnail_url, 'thumbnail_url') ?? null;
  }

  if ('subject_id' in body) {
    data.subject_id = parseOptionalNullablePositiveInt(body.subject_id, 'subject_id') ?? null;
  }

  if ('class_id' in body) {
    data.class_id = parseOptionalNullablePositiveInt(body.class_id, 'class_id') ?? null;
  }

  if ('is_published' in body) {
    const isPublished = parseOptionalBoolean(body.is_published, 'is_published');
    if (isPublished !== undefined) {
      data.is_published = isPublished;
    }
  }

  if (Object.keys(data).length === 0) {
    badRequest('No fields provided for update');
  }

  return data;
}
