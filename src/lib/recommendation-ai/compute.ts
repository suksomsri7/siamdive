import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/ark-ai/encryption";
import OpenAI from "openai";

type VisitorProfile = {
  visitorId: string;
  userId?: string;
  viewedBoatIds: string[];
  viewedTypes: { type: string; count: number }[];
  viewedAreas: string[];
  searches: string[];
  planTrips: string[];
  removedTrips: string[];
  bookingIntents: string[];
  totalActivity: number;
};

type AiRecommendation = {
  boatId: string;
  scheduleId?: string;
  reason: string;
};

export async function buildVisitorProfile(visitorId: string): Promise<VisitorProfile> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const events = await prisma.$queryRaw<
    Array<{ type: string; entityId: string | null; entityType: string | null }>
  >`
    SELECT e.type::text, e."entityId", e."entityType"::text
    FROM "AnalyticsEvent" e
    JOIN "AnalyticsSession" s ON s.id = e."sessionId"
    WHERE e."visitorId" = ${visitorId}
      AND e.ts >= ${thirtyDaysAgo}
      AND s."isBot" = FALSE
    ORDER BY e.ts DESC
    LIMIT 500
  `;

  const viewedBoatIds: string[] = [];
  const typeCounts = new Map<string, number>();
  const searches: string[] = [];
  const planTrips: string[] = [];
  const removedTrips: string[] = [];
  const bookingIntents: string[] = [];

  for (const e of events) {
    if (e.type === "TRIP_VIEW" && e.entityType === "BOAT" && e.entityId) {
      if (!viewedBoatIds.includes(e.entityId)) viewedBoatIds.push(e.entityId);
    }
    if (e.type === "PLAN_TRIP_ADD" && e.entityId) planTrips.push(e.entityId);
    if (e.type === "PLAN_TRIP_REMOVE" && e.entityId) removedTrips.push(e.entityId);
    if (e.type?.startsWith("BOOKING_INTENT") && e.entityId) bookingIntents.push(e.entityId);
  }

  const searchRows = await prisma.analyticsSearch.findMany({
    where: { visitorId, ts: { gte: thirtyDaysAgo } },
    select: { queryRaw: true },
    orderBy: { ts: "desc" },
    take: 10,
  });
  for (const s of searchRows) searches.push(s.queryRaw);

  if (viewedBoatIds.length > 0) {
    const boats = await prisma.boat.findMany({
      where: { id: { in: viewedBoatIds } },
      select: { id: true, type: true },
    });
    for (const b of boats) {
      typeCounts.set(b.type, (typeCounts.get(b.type) ?? 0) + 1);
    }
  }

  const viewedAreaRows = viewedBoatIds.length > 0
    ? await prisma.boatServiceArea.findMany({
        where: { boatId: { in: viewedBoatIds } },
        select: { serviceAreaId: true },
        distinct: ["serviceAreaId"],
      })
    : [];

  const userId = await prisma.planUser
    .findFirst({ where: { deviceId: visitorId }, select: { id: true } })
    .then((u) => u?.id);

  return {
    visitorId,
    userId: userId ?? undefined,
    viewedBoatIds,
    viewedTypes: [...typeCounts.entries()]
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count),
    viewedAreas: viewedAreaRows.map((a) => a.serviceAreaId),
    searches,
    planTrips,
    removedTrips,
    bookingIntents,
    totalActivity: events.length,
  };
}

export async function getCandidateBoats(
  excludeIds: string[],
  lang: string,
  limit = 30,
) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const boats = await prisma.boat.findMany({
    where: {
      status: "PUBLISHED",
      id: { notIn: excludeIds },
    },
    include: {
      translations: {
        where: { lang: { in: [lang, "en"] } },
        select: { lang: true, title: true, slug: true },
      },
      priceTiers: { select: { regularPrice: true, salePrice: true } },
      serviceAreas: {
        include: {
          serviceArea: {
            include: { translations: { where: { lang: { in: [lang, "en"] } }, select: { lang: true, name: true } } },
          },
        },
      },
    },
    take: limit,
  });

  const boatIds = boats.map((b) => b.id);
  const schedules = await prisma.schedule.findMany({
    where: {
      boatId: { in: boatIds },
      departureDate: { gte: startOfToday },
      status: { not: "CANCELLED" },
    },
    orderBy: { departureDate: "asc" },
    select: { id: true, boatId: true, departureDate: true },
  });

  const schedulesByBoat = new Map<string, Array<{ id: string; date: string }>>();
  for (const s of schedules) {
    if (!s.departureDate) continue;
    const arr = schedulesByBoat.get(s.boatId) ?? [];
    if (arr.length < 3) arr.push({ id: s.id, date: s.departureDate.toISOString().slice(0, 10) });
    schedulesByBoat.set(s.boatId, arr);
  }

  const pick = <T extends { lang: string }>(arr: T[]) =>
    arr.find((t) => t.lang === lang) || arr.find((t) => t.lang === "en") || arr[0];

  return boats.map((b) => {
    const t = pick(b.translations);
    const area = pick(b.serviceAreas[0]?.serviceArea.translations ?? []);
    const prices = b.priceTiers.map((p) => p.salePrice ?? p.regularPrice).filter((p) => p > 0);
    const minPrice = prices.length ? Math.min(...prices) : 0;
    return {
      id: b.id,
      name: t?.title || b.name || "",
      slug: t?.slug || b.id,
      type: b.type,
      area: area?.name || "",
      price: minPrice,
      covers: b.covers,
      schedules: schedulesByBoat.get(b.id) ?? [],
    };
  });
}

