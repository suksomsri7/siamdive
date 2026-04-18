import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCronSecret } from "@/lib/cronAuth";

// Daily aggregation + pruning for analytics tables.
// Cron schedule: 01:00 BKK = 18:00 UTC previous day (0 18 * * *).
//
// What it does:
//   1. Roll up yesterday's (BKK) events → AnalyticsDaily rows
//      grouped by (date, entityType, entityId, country, device).
//      Also rolls up paths (entityType="PATH") and searches (entityType="SEARCH").
//   2. Refresh trending_24h materialized view if it exists.
//   3. Prune AnalyticsEvent + AnalyticsSearch rows > 90 days.
//   4. Delete AnalyticsSession rows > 180 days with cascade.

const RAW_RETENTION_DAYS = 90;
const SESSION_RETENTION_DAYS = 180;

// Returns a JS Date at 00:00 Bangkok time on the BKK-calendar day N days ago.
function bkkDaysAgoMidnight(daysAgo: number): Date {
  const nowUtcMs = Date.now();
  const bkkOffsetMs = 7 * 60 * 60 * 1000;
  const bkkNowMs = nowUtcMs + bkkOffsetMs;
  const bkkNow = new Date(bkkNowMs);
  const y = bkkNow.getUTCFullYear();
  const m = bkkNow.getUTCMonth();
  const d = bkkNow.getUTCDate() - daysAgo;
  // Midnight BKK = 17:00 UTC of the previous calendar day
  return new Date(Date.UTC(y, m, d, -7, 0, 0));
}

type AggRow = {
  entityType: string;
  entityId: string;
  country: string | null;
  device: string | null;
  views: number;
  uniqueVisitors: number;
  uniqueSessions: number;
  avgDwellMs: number | null;
  avgScrollPct: number | null;
  reads: number;
  intents: number;
};

