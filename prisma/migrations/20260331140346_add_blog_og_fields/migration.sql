-- AlterTable
ALTER TABLE "BlogTranslation" ADD COLUMN     "ogDescription" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "ogImage" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "ogTitle" TEXT NOT NULL DEFAULT '';
