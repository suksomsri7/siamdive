-- Dive-resort structured fields (PADI-style). ADDITIVE ONLY.
-- NOTE: hand-curated from `prisma migrate diff` — the raw diff also wanted to
-- DROP cf_* / ChatMemory tables (live-DB drift from other apps); those drops
-- are deliberately EXCLUDED here to avoid data loss.

-- AlterTable: Boat — resort attributes
ALTER TABLE "Boat"
  ADD COLUMN "ecoLabels" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "latitude" DOUBLE PRECISION,
  ADD COLUMN "longitude" DOUBLE PRECISION,
  ADD COLUMN "stars" INTEGER,
  ADD COLUMN "tripadvisorRating" DOUBLE PRECISION;

-- AlterTable: Package — room attributes
ALTER TABLE "Package"
  ADD COLUMN "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "bedType" TEXT,
  ADD COLUMN "occupancyMax" INTEGER,
  ADD COLUMN "occupancyMin" INTEGER,
  ADD COLUMN "pricePerNight" DOUBLE PRECISION,
  ADD COLUMN "roomSizeSqm" INTEGER;

-- CreateTable: DivePackage
CREATE TABLE "DivePackage" (
    "id" TEXT NOT NULL,
    "boatId" TEXT NOT NULL,
    "numberOfDives" INTEGER NOT NULL,
    "price" DOUBLE PRECISION,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DivePackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable: MealPlan
CREATE TABLE "MealPlan" (
    "id" TEXT NOT NULL,
    "boatId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION,
    "included" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DivePackage_boatId_idx" ON "DivePackage"("boatId");
CREATE INDEX "MealPlan_boatId_idx" ON "MealPlan"("boatId");

-- AddForeignKey
ALTER TABLE "DivePackage" ADD CONSTRAINT "DivePackage_boatId_fkey" FOREIGN KEY ("boatId") REFERENCES "Boat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MealPlan" ADD CONSTRAINT "MealPlan_boatId_fkey" FOREIGN KEY ("boatId") REFERENCES "Boat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
