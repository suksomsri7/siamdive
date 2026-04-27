import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/ark-ai/encryption";
import { requireAuth } from "@/lib/apiAuth";

type Ctx = { params: Promise<{ id: string }> };

async function getAiKey() {
  const config = await prisma.aiConfig.findUnique({ where: { id: "default" } });
  return config?.apiKeyEncrypted ? decrypt(config.apiKeyEncrypted) : (process.env.ANTHROPIC_API_KEY || "");
}

export async function GET(req: NextRequest, ctx: Ctx) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const refresh = req.nextUrl.searchParams.get("refresh") === "1";

  const plan = await prisma.userPlan.findFirst({
    where: { OR: [{ id }, { shortId: id }] },
    include: {
      user: { select: { deviceId: true, email: true, name: true } },
      members: { select: { email: true, name: true, certLevel: true } },
    },
  });
  if (!plan) return NextResponse.json({ error: "plan_not_found" }, { status: 404 });

  const deviceId = plan.user.deviceId;

  const currentEventCount = await prisma.analyticsEvent.count({
    where: {
      visitorId: {
        in: (await prisma.$queryRaw<Array<{ visitorId: string }>>`
          SELECT DISTINCT "visitorId" FROM "AnalyticsEvent"
          WHERE type::text LIKE 'PLAN_%' AND properties->>'deviceId' = ${deviceId}
          LIMIT 3
        `).map((r) => r.visitorId),
      },
    },
  });

  if (!refresh) {
    const cached = await prisma.planAiSummary.findUnique({ where: { planId: plan.id } });
    if (cached && cached.eventCount === currentEventCount) {
      return NextResponse.json({ summary: cached.summary, generatedAt: cached.generatedAt.toISOString(), cached: true });
    }
  }

  const profileRes = await fetch(new URL(`/api/user-plans/${plan.id}/profile`, req.url), {
    headers: { cookie: req.headers.get("cookie") || "", authorization: req.headers.get("authorization") || "" },
  });
  if (!profileRes.ok) return NextResponse.json({ error: "profile_fetch_failed" }, { status: 500 });
  const profile = await profileRes.json();

  const trips = Array.isArray(plan.trips) ? plan.trips as Array<{ title?: string; type?: string; area?: string; schedule?: { departureDate?: string; packages?: Array<{ name?: string; minPrice?: number; qty?: number }> } }> : [];

  const prompt = buildPrompt({
    planName: plan.name,
    status: plan.status,
    owner: { email: plan.user.email, name: plan.user.name },
    members: plan.members,
    trips,
    profile,
  });

  try {
    const apiKey = await getAiKey();
    if (!apiKey) return NextResponse.json({ error: "ai_not_configured" }, { status: 500 });

    const client = new Anthropic({ apiKey });
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      temperature: 0.3,
      messages: [{ role: "user", content: prompt }],
    });

    const summary = msg.content[0].type === "text" ? msg.content[0].text : "";

    await prisma.planAiSummary.upsert({
      where: { planId: plan.id },
      create: { planId: plan.id, summary, eventCount: currentEventCount },
      update: { summary, eventCount: currentEventCount, generatedAt: new Date() },
    });

    return NextResponse.json({ summary, generatedAt: new Date().toISOString(), cached: false });
  } catch {
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
    visitor?: { device?: string; os?: string; country?: string; city?: string; lang?: string } | null;
    acquisition?: { firstReferrer?: string; firstUtmSource?: string; firstUtmMedium?: string; firstLandingPath?: string } | null;
    engagement?: { totalSessions?: number; totalEvents?: number; firstSeenAt?: string; lastSeenAt?: string; totalDaysActive?: number } | null;
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
  }

  parts.push(`\n---\nจากข้อมูลทั้งหมด ให้สรุปเป็นภาษาไทยสำหรับ admin ที่จะตอบลูกค้า โดยมี 4 ส่วน:

1. **สรุปลูกค้า** (1-2 ประโยค) — ลูกค้าเป็นใคร สนใจอะไร ระดับประสบการณ์
2. **ความสนใจหลัก** — ทริปที่สนใจมากสุด พื้นที่ไหน ช่วงเวลาไหน งบประมาณคร่าวๆ
3. **ระดับความพร้อมจอง** — วิเคราะห์ว่าลูกค้าพร้อมจองแค่ไหน (ดูจากจำนวน session, เวลาที่ใช้, การเปรียบเทียบทริป)
4. **แนะนำ action สำหรับ admin** — ควรตอบอะไร แนะนำอะไร เสนอ promotion อะไร

เขียนกระชับ อ่านแล้วเข้าใจใน 30 วินาที ห้ามยาวเกิน 300 คำ`);

  return parts.join("\n");
}
