-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'userrole') THEN
    CREATE TYPE "userrole" AS ENUM ('STUDENT', 'TEACHER', 'DIRECTOR', 'ADMIN');
  END IF;
END$$;

-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assignmenttype') THEN
    CREATE TYPE "assignmenttype" AS ENUM ('INDIVIDUAL', 'GROUP');
  END IF;
END$$;

-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assignmenttargetscope') THEN
    CREATE TYPE "assignmenttargetscope" AS ENUM ('CLASS', 'GROUPS', 'STUDENTS');
  END IF;
END$$;

-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendancestatus') THEN
    CREATE TYPE "attendancestatus" AS ENUM ('PRESENT', 'LATE', 'ABSENT', 'EXCUSED');
  END IF;
END$$;

-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendancesource') THEN
    CREATE TYPE "attendancesource" AS ENUM ('GEOLOCATION', 'SYSTEM', 'MANUAL_OVERRIDE');
  END IF;
END$$;

-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'aiworkflowtype') THEN
    CREATE TYPE "aiworkflowtype" AS ENUM ('TEST_GENERATION', 'SCHEDULE_OPTIMIZATION');
  END IF;
END$$;

-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'aiworkflowstatus') THEN
    CREATE TYPE "aiworkflowstatus" AS ENUM ('DRAFT', 'APPLIED', 'FAILED');
  END IF;
END$$;

-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'jobapplicationstatus') THEN
    CREATE TYPE "jobapplicationstatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
  END IF;
END$$;

-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dayofweek') THEN
    CREATE TYPE "dayofweek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');
  END IF;
END$$;

-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'chatchanneltype') THEN
    CREATE TYPE "chatchanneltype" AS ENUM ('class', 'staff');
  END IF;
END$$;

-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'learningmaterialtype') THEN
    CREATE TYPE "learningmaterialtype" AS ENUM ('BOOK', 'ARTICLE', 'WORKSHEET', 'VIDEO', 'OTHER');
  END IF;
