-- AlterTable
ALTER TABLE "Schedule" ADD COLUMN     "dateType" TEXT NOT NULL DEFAULT 'single',
ADD COLUMN     "weekDays" TEXT[],
ALTER COLUMN "departureDate" DROP NOT NULL;
