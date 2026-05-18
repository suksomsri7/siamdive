-- CreateEnum
CREATE TYPE "PlanItemType" AS ENUM ('FLIGHT', 'HOTEL', 'BOAT', 'ACTIVITY', 'TRANSFER', 'NOTE');

-- CreateTable
CREATE TABLE "PlanItem" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "type" "PlanItemType" NOT NULL,
    "title" TEXT NOT NULL,
    "location" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "externalUrl" TEXT,
    "bookingRef" TEXT,
    "cost" DOUBLE PRECISION,
    "currency" TEXT DEFAULT 'THB',
    "source" TEXT NOT NULL DEFAULT 'USER_INPUT',
    "scheduleId" TEXT,
    "notes" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "searchQuery" JSONB,
    "alternatives" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanItem_planId_startAt_idx" ON "PlanItem"("planId", "startAt");

-- CreateIndex
CREATE INDEX "PlanItem_planId_type_idx" ON "PlanItem"("planId", "type");

-- AddForeignKey
ALTER TABLE "PlanItem" ADD CONSTRAINT "PlanItem_planId_fkey" FOREIGN KEY ("planId") REFERENCES "UserPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
