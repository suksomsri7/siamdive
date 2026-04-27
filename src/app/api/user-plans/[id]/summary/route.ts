import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/ark-ai/encryption";
import { requireAuth } from "@/lib/apiAuth";

type Ctx = { params: Promise<{ id: string }> };

async function getAiConfig() {
  const config = await prisma.aiConfig.findUnique({ where: { id: "default" } });
  return {
    provider: config?.provider || "anthropic",
    apiKey: config?.apiKeyEncrypted ? decrypt(config.apiKeyEncrypted) : (process.env.ANTHROPIC_API_KEY || ""),
    model: config?.model || "claude-haiku-4-5-20251001",
  };
}

const EVENT_LABELS: Record<string, string> = {
  PAGE_VIEW: "Viewed page", TRIP_VIEW: "Viewed trip", SCHEDULE_VIEW: "Viewed schedule",
  BLOG_VIEW: "Read blog", BLOG_READ_COMPLETE: "Finished reading", SEARCH: "Searched",
  SEARCH_RESULT_CLICK: "Clicked search result", FILTER_APPLY: "Applied filter",
  BOOKING_INTENT_LINE: "Contact via LINE", BOOKING_INTENT_WHATSAPP: "Contact via WhatsApp",
  BOOKING_INTENT_EMAIL: "Contact via Email", BOOKING_INTENT_CALL: "Contact via Phone",
  PLAN_CREATE: "Created plan", PLAN_TRIP_ADD: "Added trip to plan",
  PLAN_TRIP_REMOVE: "Removed trip", PLAN_SHARE: "Shared plan",
  PLAN_INVITE: "Invited member", PLAN_CONTACT: "Contacted via plan",
  CHAT_OPEN: "Opened AI chat", CHAT_MESSAGE: "Chat message",
  CHAT_TRIP_CLICK: "Clicked trip from chat",
  SESSION_START: "Started session",
};

