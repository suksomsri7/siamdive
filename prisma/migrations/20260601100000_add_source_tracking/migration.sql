-- 20260601100000_add_source_tracking
-- Adds external-source tracking to Boat, Schedule and Package so importers
-- (e.g. /siamdive-import-liveaboard) can record where a record came from and
-- so a cron sync can match/upsert departures idempotently instead of creating
-- duplicates.
-- Additive only: all new columns are nullable. Uses IF NOT EXISTS so it is safe
-- to re-run and matches the out-of-band-applied state of this DB.

ALTER TABLE "Boat" ADD COLUMN IF NOT EXISTS "sourceUrl" TEXT;
ALTER TABLE "Boat" ADD COLUMN IF NOT EXISTS "sourceId"  TEXT;
CREATE INDEX IF NOT EXISTS "Boat_sourceId_idx" ON "Boat"("sourceId");

ALTER TABLE "Schedule" ADD COLUMN IF NOT EXISTS "sourceUrl" TEXT;
ALTER TABLE "Schedule" ADD COLUMN IF NOT EXISTS "sourceId"  TEXT;
CREATE INDEX IF NOT EXISTS "Schedule_boatId_sourceId_idx" ON "Schedule"("boatId", "sourceId");

ALTER TABLE "Package" ADD COLUMN IF NOT EXISTS "sourceId" TEXT;
CREATE INDEX IF NOT EXISTS "Package_boatId_sourceId_idx" ON "Package"("boatId", "sourceId");
