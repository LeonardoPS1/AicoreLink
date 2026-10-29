ALTER TABLE "conversations" ADD COLUMN "external_id" TEXT;
CREATE UNIQUE INDEX "conversations_tenant_id_external_id_key" ON "conversations"("tenant_id", "external_id");
