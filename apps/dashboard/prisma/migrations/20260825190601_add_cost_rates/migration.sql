-- CreateTable
CREATE TABLE "cost_rates" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "rate" DECIMAL(65,30) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cost_rates_pkey" PRIMARY KEY ("id")
);
