-- Auth schema alignment:
-- 1) Add token versioning for JWT invalidation
-- 2) Enforce non-null auth booleans with defaults
-- 3) Ensure auth-created records get created_at defaults

ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "token_version" INTEGER;

UPDATE "users"
SET "token_version" = 0
WHERE "token_version" IS NULL;

ALTER TABLE "users"
ALTER COLUMN "token_version" SET DEFAULT 0,
ALTER COLUMN "token_version" SET NOT NULL;

UPDATE "users"
SET "is_active" = TRUE
WHERE "is_active" IS NULL;

UPDATE "users"
SET "is_verified" = FALSE
WHERE "is_verified" IS NULL;

ALTER TABLE "users"
ALTER COLUMN "is_active" SET DEFAULT TRUE,
ALTER COLUMN "is_active" SET NOT NULL,
ALTER COLUMN "is_verified" SET DEFAULT FALSE,
ALTER COLUMN "is_verified" SET NOT NULL;

ALTER TABLE "users"
ALTER COLUMN "created_at" SET DEFAULT NOW();

ALTER TABLE "student_profiles"
ALTER COLUMN "created_at" SET DEFAULT NOW();

ALTER TABLE "teacher_profiles"
ALTER COLUMN "created_at" SET DEFAULT NOW();

ALTER TABLE "password_reset_tokens"
ALTER COLUMN "created_at" SET DEFAULT NOW();
