import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCronSecret } from "@/lib/cronAuth";

// Daily cleanup for Ark AI privacy + storage hygiene.
// Retention windows are documented in /[lang]/privacy:
//   - AiUsageLog: 90 days (cost telemetry without message content)
//   - AiPlanSession: drop past expiresAt (already 30-day TTL by default)
//   - AnalyticsEvent ARK_AI_*: 90 days (matches AiUsageLog)
//   - UserPlan source=ARK_AI: anonymous (viewCount=0) drop after 7 days,
//     stale public (viewCount<3) drop after 30 days, popular kept indefinitely
export async function POST(req: NextRequest) {
  const authError = requireCronSecret(req);
  if (authError) return authError;

  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [usageLog, expiredSessions, oldEvents, anonAiPlans, stalePublicAiPlans] = await Promise.all([
    prisma.aiUsageLog.deleteMany({ where: { createdAt: { lt: ninetyDaysAgo } } }),
    prisma.aiPlanSession.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.analyticsEvent.deleteMany({
      where: {
        type: { in: ["ARK_AI_SLOT_FILLED","ARK_AI_SLOT_SKIPPED","ARK_AI_PLAN_GENERATED","ARK_AI_PLAN_SAVED","ARK_AI_TEMPLATE_SELECTED","ARK_AI_BUDGET_BLOCKED","ARK_AI_PERSONALIZED"] },
        ts: { lt: ninetyDaysAgo },
      },
    }),
    prisma.userPlan.deleteMany({
      where: {
        source: "ARK_AI",
        viewCount: 0,
        createdAt: { lt: sevenDaysAgo },
      },
    }),
    prisma.userPlan.deleteMany({
      where: {
        source: "ARK_AI",
        isPublic: true,
        viewCount: { lt: 3 },
        createdAt: { lt: thirtyDaysAgo },
      },
    }),
  ]);

  return NextResponse.json({
    at: now.toISOString(),
    deleted: {
      aiUsageLog: usageLog.count,
      aiPlanSession: expiredSessions.count,
      analyticsEventArkAi: oldEvents.count,
      anonymousAiPlans: anonAiPlans.count,
      stalePublicAiPlans: stalePublicAiPlans.count,
    },
  });
}
