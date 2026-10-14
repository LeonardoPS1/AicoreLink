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
CREATE UNIQUE INDEX "business_profiles_tenant_id_key" ON "business_profiles"("tenant_id");

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
CREATE UNIQUE INDEX "site_templates_rubro_planTier_key" ON "site_templates"("rubro", "planTier");

-- CreateIndex
CREATE UNIQUE INDEX "site_template_pages_template_id_path_key" ON "site_template_pages"("template_id", "path");

-- CreateIndex
CREATE UNIQUE INDEX "site_versions_site_id_version_key" ON "site_versions"("site_id", "version");

-- CreateIndex
CREATE INDEX "publish_logs_site_id_idx" ON "publish_logs"("site_id");

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
CREATE POLICY tenant_isolation ON "business_profiles" USING ("tenant_id" = current_setting('app.current_tenant'::text, true));
CREATE POLICY tenant_isolation ON "sites" USING ("tenant_id" = current_setting('app.current_tenant'::text, true));
CREATE POLICY tenant_isolation ON "site_pages" USING ("site_id" IN (SELECT "id" FROM "sites" WHERE "tenant_id" = current_setting('app.current_tenant'::text, true)));
CREATE POLICY tenant_isolation ON "site_versions" USING ("site_id" IN (SELECT "id" FROM "sites" WHERE "tenant_id" = current_setting('app.current_tenant'::text, true)));
CREATE POLICY tenant_isolation ON "publish_logs" USING ("site_id" IN (SELECT "id" FROM "sites" WHERE "tenant_id" = current_setting('app.current_tenant'::text, true)));
