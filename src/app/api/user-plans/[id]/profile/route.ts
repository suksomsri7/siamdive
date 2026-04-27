import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/apiAuth";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;

  try {
    const plan = await prisma.userPlan.findFirst({
      where: { OR: [{ id }, { shortId: id }] },
      include: { user: { select: { deviceId: true } } },
    });
    if (!plan) return NextResponse.json({ error: "plan_not_found" }, { status: 404 });

    const deviceId = plan.user.deviceId;

    const vidRows = await prisma.$queryRaw<Array<{ visitorId: string }>>`
      SELECT DISTINCT "visitorId"
      FROM "AnalyticsEvent"
      WHERE type::text LIKE 'PLAN_%'
        AND properties->>'deviceId' = ${deviceId}
      ORDER BY "visitorId"
      LIMIT 3
    `;

    if (vidRows.length === 0) {
      return NextResponse.json({ linked: false, visitor: null, acquisition: null, engagement: null, interests: null, timeline: [] });
    }

    const visitorIds = vidRows.map((r) => r.visitorId);

    const [sessionRow, engagement, topTripsRaw, topBlogsRaw, searches, timelineRaw] = await Promise.all([
      prisma.$queryRaw<Array<{
        id: string; device: string | null; os: string | null; browser: string | null;
        country: string | null; city: string | null; lang: string | null;
        firstReferrer: string | null; firstUtmSource: string | null; firstUtmMedium: string | null;
        firstUtmCampaign: string | null; firstLandingPath: string | null;
      }>>`
        SELECT id, device, os, browser, country, city, lang,
               "firstReferrer", "firstUtmSource", "firstUtmMedium", "firstUtmCampaign", "firstLandingPath"
        FROM "AnalyticsSession"
        WHERE "visitorId" = ANY(${visitorIds}) AND "isBot" = FALSE
        ORDER BY "startedAt" DESC
        LIMIT 1
      `,

      prisma.$queryRaw<Array<{
        totalSessions: number; totalEvents: number;
        firstSeenAt: Date; lastSeenAt: Date; totalDaysActive: number;
      }>>`
        SELECT
          COUNT(DISTINCT id)::int AS "totalSessions",
          COALESCE(SUM("eventCount"), 0)::int AS "totalEvents",
          MIN("startedAt") AS "firstSeenAt",
          MAX("lastSeenAt") AS "lastSeenAt",
          COUNT(DISTINCT DATE("startedAt" AT TIME ZONE 'Asia/Bangkok'))::int AS "totalDaysActive"
        FROM "AnalyticsSession"
        WHERE "visitorId" = ANY(${visitorIds}) AND "isBot" = FALSE
      `,

      prisma.$queryRaw<Array<{ entityId: string; viewCount: number }>>`
        SELECT "entityId", COUNT(*)::int AS "viewCount"
        FROM "AnalyticsEvent"
        WHERE "visitorId" = ANY(${visitorIds})
          AND type IN ('TRIP_VIEW', 'SCHEDULE_VIEW')
          AND "entityType" = 'BOAT' AND "entityId" IS NOT NULL
        GROUP BY "entityId"
        ORDER BY "viewCount" DESC
        LIMIT 5
      `,

      prisma.$queryRaw<Array<{ entityId: string; viewCount: number }>>`
        SELECT "entityId", COUNT(*)::int AS "viewCount"
        FROM "AnalyticsEvent"
        WHERE "visitorId" = ANY(${visitorIds})
          AND type IN ('BLOG_VIEW', 'BLOG_READ_COMPLETE')
          AND "entityType" = 'BLOG' AND "entityId" IS NOT NULL
        GROUP BY "entityId"
        ORDER BY "viewCount" DESC
        LIMIT 3
      `,

      prisma.$queryRaw<Array<{ query: string; resultsCount: number; ts: Date }>>`
        SELECT "queryRaw" AS query, "resultsCount"::int, ts
        FROM "AnalyticsSearch"
        WHERE "visitorId" = ANY(${visitorIds})
        ORDER BY ts DESC
        LIMIT 10
      `,

      prisma.$queryRaw<Array<{ ts: Date; type: string; path: string | null; entityType: string | null; entityId: string | null }>>`
        SELECT ts, type::text, path, "entityType", "entityId"
        FROM "AnalyticsEvent"
        WHERE "visitorId" = ANY(${visitorIds})
        ORDER BY ts DESC
        LIMIT 30
      `,
    ]);

    const boatIds = topTripsRaw.map((r) => r.entityId);
    const blogIds = topBlogsRaw.map((r) => r.entityId);

    const [boats, blogs] = await Promise.all([
      boatIds.length > 0
        ? prisma.boat.findMany({
            where: { id: { in: boatIds } },
            select: { id: true, name: true, translations: { where: { lang: "en" }, select: { title: true } } },
          })
        : [],
      blogIds.length > 0
        ? prisma.blog.findMany({
            where: { id: { in: blogIds } },
            select: { id: true, translations: { where: { lang: "en" }, select: { title: true } } },
          })
        : [],
    ]);

    const boatMap = new Map(boats.map((b) => [b.id, b.translations[0]?.title || b.name]));
    const blogMap = new Map(blogs.map((b) => [b.id, b.translations[0]?.title || b.id]));

    const topTrips = topTripsRaw.map((r) => ({ boatId: r.entityId, title: boatMap.get(r.entityId) || r.entityId, viewCount: r.viewCount }));
    const topBlogs = topBlogsRaw.map((r) => ({ blogId: r.entityId, title: blogMap.get(r.entityId) || r.entityId, viewCount: r.viewCount }));

    const EVENT_LABELS: Record<string, string> = {
      PAGE_VIEW: "Viewed page", TRIP_VIEW: "Viewed trip", SCHEDULE_VIEW: "Viewed schedule",
      BLOG_VIEW: "Read blog", BLOG_READ_COMPLETE: "Finished reading", SEARCH: "Searched",
      SEARCH_RESULT_CLICK: "Clicked search result", FILTER_APPLY: "Applied filter",
      BOOKING_INTENT_LINE: "Contact via LINE", BOOKING_INTENT_WHATSAPP: "Contact via WhatsApp",
      BOOKING_INTENT_EMAIL: "Contact via Email", BOOKING_INTENT_CALL: "Contact via Phone",
      BOOKING_INTENT_MESSENGER: "Contact via Messenger", BOOKING_INTENT_WECHAT: "Contact via WeChat",
      BOOKING_INTENT_KAKAO: "Contact via KakaoTalk",
      PLAN_CREATE: "Created plan", PLAN_TRIP_ADD: "Added trip to plan",
      PLAN_TRIP_REMOVE: "Removed trip", PLAN_SHARE: "Shared plan",
      PLAN_INVITE: "Invited member", PLAN_CONTACT: "Contacted via plan",
      PLAN_EMAIL_LINK: "Linked email", PLAN_VIEW: "Viewed plan",
      CHAT_OPEN: "Opened AI chat", CHAT_MESSAGE: "Chat message",
      CHAT_TRIP_CLICK: "Clicked trip from chat",
      CHAT_ITINERARY_SAVE: "Saved itinerary", CHAT_ITINERARY_SHARE: "Shared itinerary",
      SESSION_START: "Started session", SESSION_END: "Ended session",
      ROW_CLICK: "Clicked row item", LANGUAGE_SWITCH: "Switched language",
    };

    const timeline = timelineRaw.map((e) => ({
      ts: e.ts.toISOString(),
      type: e.type,
      label: EVENT_LABELS[e.type] || e.type,
      path: e.path || undefined,
      entityType: e.entityType || undefined,
      entityId: e.entityId || undefined,
    }));

    const s = sessionRow[0] || null;
    const eng = engagement[0] || null;

    return NextResponse.json({
      linked: true,
      visitor: s ? { id: s.id, device: s.device, os: s.os, browser: s.browser, country: s.country, city: s.city, lang: s.lang } : null,
      acquisition: s ? { firstReferrer: s.firstReferrer, firstUtmSource: s.firstUtmSource, firstUtmMedium: s.firstUtmMedium, firstUtmCampaign: s.firstUtmCampaign, firstLandingPath: s.firstLandingPath } : null,
      engagement: eng ? {
        totalSessions: eng.totalSessions, totalEvents: eng.totalEvents,
        firstSeenAt: eng.firstSeenAt?.toISOString() || null, lastSeenAt: eng.lastSeenAt?.toISOString() || null,
        totalDaysActive: eng.totalDaysActive,
      } : null,
      interests: { topTrips, topBlogs, searches: searches.map((s) => ({ query: s.query, resultsCount: s.resultsCount, ts: s.ts.toISOString() })) },
      timeline,
    });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
