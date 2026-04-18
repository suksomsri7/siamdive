import { prisma } from "@/lib/prisma";

// Shared query helpers used by /api/analytics/* routes.
// Keep queries raw-SQL where it's cleaner; Prisma findMany where not.

const DAYS = {
  "7d":  7,
  "30d": 30,
  "90d": 90,
} as const;
export type RangeKey = keyof typeof DAYS;

function rangeStart(range: RangeKey): Date {
  return new Date(Date.now() - DAYS[range] * 24 * 60 * 60 * 1000);
}

export async function topTrips(range: RangeKey, limit = 10) {
  const start = rangeStart(range);
  const rows = await prisma.$queryRaw<Array<{
    entityId: string;
    views: number;
    uniqueVisitors: number;
    uniqueSessions: number;
    intents: number;
  }>>`
    SELECT
      e."entityId",
      COUNT(*)::int AS views,
      COUNT(DISTINCT e."visitorId")::int AS "uniqueVisitors",
      COUNT(DISTINCT e."sessionId")::int AS "uniqueSessions",
      COUNT(*) FILTER (WHERE e.type LIKE 'BOOKING_INTENT_%')::int AS intents
    FROM "AnalyticsEvent" e
    JOIN "AnalyticsSession" s ON s.id = e."sessionId"
    WHERE e.ts >= ${start}
      AND s."isBot" = FALSE
      AND e."entityType" = 'BOAT'
      AND e."entityId" IS NOT NULL
    GROUP BY e."entityId"
    ORDER BY views DESC
    LIMIT ${limit}
  `;

  if (rows.length === 0) return [];

  const boats = await prisma.boat.findMany({
    where: { id: { in: rows.map((r) => r.entityId) } },
    select: {
      id: true, name: true, type: true, covers: true,
      translations: { where: { lang: "en" }, select: { title: true, slug: true } },
    },
  });
  const bMap = new Map(boats.map((b) => [b.id, b]));

  return rows.map((r) => ({
    ...r,
    boat: bMap.get(r.entityId) ?? null,
  }));
}

export async function topBlogs(range: RangeKey, limit = 10) {
  const start = rangeStart(range);
  const rows = await prisma.$queryRaw<Array<{
    entityId: string;
    views: number;
    reads: number;
    avgDwellMs: number | null;
    uniqueVisitors: number;
  }>>`
    SELECT
      e."entityId",
      COUNT(*) FILTER (WHERE e.type = 'BLOG_VIEW')::int AS views,
      COUNT(*) FILTER (WHERE e.type = 'BLOG_READ_COMPLETE')::int AS reads,
      NULLIF(AVG(e."dwellMs") FILTER (WHERE e.type = 'BLOG_READ_COMPLETE')::int, 0) AS "avgDwellMs",
      COUNT(DISTINCT e."visitorId")::int AS "uniqueVisitors"
    FROM "AnalyticsEvent" e
    JOIN "AnalyticsSession" s ON s.id = e."sessionId"
    WHERE e.ts >= ${start}
      AND s."isBot" = FALSE
      AND e."entityType" = 'BLOG'
      AND e."entityId" IS NOT NULL
    GROUP BY e."entityId"
    HAVING COUNT(*) FILTER (WHERE e.type = 'BLOG_VIEW') > 0
    ORDER BY reads DESC, views DESC
    LIMIT ${limit}
  `;

  if (rows.length === 0) return [];

  const blogs = await prisma.blog.findMany({
    where: { id: { in: rows.map((r) => r.entityId) } },
    select: {
      id: true, covers: true,
      translations: { where: { lang: "en" }, select: { slug: true, title: true } },
    },
  });
  const bMap = new Map(blogs.map((b) => [b.id, b]));

  return rows.map((r) => ({ ...r, blog: bMap.get(r.entityId) ?? null }));
}

