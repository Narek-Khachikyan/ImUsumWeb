import dotenv from 'dotenv';

dotenv.config();

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }
  return value.toLowerCase() === 'true';
}

function parseNumber(value: string | undefined, fallback: number): number {
  if (value === undefined) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseCorsOrigins(value: string | undefined): string[] {
  if (!value) {
    return ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];
  }
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item));
    }
  } catch {
    return value.split(',').map((origin) => origin.trim()).filter(Boolean);
  }
  return ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];
}

export const env = {
  APP_NAME: process.env.APP_NAME ?? 'ImUsum API',
  DEBUG: parseBoolean(process.env.DEBUG, false),
  API_V1_PREFIX: process.env.API_V1_PREFIX ?? '/api/v1',
  DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/imusum',
  SECRET_KEY: process.env.SECRET_KEY ?? 'your-super-secret-key-change-in-production',
  ALGORITHM: process.env.ALGORITHM ?? 'HS256',
  ACCESS_TOKEN_EXPIRE_MINUTES: parseNumber(process.env.ACCESS_TOKEN_EXPIRE_MINUTES, 30),
  REFRESH_TOKEN_EXPIRE_DAYS: parseNumber(process.env.REFRESH_TOKEN_EXPIRE_DAYS, 7),
  RESET_PASSWORD_TOKEN_EXPIRE_MINUTES: parseNumber(process.env.RESET_PASSWORD_TOKEN_EXPIRE_MINUTES, 15),
  CORS_ORIGINS: parseCorsOrigins(process.env.CORS_ORIGINS),
  FRONTEND_URL: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? '',
  OPENAI_MODEL: process.env.OPENAI_MODEL ?? 'gpt-4',
  SMTP_HOST: process.env.SMTP_HOST ?? '',
  SMTP_PORT: parseNumber(process.env.SMTP_PORT, 587),
  SMTP_USERNAME: process.env.SMTP_USERNAME ?? '',
  SMTP_PASSWORD: process.env.SMTP_PASSWORD ?? '',
  SMTP_USE_TLS: parseBoolean(process.env.SMTP_USE_TLS, true),
  SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL ?? 'noreply@imusum.local',
  RATE_LIMIT_PER_MINUTE: parseNumber(process.env.RATE_LIMIT_PER_MINUTE, 60),
  MAX_FILE_SIZE_MB: parseNumber(process.env.MAX_FILE_SIZE_MB, 10),
  ALLOWED_FILE_TYPES: process.env.ALLOWED_FILE_TYPES
    ? process.env.ALLOWED_FILE_TYPES.split(',').map((value) => value.trim()).filter(Boolean)
    : ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'mp4'],
  UPLOAD_DIR: process.env.UPLOAD_DIR ?? './uploads',
  GEOLOCATION_RADIUS_METERS: parseNumber(process.env.GEOLOCATION_RADIUS_METERS, 100),
  NODE_ENV: process.env.NODE_ENV ?? 'development',
};