async function fetchProfile(deviceId: string) {
  const vidRows = await prisma.$queryRaw<Array<{ visitorId: string }>>`
    SELECT DISTINCT "visitorId" FROM "AnalyticsEvent"
    WHERE type::text LIKE 'PLAN_%' AND properties->>'deviceId' = ${deviceId}
    ORDER BY "visitorId" LIMIT 3
  `;
  if (vidRows.length === 0) return { linked: false, eventCount: 0 };

  const visitorIds = vidRows.map((r) => r.visitorId);

  const [sessionRow, engagement, topTripsRaw, topBlogsRaw, searches, timelineRaw, totalEvents] = await Promise.all([
    prisma.$queryRaw<Array<{
      device: string | null; os: string | null; browser: string | null;
      country: string | null; city: string | null; lang: string | null;
      firstReferrer: string | null; firstUtmSource: string | null;
      firstUtmMedium: string | null; firstLandingPath: string | null;
    }>>`
      SELECT device, os, browser, country, city, lang,
             "firstReferrer", "firstUtmSource", "firstUtmMedium", "firstLandingPath"
      FROM "AnalyticsSession"
      WHERE "visitorId" = ANY(${visitorIds}) AND "isBot" = FALSE
      ORDER BY "startedAt" DESC LIMIT 1
    `,
    prisma.$queryRaw<Array<{
      totalSessions: number; totalEvents: number;
      firstSeenAt: Date; lastSeenAt: Date; totalDaysActive: number;
    }>>`
      SELECT COUNT(DISTINCT id)::int AS "totalSessions",
             COALESCE(SUM("eventCount"), 0)::int AS "totalEvents",
             MIN("startedAt") AS "firstSeenAt", MAX("lastSeenAt") AS "lastSeenAt",
             COUNT(DISTINCT DATE("startedAt" AT TIME ZONE 'Asia/Bangkok'))::int AS "totalDaysActive"
      FROM "AnalyticsSession"
      WHERE "visitorId" = ANY(${visitorIds}) AND "isBot" = FALSE
    `,
    prisma.$queryRaw<Array<{ entityId: string; viewCount: number }>>`
      SELECT "entityId", COUNT(*)::int AS "viewCount" FROM "AnalyticsEvent"
      WHERE "visitorId" = ANY(${visitorIds}) AND type IN ('TRIP_VIEW', 'SCHEDULE_VIEW')
        AND "entityType" = 'BOAT' AND "entityId" IS NOT NULL
      GROUP BY "entityId" ORDER BY "viewCount" DESC LIMIT 5
    `,
    prisma.$queryRaw<Array<{ entityId: string; viewCount: number }>>`
      SELECT "entityId", COUNT(*)::int AS "viewCount" FROM "AnalyticsEvent"
      WHERE "visitorId" = ANY(${visitorIds}) AND type IN ('BLOG_VIEW', 'BLOG_READ_COMPLETE')
        AND "entityType" = 'BLOG' AND "entityId" IS NOT NULL
      GROUP BY "entityId" ORDER BY "viewCount" DESC LIMIT 3
    `,
    prisma.$queryRaw<Array<{ query: string; resultsCount: number; ts: Date }>>`
      SELECT "queryRaw" AS query, "resultsCount"::int, ts FROM "AnalyticsSearch"
      WHERE "visitorId" = ANY(${visitorIds}) ORDER BY ts DESC LIMIT 10
    `,
    prisma.$queryRaw<Array<{ ts: Date; type: string; path: string | null }>>`
      SELECT ts, type::text, path FROM "AnalyticsEvent"
      WHERE "visitorId" = ANY(${visitorIds}) ORDER BY ts DESC LIMIT 30
    `,
    prisma.analyticsEvent.count({ where: { visitorId: { in: visitorIds } } }),
  ]);

  const boatIds = topTripsRaw.map((r) => r.entityId);
  const blogIds = topBlogsRaw.map((r) => r.entityId);

  const [boats, blogs] = await Promise.all([
    boatIds.length > 0
      ? prisma.boat.findMany({ where: { id: { in: boatIds } }, select: { id: true, name: true, translations: { where: { lang: "en" }, select: { title: true } } } })
      : [],
    blogIds.length > 0
      ? prisma.blog.findMany({ where: { id: { in: blogIds } }, select: { id: true, translations: { where: { lang: "en" }, select: { title: true } } } })
      : [],
  ]);

  const boatMap = new Map(boats.map((b) => [b.id, b.translations[0]?.title || b.name]));
  const blogMap = new Map(blogs.map((b) => [b.id, b.translations[0]?.title || b.id]));

  const s = sessionRow[0] || null;
  const eng = engagement[0] || null;

  return {
    linked: true,
    eventCount: totalEvents,
    visitor: s ? { device: s.device, os: s.os, country: s.country, city: s.city, lang: s.lang } : null,
    acquisition: s ? { firstReferrer: s.firstReferrer, firstUtmSource: s.firstUtmSource, firstUtmMedium: s.firstUtmMedium, firstLandingPath: s.firstLandingPath } : null,
    engagement: eng ? {
      totalSessions: eng.totalSessions, totalEvents: eng.totalEvents,
      firstSeenAt: eng.firstSeenAt?.toISOString() || null, lastSeenAt: eng.lastSeenAt?.toISOString() || null,
      totalDaysActive: eng.totalDaysActive,
    } : null,
    interests: {
      topTrips: topTripsRaw.map((r) => ({ title: boatMap.get(r.entityId) || r.entityId, viewCount: r.viewCount })),
      topBlogs: topBlogsRaw.map((r) => ({ title: blogMap.get(r.entityId) || r.entityId, viewCount: r.viewCount })),
      searches: searches.map((s) => ({ query: s.query })),
    },
    timeline: timelineRaw.map((e) => ({ ts: e.ts.toISOString(), label: EVENT_LABELS[e.type] || e.type, path: e.path })),
  };
}

