-- CreateTable
CREATE TABLE "Package" (
    "id" TEXT NOT NULL,
    "boatId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "totalSeats" INTEGER,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackageTranslation" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "lang" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "slug" TEXT NOT NULL DEFAULT '',
    "excerpt" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL DEFAULT '',
    "itinerary" TEXT NOT NULL DEFAULT '',
    "route" TEXT NOT NULL DEFAULT '',
    "keywords" TEXT[],

    CONSTRAINT "PackageTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackagePriceTier" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "costPrice" DOUBLE PRECISION,
    "regularPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "salePrice" DOUBLE PRECISION,
    "agentPrice" DOUBLE PRECISION,

    CONSTRAINT "PackagePriceTier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PackageTranslation_packageId_lang_key" ON "PackageTranslation"("packageId", "lang");

-- CreateIndex
CREATE UNIQUE INDEX "PackagePriceTier_packageId_tier_key" ON "PackagePriceTier"("packageId", "tier");

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_boatId_fkey" FOREIGN KEY ("boatId") REFERENCES "Boat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageTranslation" ADD CONSTRAINT "PackageTranslation_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackagePriceTier" ADD CONSTRAINT "PackagePriceTier_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE CASCADE ON UPDATE CASCADE;
