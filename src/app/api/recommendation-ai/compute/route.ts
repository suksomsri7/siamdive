import { NextRequest, NextResponse } from "next/server";
import {
  buildVisitorProfile,
  computeAiRecommendations,
  saveRecommendationCache,
} from "@/lib/recommendation-ai/compute";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret") || req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { visitorId, lang } = await req.json();
  if (!visitorId) {
    return NextResponse.json({ ok: false, error: "missing visitorId" }, { status: 400 });
  }

  const config = await prisma.recommendationAiConfig.findUnique({ where: { id: "default" } });
  if (!config?.enabled) {
    return NextResponse.json({ ok: false, error: "disabled" });
  }

  const profile = await buildVisitorProfile(visitorId);

  const result = await computeAiRecommendations(visitorId, lang || "en");

  await saveRecommendationCache(
    visitorId,
    profile.userId,
    result,
    profile.totalActivity,
    config.cacheTTLDays,
  );

  return NextResponse.json({ ok: true, variant: result.variant, count: result.boatIds.length });
}
