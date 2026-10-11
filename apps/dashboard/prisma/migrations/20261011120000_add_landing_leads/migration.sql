-- CreateTable
-- Landing page enquiries. Intentionally has no tenant_id: these are pre-sale
-- leads from the public marketing site, not customer data, so no RLS policy.
-- The app role owns the table because migrations run with DATABASE_URL.
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
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landing_leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "landing_leads_created_at_idx" ON "landing_leads"("created_at");

-- CreateIndex
CREATE INDEX "landing_leads_status_idx" ON "landing_leads"("status");
