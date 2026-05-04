-- Ark AI v2 — Phase 1.5: add 7 ARK_AI_* event types for behavior tracking
--
-- ALTER TYPE ... ADD VALUE is non-transactional in PostgreSQL — each must be
-- in its own statement. Order does not matter.

ALTER TYPE "AnalyticsEventType" ADD VALUE IF NOT EXISTS 'ARK_AI_SLOT_FILLED';
ALTER TYPE "AnalyticsEventType" ADD VALUE IF NOT EXISTS 'ARK_AI_SLOT_SKIPPED';
ALTER TYPE "AnalyticsEventType" ADD VALUE IF NOT EXISTS 'ARK_AI_PLAN_GENERATED';
ALTER TYPE "AnalyticsEventType" ADD VALUE IF NOT EXISTS 'ARK_AI_PLAN_SAVED';
ALTER TYPE "AnalyticsEventType" ADD VALUE IF NOT EXISTS 'ARK_AI_TEMPLATE_SELECTED';
ALTER TYPE "AnalyticsEventType" ADD VALUE IF NOT EXISTS 'ARK_AI_BUDGET_BLOCKED';
ALTER TYPE "AnalyticsEventType" ADD VALUE IF NOT EXISTS 'ARK_AI_PERSONALIZED';
