-- Add UTM attribution and consent columns to landing_leads
-- UTM fields are nullable (optional on submit); consent defaults to false for legacy rows
-- but the application schema (z.literal(true)) never inserts false.

ALTER TABLE "landing_leads"
  ADD COLUMN "utm_source" TEXT,
  ADD COLUMN "utm_medium" TEXT,
  ADD COLUMN "utm_campaign" TEXT,
  ADD COLUMN "utm_content" TEXT,
  ADD COLUMN "utm_term" TEXT,
  ADD COLUMN "consent" BOOLEAN NOT NULL DEFAULT false;

-- Optional index for attribution queries
CREATE INDEX "landing_leads_utm_source_idx" ON "landing_leads"("utm_source");