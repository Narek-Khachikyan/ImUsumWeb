-- Normalize grading system to strict 10-point scale (2..10)

-- 1) Grades -> convert historical values and pin max_value=10
UPDATE "grades"
SET
  "grade_value" = CASE
    WHEN COALESCE("max_value", 0) <= 0 THEN 2
    ELSE LEAST(
      10,
      GREATEST(
        2,
        ROUND(2 + (GREATEST("grade_value", 0)::numeric / "max_value"::numeric) * 8)
      )
    )::double precision
  END,
  "max_value" = 10;

-- 2) Assignment submissions -> convert using existing assignment max_points
UPDATE "assignment_submissions" AS s
SET "points_earned" = CASE
  WHEN s."points_earned" IS NULL THEN NULL
  WHEN COALESCE(a."max_points", 0) <= 0 THEN 2
  ELSE LEAST(
    10,
    GREATEST(
      2,
      ROUND(2 + (GREATEST(s."points_earned", 0)::numeric / a."max_points"::numeric) * 8)
    )
  )::integer
END
FROM "assignments" AS a
WHERE s."assignment_id" = a."id";

-- 3) Assignments -> force single max_points scale
UPDATE "assignments"
SET "max_points" = 10;

-- 4) Test attempts -> normalize score_points and pin max_points=10
UPDATE "test_attempts"
SET
  "score_points" = CASE
    WHEN "max_points" <= 0 THEN 2
    ELSE LEAST(
      10,
      GREATEST(
        2,
        ROUND(2 + (GREATEST("score_points", 0)::numeric / "max_points"::numeric) * 8)
      )
    )::integer
  END,
  "max_points" = 10;

-- 5) Strengthen defaults/nullability for fixed-scale columns
ALTER TABLE "assignments"
  ALTER COLUMN "max_points" SET DEFAULT 10,
  ALTER COLUMN "max_points" SET NOT NULL;

ALTER TABLE "grades"
  ALTER COLUMN "max_value" SET DEFAULT 10,
  ALTER COLUMN "max_value" SET NOT NULL;

-- 6) Enforce DB-level invariants
ALTER TABLE "grades" DROP CONSTRAINT IF EXISTS "ck_grades_grade_value_2_10";
ALTER TABLE "grades" ADD CONSTRAINT "ck_grades_grade_value_2_10"
  CHECK ("grade_value" BETWEEN 2 AND 10 AND "grade_value" = ROUND("grade_value"));

ALTER TABLE "grades" DROP CONSTRAINT IF EXISTS "ck_grades_max_value_10";
ALTER TABLE "grades" ADD CONSTRAINT "ck_grades_max_value_10"
  CHECK ("max_value" = 10);

ALTER TABLE "assignment_submissions" DROP CONSTRAINT IF EXISTS "ck_assignment_submissions_points_earned_2_10";
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "ck_assignment_submissions_points_earned_2_10"
  CHECK ("points_earned" IS NULL OR "points_earned" BETWEEN 2 AND 10);

ALTER TABLE "assignments" DROP CONSTRAINT IF EXISTS "ck_assignments_max_points_10";
ALTER TABLE "assignments" ADD CONSTRAINT "ck_assignments_max_points_10"
  CHECK ("max_points" = 10);

ALTER TABLE "test_attempts" DROP CONSTRAINT IF EXISTS "ck_test_attempts_score_points_2_10";
ALTER TABLE "test_attempts" ADD CONSTRAINT "ck_test_attempts_score_points_2_10"
  CHECK ("score_points" BETWEEN 2 AND 10);

ALTER TABLE "test_attempts" DROP CONSTRAINT IF EXISTS "ck_test_attempts_max_points_10";
ALTER TABLE "test_attempts" ADD CONSTRAINT "ck_test_attempts_max_points_10"
  CHECK ("max_points" = 10);
