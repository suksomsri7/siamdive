-- Multi-currency display support (additive only).
-- Per-item native currency override (null = inherit boat.currency).
ALTER TABLE "Package" ADD COLUMN "currency" TEXT;
ALTER TABLE "DivePackage" ADD COLUMN "currency" TEXT;
ALTER TABLE "MealPlan" ADD COLUMN "currency" TEXT;

-- Daily FX rates (ECB pivot via EUR), display-only conversion.
CREATE TABLE "FxRate" (
    "id" TEXT NOT NULL,
    "base" TEXT NOT NULL,
    "quote" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FxRate_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FxRate_base_quote_date_key" ON "FxRate"("base", "quote", "date");
CREATE INDEX "FxRate_quote_date_idx" ON "FxRate"("quote", "date");
