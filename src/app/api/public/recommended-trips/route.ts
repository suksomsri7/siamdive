import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const lang = req.nextUrl.searchParams.get("lang") || "en";
  const vid = req.nextUrl.searchParams.get("vid")?.trim();

  if (!vid) return NextResponse.json([]);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const viewEvents = await prisma.$queryRaw<
    Array<{
      entityId: string;
      boatType: string;
      viewCount: number;
    }>
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
        ...(topTypes.length > 0
          ? [{ type: { in: topTypes as never[] } }]
          : []),
        ...(areaIds.length > 0
          ? [{ serviceAreas: { some: { serviceAreaId: { in: areaIds } } } }]
          : []),
      ],
    },
    include: {
      translations: {
        select: { lang: true, title: true, slug: true, excerpt: true },
      },
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
    if (b.serviceAreas.some((sa) => areaIds.includes(sa.serviceAreaId)))
      score += 2;
    if (nextDepByBoat.has(b.id)) score += 1;
    return { boat: b, score };
  });
  scored.sort((a, b) => b.score - a.score);

  const pick = <T extends { lang: string }>(arr: T[]) =>
    arr.find((t) => t.lang === lang) ||
    arr.find((t) => t.lang === "en") ||
    arr[0];

  const result = scored.slice(0, 10).map(({ boat: b }) => {
    const bt = pick(b.translations);
    const area = pick(b.serviceAreas[0]?.serviceArea.translations ?? []);
    const prices = b.priceTiers
      .map((p) => p.salePrice ?? p.regularPrice)
      .filter((p) => p > 0);
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
