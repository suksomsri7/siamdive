-- AlterTable
ALTER TABLE "DisplayRow" ADD COLUMN     "maxItems" INTEGER;

-- CreateTable
CREATE TABLE "DisplayRowTranslation" (
    "id" TEXT NOT NULL,
    "rowId" TEXT NOT NULL,
    "lang" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "subtitle" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "DisplayRowTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DisplayRowTranslation_rowId_lang_key" ON "DisplayRowTranslation"("rowId", "lang");

-- AddForeignKey
ALTER TABLE "DisplayRowTranslation" ADD CONSTRAINT "DisplayRowTranslation_rowId_fkey" FOREIGN KEY ("rowId") REFERENCES "DisplayRow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
