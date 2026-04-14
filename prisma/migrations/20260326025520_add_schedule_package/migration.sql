-- CreateTable
CREATE TABLE "SchedulePackage" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,

    CONSTRAINT "SchedulePackage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SchedulePackage_scheduleId_packageId_key" ON "SchedulePackage"("scheduleId", "packageId");

-- AddForeignKey
ALTER TABLE "SchedulePackage" ADD CONSTRAINT "SchedulePackage_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedulePackage" ADD CONSTRAINT "SchedulePackage_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE CASCADE ON UPDATE CASCADE;
