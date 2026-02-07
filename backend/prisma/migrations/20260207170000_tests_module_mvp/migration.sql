CREATE TABLE IF NOT EXISTS "tests" (
  "id" SERIAL NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "subject_id" INTEGER NOT NULL,
  "class_id" INTEGER NOT NULL,
  "teacher_id" INTEGER NOT NULL,
  "due_date" TIMESTAMP(6) NOT NULL,
  "is_published" BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP(6) NOT NULL,
  CONSTRAINT "tests_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "tests_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT "tests_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT "tests_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teacher_profiles" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE TABLE IF NOT EXISTS "test_questions" (
  "id" SERIAL NOT NULL,
  "test_id" INTEGER NOT NULL,
  "question_text" TEXT NOT NULL,
  "order_index" INTEGER NOT NULL,
  "points" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP(6) NOT NULL,
  CONSTRAINT "test_questions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "test_questions_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE TABLE IF NOT EXISTS "test_options" (
  "id" SERIAL NOT NULL,
  "question_id" INTEGER NOT NULL,
  "option_text" TEXT NOT NULL,
  "order_index" INTEGER NOT NULL,
  "is_correct" BOOLEAN NOT NULL,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP(6) NOT NULL,
  CONSTRAINT "test_options_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "test_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "test_questions" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE TABLE IF NOT EXISTS "test_attempts" (
  "id" SERIAL NOT NULL,
  "test_id" INTEGER NOT NULL,
  "student_id" INTEGER NOT NULL,
  "submitted_at" TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  "score_points" INTEGER NOT NULL,
  "max_points" INTEGER NOT NULL,
  "percentage" DOUBLE PRECISION NOT NULL,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP(6) NOT NULL,
  CONSTRAINT "test_attempts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "test_attempts_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT "test_attempts_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE TABLE IF NOT EXISTS "test_answers" (
  "id" SERIAL NOT NULL,
  "attempt_id" INTEGER NOT NULL,
  "question_id" INTEGER NOT NULL,
  "selected_option_id" INTEGER NOT NULL,
  "is_correct" BOOLEAN NOT NULL,
  "awarded_points" INTEGER NOT NULL,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP(6) NOT NULL,
  CONSTRAINT "test_answers_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "test_answers_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "test_attempts" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT "test_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "test_questions" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT "test_answers_selected_option_id_fkey" FOREIGN KEY ("selected_option_id") REFERENCES "test_options" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE INDEX IF NOT EXISTS "ix_tests_id" ON "tests"("id");
CREATE INDEX IF NOT EXISTS "ix_tests_class_id" ON "tests"("class_id");
CREATE INDEX IF NOT EXISTS "ix_tests_teacher_id" ON "tests"("teacher_id");
CREATE INDEX IF NOT EXISTS "ix_tests_subject_id" ON "tests"("subject_id");

CREATE INDEX IF NOT EXISTS "ix_test_questions_id" ON "test_questions"("id");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_test_questions_test_order" ON "test_questions"("test_id", "order_index");

CREATE INDEX IF NOT EXISTS "ix_test_options_id" ON "test_options"("id");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_test_options_question_order" ON "test_options"("question_id", "order_index");

CREATE INDEX IF NOT EXISTS "ix_test_attempts_id" ON "test_attempts"("id");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_test_attempts_test_student" ON "test_attempts"("test_id", "student_id");

CREATE INDEX IF NOT EXISTS "ix_test_answers_id" ON "test_answers"("id");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_test_answers_attempt_question" ON "test_answers"("attempt_id", "question_id");
