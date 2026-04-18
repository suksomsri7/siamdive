-- CreateEnum
CREATE TYPE "AnalyticsEventType" AS ENUM ('PAGE_VIEW', 'ROW_CLICK', 'LANGUAGE_SWITCH', 'TRIP_VIEW', 'SCHEDULE_VIEW', 'SCHEDULE_SHARE', 'BLOG_VIEW', 'BLOG_READ_COMPLETE', 'SEARCH', 'SEARCH_RESULT_CLICK', 'FILTER_APPLY', 'BOOKING_INTENT_LINE', 'BOOKING_INTENT_WHATSAPP', 'BOOKING_INTENT_EMAIL', 'BOOKING_INTENT_CALL', 'BOOKING_INTENT_MESSENGER', 'BOOKING_INTENT_WECHAT', 'SESSION_START', 'SESSION_END', 'ERROR');

-- CreateTable
CREATE TABLE "AnalyticsSession" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventCount" INTEGER NOT NULL DEFAULT 0,
    "pageCount" INTEGER NOT NULL DEFAULT 0,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "device" TEXT,
    "os" TEXT,
    "browser" TEXT,
    "firstUtmSource" TEXT,
    "firstUtmMedium" TEXT,
    "firstUtmCampaign" TEXT,
    "firstUtmTerm" TEXT,
    "firstUtmContent" TEXT,
    "firstReferrer" TEXT,
    "firstLandingPath" TEXT,
    "lastUtmSource" TEXT,
    "lastUtmMedium" TEXT,
    "lastUtmCampaign" TEXT,
    "lang" TEXT,
    "isBot" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AnalyticsSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" BIGSERIAL NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "type" "AnalyticsEventType" NOT NULL,
    "path" TEXT NOT NULL,
    "lang" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "dwellMs" INTEGER,
    "scrollPct" INTEGER,
    "viewportW" INTEGER,
    "viewportH" INTEGER,
    "properties" JSONB,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsSearch" (
    "id" BIGSERIAL NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "queryRaw" TEXT NOT NULL,
    "queryNorm" TEXT NOT NULL,
    "lang" TEXT,
    "country" TEXT,
    "resultsCount" INTEGER NOT NULL,
    "filters" JSONB,
    "clickedResult" TEXT,
    "clickedRank" INTEGER,

    CONSTRAINT "AnalyticsSearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsAttribution" (
    "id" BIGSERIAL NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "intentType" "AnalyticsEventType" NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetPriceTHB" INTEGER,
    "scheduleDate" TIMESTAMP(3),
    "firstUtmSource" TEXT,
    "firstUtmMedium" TEXT,
    "firstUtmCampaign" TEXT,
    "firstReferrer" TEXT,
    "msFromSessionStart" INTEGER,
    "sessionsBeforeIntent" INTEGER,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "confirmedAt" TIMESTAMP(3),
    "confirmedValueTHB" INTEGER,

    CONSTRAINT "AnalyticsAttribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsDaily" (
    "id" BIGSERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "country" TEXT,
    "device" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "uniqueVisitors" INTEGER NOT NULL DEFAULT 0,
    "uniqueSessions" INTEGER NOT NULL DEFAULT 0,
    "avgDwellMs" INTEGER,
    "avgScrollPct" INTEGER,
    "reads" INTEGER NOT NULL DEFAULT 0,
    "intents" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AnalyticsDaily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalyticsSession_startedAt_idx" ON "AnalyticsSession"("startedAt");
CREATE INDEX "AnalyticsSession_visitorId_idx" ON "AnalyticsSession"("visitorId");
CREATE INDEX "AnalyticsSession_country_startedAt_idx" ON "AnalyticsSession"("country", "startedAt");
CREATE INDEX "AnalyticsSession_isBot_startedAt_idx" ON "AnalyticsSession"("isBot", "startedAt");

CREATE INDEX "AnalyticsEvent_ts_idx" ON "AnalyticsEvent"("ts");
CREATE INDEX "AnalyticsEvent_type_ts_idx" ON "AnalyticsEvent"("type", "ts");
CREATE INDEX "AnalyticsEvent_entityType_entityId_ts_idx" ON "AnalyticsEvent"("entityType", "entityId", "ts");
CREATE INDEX "AnalyticsEvent_sessionId_idx" ON "AnalyticsEvent"("sessionId");
CREATE INDEX "AnalyticsEvent_visitorId_ts_idx" ON "AnalyticsEvent"("visitorId", "ts");

CREATE INDEX "AnalyticsSearch_ts_idx" ON "AnalyticsSearch"("ts");
CREATE INDEX "AnalyticsSearch_queryNorm_idx" ON "AnalyticsSearch"("queryNorm");
CREATE INDEX "AnalyticsSearch_resultsCount_ts_idx" ON "AnalyticsSearch"("resultsCount", "ts");
CREATE INDEX "AnalyticsSearch_sessionId_idx" ON "AnalyticsSearch"("sessionId");

CREATE INDEX "AnalyticsAttribution_ts_idx" ON "AnalyticsAttribution"("ts");
CREATE INDEX "AnalyticsAttribution_targetType_targetId_ts_idx" ON "AnalyticsAttribution"("targetType", "targetId", "ts");
CREATE INDEX "AnalyticsAttribution_firstUtmSource_ts_idx" ON "AnalyticsAttribution"("firstUtmSource", "ts");
CREATE INDEX "AnalyticsAttribution_confirmed_ts_idx" ON "AnalyticsAttribution"("confirmed", "ts");

CREATE INDEX "AnalyticsDaily_date_entityType_idx" ON "AnalyticsDaily"("date", "entityType");
CREATE INDEX "AnalyticsDaily_entityType_entityId_date_idx" ON "AnalyticsDaily"("entityType", "entityId", "date");
CREATE UNIQUE INDEX "AnalyticsDaily_date_entityType_entityId_country_device_key" ON "AnalyticsDaily"("date", "entityType", "entityId", "country", "device");

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AnalyticsSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnalyticsAttribution" ADD CONSTRAINT "AnalyticsAttribution_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AnalyticsSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Materialized view for "trending now" (last 24h). Refresh via cron.
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_trending_24h AS
SELECT
  e."entityType",
  e."entityId",
  COUNT(*)::int AS views,
  COUNT(DISTINCT e."sessionId")::int AS sessions,
  MAX(e.ts) AS last_ts
FROM "AnalyticsEvent" e
JOIN "AnalyticsSession" s ON s.id = e."sessionId"
WHERE e.ts > NOW() - INTERVAL '24 hours'
  AND e."entityType" IS NOT NULL
  AND e."entityId" IS NOT NULL
  AND s."isBot" = FALSE
  AND e.type IN ('TRIP_VIEW','BLOG_VIEW','SCHEDULE_VIEW')
GROUP BY e."entityType", e."entityId";

CREATE UNIQUE INDEX IF NOT EXISTS analytics_trending_24h_pk
  ON analytics_trending_24h ("entityType", "entityId");

CREATE INDEX IF NOT EXISTS analytics_trending_24h_views
  ON analytics_trending_24h (views DESC);
