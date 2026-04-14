-- CreateTable
CREATE TABLE "PackageSeasonPeriod" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackageSeasonPeriod_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PackageSeasonPeriod" ADD CONSTRAINT "PackageSeasonPeriod_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE CASCADE ON UPDATE CASCADE;
