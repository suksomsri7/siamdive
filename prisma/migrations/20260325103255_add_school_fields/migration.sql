-- AlterTable
ALTER TABLE "School" ADD COLUMN     "keywords" TEXT[],
ADD COLUMN     "serviceArea" TEXT,
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "SchoolTranslation" ADD COLUMN     "information" TEXT NOT NULL DEFAULT '';
