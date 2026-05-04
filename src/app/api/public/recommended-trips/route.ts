import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const lang = req.nextUrl.searchParams.get("lang") || "en";
  const vid = req.nextUrl.searchParams.get("vid")?.trim();

  if (!vid) return NextResponse.json([]);

  const config = await prisma.recommendationAiConfig.findUnique({ where: { id: "default" } });
  const aiEnabled = config?.enabled ?? false;
  const minActivity = config?.minActivity ?? 5;
  const cacheTTLDays = config?.cacheTTLDays ?? 7;
  const cooldownMinutes = config?.cooldownMinutes ?? 60;
  const abTestEnabled = config?.abTestEnabled ?? false;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Count activity for this visitor
  const activityRows = await prisma.$queryRaw<[{ count: number }]>`
    SELECT COUNT(*)::int AS count
    FROM "AnalyticsEvent" e
    JOIN "AnalyticsSession" s ON s.id = e."sessionId"
    WHERE e."visitorId" = ${vid}
      AND e.ts >= ${thirtyDaysAgo}
      AND s."isBot" = FALSE
  `;
  const activityCount = activityRows[0]?.count ?? 0;

  // Check if this visitor has a userId (linked email)
  const planUser = await prisma.planUser.findUnique({
    where: { deviceId: vid },
    select: { id: true },
  });
  const userId = planUser?.id;

  // Determine A/B variant: hash visitorId to get stable 50/50 split
  const shouldUseAi = aiEnabled && activityCount >= minActivity &&
    (!abTestEnabled || hashToGroup(vid) === "ai");

  if (!shouldUseAi) {
    return returnRuleBased(vid, lang, thirtyDaysAgo);
  }

  // Check cache
  const cache = userId
    ? await prisma.recommendationCache.findUnique({ where: { userId } })
    : await prisma.recommendationCache.findUnique({ where: { deviceId: vid } });

  if (cache) {
    const cacheExpired = cache.expiresAt < new Date();
    const activityChanged = cache.activityCount !== activityCount;
    const cooldownPassed = cache.computedAt < new Date(Date.now() - cooldownMinutes * 60 * 1000);

    if (!cacheExpired && !activityChanged) {
      // Cache is valid — return cached AI results
      return returnCachedResults(cache.boatIds, lang);
    }

    if (cooldownPassed && (cacheExpired || activityChanged)) {
      // Trigger background AI compute, return cached for now
      triggerBackgroundCompute(vid, lang);
      if (cache.boatIds.length > 0) {
        return returnCachedResults(cache.boatIds, lang);
      }
    }

    // Cooldown not passed or no cached results — fallback
    if (cache.boatIds.length > 0) {
      return returnCachedResults(cache.boatIds, lang);
    }
  }

  // No cache at all — trigger background compute and return rule-based
  triggerBackgroundCompute(vid, lang);
  return returnRuleBased(vid, lang, thirtyDaysAgo);
}

// Stable hash for A/B test: same visitor always gets same variant
function hashToGroup(vid: string): "ai" | "rule-based" {
  let hash = 0;
  for (let i = 0; i < vid.length; i++) {
    hash = ((hash << 5) - hash + vid.charCodeAt(i)) | 0;
  }
  return (Math.abs(hash) % 2 === 0) ? "ai" : "rule-based";
}

