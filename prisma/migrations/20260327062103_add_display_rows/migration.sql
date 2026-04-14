-- AlterTable
ALTER TABLE "Admin" ALTER COLUMN "permissions" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "DisplayRow" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "layout" TEXT NOT NULL DEFAULT 'HORIZONTAL',
    "itemType" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DisplayRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisplayRowItem" (
    "id" TEXT NOT NULL,
    "rowId" TEXT NOT NULL,
    "refId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DisplayRowItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DisplayRowItem_rowId_refId_key" ON "DisplayRowItem"("rowId", "refId");

-- AddForeignKey
ALTER TABLE "DisplayRowItem" ADD CONSTRAINT "DisplayRowItem_rowId_fkey" FOREIGN KEY ("rowId") REFERENCES "DisplayRow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
