-- Liveaboard full-detail (PADI-style) sections. ADDITIVE, idempotent. Only liveaboard uses these.
ALTER TABLE "Schedule" ADD COLUMN IF NOT EXISTS "logistics" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "ScheduleTranslation" ADD COLUMN IF NOT EXISTS "details" JSONB NOT NULL DEFAULT '{}';
