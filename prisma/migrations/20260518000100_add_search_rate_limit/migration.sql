-- CreateTable
CREATE TABLE "SearchRateLimit" (
    "planId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchRateLimit_pkey" PRIMARY KEY ("planId", "date")
);

-- CreateIndex (for cleanup of old rows)
CREATE INDEX "SearchRateLimit_date_idx" ON "SearchRateLimit"("date");
