-- Drop SchedulePriceTier (move pricing to per-package level)
DROP TABLE IF EXISTS "SchedulePriceTier";

-- Add priceTiers to SchedulePackage via new join table
CREATE TABLE "SchedulePackagePriceTier" (
    "id" TEXT NOT NULL,
    "schedulePackageId" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "costPrice" DOUBLE PRECISION,
    "regularPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "salePrice" DOUBLE PRECISION,
    "agentPrice" DOUBLE PRECISION,

    CONSTRAINT "SchedulePackagePriceTier_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SchedulePackagePriceTier_schedulePackageId_tier_key"
    ON "SchedulePackagePriceTier"("schedulePackageId", "tier");

ALTER TABLE "SchedulePackagePriceTier"
    ADD CONSTRAINT "SchedulePackagePriceTier_schedulePackageId_fkey"
    FOREIGN KEY ("schedulePackageId")
    REFERENCES "SchedulePackage"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
