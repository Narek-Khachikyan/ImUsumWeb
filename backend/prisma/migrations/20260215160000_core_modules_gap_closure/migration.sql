DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assignmenttargetscope') THEN
    CREATE TYPE "assignmenttargetscope" AS ENUM ('CLASS', 'GROUPS', 'STUDENTS');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendancestatus') THEN
    CREATE TYPE "attendancestatus" AS ENUM ('PRESENT', 'LATE', 'ABSENT', 'EXCUSED');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendancesource') THEN
    CREATE TYPE "attendancesource" AS ENUM ('GEOLOCATION', 'SYSTEM', 'MANUAL_OVERRIDE');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'aiworkflowtype') THEN
    CREATE TYPE "aiworkflowtype" AS ENUM ('TEST_GENERATION', 'SCHEDULE_OPTIMIZATION');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'aiworkflowstatus') THEN
    CREATE TYPE "aiworkflowstatus" AS ENUM ('DRAFT', 'APPLIED', 'FAILED');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'jobapplicationstatus') THEN
    CREATE TYPE "jobapplicationstatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
  END IF;
END$$;

ALTER TABLE "assignments"
ADD COLUMN IF NOT EXISTS "target_scope" "assignmenttargetscope";

UPDATE "assignments"
SET "target_scope" = 'CLASS'
WHERE "target_scope" IS NULL;

ALTER TABLE "assignments"
ALTER COLUMN "target_scope" SET DEFAULT 'CLASS';

ALTER TABLE "assignments"
ALTER COLUMN "target_scope" SET NOT NULL;

