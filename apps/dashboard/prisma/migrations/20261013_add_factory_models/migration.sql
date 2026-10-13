-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'basico',
    "status" TEXT NOT NULL DEFAULT 'activo',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_users" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'cliente',

    CONSTRAINT "tenant_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_channels" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB NOT NULL DEFAULT '{}',
    "descripcion" TEXT,
    "activated_at" TIMESTAMP(3),

    CONSTRAINT "tenant_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_credentials" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "external_id" TEXT,
    "encrypted_secret" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "channel_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_usage" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "period" TIMESTAMP(3) NOT NULL,
    "messages_in" INTEGER NOT NULL DEFAULT 0,
    "messages_out" INTEGER NOT NULL DEFAULT 0,
    "tokens_used" INTEGER NOT NULL DEFAULT 0,
    "cost_estimate" DECIMAL(65,30) NOT NULL DEFAULT 0,

    CONSTRAINT "tenant_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "actor_id" TEXT,
    "action" TEXT NOT NULL,
    "meta" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_rates" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "rate" DECIMAL(65,30) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cost_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'whatsapp_text',
    "contact_ref" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'abierta',
    "escalado" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "ai_generated" BOOLEAN NOT NULL DEFAULT false,
    "tokens_used" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "media_type" TEXT DEFAULT 'text',
    "audio_url" TEXT,
    "transcript" TEXT,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "landing_leads" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "business" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "vertical" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "source" TEXT NOT NULL DEFAULT 'landing',
    "user_agent" TEXT,
    "utm_source" TEXT,
    "utm_medium" TEXT,
    "utm_campaign" TEXT,
    "utm_content" TEXT,
    "utm_term" TEXT,
    "consent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landing_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_profiles" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "rubro" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "description" TEXT,
    "logo_url" TEXT,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hours" JSONB NOT NULL DEFAULT '{}',
    "team" JSONB NOT NULL DEFAULT '[]',
    "services" JSONB NOT NULL DEFAULT '[]',
    "faqs" JSONB NOT NULL DEFAULT '[]',
    "social" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sites" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "business_profile_id" TEXT,
    "template_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "custom_domain" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "current_version_id" TEXT,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_pages" (
    "id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "template_page_id" TEXT,
    "path" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "meta" JSONB NOT NULL DEFAULT '{}',
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_templates" (
    "id" TEXT NOT NULL,
    "rubro" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "planTier" TEXT NOT NULL,
    "pageCount" INTEGER NOT NULL,
    "structure" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_template_pages" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "blocksTemplate" JSONB NOT NULL,
    "required_variables" TEXT[],
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "site_template_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_versions" (
    "id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "pages" JSONB NOT NULL,
    "changelog" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publish_logs" (
    "id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "meta" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "publish_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_users_tenant_id_user_id_key" ON "tenant_users"("tenant_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_channels_tenant_id_channel_key" ON "tenant_channels"("tenant_id", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_usage_tenant_id_channel_period_key" ON "tenant_usage"("tenant_id", "channel", "period");

-- CreateIndex
CREATE INDEX "landing_leads_created_at_idx" ON "landing_leads"("created_at");

-- CreateIndex
CREATE INDEX "landing_leads_status_idx" ON "landing_leads"("status");

-- CreateIndex
CREATE INDEX "landing_leads_utm_source_idx" ON "landing_leads"("utm_source");

-- CreateIndex
CREATE UNIQUE INDEX "business_profiles_slug_key" ON "business_profiles"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "sites_business_profile_id_key" ON "sites"("business_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "sites_subdomain_key" ON "sites"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "sites_custom_domain_key" ON "sites"("custom_domain");

-- CreateIndex
CREATE INDEX "sites_tenant_id_idx" ON "sites"("tenant_id");

-- CreateIndex
CREATE INDEX "sites_status_idx" ON "sites"("status");

-- CreateIndex
CREATE UNIQUE INDEX "site_pages_site_id_path_key" ON "site_pages"("site_id", "path");

-- CreateIndex
CREATE UNIQUE INDEX "site_templates_rubro_key" ON "site_templates"("rubro");

-- CreateIndex
CREATE UNIQUE INDEX "site_template_pages_template_id_path_key" ON "site_template_pages"("template_id", "path");

-- CreateIndex
CREATE UNIQUE INDEX "site_versions_site_id_version_key" ON "site_versions"("site_id", "version");

-- CreateIndex
CREATE INDEX "publish_logs_site_id_idx" ON "publish_logs"("site_id");

-- AddForeignKey
ALTER TABLE "tenant_users" ADD CONSTRAINT "tenant_users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_users" ADD CONSTRAINT "tenant_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_channels" ADD CONSTRAINT "tenant_channels_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_credentials" ADD CONSTRAINT "channel_credentials_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_usage" ADD CONSTRAINT "tenant_usage_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_profiles" ADD CONSTRAINT "business_profiles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sites" ADD CONSTRAINT "sites_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sites" ADD CONSTRAINT "sites_business_profile_id_fkey" FOREIGN KEY ("business_profile_id") REFERENCES "business_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sites" ADD CONSTRAINT "sites_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "site_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_pages" ADD CONSTRAINT "site_pages_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_template_pages" ADD CONSTRAINT "site_template_pages_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "site_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_versions" ADD CONSTRAINT "site_versions_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publish_logs" ADD CONSTRAINT "publish_logs_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable Row Level Security for factory models
ALTER TABLE "business_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sites" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "site_pages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "site_versions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "publish_logs" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for factory models
CREATE POLICY business_profiles_tenant ON "business_profiles" USING ("tenant_id" = current_setting('app.current_tenant')::uuid);
CREATE POLICY sites_tenant ON "sites" USING ("tenant_id" = current_setting('app.current_tenant')::uuid);
CREATE POLICY site_pages_tenant ON "site_pages" USING ("site_id" IN (SELECT "id" FROM "sites" WHERE "tenant_id" = current_setting('app.current_tenant')::uuid));
CREATE POLICY site_versions_tenant ON "site_versions" USING ("site_id" IN (SELECT "id" FROM "sites" WHERE "tenant_id" = current_setting('app.current_tenant')::uuid));
CREATE POLICY publish_logs_tenant ON "publish_logs" USING ("site_id" IN (SELECT "id" FROM "sites" WHERE "tenant_id" = current_setting('app.current_tenant')::uuid));

