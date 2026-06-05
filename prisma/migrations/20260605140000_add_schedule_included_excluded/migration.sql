-- Liveaboard schedule structured "what's included / not included". ADDITIVE ONLY, idempotent.
-- Only liveaboard category uses these; other categories leave them empty ([]).
ALTER TABLE "ScheduleTranslation"
  ADD COLUMN IF NOT EXISTS "included" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "excluded" TEXT[] DEFAULT ARRAY[]::TEXT[];