export async function searchInsights(range: RangeKey) {
  const start = rangeStart(range);

  const top = await prisma.$queryRaw<Array<{
    queryNorm: string;
    count: number;
    uniqueSessions: number;
    avgResultsCount: number | null;
  }>>`
    SELECT
      "queryNorm",
      COUNT(*)::int AS count,
      COUNT(DISTINCT "sessionId")::int AS "uniqueSessions",
      AVG("resultsCount")::int AS "avgResultsCount"
    FROM "AnalyticsSearch"
    WHERE ts >= ${start} AND "queryNorm" != ''
    GROUP BY "queryNorm"
    ORDER BY count DESC
    LIMIT 30
  `;

  const zeroResult = await prisma.$queryRaw<Array<{
    queryNorm: string;
    count: number;
  }>>`
    SELECT "queryNorm", COUNT(*)::int AS count
    FROM "AnalyticsSearch"
    WHERE ts >= ${start} AND "resultsCount" = 0 AND "queryNorm" != ''
    GROUP BY "queryNorm"
    ORDER BY count DESC
    LIMIT 30
  `;

  const totals = await prisma.$queryRaw<Array<{ total: number; zero: number }>>`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE "resultsCount" = 0)::int AS zero
    FROM "AnalyticsSearch"
    WHERE ts >= ${start}
  `;

  return { top, zeroResult, totals: totals[0] ?? { total: 0, zero: 0 } };
}

export async function countryHeatmap(range: RangeKey) {
  const start = rangeStart(range);
  return prisma.$queryRaw<Array<{
    country: string | null;
    entityType: string;
    views: number;
    uniqueSessions: number;
    intents: number;
  }>>`
    SELECT
      s.country,
      COALESCE(e."entityType", 'PATH') AS "entityType",
      COUNT(*)::int AS views,
      COUNT(DISTINCT e."sessionId")::int AS "uniqueSessions",
      COUNT(*) FILTER (WHERE e.type LIKE 'BOOKING_INTENT_%')::int AS intents
    FROM "AnalyticsEvent" e
    JOIN "AnalyticsSession" s ON s.id = e."sessionId"
    WHERE e.ts >= ${start} AND s."isBot" = FALSE
    GROUP BY s.country, e."entityType"
    ORDER BY views DESC
  `;
}

export async function funnel(range: RangeKey) {
  const start = rangeStart(range);

  const rows = await prisma.$queryRaw<Array<{
    sessions: number;
    sessionsWithTripView: number;
    sessionsWithIntent: number;
  }>>`
    SELECT
      COUNT(DISTINCT s.id)::int AS sessions,
      COUNT(DISTINCT s.id) FILTER (WHERE e.type = 'TRIP_VIEW')::int AS "sessionsWithTripView",
      COUNT(DISTINCT s.id) FILTER (WHERE e.type LIKE 'BOOKING_INTENT_%')::int AS "sessionsWithIntent"
    FROM "AnalyticsSession" s
    LEFT JOIN "AnalyticsEvent" e ON e."sessionId" = s.id
    WHERE s."startedAt" >= ${start} AND s."isBot" = FALSE
  `;

  const r = rows[0] ?? { sessions: 0, sessionsWithTripView: 0, sessionsWithIntent: 0 };
  return {
    sessions: r.sessions,
    viewed:   r.sessionsWithTripView,
    intent:   r.sessionsWithIntent,
    viewRate:   r.sessions ? +(r.sessionsWithTripView / r.sessions * 100).toFixed(1) : 0,
    intentRate: r.sessionsWithTripView ? +(r.sessionsWithIntent / r.sessionsWithTripView * 100).toFixed(1) : 0,
  };
}

