-- Sprint 3 B5 — Auto-improve cron writes per-plan notifications when state
-- changes are worth surfacing (selected schedule near full / new relevant
-- blog / price drop). Plan detail view reads active rows on load.

CREATE TYPE "PlanNotificationType" AS ENUM (
  'NEAR_FULL',
  'NEW_BLOG',
  'PRICE_DROP',
  'DATE_REMINDER'
);

CREATE TABLE "PlanNotification" (
  "id"          TEXT NOT NULL,
  "planId"      TEXT NOT NULL,
  "type"        "PlanNotificationType" NOT NULL,
  "title"       TEXT NOT NULL,
  "body"        TEXT NOT NULL,
  "payload"     JSONB,
  "scheduleId"  TEXT,
  "blogId"      TEXT,
  "dismissedAt" TIMESTAMP(3),
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PlanNotification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PlanNotification_planId_dismissedAt_idx"
  ON "PlanNotification"("planId", "dismissedAt");

CREATE INDEX "PlanNotification_createdAt_idx"
  ON "PlanNotification"("createdAt");

ALTER TABLE "PlanNotification"
  ADD CONSTRAINT "PlanNotification_planId_fkey"
  FOREIGN KEY ("planId") REFERENCES "UserPlan"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