function buildPrompt(
  profile: VisitorProfile,
  candidates: Awaited<ReturnType<typeof getCandidateBoats>>,
) {
  const profileLines = [
    `Viewed trip types: ${profile.viewedTypes.map((t) => `${t.type}(${t.count})`).join(", ") || "none"}`,
    `Viewed ${profile.viewedBoatIds.length} trips`,
    profile.searches.length > 0 ? `Searched: ${profile.searches.join(", ")}` : null,
    profile.planTrips.length > 0 ? `Added to plan: ${profile.planTrips.length} trips` : null,
    profile.removedTrips.length > 0 ? `Removed from plan: ${profile.removedTrips.length} trips` : null,
    profile.bookingIntents.length > 0 ? `Booking intents: ${profile.bookingIntents.length}` : null,
  ].filter(Boolean);

  const boatList = candidates
    .map((b) => {
      const sched = b.schedules.length > 0 ? ` | next: ${b.schedules.map((s) => s.date).join(", ")}` : "";
      return `- [${b.id}] ${b.name} | ${b.type} | ${b.area} | ${b.price > 0 ? `฿${b.price}` : "price TBD"}${sched}`;
    })
    .join("\n");

  return `You are a dive trip recommendation engine. Based on the visitor's behavior profile, rank the best 5 trips from the candidate list.

## Visitor Profile
${profileLines.join("\n")}

## Candidate Trips (not yet viewed by this visitor)
${boatList}

## Rules
1. Recommend trips that match the visitor's interests (type, area, price range)
2. If visitor searched for specific keywords, prioritize matching trips
3. Prefer trips with upcoming schedules
4. Include the schedule ID if a specific date is particularly relevant
5. Write the reason in the visitor's language if possible, otherwise English

Return ONLY a JSON array with exactly 5 items:
[{"boatId":"...","scheduleId":"...or null","reason":"short reason"}]`;
}

export async function computeAiRecommendations(
  visitorId: string,
  lang: string,
): Promise<{ boatIds: string[]; scheduleIds: string[]; reasons: string[]; variant: "ai" | "rule-based" }> {
  const config = await prisma.recommendationAiConfig.findUnique({ where: { id: "default" } });
  if (!config?.enabled || !config.apiKeyEncrypted) {
    return { boatIds: [], scheduleIds: [], reasons: [], variant: "rule-based" };
  }

  const profile = await buildVisitorProfile(visitorId);
  const candidates = await getCandidateBoats(profile.viewedBoatIds, lang);

  if (candidates.length === 0) {
    return { boatIds: [], scheduleIds: [], reasons: [], variant: "rule-based" };
  }

  const apiKey = decrypt(config.apiKeyEncrypted);
  const client = new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
  });

  try {
    const resp = await client.chat.completions.create({
      model: config.model,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      messages: [
        { role: "user", content: buildPrompt(profile, candidates) },
      ],
    });

    const text = resp.choices[0]?.message?.content || "";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON array in response");

    const parsed: AiRecommendation[] = JSON.parse(jsonMatch[0]);
    const validBoatIds = new Set(candidates.map((b) => b.id));
    const filtered = parsed.filter((r) => validBoatIds.has(r.boatId)).slice(0, 5);

    return {
      boatIds: filtered.map((r) => r.boatId),
      scheduleIds: filtered.map((r) => r.scheduleId || ""),
      reasons: filtered.map((r) => r.reason),
      variant: "ai",
    };
  } catch {
    return { boatIds: [], scheduleIds: [], reasons: [], variant: "rule-based" };
  }
}

export async function saveRecommendationCache(
  visitorId: string,
  userId: string | undefined,
  result: { boatIds: string[]; scheduleIds: string[]; reasons: string[]; variant: string },
  activityCount: number,
  ttlDays: number,
) {
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);
  const data = {
    boatIds: result.boatIds,
    scheduleIds: result.scheduleIds,
    reasons: result.reasons,
    activityCount,
    variant: result.variant,
    computedAt: new Date(),
    expiresAt,
  };

  if (userId) {
    await prisma.recommendationCache.upsert({
      where: { userId },
      create: { userId, deviceId: visitorId, ...data },
      update: data,
    });
  } else {
    await prisma.recommendationCache.upsert({
      where: { deviceId: visitorId },
      create: { deviceId: visitorId, ...data },
      update: data,
    });
  }
}