export async function GET(req: NextRequest, ctx: Ctx) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const refresh = req.nextUrl.searchParams.get("refresh") === "1";

  try {
    const plan = await prisma.userPlan.findFirst({
      where: { OR: [{ id }, { shortId: id }] },
      include: {
        user: { select: { deviceId: true, email: true, name: true } },
        members: { select: { email: true, name: true, certLevel: true } },
      },
    });
    if (!plan) return NextResponse.json({ error: "plan_not_found" }, { status: 404 });

    const profile = await fetchProfile(plan.user.deviceId);

    if (!refresh) {
      const cached = await prisma.planAiSummary.findUnique({ where: { planId: plan.id } });
      if (cached && cached.eventCount === profile.eventCount) {
        return NextResponse.json({ summary: cached.summary, generatedAt: cached.generatedAt.toISOString(), cached: true });
      }
    }

    const trips = Array.isArray(plan.trips) ? plan.trips as Array<{ title?: string; type?: string; area?: string; schedule?: { departureDate?: string; packages?: Array<{ name?: string; minPrice?: number; qty?: number }> } }> : [];

    const prompt = buildPrompt({
      planName: plan.name, status: plan.status,
      owner: { email: plan.user.email, name: plan.user.name },
      members: plan.members, trips, profile,
    });

    const aiConfig = await getAiConfig();
    if (!aiConfig.apiKey) return NextResponse.json({ error: "ai_not_configured" }, { status: 500 });

    let summary = "";

    if (aiConfig.provider === "anthropic") {
      const client = new Anthropic({ apiKey: aiConfig.apiKey });
      const msg = await client.messages.create({
        model: aiConfig.model, max_tokens: 1024, temperature: 0.3,
        messages: [{ role: "user", content: prompt }],
      });
      summary = msg.content[0].type === "text" ? msg.content[0].text : "";
    } else {
      const baseURL = aiConfig.provider === "openrouter"
        ? "https://openrouter.ai/api/v1"
        : aiConfig.provider === "openai"
          ? "https://api.openai.com/v1"
          : undefined;
      const client = new OpenAI({ apiKey: aiConfig.apiKey, baseURL });
      const res = await client.chat.completions.create({
        model: aiConfig.model, max_tokens: 1024, temperature: 0.3,
        messages: [{ role: "user", content: prompt }],
      });
      summary = res.choices[0]?.message?.content || "";
    }

    await prisma.planAiSummary.upsert({
      where: { planId: plan.id },
      create: { planId: plan.id, summary, eventCount: profile.eventCount },
      update: { summary, eventCount: profile.eventCount, generatedAt: new Date() },
    });

    return NextResponse.json({ summary, generatedAt: new Date().toISOString(), cached: false });
  } catch (err) {
    console.error("[summary]", err);
    return NextResponse.json({ error: "ai_generation_failed" }, { status: 500 });
  }
}

