/*
  Warnings:

  - You are about to drop the column `categoryId` on the `Blog` table. All the data in the column will be lost.
  - You are about to drop the column `content` on the `Blog` table. All the data in the column will be lost.
  - You are about to drop the column `coverImage` on the `Blog` table. All the data in the column will be lost.
  - You are about to drop the column `excerpt` on the `Blog` table. All the data in the column will be lost.
  - You are about to drop the column `published` on the `Blog` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `Blog` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Blog` table. All the data in the column will be lost.
  - You are about to drop the column `titleEn` on the `Blog` table. All the data in the column will be lost.
  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "BlogStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- DropForeignKey
ALTER TABLE "Blog" DROP CONSTRAINT "Blog_categoryId_fkey";

-- DropIndex
DROP INDEX "Blog_slug_key";

-- AlterTable
ALTER TABLE "Blog" DROP COLUMN "categoryId",
DROP COLUMN "content",
DROP COLUMN "coverImage",
DROP COLUMN "excerpt",
DROP COLUMN "published",
DROP COLUMN "slug",
DROP COLUMN "title",
DROP COLUMN "titleEn",
ADD COLUMN     "covers" TEXT[],
ADD COLUMN     "status" "BlogStatus" NOT NULL DEFAULT 'DRAFT';

-- DropTable
DROP TABLE "Category";

-- CreateTable
CREATE TABLE "BlogTranslation" (
    "id" TEXT NOT NULL,
    "blogId" TEXT NOT NULL,
    "lang" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL DEFAULT '',
    "keywords" TEXT[],

    CONSTRAINT "BlogTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogVideo" (
    "id" TEXT NOT NULL,
    "blogId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BlogVideo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BlogTranslation_slug_key" ON "BlogTranslation"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BlogTranslation_blogId_lang_key" ON "BlogTranslation"("blogId", "lang");

-- AddForeignKey
ALTER TABLE "BlogTranslation" ADD CONSTRAINT "BlogTranslation_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "Blog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogVideo" ADD CONSTRAINT "BlogVideo_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "Blog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
