ALTER TABLE "messages" ADD COLUMN "external_message_id" TEXT;
CREATE UNIQUE INDEX "messages_tenant_id_external_message_id_key" ON "messages"("tenant_id", "external_message_id");