-- Ark AI v2 — Phase 1: Schema additions + Cost Guard tables
-- Additive only. No DROP/ALTER COLUMN on existing data. Safe to roll back.
--
-- Changes:
--   1. Blog: add category, serviceAreaIds + indexes
--   2. Schedule: add composite index for availability queries
--   3. UserPlan: add public sharing + expiration + source fields
--   4. AiConfig: add kill switch + cost guard fields
--   5. AiUsageLog (NEW): per-call token + cost tracking
--   6. AiPlanSession (NEW): slot-extraction session state per device

-- ── 1. Blog ─────────────────────────────────────────────────────────────────
ALTER TABLE "Blog" ADD COLUMN "category" "BlogCategory";
ALTER TABLE "Blog" ADD COLUMN "serviceAreaIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

CREATE INDEX "Blog_category_idx" ON "Blog"("category");
CREATE INDEX "Blog_serviceAreaIds_idx" ON "Blog" USING GIN ("serviceAreaIds");

-- ── 2. Schedule ─────────────────────────────────────────────────────────────
CREATE INDEX "Schedule_status_departureDate_availableSeats_idx"
  ON "Schedule"("status", "departureDate", "availableSeats");

-- ── 3. UserPlan ─────────────────────────────────────────────────────────────
ALTER TABLE "UserPlan" ADD COLUMN "isPublic"   BOOLEAN   NOT NULL DEFAULT false;
ALTER TABLE "UserPlan" ADD COLUMN "publicSlug" TEXT;
ALTER TABLE "UserPlan" ADD COLUMN "viewCount"  INTEGER   NOT NULL DEFAULT 0;
ALTER TABLE "UserPlan" ADD COLUMN "expiresAt"  TIMESTAMP(3);
ALTER TABLE "UserPlan" ADD COLUMN "source"     TEXT      NOT NULL DEFAULT 'USER';
ALTER TABLE "UserPlan" ADD COLUMN "aiPrompt"   TEXT;

CREATE UNIQUE INDEX "UserPlan_publicSlug_key" ON "UserPlan"("publicSlug");

-- ── 4. AiConfig ─────────────────────────────────────────────────────────────
ALTER TABLE "AiConfig" ADD COLUMN "enabled"            BOOLEAN          NOT NULL DEFAULT true;
ALTER TABLE "AiConfig" ADD COLUMN "dailyBudgetUsd"     DOUBLE PRECISION NOT NULL DEFAULT 5;
ALTER TABLE "AiConfig" ADD COLUMN "costAlertEmail"     TEXT;
ALTER TABLE "AiConfig" ADD COLUMN "costAlertThreshold" INTEGER          NOT NULL DEFAULT 80;

-- ── 5. AiUsageLog ───────────────────────────────────────────────────────────
CREATE TABLE "AiUsageLog" (
  "id"           TEXT             NOT NULL,
  "sessionId"    TEXT,
  "inputTokens"  INTEGER          NOT NULL,
  "outputTokens" INTEGER          NOT NULL,
  "costUsd"      DOUBLE PRECISION NOT NULL,
  "model"        TEXT             NOT NULL,
  "createdAt"    TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AiUsageLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AiUsageLog_createdAt_idx" ON "AiUsageLog"("createdAt");

-- ── 6. AiPlanSession ────────────────────────────────────────────────────────
CREATE TABLE "AiPlanSession" (
  "id"              TEXT         NOT NULL,
  "deviceId"        TEXT         NOT NULL,
  "slots"           JSONB        NOT NULL DEFAULT '{}',
  "status"          TEXT         NOT NULL DEFAULT 'active',
  "behaviorContext" JSONB,
  "lastActiveAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt"       TIMESTAMP(3) NOT NULL,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AiPlanSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AiPlanSession_deviceId_idx" ON "AiPlanSession"("deviceId");
CREATE INDEX "AiPlanSession_expiresAt_idx" ON "AiPlanSession"("expiresAt");
