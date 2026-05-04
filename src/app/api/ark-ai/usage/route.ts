import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/apiAuth";

function startOfUtcDay(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response!;

  const today = startOfUtcDay(new Date());
  const weekAgo = startOfUtcDay(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000));

  const todayAgg = await prisma.aiUsageLog.aggregate({
    _sum: { costUsd: true, inputTokens: true, outputTokens: true },
    _count: { _all: true },
    where: { createdAt: { gte: today } },
  });

  const weekRows = await prisma.aiUsageLog.findMany({
    where: { createdAt: { gte: weekAgo } },
    select: { createdAt: true, costUsd: true },
  });

  const dayBuckets: Record<string, number> = {};
  for (let i = 0; i < 7; i++) {
    const d = startOfUtcDay(new Date(Date.now() - i * 24 * 60 * 60 * 1000));
    dayBuckets[d.toISOString().slice(0, 10)] = 0;
  }
  for (const row of weekRows) {
    const key = startOfUtcDay(row.createdAt).toISOString().slice(0, 10);
    if (key in dayBuckets) dayBuckets[key] += row.costUsd;
  }
  const week = Object.keys(dayBuckets)
    .sort()
    .map(date => ({ date, costUsd: Math.round(dayBuckets[date] * 1e4) / 1e4 }));

  // Top spenders by sessionId today (gate against abuse). Skip rows with null sessionId.
  const topRaw = await prisma.aiUsageLog.groupBy({
    by: ["sessionId"],
    where: { createdAt: { gte: today }, sessionId: { not: null } },
    _sum: { costUsd: true, inputTokens: true, outputTokens: true },
    _count: { _all: true },
    orderBy: { _sum: { costUsd: "desc" } },
    take: 10,
  });
  const topSpenders = topRaw.map(r => ({
    sessionId: r.sessionId!,
    callCount: r._count._all,
    inputTokens: r._sum.inputTokens ?? 0,
    outputTokens: r._sum.outputTokens ?? 0,
    costUsd: Math.round((r._sum.costUsd ?? 0) * 1e4) / 1e4,
  }));

  return NextResponse.json({
    today: {
      costUsd: Math.round((todayAgg._sum.costUsd ?? 0) * 1e4) / 1e4,
      inputTokens: todayAgg._sum.inputTokens ?? 0,
      outputTokens: todayAgg._sum.outputTokens ?? 0,
      callCount: todayAgg._count._all,
    },
    week,
    topSpenders,
  });
}
