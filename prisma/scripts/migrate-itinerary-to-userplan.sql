-- Ark AI v2 — Phase 4 — Itinerary → UserPlan migration (manual, run after DB snapshot)
--
-- USAGE:
--   1. Take a DB snapshot first (Supabase dashboard → Backups → Restore point)
--   2. Run this script in Supabase SQL editor or via psql:
--      psql "$DATABASE_URL" -f prisma/scripts/migrate-itinerary-to-userplan.sql
--   3. Verify: SELECT COUNT(*) FROM "UserPlan" WHERE source = 'ARK_AI';
--   4. Existing /plan/[shortId] URLs continue to work (shortId preserved)
--   5. After 30 days of stability, run drop-itinerary-table.sql to clean up
--
-- WHAT THIS DOES:
--   - Creates a system PlanUser to own AI-generated plans
--   - Copies each Itinerary row → UserPlan with shape conversion
--     - days/budget/areas/durationDays → packed into trips JSON metadata
--     - shortId preserved (URL stability)
--     - viewCount, expiresAt, createdAt preserved
--     - source = 'ARK_AI', isPublic = true (so PopularPlansRow surfaces them)
--
-- ROLLBACK: DELETE FROM "UserPlan" WHERE source = 'ARK_AI'; DELETE FROM "PlanUser" WHERE email = 'ark-ai-system@siamdive.com';

BEGIN;

-- 1) System PlanUser for AI-generated plans (idempotent)
INSERT INTO "PlanUser" (id, email, name, "createdAt", "updatedAt")
VALUES (
  'plan-user-ark-ai-system',
  'ark-ai-system@siamdive.com',
  'Ark AI',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- 2) Backfill UserPlan from Itinerary (idempotent on shortId)
INSERT INTO "UserPlan" (
  id,
  "shortId",
  "userId",
  name,
  trips,
  "isPublic",
  "viewCount",
  "expiresAt",
  source,
  "createdAt",
  "updatedAt",
  status
)
SELECT
  'up-from-itin-' || i.id AS id,
  i."shortId",
  (SELECT id FROM "PlanUser" WHERE email = 'ark-ai-system@siamdive.com') AS "userId",
  i.title AS name,
  jsonb_build_object(
    'legacyDays', i.days,
    'legacyBudget', i.budget,
    'legacyBoatIds', to_jsonb(i."boatIds"),
    'legacyBlogIds', to_jsonb(i."blogIds"),
    'legacyAreas', to_jsonb(i.areas),
    'legacyDurationDays', i."durationDays",
    'legacyTotalDives', i."totalDives",
    'legacyTotalTours', i."totalTours",
    'legacyLang', i.lang
  ) AS trips,
  TRUE AS "isPublic",
  i."viewCount",
  i."expiresAt",
  'ARK_AI' AS source,
  i."createdAt",
  NOW() AS "updatedAt",
  'PLANNING'::"PlanStatus" AS status
FROM "Itinerary" i
WHERE NOT EXISTS (
  SELECT 1 FROM "UserPlan" up WHERE up."shortId" = i."shortId"
);

-- 3) Verify counts
DO $$
DECLARE
  itin_count INT;
  ai_plan_count INT;
BEGIN
  SELECT COUNT(*) INTO itin_count FROM "Itinerary";
  SELECT COUNT(*) INTO ai_plan_count FROM "UserPlan" WHERE source = 'ARK_AI';
  RAISE NOTICE 'Itinerary rows: %, ARK_AI UserPlan rows: %', itin_count, ai_plan_count;
END $$;

COMMIT;
