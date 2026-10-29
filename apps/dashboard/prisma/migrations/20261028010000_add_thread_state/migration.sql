-- Task 15: thread state, summary, handoff.
DO $$ BEGIN
  CREATE TYPE "ThreadState" AS ENUM ('open', 'escalated', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "conversations"
  ADD COLUMN IF NOT EXISTS "thread_state" "ThreadState" NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS "handoff" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "summary" TEXT,
  ADD COLUMN IF NOT EXISTS "escalated_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "closed_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "reactivated_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "conversations_tenant_id_thread_state_idx"
  ON "conversations" ("tenant_id", "thread_state");
