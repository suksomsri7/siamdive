-- 20260509_add_plan_signature
-- Adds slot-derived signature to UserPlan so /api/ark-ai/build-plan can
-- detect "same trip already built for this user" and reuse the existing
-- plan instead of creating duplicates.
-- Additive only: new column is nullable, partial unique index ignores NULL.

ALTER TABLE "UserPlan" ADD COLUMN "planSignature" TEXT;

-- Partial unique index — only enforces uniqueness when planSignature is set.
-- Legacy rows with NULL signature are unaffected. Postgres treats multiple
-- NULLs as distinct, so no constraint violation on existing data.
CREATE UNIQUE INDEX "UserPlan_userId_planSignature_unique"
  ON "UserPlan"("userId", "planSignature")
  WHERE "planSignature" IS NOT NULL;
