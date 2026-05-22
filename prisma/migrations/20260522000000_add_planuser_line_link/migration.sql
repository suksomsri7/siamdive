-- AlterTable
ALTER TABLE "PlanUser" ADD COLUMN "lineUserId" TEXT;
ALTER TABLE "PlanUser" ADD COLUMN "lineDisplayName" TEXT;
ALTER TABLE "PlanUser" ADD COLUMN "linePictureUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "PlanUser_lineUserId_key" ON "PlanUser"("lineUserId");
