-- CreateTable
CREATE TABLE "ScheduleTranslation" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "lang" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "slug" TEXT NOT NULL DEFAULT '',
    "excerpt" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL DEFAULT '',
    "itinerary" TEXT NOT NULL DEFAULT '',
    "route" TEXT NOT NULL DEFAULT '',
    "keywords" TEXT[],

    CONSTRAINT "ScheduleTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchedulePriceTier" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "costPrice" DOUBLE PRECISION,
    "regularPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "salePrice" DOUBLE PRECISION,
    "agentPrice" DOUBLE PRECISION,

    CONSTRAINT "SchedulePriceTier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleTranslation_scheduleId_lang_key" ON "ScheduleTranslation"("scheduleId", "lang");

-- CreateIndex
CREATE UNIQUE INDEX "SchedulePriceTier_scheduleId_tier_key" ON "SchedulePriceTier"("scheduleId", "tier");

-- AddForeignKey
ALTER TABLE "ScheduleTranslation" ADD CONSTRAINT "ScheduleTranslation_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedulePriceTier" ADD CONSTRAINT "SchedulePriceTier_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
