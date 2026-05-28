-- AlterTable
ALTER TABLE "Company"
  ADD COLUMN "website"      TEXT,
  ADD COLUMN "facebookUrl"  TEXT,
  ADD COLUMN "instagramUrl" TEXT,
  ADD COLUMN "youtubeUrl"   TEXT,
  ADD COLUMN "whatsApp"     TEXT,
  ADD COLUMN "wechat"       TEXT,
  ADD COLUMN "contactName"  TEXT,
  ADD COLUMN "internalNote" TEXT;

-- CreateTable
CREATE TABLE "CompanySource" (
    "id"          TEXT NOT NULL,
    "companyId"   TEXT NOT NULL,
    "type"        TEXT NOT NULL,
    "url"         TEXT,
    "content"     TEXT,
    "filename"    TEXT,
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "collectedBy" TEXT,
    "note"        TEXT,
    "boatId"      TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompanySource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompanySource_companyId_type_idx" ON "CompanySource"("companyId", "type");
CREATE INDEX "CompanySource_boatId_idx" ON "CompanySource"("boatId");

-- AddForeignKey
ALTER TABLE "CompanySource"
  ADD CONSTRAINT "CompanySource_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
