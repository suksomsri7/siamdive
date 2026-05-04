-- Emergency rollback for migration 20260504053017_arkai_v2_schema_cost_guard
-- Apply manually via Supabase SQL editor only if Phase 1 must be reverted.
-- Drops in REVERSE order of creation. Drops new columns + new tables.
-- WARNING: data in AiUsageLog / AiPlanSession will be permanently lost.

-- ── 6. AiPlanSession ────────────────────────────────────────────────────────
DROP TABLE IF EXISTS "AiPlanSession";

-- ── 5. AiUsageLog ───────────────────────────────────────────────────────────
DROP TABLE IF EXISTS "AiUsageLog";

-- ── 4. AiConfig (drop new cost guard columns) ───────────────────────────────
ALTER TABLE "AiConfig" DROP COLUMN IF EXISTS "costAlertThreshold";
ALTER TABLE "AiConfig" DROP COLUMN IF EXISTS "costAlertEmail";
ALTER TABLE "AiConfig" DROP COLUMN IF EXISTS "dailyBudgetUsd";
ALTER TABLE "AiConfig" DROP COLUMN IF EXISTS "enabled";

-- ── 3. UserPlan (drop new sharing/expiration columns) ───────────────────────
DROP INDEX IF EXISTS "UserPlan_publicSlug_key";
ALTER TABLE "UserPlan" DROP COLUMN IF EXISTS "aiPrompt";
ALTER TABLE "UserPlan" DROP COLUMN IF EXISTS "source";
ALTER TABLE "UserPlan" DROP COLUMN IF EXISTS "expiresAt";
ALTER TABLE "UserPlan" DROP COLUMN IF EXISTS "viewCount";
ALTER TABLE "UserPlan" DROP COLUMN IF EXISTS "publicSlug";
ALTER TABLE "UserPlan" DROP COLUMN IF EXISTS "isPublic";

-- ── 2. Schedule (drop composite index) ──────────────────────────────────────
DROP INDEX IF EXISTS "Schedule_status_departureDate_availableSeats_idx";

-- ── 1. Blog (drop new columns + indexes) ────────────────────────────────────
DROP INDEX IF EXISTS "Blog_serviceAreaIds_idx";
DROP INDEX IF EXISTS "Blog_category_idx";
ALTER TABLE "Blog" DROP COLUMN IF EXISTS "serviceAreaIds";
ALTER TABLE "Blog" DROP COLUMN IF EXISTS "category";