function triggerBackgroundCompute(vid: string, lang: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
    || "http://localhost:3000";

  fetch(`${baseUrl}/api/recommendation-ai/compute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Cron-Secret": process.env.CRON_SECRET || "",
    },
    body: JSON.stringify({ visitorId: vid, lang }),
  }).catch(() => {});
}

async function returnCachedResults(boatIds: string[], lang: string) {
  if (boatIds.length === 0) return NextResponse.json([]);

  // Get 4 from AI cache + 1 random popular unseen
  const aiBoatIds = boatIds.slice(0, 4);
  const randomBoat = await getRandomPopularBoat(boatIds, lang);
  const allIds = randomBoat ? [...aiBoatIds, randomBoat] : aiBoatIds;

  const result = await boatIdsToResponse(allIds, lang);
  return NextResponse.json(result, {
    headers: { "Cache-Control": "private, max-age=300" },
  });
}

async function getRandomPopularBoat(excludeIds: string[], lang: string): Promise<string | null> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const popular = await prisma.$queryRaw<Array<{ entityId: string }>>`
    SELECT e."entityId", COUNT(*)::int AS cnt
    FROM "AnalyticsEvent" e
    JOIN "AnalyticsSession" s ON s.id = e."sessionId"
    JOIN "Boat" b ON b.id = e."entityId"
    WHERE e.type = 'TRIP_VIEW'
      AND e."entityType" = 'BOAT'
      AND e."entityId" IS NOT NULL
      AND e.ts >= ${thirtyDaysAgo}
      AND s."isBot" = FALSE
      AND b.status = 'PUBLISHED'
      AND e."entityId" != ALL(${excludeIds}::text[])
    GROUP BY e."entityId"
    ORDER BY cnt DESC
    LIMIT 10
  `;

  if (popular.length === 0) return null;
  const idx = Math.floor(Math.random() * Math.min(popular.length, 5));
  return popular[idx].entityId;
}

async function boatIdsToResponse(boatIds: string[], lang: string) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const boats = await prisma.boat.findMany({
    where: { id: { in: boatIds }, status: "PUBLISHED" },
    include: {
      translations: { select: { lang: true, title: true, slug: true } },
      priceTiers: { select: { regularPrice: true, salePrice: true } },
      serviceAreas: {
        include: {
          serviceArea: {
            include: { translations: { select: { lang: true, name: true } } },
          },
        },
      },
    },
  });

  const nextSchedules = await prisma.schedule.findMany({
    where: {
      boatId: { in: boatIds },
      departureDate: { gte: startOfToday },
      status: { not: "CANCELLED" },
    },
    orderBy: { departureDate: "asc" },
    select: { boatId: true, departureDate: true },
  });

  const nextDepByBoat = new Map<string, string>();
  for (const s of nextSchedules) {
    if (!nextDepByBoat.has(s.boatId) && s.departureDate) {
      nextDepByBoat.set(s.boatId, s.departureDate.toISOString());
    }
  }

  const pick = <T extends { lang: string }>(arr: T[]) =>
    arr.find((t) => t.lang === lang) ||
    arr.find((t) => t.lang === "en") ||
    arr[0];

  // Preserve order from boatIds
  const boatMap = new Map(boats.map((b) => [b.id, b]));
  return boatIds
    .map((id) => boatMap.get(id))
    .filter(Boolean)
    .map((b) => {
      const bt = pick(b!.translations);
      const area = pick(b!.serviceAreas[0]?.serviceArea.translations ?? []);
      const prices = b!.priceTiers
        .map((p) => p.salePrice ?? p.regularPrice)
        .filter((p) => p > 0);
      const minPrice = prices.length ? Math.min(...prices) : 0;
      const isLiveaboard = ["LIVEABOARD", "DIVE_RESORT"].includes(b!.type);
      return {
        id: b!.id,
        slug: bt?.slug || b!.id,
        title: bt?.title || b!.name || "",
        destinationName: area?.name || "",
        price: minPrice,
        type: isLiveaboard ? ("LIVEABOARD" as const) : ("DAYTRIP" as const),
        imageUrl: b!.covers[0] || undefined,
        covers: b!.covers,
        boatType: b!.type,
        boatId: b!.id,
        nextDeparture: nextDepByBoat.get(b!.id) || undefined,
      };
    });
}

async function returnRuleBased(vid: string, lang: string, thirtyDaysAgo: Date) {
  const viewEvents = await prisma.$queryRaw<
    Array<{ entityId: string; boatType: string; viewCount: number }>
  >`
    SELECT e."entityId", b.type::text AS "boatType", COUNT(*)::int AS "viewCount"
    FROM "AnalyticsEvent" e
    JOIN "AnalyticsSession" s ON s.id = e."sessionId"
    JOIN "Boat" b ON b.id = e."entityId"
    WHERE e."visitorId" = ${vid}
      AND e.ts >= ${thirtyDaysAgo}
      AND s."isBot" = FALSE
      AND e.type = 'TRIP_VIEW'
      AND e."entityType" = 'BOAT'
      AND e."entityId" IS NOT NULL
    GROUP BY e."entityId", b.type
    ORDER BY "viewCount" DESC
    LIMIT 20
  `;

  if (viewEvents.length === 0) return NextResponse.json([]);

  const viewedBoatIds = viewEvents.map((e) => e.entityId);

  const typeCounts = new Map<string, number>();
  for (const e of viewEvents) {
    typeCounts.set(e.boatType, (typeCounts.get(e.boatType) ?? 0) + e.viewCount);
  }
  const topTypes = [...typeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([t]) => t);

  const viewedAreaIds = await prisma.boatServiceArea.findMany({
    where: { boatId: { in: viewedBoatIds } },
    select: { serviceAreaId: true },
    distinct: ["serviceAreaId"],
  });
  const areaIds = viewedAreaIds.map((a) => a.serviceAreaId);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const candidates = await prisma.boat.findMany({
    where: {
      status: "PUBLISHED",
      id: { notIn: viewedBoatIds },
      OR: [
        ...(topTypes.length > 0 ? [{ type: { in: topTypes as never[] } }] : []),
        ...(areaIds.length > 0 ? [{ serviceAreas: { some: { serviceAreaId: { in: areaIds } } } }] : []),
      ],
    },
    include: {
      translations: { select: { lang: true, title: true, slug: true, excerpt: true } },
      priceTiers: { select: { regularPrice: true, salePrice: true } },
      serviceAreas: {
        include: {
          serviceArea: {
            include: { translations: { select: { lang: true, name: true } } },
          },
        },
      },
    },
    take: 20,
  });

  const nextSchedules = await prisma.schedule.findMany({
    where: {
      boatId: { in: candidates.map((b) => b.id) },
      departureDate: { gte: startOfToday },
      status: { not: "CANCELLED" },
    },
    orderBy: { departureDate: "asc" },
    select: { boatId: true, departureDate: true },
  });

  const nextDepByBoat = new Map<string, string>();
  for (const s of nextSchedules) {
    if (!nextDepByBoat.has(s.boatId) && s.departureDate) {
      nextDepByBoat.set(s.boatId, s.departureDate.toISOString());
    }
  }

  const scored = candidates.map((b) => {
    let score = 0;
    if (topTypes.includes(b.type)) score += 3;
    if (b.serviceAreas.some((sa) => areaIds.includes(sa.serviceAreaId))) score += 2;
    if (nextDepByBoat.has(b.id)) score += 1;
    return { boat: b, score };
  });
  scored.sort((a, b) => b.score - a.score);

  const pick = <T extends { lang: string }>(arr: T[]) =>
    arr.find((t) => t.lang === lang) || arr.find((t) => t.lang === "en") || arr[0];

  const result = scored.slice(0, 10).map(({ boat: b }) => {
    const bt = pick(b.translations);
    const area = pick(b.serviceAreas[0]?.serviceArea.translations ?? []);
    const prices = b.priceTiers.map((p) => p.salePrice ?? p.regularPrice).filter((p) => p > 0);
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const isLiveaboard = ["LIVEABOARD", "DIVE_RESORT"].includes(b.type);
    return {
      id: b.id,
      slug: bt?.slug || b.id,
      title: bt?.title || b.name || "",
      destinationName: area?.name || "",
      price: minPrice,
      type: isLiveaboard ? ("LIVEABOARD" as const) : ("DAYTRIP" as const),
      imageUrl: b.covers[0] || undefined,
      covers: b.covers,
      boatType: b.type,
      boatId: b.id,
      nextDeparture: nextDepByBoat.get(b.id) || undefined,
    };
  });

  return NextResponse.json(result, {
    headers: { "Cache-Control": "private, max-age=300" },
  });
}
