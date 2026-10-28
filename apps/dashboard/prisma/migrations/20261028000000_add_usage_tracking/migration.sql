-- Task 13: per-conversation usage and cost tracking.
-- tenant_usage (period) and cost_rates already exist; ensure RLS is enabled.
ALTER TABLE "tenant_usage" ENABLE ROW LEVEL SECURITY;