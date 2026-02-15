DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'learningmaterialtype') THEN
    CREATE TYPE "learningmaterialtype" AS ENUM ('BOOK', 'ARTICLE', 'WORKSHEET', 'VIDEO', 'OTHER');
  END IF;
END$$;

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
  "is_published" BOOLEAN NOT NULL DEFAULT TRUE,
  "uploaded_by_user_id" INTEGER NOT NULL,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP(6) NOT NULL,
  CONSTRAINT "learning_materials_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "learning_materials_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT "learning_materials_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT "learning_materials_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE INDEX IF NOT EXISTS "ix_learning_materials_id" ON "learning_materials"("id");
CREATE INDEX IF NOT EXISTS "ix_learning_materials_subject_id" ON "learning_materials"("subject_id");
CREATE INDEX IF NOT EXISTS "ix_learning_materials_class_id" ON "learning_materials"("class_id");
CREATE INDEX IF NOT EXISTS "ix_learning_materials_uploaded_by_user_id" ON "learning_materials"("uploaded_by_user_id");
CREATE INDEX IF NOT EXISTS "ix_learning_materials_material_type" ON "learning_materials"("material_type");
