CREATE UNIQUE INDEX IF NOT EXISTS "uq_assignment_submission_assignment_student"
ON "assignment_submissions" ("assignment_id", "student_id");
