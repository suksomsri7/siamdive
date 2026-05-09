-- Rollback for 20260509_add_recently_deleted_sigs

ALTER TABLE "PlanUser" DROP COLUMN IF EXISTS "recentlyDeletedSigs";
