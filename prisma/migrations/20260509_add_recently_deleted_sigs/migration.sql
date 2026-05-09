-- 20260509_add_recently_deleted_sigs
-- User-reported bug 2026-05-09: deleted an ARK_AI plan, then clicked
-- "Build my plan" again — same trip rebuilt from stale chat slots, felt
-- like the deleted plan came back. Track recent ARK_AI deletions on
-- PlanUser so build-plan can detect this and ask the user to confirm
-- before recreating an identical plan.
-- Additive only.

ALTER TABLE "PlanUser"
  ADD COLUMN "recentlyDeletedSigs" JSONB NOT NULL DEFAULT '[]'::jsonb;
