-- Add enabled flag to channel_credentials so chatwoot inbox resolution can filter active credentials.

ALTER TABLE "channel_credentials" ADD COLUMN IF NOT EXISTS "enabled" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS "channel_credentials_enabled_idx" ON "channel_credentials"("enabled");