CREATE TABLE IF NOT EXISTS "attendance_records" (
  "id" SERIAL NOT NULL,
  "student_id" INTEGER NOT NULL,
  "schedule_id" INTEGER NOT NULL,
  "attendance_date" DATE NOT NULL,
  "checked_in_at" TIMESTAMP(6),
  "status" "attendancestatus" NOT NULL,
  "source" "attendancesource" NOT NULL DEFAULT 'GEOLOCATION',
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "accuracy_m" DOUBLE PRECISION,
  "distance_m" DOUBLE PRECISION,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP(6) NOT NULL,
  CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "attendance_records_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "schedules"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT "attendance_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE TABLE IF NOT EXISTS "attendance_overrides" (
  "id" SERIAL NOT NULL,
  "attendance_record_id" INTEGER NOT NULL,
  "changed_by_user_id" INTEGER NOT NULL,
  "previous_status" "attendancestatus" NOT NULL,
  "new_status" "attendancestatus" NOT NULL,
  "reason" TEXT,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT "attendance_overrides_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "attendance_overrides_attendance_record_id_fkey" FOREIGN KEY ("attendance_record_id") REFERENCES "attendance_records"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT "attendance_overrides_changed_by_user_id_fkey" FOREIGN KEY ("changed_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE TABLE IF NOT EXISTS "ai_workflow_runs" (
  "id" SERIAL NOT NULL,
  "workflow_type" "aiworkflowtype" NOT NULL,
  "status" "aiworkflowstatus" NOT NULL DEFAULT 'DRAFT',
  "input_json" JSONB NOT NULL,
  "output_json" JSONB NOT NULL,
  "error_message" TEXT,
  "created_by_user_id" INTEGER NOT NULL,
  "applied_at" TIMESTAMP(6),
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP(6) NOT NULL,
  CONSTRAINT "ai_workflow_runs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ai_workflow_runs_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE TABLE IF NOT EXISTS "job_postings" (
  "id" SERIAL NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT NOT NULL,
  "company_name" VARCHAR(255) NOT NULL,
  "contact_email" VARCHAR(255),
  "external_url" VARCHAR(500),
  "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_by_user_id" INTEGER NOT NULL,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP(6) NOT NULL,
  CONSTRAINT "job_postings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "job_postings_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE TABLE IF NOT EXISTS "job_applications" (
  "id" SERIAL NOT NULL,
  "job_posting_id" INTEGER NOT NULL,
  "student_id" INTEGER NOT NULL,
  "status" "jobapplicationstatus" NOT NULL DEFAULT 'PENDING',
  "cover_letter" TEXT,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP(6) NOT NULL,
  CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "job_applications_job_posting_id_fkey" FOREIGN KEY ("job_posting_id") REFERENCES "job_postings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT "job_applications_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE TABLE IF NOT EXISTS "job_eligibility_overrides" (
  "id" SERIAL NOT NULL,
  "student_id" INTEGER NOT NULL,
  "eligible" BOOLEAN NOT NULL,
  "reason" TEXT,
  "set_by_user_id" INTEGER NOT NULL,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP(6) NOT NULL,
  CONSTRAINT "job_eligibility_overrides_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "job_eligibility_overrides_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT "job_eligibility_overrides_set_by_user_id_fkey" FOREIGN KEY ("set_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE TABLE IF NOT EXISTS "assignment_groups" (
  "id" SERIAL NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "class_id" INTEGER NOT NULL,
  "created_by_user_id" INTEGER NOT NULL,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP(6) NOT NULL,
  CONSTRAINT "assignment_groups_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "assignment_groups_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT "assignment_groups_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE TABLE IF NOT EXISTS "assignment_group_members" (
  "id" SERIAL NOT NULL,
  "group_id" INTEGER NOT NULL,
  "student_id" INTEGER NOT NULL,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT "assignment_group_members_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "assignment_group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "assignment_groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT "assignment_group_members_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE TABLE IF NOT EXISTS "assignment_target_groups" (
  "id" SERIAL NOT NULL,
  "assignment_id" INTEGER NOT NULL,
  "group_id" INTEGER NOT NULL,
  CONSTRAINT "assignment_target_groups_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "assignment_target_groups_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT "assignment_target_groups_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "assignment_groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE TABLE IF NOT EXISTS "assignment_target_students" (
  "id" SERIAL NOT NULL,
  "assignment_id" INTEGER NOT NULL,
  "student_id" INTEGER NOT NULL,
  CONSTRAINT "assignment_target_students_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "assignment_target_students_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT "assignment_target_students_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_attendance_records_student_schedule_date"
ON "attendance_records"("student_id", "schedule_id", "attendance_date");

CREATE UNIQUE INDEX IF NOT EXISTS "uq_job_applications_job_student"
ON "job_applications"("job_posting_id", "student_id");

CREATE UNIQUE INDEX IF NOT EXISTS "uq_job_eligibility_overrides_student_id"
ON "job_eligibility_overrides"("student_id");

CREATE UNIQUE INDEX IF NOT EXISTS "uq_assignment_groups_class_name"
ON "assignment_groups"("class_id", "name");

CREATE UNIQUE INDEX IF NOT EXISTS "uq_assignment_group_members_group_student"
ON "assignment_group_members"("group_id", "student_id");

CREATE UNIQUE INDEX IF NOT EXISTS "uq_assignment_target_groups_assignment_group"
ON "assignment_target_groups"("assignment_id", "group_id");

CREATE UNIQUE INDEX IF NOT EXISTS "uq_assignment_target_students_assignment_student"
ON "assignment_target_students"("assignment_id", "student_id");

CREATE INDEX IF NOT EXISTS "ix_assignments_target_scope" ON "assignments"("target_scope");
CREATE INDEX IF NOT EXISTS "ix_attendance_records_id" ON "attendance_records"("id");
CREATE INDEX IF NOT EXISTS "ix_attendance_records_student_id" ON "attendance_records"("student_id");
CREATE INDEX IF NOT EXISTS "ix_attendance_records_schedule_id" ON "attendance_records"("schedule_id");
CREATE INDEX IF NOT EXISTS "ix_attendance_records_attendance_date" ON "attendance_records"("attendance_date");
CREATE INDEX IF NOT EXISTS "ix_attendance_overrides_id" ON "attendance_overrides"("id");
CREATE INDEX IF NOT EXISTS "ix_attendance_overrides_attendance_record_id" ON "attendance_overrides"("attendance_record_id");
CREATE INDEX IF NOT EXISTS "ix_attendance_overrides_changed_by_user_id" ON "attendance_overrides"("changed_by_user_id");
CREATE INDEX IF NOT EXISTS "ix_ai_workflow_runs_id" ON "ai_workflow_runs"("id");
CREATE INDEX IF NOT EXISTS "ix_ai_workflow_runs_workflow_type" ON "ai_workflow_runs"("workflow_type");
CREATE INDEX IF NOT EXISTS "ix_ai_workflow_runs_status" ON "ai_workflow_runs"("status");
CREATE INDEX IF NOT EXISTS "ix_ai_workflow_runs_created_by_user_id" ON "ai_workflow_runs"("created_by_user_id");
CREATE INDEX IF NOT EXISTS "ix_job_postings_id" ON "job_postings"("id");
CREATE INDEX IF NOT EXISTS "ix_job_postings_is_active" ON "job_postings"("is_active");
CREATE INDEX IF NOT EXISTS "ix_job_postings_created_by_user_id" ON "job_postings"("created_by_user_id");
CREATE INDEX IF NOT EXISTS "ix_job_applications_id" ON "job_applications"("id");
CREATE INDEX IF NOT EXISTS "ix_job_applications_job_posting_id" ON "job_applications"("job_posting_id");
CREATE INDEX IF NOT EXISTS "ix_job_applications_student_id" ON "job_applications"("student_id");
CREATE INDEX IF NOT EXISTS "ix_job_applications_status" ON "job_applications"("status");
CREATE INDEX IF NOT EXISTS "ix_job_eligibility_overrides_id" ON "job_eligibility_overrides"("id");
CREATE INDEX IF NOT EXISTS "ix_job_eligibility_overrides_set_by_user_id" ON "job_eligibility_overrides"("set_by_user_id");
CREATE INDEX IF NOT EXISTS "ix_assignment_groups_id" ON "assignment_groups"("id");
CREATE INDEX IF NOT EXISTS "ix_assignment_groups_class_id" ON "assignment_groups"("class_id");
CREATE INDEX IF NOT EXISTS "ix_assignment_groups_created_by_user_id" ON "assignment_groups"("created_by_user_id");
CREATE INDEX IF NOT EXISTS "ix_assignment_group_members_id" ON "assignment_group_members"("id");
CREATE INDEX IF NOT EXISTS "ix_assignment_group_members_group_id" ON "assignment_group_members"("group_id");
CREATE INDEX IF NOT EXISTS "ix_assignment_group_members_student_id" ON "assignment_group_members"("student_id");
CREATE INDEX IF NOT EXISTS "ix_assignment_target_groups_id" ON "assignment_target_groups"("id");
CREATE INDEX IF NOT EXISTS "ix_assignment_target_groups_assignment_id" ON "assignment_target_groups"("assignment_id");
CREATE INDEX IF NOT EXISTS "ix_assignment_target_groups_group_id" ON "assignment_target_groups"("group_id");
CREATE INDEX IF NOT EXISTS "ix_assignment_target_students_id" ON "assignment_target_students"("id");
CREATE INDEX IF NOT EXISTS "ix_assignment_target_students_assignment_id" ON "assignment_target_students"("assignment_id");
CREATE INDEX IF NOT EXISTS "ix_assignment_target_students_student_id" ON "assignment_target_students"("student_id");
