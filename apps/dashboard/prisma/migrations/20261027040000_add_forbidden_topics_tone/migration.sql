-- AlterTable knowledge_bases: add tone + forbidden_topics
ALTER TABLE "knowledge_bases"
  ADD COLUMN "tone" TEXT,
  ADD COLUMN "forbidden_topics" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- CreateTable knowledge_base_configs
CREATE TABLE "knowledge_base_configs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "tone" TEXT NOT NULL DEFAULT 'amable',
    "forbidden_topics" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_base_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_base_configs_tenant_id_key" ON "knowledge_base_configs"("tenant_id");

-- AddForeignKey
ALTER TABLE "knowledge_base_configs" ADD CONSTRAINT "knowledge_base_configs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable Row Level Security for knowledge_base_configs
ALTER TABLE "knowledge_base_configs" ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "knowledge_base_configs" USING ("tenant_id" = current_setting('app.current_tenant'::text, true));