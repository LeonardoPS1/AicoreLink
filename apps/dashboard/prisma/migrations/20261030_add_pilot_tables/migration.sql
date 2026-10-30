-- CreateTable
CREATE TABLE "pilot_onboardings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "founder_agreement" BOOLEAN NOT NULL DEFAULT false,
    "checklist" JSONB NOT NULL DEFAULT '{}',
    "assigned_to" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pilot_onboardings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pilot_onboardings_tenant_id_key" ON "pilot_onboardings"("tenant_id");

-- AddForeignKey
ALTER TABLE "pilot_onboardings" ADD CONSTRAINT "pilot_onboardings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable Row Level Security for pilot_onboardings
ALTER TABLE "pilot_onboardings" ENABLE ROW LEVEL SECURITY;

-- RLS Policy for pilot_onboardings
CREATE POLICY tenant_isolation ON "pilot_onboardings" USING ("tenant_id" = current_setting('app.current_tenant'::text, true));

-- CreateTable
CREATE TABLE "pilot_followups" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "sent_at" TIMESTAMP(3),
    "responded_at" TIMESTAMP(3),
    "score" INTEGER,
    "feedback" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pilot_followups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pilot_followups_tenant_id_idx" ON "pilot_followups"("tenant_id");

-- CreateIndex
CREATE INDEX "pilot_followups_tenant_id_day_idx" ON "pilot_followups"("tenant_id", "day");

-- AddForeignKey
ALTER TABLE "pilot_followups" ADD CONSTRAINT "pilot_followups_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable Row Level Security for pilot_followups
ALTER TABLE "pilot_followups" ENABLE ROW LEVEL SECURITY;

-- RLS Policy for pilot_followups
CREATE POLICY tenant_isolation ON "pilot_followups" USING ("tenant_id" = current_setting('app.current_tenant'::text, true));

-- CreateTable
CREATE TABLE "testimonials" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "author_name" TEXT NOT NULL,
    "author_role" TEXT,
    "content" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "testimonials_tenant_id_idx" ON "testimonials"("tenant_id");

-- CreateIndex
CREATE INDEX "testimonials_approved_published_idx" ON "testimonials"("approved", "published");

-- AddForeignKey
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable Row Level Security for testimonials
ALTER TABLE "testimonials" ENABLE ROW LEVEL SECURITY;

-- RLS Policy for testimonials
CREATE POLICY tenant_isolation ON "testimonials" USING ("tenant_id" = current_setting('app.current_tenant'::text, true));