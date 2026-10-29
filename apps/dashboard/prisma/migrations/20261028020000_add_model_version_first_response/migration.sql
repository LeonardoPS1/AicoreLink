-- Task 19: model/version log and first-response time.
ALTER TABLE "messages"
  ADD COLUMN IF NOT EXISTS "model" TEXT,
  ADD COLUMN IF NOT EXISTS "version" TEXT,
  ADD COLUMN IF NOT EXISTS "first_response_ms" INTEGER;

ALTER TABLE "conversations"
  ADD COLUMN IF NOT EXISTS "model" TEXT,
  ADD COLUMN IF NOT EXISTS "version" TEXT,
  ADD COLUMN IF NOT EXISTS "first_response_ms" INTEGER;

ALTER TABLE "tenant_usage"
  ADD COLUMN IF NOT EXISTS "model" TEXT,
  ADD COLUMN IF NOT EXISTS "version" TEXT,
  ADD COLUMN IF NOT EXISTS "first_response_ms" INTEGER;