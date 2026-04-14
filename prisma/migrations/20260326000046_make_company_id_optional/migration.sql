-- DropForeignKey
ALTER TABLE "Boat" DROP CONSTRAINT "Boat_companyId_fkey";

-- AlterTable
ALTER TABLE "Boat" ALTER COLUMN "companyId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Boat" ADD CONSTRAINT "Boat_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
