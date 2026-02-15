DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'chatchanneltype') THEN
    CREATE TYPE "chatchanneltype" AS ENUM ('class', 'staff');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS "chat_channels" (
  "id" SERIAL NOT NULL,
  "key" VARCHAR(120) NOT NULL,
  "type" "chatchanneltype" NOT NULL,
  "school_id" INTEGER NOT NULL,
  "class_id" INTEGER,
  "title" VARCHAR(255) NOT NULL,
  "last_message_id" INTEGER,
  "last_message_at" TIMESTAMP(6),
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP(6) NOT NULL,
  CONSTRAINT "chat_channels_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "chat_channels_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT "chat_channels_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE TABLE IF NOT EXISTS "chat_messages" (
  "id" SERIAL NOT NULL,
  "channel_id" INTEGER NOT NULL,
  "sender_user_id" INTEGER NOT NULL,
  "body" TEXT,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  "edited_at" TIMESTAMP(6),
  "deleted_at" TIMESTAMP(6),
  "updated_at" TIMESTAMP(6) NOT NULL,
  CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "chat_messages_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "chat_channels" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT "chat_messages_sender_user_id_fkey" FOREIGN KEY ("sender_user_id") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE TABLE IF NOT EXISTS "chat_channel_reads" (
  "user_id" INTEGER NOT NULL,
  "channel_id" INTEGER NOT NULL,
  "last_read_message_id" INTEGER,
  "updated_at" TIMESTAMP(6) NOT NULL,
  CONSTRAINT "chat_channel_reads_pkey" PRIMARY KEY ("user_id", "channel_id"),
  CONSTRAINT "chat_channel_reads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT "chat_channel_reads_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "chat_channels" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE UNIQUE INDEX IF NOT EXISTS "ix_chat_channels_key" ON "chat_channels"("key");
CREATE INDEX IF NOT EXISTS "ix_chat_channels_id" ON "chat_channels"("id");
CREATE INDEX IF NOT EXISTS "ix_chat_channels_school_id" ON "chat_channels"("school_id");
CREATE INDEX IF NOT EXISTS "ix_chat_channels_class_id" ON "chat_channels"("class_id");

CREATE INDEX IF NOT EXISTS "ix_chat_messages_id" ON "chat_messages"("id");
CREATE INDEX IF NOT EXISTS "ix_chat_messages_channel_id_id" ON "chat_messages"("channel_id", "id");
CREATE INDEX IF NOT EXISTS "ix_chat_messages_sender_user_id" ON "chat_messages"("sender_user_id");

CREATE INDEX IF NOT EXISTS "ix_chat_channel_reads_channel_id" ON "chat_channel_reads"("channel_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chat_channels_last_message_id_fkey'
  ) THEN
    ALTER TABLE "chat_channels"
      ADD CONSTRAINT "chat_channels_last_message_id_fkey"
      FOREIGN KEY ("last_message_id") REFERENCES "chat_messages"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END$$;