export async function POST(req: NextRequest) {
  const authErr = requireCronSecret(req);
  if (authErr) return authErr;

  const startTs = Date.now();

  // Yesterday's BKK window [dayStart, dayEnd)
  const dayStart = bkkDaysAgoMidnight(1);
  const dayEnd   = bkkDaysAgoMidnight(0);
  const dayKey   = new Date(Date.UTC(dayStart.getUTCFullYear(), dayStart.getUTCMonth(), dayStart.getUTCDate(), -7));

  // ── Aggregate events into (entityType, entityId, country, device) buckets ──
  const entityAggs = await prisma.$queryRaw<AggRow[]>`
    SELECT
      COALESCE(e."entityType", 'PATH') AS "entityType",
      COALESCE(e."entityId", e.path)   AS "entityId",
      s.country,
      s.device,
      COUNT(*) FILTER (WHERE e.type IN ('PAGE_VIEW','TRIP_VIEW','BLOG_VIEW','SCHEDULE_VIEW'))::int AS views,
      COUNT(DISTINCT e."visitorId")::int AS "uniqueVisitors",
      COUNT(DISTINCT e."sessionId")::int AS "uniqueSessions",
      NULLIF(AVG(e."dwellMs" )::int, 0)  AS "avgDwellMs",
      NULLIF(AVG(e."scrollPct")::int, 0) AS "avgScrollPct",
      COUNT(*) FILTER (WHERE e.type = 'BLOG_READ_COMPLETE')::int AS reads,
      COUNT(*) FILTER (WHERE e.type::text LIKE 'BOOKING_INTENT_%')::int AS intents
    FROM "AnalyticsEvent" e
    JOIN "AnalyticsSession" s ON s.id = e."sessionId"
    WHERE e.ts >= ${dayStart} AND e.ts < ${dayEnd}
      AND s."isBot" = FALSE
    GROUP BY 1, 2, 3, 4
  `;

  let upserts = 0;
  for (const r of entityAggs) {
    if (!r.entityId) continue;
    await prisma.analyticsDaily.upsert({
      where: {
        date_entityType_entityId_country_device: {
          date: dayKey,
          entityType: r.entityType,
          entityId: r.entityId.slice(0, 120),
          country: r.country ?? "",
          device: r.device ?? "",
        },
      },
      create: {
        date: dayKey,
        entityType: r.entityType,
        entityId: r.entityId.slice(0, 120),
        country: r.country,
        device: r.device,
        views: r.views,
        uniqueVisitors: r.uniqueVisitors,
        uniqueSessions: r.uniqueSessions,
        avgDwellMs: r.avgDwellMs,
        avgScrollPct: r.avgScrollPct,
        reads: r.reads,
        intents: r.intents,
      },
      update: {
        views: r.views,
        uniqueVisitors: r.uniqueVisitors,
        uniqueSessions: r.uniqueSessions,
        avgDwellMs: r.avgDwellMs,
        avgScrollPct: r.avgScrollPct,
        reads: r.reads,
        intents: r.intents,
      },
    });
    upserts++;
  }

  // ── Aggregate searches ──
  const searchAggs = await prisma.$queryRaw<Array<{
    queryNorm: string;
    country: string | null;
    views: number;
    uniqueSessions: number;
    zeroResults: number;
  }>>`
    SELECT
      "queryNorm",
      country,
      COUNT(*)::int AS views,
      COUNT(DISTINCT "sessionId")::int AS "uniqueSessions",
      COUNT(*) FILTER (WHERE "resultsCount" = 0)::int AS "zeroResults"
    FROM "AnalyticsSearch"
    WHERE ts >= ${dayStart} AND ts < ${dayEnd}
    GROUP BY "queryNorm", country
  `;

  for (const s of searchAggs) {
    if (!s.queryNorm) continue;
    await prisma.analyticsDaily.upsert({
      where: {
        date_entityType_entityId_country_device: {
          date: dayKey,
          entityType: "SEARCH",
          entityId: s.queryNorm.slice(0, 120),
          country: s.country ?? "",
          device: "",
        },
      },
      create: {
        date: dayKey,
        entityType: "SEARCH",
        entityId: s.queryNorm.slice(0, 120),
        country: s.country,
        device: null,
        views: s.views,
        uniqueSessions: s.uniqueSessions,
        uniqueVisitors: 0,
        reads: 0,
        intents: s.zeroResults,     // repurposed: count of 0-result occurrences
      },
      update: {
        views: s.views,
        uniqueSessions: s.uniqueSessions,
        intents: s.zeroResults,
      },
    });
    upserts++;
  }

  // ── Prune ──
  const rawCutoff = new Date(Date.now() - RAW_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const sessionCutoff = new Date(Date.now() - SESSION_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const deleteEv = await prisma.analyticsEvent.deleteMany({ where: { ts: { lt: rawCutoff } } });
  const deleteSr = await prisma.analyticsSearch.deleteMany({ where: { ts: { lt: rawCutoff } } });
  const deleteSs = await prisma.analyticsSession.deleteMany({ where: { lastSeenAt: { lt: sessionCutoff } } });

  // Refresh trending MV if present
  try {
    await prisma.$executeRawUnsafe(`REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_trending_24h`);
  } catch {
    // MV may not exist in dev — that's fine
  }

  await prisma.cronAuditLog.create({
    data: {
      event: "analytics.rollup",
      detail: `day=${dayKey.toISOString().slice(0,10)}, entityAggs=${entityAggs.length}, searchAggs=${searchAggs.length}, upserts=${upserts}, pruneEv=${deleteEv.count}, pruneSr=${deleteSr.count}, pruneSs=${deleteSs.count}, ms=${Date.now()-startTs}`,
    },
  });

  return NextResponse.json({
    day: dayKey.toISOString().slice(0, 10),
    entityAggs: entityAggs.length,
    searchAggs: searchAggs.length,
    upserts,
    pruned: { events: deleteEv.count, searches: deleteSr.count, sessions: deleteSs.count },
    ms: Date.now() - startTs,
  });
}

export async function GET(req: NextRequest) {
  const authErr = requireCronSecret(req);
  if (authErr) return authErr;

  const [sessions, events, searches, daily, attributions] = await Promise.all([
    prisma.analyticsSession.count(),
    prisma.analyticsEvent.count(),
    prisma.analyticsSearch.count(),
    prisma.analyticsDaily.count(),
    prisma.analyticsAttribution.count(),
  ]);

  return NextResponse.json({
    counts: { sessions, events, searches, daily, attributions },
    nextDayToRoll: bkkDaysAgoMidnight(1).toISOString().slice(0, 10),
  });
}
