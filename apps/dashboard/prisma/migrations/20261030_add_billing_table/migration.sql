-- CreateTable
CREATE TABLE "tenant_billings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'CLP',
    "status" TEXT NOT NULL DEFAULT 'active',
    "billing_active" BOOLEAN NOT NULL DEFAULT true,
    "invoice_number" TEXT,
    "invoice_url" TEXT,
    "last_payment_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_billings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tenant_billings_tenant_id_idx" ON "tenant_billings"("tenant_id");

-- CreateIndex
CREATE INDEX "tenant_billings_status_idx" ON "tenant_billings"("status");

-- AddForeignKey
ALTER TABLE "tenant_billings" ADD CONSTRAINT "tenant_billings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable Row Level Security for tenant_billings
ALTER TABLE "tenant_billings" ENABLE ROW LEVEL SECURITY;

-- RLS Policy for tenant_billings
CREATE POLICY tenant_isolation ON "tenant_billings" USING ("tenant_id" = current_setting('app.current_tenant'::text, true));