END$$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "users" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "hashed_password" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "role" "userrole" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "token_version" INTEGER NOT NULL DEFAULT 0,
    "avatar_url" VARCHAR(500),
    "phone" VARCHAR(20),
    "school_id" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "schools" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "address" VARCHAR(500),
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "phone" VARCHAR(20),
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "classes" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "grade_level" INTEGER NOT NULL,
    "school_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "student_profiles" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "class_id" INTEGER,
    "student_id_number" VARCHAR(50),
    "gpa" DOUBLE PRECISION,
    "bonus_points" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "teacher_profiles" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "employee_id" VARCHAR(50),
    "department" VARCHAR(100),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "teacher_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "subjects" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "teacher_subjects" (
    "teacher_id" INTEGER NOT NULL,
    "subject_id" INTEGER NOT NULL,

    CONSTRAINT "teacher_subjects_pkey" PRIMARY KEY ("teacher_id","subject_id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "schedules" (
    "id" SERIAL NOT NULL,
    "class_id" INTEGER NOT NULL,
    "subject_id" INTEGER NOT NULL,
    "teacher_id" INTEGER NOT NULL,
    "day_of_week" "dayofweek" NOT NULL,
    "start_time" TIME(6) NOT NULL,
    "end_time" TIME(6) NOT NULL,
    "room" VARCHAR(50),
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "assignments" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "assignment_type" "assignmenttype",
    "target_scope" "assignmenttargetscope" NOT NULL DEFAULT 'CLASS',
    "subject_id" INTEGER NOT NULL,
    "class_id" INTEGER NOT NULL,
    "teacher_id" INTEGER NOT NULL,
    "due_date" TIMESTAMP(6) NOT NULL,
    "max_points" INTEGER,
    "is_published" BOOLEAN,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "assignment_submissions" (
    "id" SERIAL NOT NULL,
    "assignment_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "content" TEXT,
    "file_url" VARCHAR(500),
    "submitted_at" TIMESTAMP(6),
    "points_earned" INTEGER,
    "feedback" TEXT,
    "is_graded" BOOLEAN,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "assignment_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "grades" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "subject_id" INTEGER NOT NULL,
    "teacher_id" INTEGER NOT NULL,
    "grade_value" DOUBLE PRECISION NOT NULL,
    "max_value" DOUBLE PRECISION,
    "grade_type" VARCHAR(50) NOT NULL,
    "reference_id" INTEGER,
    "date" DATE NOT NULL,
    "comment" VARCHAR(500),
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "tests" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "subject_id" INTEGER NOT NULL,
    "class_id" INTEGER NOT NULL,
    "teacher_id" INTEGER NOT NULL,
    "due_date" TIMESTAMP(6) NOT NULL,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "test_questions" (
    "id" SERIAL NOT NULL,
    "test_id" INTEGER NOT NULL,
    "question_text" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "test_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "test_options" (
    "id" SERIAL NOT NULL,
    "question_id" INTEGER NOT NULL,
    "option_text" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "test_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "test_attempts" (
    "id" SERIAL NOT NULL,
    "test_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "submitted_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "score_points" INTEGER NOT NULL,
    "max_points" INTEGER NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "test_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "test_answers" (
    "id" SERIAL NOT NULL,
    "attempt_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,
    "selected_option_id" INTEGER NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "awarded_points" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "test_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "chat_channels" (
    "id" SERIAL NOT NULL,
    "key" VARCHAR(120) NOT NULL,
    "type" "chatchanneltype" NOT NULL,
    "school_id" INTEGER NOT NULL,
    "class_id" INTEGER,
    "title" VARCHAR(255) NOT NULL,
    "last_message_id" INTEGER,
    "last_message_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "chat_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "chat_messages" (
    "id" SERIAL NOT NULL,
    "channel_id" INTEGER NOT NULL,
    "sender_user_id" INTEGER NOT NULL,
    "body" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "edited_at" TIMESTAMP(6),
    "deleted_at" TIMESTAMP(6),
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "chat_channel_reads" (
    "user_id" INTEGER NOT NULL,
    "channel_id" INTEGER NOT NULL,
    "last_read_message_id" INTEGER,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "chat_channel_reads_pkey" PRIMARY KEY ("user_id","channel_id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "blog_posts" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "image" VARCHAR(500),
    "letter" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "hot" BOOLEAN,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "learning_materials" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "material_type" "learningmaterialtype" NOT NULL DEFAULT 'BOOK',
    "author" VARCHAR(255),
    "file_url" VARCHAR(500) NOT NULL,
    "thumbnail_url" VARCHAR(500),
    "subject_id" INTEGER,
    "class_id" INTEGER,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "uploaded_by_user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "learning_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "partners" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "image" VARCHAR(500),
    "website" VARCHAR(500),
    "description" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "offers" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "image_url" VARCHAR(500),
    "brand_name" VARCHAR(255) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "stock_quantity" INTEGER,
    "is_active" BOOLEAN,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "purchases" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "offer_id" INTEGER NOT NULL,
    "points_spent" INTEGER NOT NULL,
    "qr_code" VARCHAR(255) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "redeemed_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "attendance_overrides" (
    "id" SERIAL NOT NULL,
    "attendance_record_id" INTEGER NOT NULL,
    "changed_by_user_id" INTEGER NOT NULL,
    "previous_status" "attendancestatus" NOT NULL,
    "new_status" "attendancestatus" NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ai_workflow_runs" (
    "id" SERIAL NOT NULL,
    "workflow_type" "aiworkflowtype" NOT NULL,
    "status" "aiworkflowstatus" NOT NULL DEFAULT 'DRAFT',
    "input_json" JSONB NOT NULL,
    "output_json" JSONB NOT NULL,
    "error_message" TEXT,
    "created_by_user_id" INTEGER NOT NULL,
    "applied_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "ai_workflow_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "job_postings" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "company_name" VARCHAR(255) NOT NULL,
    "contact_email" VARCHAR(255),
    "external_url" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by_user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "job_postings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "job_applications" (
    "id" SERIAL NOT NULL,
    "job_posting_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "status" "jobapplicationstatus" NOT NULL DEFAULT 'PENDING',
    "cover_letter" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "job_eligibility_overrides" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "eligible" BOOLEAN NOT NULL,
    "reason" TEXT,
    "set_by_user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "job_eligibility_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "assignment_groups" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "class_id" INTEGER NOT NULL,
    "created_by_user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "assignment_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "assignment_group_members" (
    "id" SERIAL NOT NULL,
    "group_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assignment_group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "assignment_target_groups" (
    "id" SERIAL NOT NULL,
    "assignment_id" INTEGER NOT NULL,
    "group_id" INTEGER NOT NULL,

    CONSTRAINT "assignment_target_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "assignment_target_students" (
    "id" SERIAL NOT NULL,
    "assignment_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,

    CONSTRAINT "assignment_target_students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "used_at" TIMESTAMP(6),
    "requested_ip" VARCHAR(45),
    "requested_user_agent" VARCHAR(500),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "alembic_version" (
    "version_num" VARCHAR(32) NOT NULL,

    CONSTRAINT "alembic_version_pkc" PRIMARY KEY ("version_num")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ix_users_email" ON "users"("email");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_users_id" ON "users"("id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_schools_id" ON "schools"("id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_classes_id" ON "classes"("id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "student_profiles_user_id_key" ON "student_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "student_profiles_student_id_number_key" ON "student_profiles"("student_id_number");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_student_profiles_id" ON "student_profiles"("id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "teacher_profiles_user_id_key" ON "teacher_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "teacher_profiles_employee_id_key" ON "teacher_profiles"("employee_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_teacher_profiles_id" ON "teacher_profiles"("id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "subjects_code_key" ON "subjects"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_subjects_id" ON "subjects"("id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_schedules_id" ON "schedules"("id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_assignments_id" ON "assignments"("id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_assignment_submissions_id" ON "assignment_submissions"("id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "uq_assignment_submission_assignment_student" ON "assignment_submissions"("assignment_id", "student_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_grades_id" ON "grades"("id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_tests_id" ON "tests"("id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_tests_class_id" ON "tests"("class_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_tests_teacher_id" ON "tests"("teacher_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_tests_subject_id" ON "tests"("subject_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_test_questions_id" ON "test_questions"("id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "uq_test_questions_test_order" ON "test_questions"("test_id", "order_index");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_test_options_id" ON "test_options"("id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "uq_test_options_question_order" ON "test_options"("question_id", "order_index");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_test_attempts_id" ON "test_attempts"("id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "uq_test_attempts_test_student" ON "test_attempts"("test_id", "student_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_test_answers_id" ON "test_answers"("id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "uq_test_answers_attempt_question" ON "test_answers"("attempt_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ix_chat_channels_key" ON "chat_channels"("key");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_chat_channels_id" ON "chat_channels"("id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_chat_channels_school_id" ON "chat_channels"("school_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_chat_channels_class_id" ON "chat_channels"("class_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_chat_messages_id" ON "chat_messages"("id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_chat_messages_channel_id_id" ON "chat_messages"("channel_id", "id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_chat_messages_sender_user_id" ON "chat_messages"("sender_user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_chat_channel_reads_channel_id" ON "chat_channel_reads"("channel_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_blog_posts_id" ON "blog_posts"("id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_learning_materials_id" ON "learning_materials"("id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_learning_materials_subject_id" ON "learning_materials"("subject_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_learning_materials_class_id" ON "learning_materials"("class_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_learning_materials_uploaded_by_user_id" ON "learning_materials"("uploaded_by_user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_learning_materials_material_type" ON "learning_materials"("material_type");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_partners_id" ON "partners"("id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_offers_id" ON "offers"("id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ix_purchases_qr_code" ON "purchases"("qr_code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_purchases_id" ON "purchases"("id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_purchases_offer_id" ON "purchases"("offer_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_purchases_student_id" ON "purchases"("student_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_attendance_records_attendance_date" ON "attendance_records"("attendance_date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_attendance_records_schedule_id" ON "attendance_records"("schedule_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_attendance_records_student_id" ON "attendance_records"("student_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_attendance_records_id" ON "attendance_records"("id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "uq_attendance_records_student_schedule_date" ON "attendance_records"("student_id", "schedule_id", "attendance_date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_attendance_overrides_attendance_record_id" ON "attendance_overrides"("attendance_record_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_attendance_overrides_changed_by_user_id" ON "attendance_overrides"("changed_by_user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_attendance_overrides_id" ON "attendance_overrides"("id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_ai_workflow_runs_workflow_type" ON "ai_workflow_runs"("workflow_type");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_ai_workflow_runs_status" ON "ai_workflow_runs"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_ai_workflow_runs_created_by_user_id" ON "ai_workflow_runs"("created_by_user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_ai_workflow_runs_id" ON "ai_workflow_runs"("id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_job_postings_is_active" ON "job_postings"("is_active");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_job_postings_created_by_user_id" ON "job_postings"("created_by_user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_job_postings_id" ON "job_postings"("id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_job_applications_job_posting_id" ON "job_applications"("job_posting_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_job_applications_student_id" ON "job_applications"("student_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_job_applications_status" ON "job_applications"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_job_applications_id" ON "job_applications"("id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "uq_job_applications_job_student" ON "job_applications"("job_posting_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "uq_job_eligibility_overrides_student_id" ON "job_eligibility_overrides"("student_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_job_eligibility_overrides_set_by_user_id" ON "job_eligibility_overrides"("set_by_user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_job_eligibility_overrides_id" ON "job_eligibility_overrides"("id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_assignment_groups_class_id" ON "assignment_groups"("class_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_assignment_groups_created_by_user_id" ON "assignment_groups"("created_by_user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_assignment_groups_id" ON "assignment_groups"("id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "uq_assignment_groups_class_name" ON "assignment_groups"("class_id", "name");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_assignment_group_members_group_id" ON "assignment_group_members"("group_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_assignment_group_members_student_id" ON "assignment_group_members"("student_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_assignment_group_members_id" ON "assignment_group_members"("id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "uq_assignment_group_members_group_student" ON "assignment_group_members"("group_id", "student_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_assignment_target_groups_assignment_id" ON "assignment_target_groups"("assignment_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_assignment_target_groups_group_id" ON "assignment_target_groups"("group_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_assignment_target_groups_id" ON "assignment_target_groups"("id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "uq_assignment_target_groups_assignment_group" ON "assignment_target_groups"("assignment_id", "group_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_assignment_target_students_assignment_id" ON "assignment_target_students"("assignment_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_assignment_target_students_student_id" ON "assignment_target_students"("student_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_assignment_target_students_id" ON "assignment_target_students"("id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "uq_assignment_target_students_assignment_student" ON "assignment_target_students"("assignment_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ix_password_reset_tokens_token_hash" ON "password_reset_tokens"("token_hash");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_password_reset_tokens_expires_at" ON "password_reset_tokens"("expires_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_password_reset_tokens_id" ON "password_reset_tokens"("id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_password_reset_tokens_used_at" ON "password_reset_tokens"("used_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ix_password_reset_tokens_user_id" ON "password_reset_tokens"("user_id");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_school_id_fkey') THEN
    ALTER TABLE "users" ADD CONSTRAINT "users_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'classes_school_id_fkey') THEN
    ALTER TABLE "classes" ADD CONSTRAINT "classes_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_profiles_class_id_fkey') THEN
    ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_profiles_user_id_fkey') THEN
    ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teacher_profiles_user_id_fkey') THEN
    ALTER TABLE "teacher_profiles" ADD CONSTRAINT "teacher_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teacher_subjects_subject_id_fkey') THEN
    ALTER TABLE "teacher_subjects" ADD CONSTRAINT "teacher_subjects_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teacher_subjects_teacher_id_fkey') THEN
    ALTER TABLE "teacher_subjects" ADD CONSTRAINT "teacher_subjects_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teacher_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'schedules_class_id_fkey') THEN
    ALTER TABLE "schedules" ADD CONSTRAINT "schedules_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'schedules_subject_id_fkey') THEN
    ALTER TABLE "schedules" ADD CONSTRAINT "schedules_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'schedules_teacher_id_fkey') THEN
    ALTER TABLE "schedules" ADD CONSTRAINT "schedules_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teacher_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assignments_class_id_fkey') THEN
    ALTER TABLE "assignments" ADD CONSTRAINT "assignments_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assignments_subject_id_fkey') THEN
    ALTER TABLE "assignments" ADD CONSTRAINT "assignments_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assignments_teacher_id_fkey') THEN
    ALTER TABLE "assignments" ADD CONSTRAINT "assignments_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teacher_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assignment_submissions_assignment_id_fkey') THEN
    ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assignment_submissions_student_id_fkey') THEN
    ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'grades_student_id_fkey') THEN
    ALTER TABLE "grades" ADD CONSTRAINT "grades_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'grades_subject_id_fkey') THEN
    ALTER TABLE "grades" ADD CONSTRAINT "grades_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'grades_teacher_id_fkey') THEN
    ALTER TABLE "grades" ADD CONSTRAINT "grades_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teacher_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tests_class_id_fkey') THEN
    ALTER TABLE "tests" ADD CONSTRAINT "tests_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tests_subject_id_fkey') THEN
    ALTER TABLE "tests" ADD CONSTRAINT "tests_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tests_teacher_id_fkey') THEN
    ALTER TABLE "tests" ADD CONSTRAINT "tests_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teacher_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'test_questions_test_id_fkey') THEN
    ALTER TABLE "test_questions" ADD CONSTRAINT "test_questions_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'test_options_question_id_fkey') THEN
    ALTER TABLE "test_options" ADD CONSTRAINT "test_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "test_questions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'test_attempts_student_id_fkey') THEN
    ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'test_attempts_test_id_fkey') THEN
    ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'test_answers_attempt_id_fkey') THEN
    ALTER TABLE "test_answers" ADD CONSTRAINT "test_answers_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "test_attempts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'test_answers_question_id_fkey') THEN
    ALTER TABLE "test_answers" ADD CONSTRAINT "test_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "test_questions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'test_answers_selected_option_id_fkey') THEN
    ALTER TABLE "test_answers" ADD CONSTRAINT "test_answers_selected_option_id_fkey" FOREIGN KEY ("selected_option_id") REFERENCES "test_options"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chat_channels_class_id_fkey') THEN
    ALTER TABLE "chat_channels" ADD CONSTRAINT "chat_channels_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chat_channels_last_message_id_fkey') THEN
    ALTER TABLE "chat_channels" ADD CONSTRAINT "chat_channels_last_message_id_fkey" FOREIGN KEY ("last_message_id") REFERENCES "chat_messages"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chat_channels_school_id_fkey') THEN
    ALTER TABLE "chat_channels" ADD CONSTRAINT "chat_channels_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chat_messages_channel_id_fkey') THEN
    ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "chat_channels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chat_messages_sender_user_id_fkey') THEN
    ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_user_id_fkey" FOREIGN KEY ("sender_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chat_channel_reads_channel_id_fkey') THEN
    ALTER TABLE "chat_channel_reads" ADD CONSTRAINT "chat_channel_reads_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "chat_channels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chat_channel_reads_user_id_fkey') THEN
    ALTER TABLE "chat_channel_reads" ADD CONSTRAINT "chat_channel_reads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'learning_materials_class_id_fkey') THEN
    ALTER TABLE "learning_materials" ADD CONSTRAINT "learning_materials_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'learning_materials_subject_id_fkey') THEN
    ALTER TABLE "learning_materials" ADD CONSTRAINT "learning_materials_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'learning_materials_uploaded_by_user_id_fkey') THEN
    ALTER TABLE "learning_materials" ADD CONSTRAINT "learning_materials_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchases_offer_id_fkey') THEN
    ALTER TABLE "purchases" ADD CONSTRAINT "purchases_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchases_student_id_fkey') THEN
    ALTER TABLE "purchases" ADD CONSTRAINT "purchases_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_records_schedule_id_fkey') THEN
    ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "schedules"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_records_student_id_fkey') THEN
    ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_overrides_attendance_record_id_fkey') THEN
    ALTER TABLE "attendance_overrides" ADD CONSTRAINT "attendance_overrides_attendance_record_id_fkey" FOREIGN KEY ("attendance_record_id") REFERENCES "attendance_records"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_overrides_changed_by_user_id_fkey') THEN
    ALTER TABLE "attendance_overrides" ADD CONSTRAINT "attendance_overrides_changed_by_user_id_fkey" FOREIGN KEY ("changed_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ai_workflow_runs_created_by_user_id_fkey') THEN
    ALTER TABLE "ai_workflow_runs" ADD CONSTRAINT "ai_workflow_runs_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'job_postings_created_by_user_id_fkey') THEN
    ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'job_applications_job_posting_id_fkey') THEN
    ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_job_posting_id_fkey" FOREIGN KEY ("job_posting_id") REFERENCES "job_postings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'job_applications_student_id_fkey') THEN
    ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'job_eligibility_overrides_set_by_user_id_fkey') THEN
    ALTER TABLE "job_eligibility_overrides" ADD CONSTRAINT "job_eligibility_overrides_set_by_user_id_fkey" FOREIGN KEY ("set_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'job_eligibility_overrides_student_id_fkey') THEN
    ALTER TABLE "job_eligibility_overrides" ADD CONSTRAINT "job_eligibility_overrides_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assignment_groups_class_id_fkey') THEN
    ALTER TABLE "assignment_groups" ADD CONSTRAINT "assignment_groups_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assignment_groups_created_by_user_id_fkey') THEN
    ALTER TABLE "assignment_groups" ADD CONSTRAINT "assignment_groups_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assignment_group_members_group_id_fkey') THEN
    ALTER TABLE "assignment_group_members" ADD CONSTRAINT "assignment_group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "assignment_groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assignment_group_members_student_id_fkey') THEN
    ALTER TABLE "assignment_group_members" ADD CONSTRAINT "assignment_group_members_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assignment_target_groups_assignment_id_fkey') THEN
    ALTER TABLE "assignment_target_groups" ADD CONSTRAINT "assignment_target_groups_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assignment_target_groups_group_id_fkey') THEN
    ALTER TABLE "assignment_target_groups" ADD CONSTRAINT "assignment_target_groups_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "assignment_groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assignment_target_students_assignment_id_fkey') THEN
    ALTER TABLE "assignment_target_students" ADD CONSTRAINT "assignment_target_students_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assignment_target_students_student_id_fkey') THEN
    ALTER TABLE "assignment_target_students" ADD CONSTRAINT "assignment_target_students_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'password_reset_tokens_user_id_fkey') THEN
    ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END$$;