export async function utmRoi(range: RangeKey) {
  const start = rangeStart(range);
  return prisma.$queryRaw<Array<{
    source: string | null;
    medium: string | null;
    campaign: string | null;
    sessions: number;
    intents: number;
    intentRate: number;
  }>>`
    SELECT
      s."firstUtmSource"   AS source,
      s."firstUtmMedium"   AS medium,
      s."firstUtmCampaign" AS campaign,
      COUNT(DISTINCT s.id)::int AS sessions,
      COUNT(a.id)::int AS intents,
      ROUND((COUNT(a.id)::numeric / NULLIF(COUNT(DISTINCT s.id), 0)) * 100, 1)::float AS "intentRate"
    FROM "AnalyticsSession" s
    LEFT JOIN "AnalyticsAttribution" a ON a."sessionId" = s.id
    WHERE s."startedAt" >= ${start} AND s."isBot" = FALSE
    GROUP BY s."firstUtmSource", s."firstUtmMedium", s."firstUtmCampaign"
    ORDER BY sessions DESC
    LIMIT 50
  `;
}

export async function trendingNow(limit = 10) {
  try {
    return await prisma.$queryRaw<Array<{
      entityType: string;
      entityId: string;
      views: number;
      sessions: number;
      last_ts: Date;
    }>>`
      SELECT * FROM analytics_trending_24h
      ORDER BY views DESC
      LIMIT ${limit}
    `;
  } catch {
    return [];
  }
}

export async function hourlyPattern(range: RangeKey) {
  const start = rangeStart(range);
  return prisma.$queryRaw<Array<{
    dow: number;
    hour: number;
    sessions: number;
    searches: number;
  }>>`
    SELECT
      EXTRACT(DOW  FROM s."startedAt" AT TIME ZONE 'Asia/Bangkok')::int AS dow,
      EXTRACT(HOUR FROM s."startedAt" AT TIME ZONE 'Asia/Bangkok')::int AS hour,
      COUNT(DISTINCT s.id)::int AS sessions,
      (SELECT COUNT(*)::int FROM "AnalyticsSearch" sr
        WHERE EXTRACT(DOW  FROM sr.ts AT TIME ZONE 'Asia/Bangkok') =
              EXTRACT(DOW  FROM s."startedAt" AT TIME ZONE 'Asia/Bangkok')
          AND EXTRACT(HOUR FROM sr.ts AT TIME ZONE 'Asia/Bangkok') =
              EXTRACT(HOUR FROM s."startedAt" AT TIME ZONE 'Asia/Bangkok')
          AND sr.ts >= ${start}) AS searches
    FROM "AnalyticsSession" s
    WHERE s."startedAt" >= ${start} AND s."isBot" = FALSE
    GROUP BY dow, hour
    ORDER BY dow, hour
  `;
}

export async function overview(range: RangeKey) {
  const start = rangeStart(range);

  const [sessions, visitors, events, intents, returning] = await Promise.all([
    prisma.analyticsSession.count({ where: { startedAt: { gte: start }, isBot: false } }),
    prisma.$queryRaw<Array<{ c: number }>>`
      SELECT COUNT(DISTINCT "visitorId")::int AS c
      FROM "AnalyticsSession"
      WHERE "startedAt" >= ${start} AND "isBot" = FALSE
    `,
    prisma.analyticsEvent.count({ where: { ts: { gte: start } } }),
    prisma.analyticsAttribution.count({ where: { ts: { gte: start } } }),
    prisma.$queryRaw<Array<{ c: number }>>`
      SELECT COUNT(*)::int AS c FROM (
        SELECT "visitorId" FROM "AnalyticsSession"
        WHERE "startedAt" >= ${start} AND "isBot" = FALSE
        GROUP BY "visitorId" HAVING COUNT(*) > 1
      ) t
    `,
  ]);

  return {
    sessions,
    visitors: visitors[0]?.c ?? 0,
    events,
    intents,
    returningVisitors: returning[0]?.c ?? 0,
    returningRate: visitors[0]?.c ? +((returning[0]?.c ?? 0) / visitors[0].c * 100).toFixed(1) : 0,
  };
}
