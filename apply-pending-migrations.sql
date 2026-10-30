-- Migraciones pendientes de E3/E4 para producción
-- Ejecutar como superuser en la DB de Dokploy

-- 20261027000000_add_enabled_to_channel_credentials
ALTER TABLE "channel_credentials" ADD COLUMN IF NOT EXISTS "enabled" BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX IF NOT EXISTS "channel_credentials_enabled_idx" ON "channel_credentials"("enabled");

-- 20261027010000_add_external_id_to_conversations
ALTER TABLE "conversations" ADD COLUMN "external_id" TEXT;
CREATE UNIQUE INDEX "conversations_tenant_id_external_id_key" ON "conversations"("tenant_id", "external_id");

-- 20261027020000_add_external_message_id_to_messages
ALTER TABLE "messages" ADD COLUMN "external_message_id" TEXT;
CREATE UNIQUE INDEX "messages_tenant_id_external_message_id_key" ON "messages"("tenant_id", "external_message_id");

-- 20261027030000_add_knowledge_base
CREATE TABLE IF NOT EXISTS "knowledge_bases" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "knowledge_bases_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "knowledge_bases_tenant_id_idx" ON "knowledge_bases"("tenant_id");
CREATE INDEX IF NOT EXISTS "knowledge_bases_tenant_id_category_idx" ON "knowledge_bases"("tenant_id", "category");
ALTER TABLE "knowledge_bases" ADD CONSTRAINT "knowledge_bases_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "knowledge_bases" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "knowledge_bases" USING ("tenant_id" = current_setting('app.current_tenant'::text, true));

-- 20261027040000_add_forbidden_topics_tone
ALTER TABLE "knowledge_bases"
  ADD COLUMN "tone" TEXT,
  ADD COLUMN "forbidden_topics" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE TABLE IF NOT EXISTS "knowledge_base_configs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "tone" TEXT NOT NULL DEFAULT 'amable',
    "forbidden_topics" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "knowledge_base_configs_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "knowledge_base_configs_tenant_id_key" ON "knowledge_base_configs"("tenant_id");
ALTER TABLE "knowledge_base_configs" ADD CONSTRAINT "knowledge_base_configs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "knowledge_base_configs" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "knowledge_base_configs" USING ("tenant_id" = current_setting('app.current_tenant'::text, true));

-- 20261028000000_add_usage_tracking
ALTER TABLE "tenant_usage" ENABLE ROW LEVEL SECURITY;

-- 20261028010000_add_thread_state
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

-- 20261028020000_add_model_version_first_response
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

-- 20261029000000_add_leads_appointments
CREATE TABLE IF NOT EXISTS "leads" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "source" TEXT NOT NULL,
    "utm_source" TEXT,
    "utm_medium" TEXT,
    "utm_campaign" TEXT,
    "status" TEXT NOT NULL DEFAULT 'nuevo',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "leads_tenant_id_idx" ON "leads"("tenant_id");
CREATE INDEX IF NOT EXISTS "leads_tenant_id_status_idx" ON "leads"("tenant_id", "status");
ALTER TABLE "leads" ADD CONSTRAINT "leads_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "leads" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "leads" USING ("tenant_id" = current_setting('app.current_tenant'::text, true));

CREATE TABLE IF NOT EXISTS "appointments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "conversation_id" TEXT,
    "lead_id" TEXT,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendiente',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "appointments_tenant_id_idx" ON "appointments"("tenant_id");
CREATE INDEX IF NOT EXISTS "appointments_tenant_id_status_idx" ON "appointments"("tenant_id", "status");
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "appointments" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "appointments" USING ("tenant_id" = current_setting('app.current_tenant'::text, true));