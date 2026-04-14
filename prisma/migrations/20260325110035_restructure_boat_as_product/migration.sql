/*
  Warnings:

  - The `duration` column on the `Course` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Trip` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TripPriceTier` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TripSchedule` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TripTranslation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TripVideo` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
ALTER TYPE "ScheduleStatus" ADD VALUE 'COMPLETED';

-- DropForeignKey
ALTER TABLE "Trip" DROP CONSTRAINT "Trip_boatId_fkey";

-- DropForeignKey
ALTER TABLE "TripPriceTier" DROP CONSTRAINT "TripPriceTier_tripId_fkey";

-- DropForeignKey
ALTER TABLE "TripSchedule" DROP CONSTRAINT "TripSchedule_tripId_fkey";

-- DropForeignKey
ALTER TABLE "TripTranslation" DROP CONSTRAINT "TripTranslation_tripId_fkey";

-- DropForeignKey
ALTER TABLE "TripVideo" DROP CONSTRAINT "TripVideo_tripId_fkey";

-- AlterTable
ALTER TABLE "Boat" ADD COLUMN     "covers" TEXT[],
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "Course" ALTER COLUMN "level" DROP NOT NULL,
DROP COLUMN "duration",
ADD COLUMN     "duration" INTEGER;

-- DropTable
DROP TABLE "Trip";

-- DropTable
DROP TABLE "TripPriceTier";

-- DropTable
DROP TABLE "TripSchedule";

-- DropTable
DROP TABLE "TripTranslation";

-- DropTable
DROP TABLE "TripVideo";

-- CreateTable
CREATE TABLE "BoatTranslation" (
    "id" TEXT NOT NULL,
    "boatId" TEXT NOT NULL,
    "lang" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "slug" TEXT NOT NULL DEFAULT '',
    "excerpt" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL DEFAULT '',
    "keywords" TEXT[],

    CONSTRAINT "BoatTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoatVideo" (
    "id" TEXT NOT NULL,
    "boatId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BoatVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoatPriceTier" (
    "id" TEXT NOT NULL,
    "boatId" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "costPrice" DOUBLE PRECISION,
    "regularPrice" DOUBLE PRECISION NOT NULL,
    "salePrice" DOUBLE PRECISION,
    "agentPrice" DOUBLE PRECISION,

    CONSTRAINT "BoatPriceTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL,
    "boatId" TEXT NOT NULL,
    "departureDate" TIMESTAMP(3) NOT NULL,
    "returnDate" TIMESTAMP(3),
    "totalSeats" INTEGER,
    "availableSeats" INTEGER,
    "status" "ScheduleStatus" NOT NULL DEFAULT 'OPEN',
    "note" TEXT,
    "itinerary" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BoatTranslation_boatId_lang_key" ON "BoatTranslation"("boatId", "lang");

-- CreateIndex
CREATE UNIQUE INDEX "BoatPriceTier_boatId_tier_key" ON "BoatPriceTier"("boatId", "tier");

-- AddForeignKey
ALTER TABLE "BoatTranslation" ADD CONSTRAINT "BoatTranslation_boatId_fkey" FOREIGN KEY ("boatId") REFERENCES "Boat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoatVideo" ADD CONSTRAINT "BoatVideo_boatId_fkey" FOREIGN KEY ("boatId") REFERENCES "Boat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoatPriceTier" ADD CONSTRAINT "BoatPriceTier_boatId_fkey" FOREIGN KEY ("boatId") REFERENCES "Boat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_boatId_fkey" FOREIGN KEY ("boatId") REFERENCES "Boat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