function buildPrompt(data: {
  planName: string;
  status: string;
  owner: { email: string | null; name: string | null };
  members: Array<{ email: string; name: string | null; certLevel: string | null }>;
  trips: Array<{ title?: string; type?: string; area?: string; schedule?: { departureDate?: string; packages?: Array<{ name?: string; minPrice?: number; qty?: number }> } }>;
  profile: {
    linked: boolean;
    visitor?: { device?: string | null; os?: string | null; country?: string | null; city?: string | null; lang?: string | null } | null;
    acquisition?: { firstReferrer?: string | null; firstUtmSource?: string | null; firstUtmMedium?: string | null; firstLandingPath?: string | null } | null;
    engagement?: { totalSessions?: number; totalEvents?: number; firstSeenAt?: string | null; lastSeenAt?: string | null; totalDaysActive?: number } | null;
    interests?: { topTrips?: Array<{ title: string; viewCount: number }>; topBlogs?: Array<{ title: string; viewCount: number }>; searches?: Array<{ query: string }> } | null;
    timeline?: Array<{ ts: string; label: string }>;
  };
}): string {
  const { planName, status, owner, members, trips, profile } = data;

  const parts: string[] = [];
  parts.push(`# Customer Data for Plan "${planName}" (${status})`);
  parts.push(`\n## Owner\n- Email: ${owner.email || "ไม่มี"}\n- Name: ${owner.name || "ไม่มี"}`);

  if (members.length > 0) {
    parts.push(`\n## Members (${members.length})`);
    members.forEach((m) => parts.push(`- ${m.email}${m.name ? ` (${m.name})` : ""}${m.certLevel ? ` — cert: ${m.certLevel}` : ""}`));
  }

  if (trips.length > 0) {
    parts.push(`\n## Trips in Plan (${trips.length})`);
    trips.forEach((t) => {
      const pkgs = t.schedule?.packages?.map((p) => `${p.name} ฿${p.minPrice}${p.qty && p.qty > 1 ? ` x${p.qty}` : ""}`).join(", ");
      parts.push(`- ${t.title || "Untitled"} (${t.type || "?"}, ${t.area || "?"})${t.schedule?.departureDate ? ` — ${t.schedule.departureDate}` : ""}${pkgs ? ` [${pkgs}]` : ""}`);
    });
  }

  if (profile.linked) {
    if (profile.visitor) {
      parts.push(`\n## Visitor\n- Device: ${profile.visitor.device || "?"} / ${profile.visitor.os || "?"}\n- Location: ${profile.visitor.city || "?"}, ${profile.visitor.country || "?"}\n- Language: ${profile.visitor.lang || "?"}`);
    }
    if (profile.acquisition) {
      parts.push(`\n## Acquisition\n- Referrer: ${profile.acquisition.firstReferrer || "direct"}\n- UTM: ${profile.acquisition.firstUtmSource || "-"} / ${profile.acquisition.firstUtmMedium || "-"}\n- Landing: ${profile.acquisition.firstLandingPath || "-"}`);
    }
    if (profile.engagement) {
      parts.push(`\n## Engagement\n- Sessions: ${profile.engagement.totalSessions}, Events: ${profile.engagement.totalEvents}, Days Active: ${profile.engagement.totalDaysActive}\n- First seen: ${profile.engagement.firstSeenAt || "-"}, Last seen: ${profile.engagement.lastSeenAt || "-"}`);
    }
    if (profile.interests) {
      if (profile.interests.topTrips?.length) {
        parts.push(`\n## Top Trips Viewed`);
        profile.interests.topTrips.forEach((t) => parts.push(`- ${t.title} (${t.viewCount}x)`));
      }
      if (profile.interests.topBlogs?.length) {
        parts.push(`\n## Blogs Read`);
        profile.interests.topBlogs.forEach((b) => parts.push(`- ${b.title} (${b.viewCount}x)`));
      }
      if (profile.interests.searches?.length) {
        parts.push(`\n## Search History`);
        profile.interests.searches.forEach((s) => parts.push(`- "${s.query}"`));
      }
    }
    if (profile.timeline?.length) {
      parts.push(`\n## Recent Activity (last ${profile.timeline.length} events)`);
      profile.timeline.slice(0, 15).forEach((e) => parts.push(`- ${e.ts}: ${e.label}`));
    }
  } else {
    parts.push(`\n## Behavior Data\nNo analytics data linked to this user yet.`);
  }

  parts.push(`\n---\nจากข้อมูลทั้งหมด ให้สรุปเป็นภาษาไทยสำหรับ admin ที่จะตอบลูกค้า โดยมี 4 ส่วน:

1. **สรุปลูกค้า** (1-2 ประโยค) — ลูกค้าเป็นใคร สนใจอะไร ระดับประสบการณ์
2. **ความสนใจหลัก** — ทริปที่สนใจมากสุด พื้นที่ไหน ช่วงเวลาไหน งบประมาณคร่าวๆ
3. **ระดับความพร้อมจอง** — วิเคราะห์ว่าลูกค้าพร้อมจองแค่ไหน (ดูจากจำนวน session, เวลาที่ใช้, การเปรียบเทียบทริป)
4. **แนะนำ action สำหรับ admin** — ควรตอบอะไร แนะนำอะไร เสนอ promotion อะไร

เขียนกระชับ อ่านแล้วเข้าใจใน 30 วินาที ห้ามยาวเกิน 300 คำ`);

  return parts.join("\n");
}
