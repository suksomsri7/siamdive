ALTER TABLE "SchedulePackage" ADD COLUMN "availableSeats" INTEGER;
ALTER TABLE "SchedulePackage" ADD COLUMN "isFull" BOOLEAN NOT NULL DEFAULT false;
