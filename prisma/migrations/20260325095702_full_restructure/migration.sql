/*
  Warnings:

  - You are about to drop the column `description` on the `Trip` table. All the data in the column will be lost.
  - You are about to drop the column `destinationId` on the `Trip` table. All the data in the column will be lost.
  - You are about to drop the column `duration` on the `Trip` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Trip` table. All the data in the column will be lost.
  - You are about to drop the column `published` on the `Trip` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `Trip` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Trip` table. All the data in the column will be lost.
  - You are about to drop the column `titleEn` on the `Trip` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Trip` table. All the data in the column will be lost.
  - You are about to drop the `Destination` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Media` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `boatId` to the `Trip` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ActiveStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "PublishStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "BoatType" AS ENUM ('DAYTRIP', 'LIVEABOARD');

-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('OPEN', 'FULL', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "Media" DROP CONSTRAINT "Media_destinationId_fkey";

-- DropForeignKey
ALTER TABLE "Media" DROP CONSTRAINT "Media_tripId_fkey";

-- DropForeignKey
ALTER TABLE "Trip" DROP CONSTRAINT "Trip_destinationId_fkey";

-- DropIndex
DROP INDEX "Trip_slug_key";

-- AlterTable
ALTER TABLE "Trip" DROP COLUMN "description",
DROP COLUMN "destinationId",
DROP COLUMN "duration",
DROP COLUMN "price",
DROP COLUMN "published",
DROP COLUMN "slug",
DROP COLUMN "title",
DROP COLUMN "titleEn",
DROP COLUMN "type",
ADD COLUMN     "boatId" TEXT NOT NULL,
ADD COLUMN     "covers" TEXT[],
ADD COLUMN     "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT';

-- DropTable
DROP TABLE "Destination";

-- DropTable
DROP TABLE "Media";

-- DropEnum
DROP TYPE "TripType";

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "logo" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "lineId" TEXT,
    "status" "ActiveStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyTranslation" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "lang" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "CompanyTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Boat" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "BoatType" NOT NULL,
    "capacity" INTEGER,
    "photos" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Boat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripTranslation" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "lang" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL DEFAULT '',
    "keywords" TEXT[],

    CONSTRAINT "TripTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripVideo" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TripVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripPriceTier" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "costPrice" DOUBLE PRECISION,
    "regularPrice" DOUBLE PRECISION NOT NULL,
    "salePrice" DOUBLE PRECISION,
    "agentPrice" DOUBLE PRECISION,

    CONSTRAINT "TripPriceTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripSchedule" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "departureDate" TIMESTAMP(3) NOT NULL,
    "returnDate" TIMESTAMP(3),
    "totalSeats" INTEGER,
    "availableSeats" INTEGER,
    "status" "ScheduleStatus" NOT NULL DEFAULT 'OPEN',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "logo" TEXT,
    "certBody" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "lineId" TEXT,
    "status" "ActiveStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolTranslation" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "lang" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "SchoolTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "duration" TEXT,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "covers" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseTranslation" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "lang" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL DEFAULT '',
    "keywords" TEXT[],

    CONSTRAINT "CourseTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseVideo" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CourseVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoursePrice" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "costPrice" DOUBLE PRECISION,
    "regularPrice" DOUBLE PRECISION NOT NULL,
    "salePrice" DOUBLE PRECISION,
    "agentPrice" DOUBLE PRECISION,

    CONSTRAINT "CoursePrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompanyTranslation_companyId_lang_key" ON "CompanyTranslation"("companyId", "lang");

-- CreateIndex
CREATE UNIQUE INDEX "TripTranslation_slug_key" ON "TripTranslation"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "TripTranslation_tripId_lang_key" ON "TripTranslation"("tripId", "lang");

-- CreateIndex
CREATE UNIQUE INDEX "TripPriceTier_tripId_tier_key" ON "TripPriceTier"("tripId", "tier");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolTranslation_schoolId_lang_key" ON "SchoolTranslation"("schoolId", "lang");

-- CreateIndex
CREATE UNIQUE INDEX "CourseTranslation_slug_key" ON "CourseTranslation"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CourseTranslation_courseId_lang_key" ON "CourseTranslation"("courseId", "lang");

-- CreateIndex
CREATE UNIQUE INDEX "CoursePrice_courseId_key" ON "CoursePrice"("courseId");

-- AddForeignKey
ALTER TABLE "CompanyTranslation" ADD CONSTRAINT "CompanyTranslation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Boat" ADD CONSTRAINT "Boat_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_boatId_fkey" FOREIGN KEY ("boatId") REFERENCES "Boat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripTranslation" ADD CONSTRAINT "TripTranslation_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripVideo" ADD CONSTRAINT "TripVideo_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripPriceTier" ADD CONSTRAINT "TripPriceTier_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripSchedule" ADD CONSTRAINT "TripSchedule_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolTranslation" ADD CONSTRAINT "SchoolTranslation_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseTranslation" ADD CONSTRAINT "CourseTranslation_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseVideo" ADD CONSTRAINT "CourseVideo_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoursePrice" ADD CONSTRAINT "CoursePrice_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
