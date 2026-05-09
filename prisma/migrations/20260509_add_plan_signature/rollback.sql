-- Rollback for 20260509_add_plan_signature

DROP INDEX IF EXISTS "UserPlan_userId_planSignature_unique";
ALTER TABLE "UserPlan" DROP COLUMN IF EXISTS "planSignature";
