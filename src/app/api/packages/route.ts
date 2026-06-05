import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, canDo, BOAT_TYPE_PERM } from "@/lib/apiAuth";

const LANGS = ["en", "th", "cn", "de", "fr", "ru", "ko", "ja"];
type TierInput = { tier: string; costPrice?: number | null; regularPrice?: number; salePrice?: number | null; agentPrice?: number | null };
type PeriodInput = { season: string; startDate: string; endDate: string };

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const boatId = req.nextUrl.searchParams.get("boatId");

  if (auth.source === "apiKey") {
    if (boatId) {
      const boat = await prisma.boat.findUnique({ where: { id: boatId }, select: { type: true } });
      if (!boat) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const permRes = BOAT_TYPE_PERM[boat.type] ?? "daytrip";
      if (!canDo(auth, `${permRes}.read`)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    } else {
      const hasAnyTripRead = Object.values(BOAT_TYPE_PERM).some(r => canDo(auth, `${r}.read`));
      if (!hasAnyTripRead) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const packages = await prisma.package.findMany({
    where: boatId ? { boatId } : {},
    orderBy: { createdAt: "asc" },
    include: {
      translations: true, priceTiers: true,
      seasonPeriods: { orderBy: { startDate: "asc" } },
      boat: { include: { translations: true } },
    },
  });
  return NextResponse.json(packages);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const { boatId, name, totalSeats, status, photos, sourceId, translations, priceTiers, seasonPeriods,
    bedType, occupancyMin, occupancyMax, roomSizeSqm, amenities, pricePerNight } = body;
  const pkgNum = (v: unknown) => (v === "" || v == null ? null : Number(v));

  if (auth.source === "apiKey") {
    const boat = await prisma.boat.findUnique({ where: { id: boatId }, select: { type: true } });
    if (!boat) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const permRes = BOAT_TYPE_PERM[boat.type] ?? "daytrip";
    if (!canDo(auth, `${permRes}.write`)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const pkg = await prisma.package.create({
    data: {
      boatId,
      name,
      totalSeats: totalSeats ? Number(totalSeats) : null,
      photos: photos ?? [],
      status: status ?? "DRAFT",
      sourceId: sourceId ?? null,
      bedType: bedType ?? null,
      occupancyMin: pkgNum(occupancyMin),
      occupancyMax: pkgNum(occupancyMax),
      roomSizeSqm: pkgNum(roomSizeSqm),
      amenities: Array.isArray(amenities) ? amenities : [],
      pricePerNight: pkgNum(pricePerNight),
      translations: {
        create: LANGS.map(lang => {
          const tr = translations?.find((t: { lang: string }) => t.lang === lang) ?? {};
          return { lang, title: tr.title ?? "", slug: tr.slug ?? "", excerpt: tr.excerpt ?? "", content: tr.content ?? "", itinerary: tr.itinerary ?? "", route: tr.route ?? "", keywords: tr.keywords ?? [] };
        }),
      },
      priceTiers: priceTiers?.length ? {
        create: (priceTiers as TierInput[]).map(t => ({
          tier: t.tier,
          costPrice: t.costPrice ? Number(t.costPrice) : null,
          regularPrice: Number(t.regularPrice) || 0,
          salePrice: t.salePrice ? Number(t.salePrice) : null,
          agentPrice: t.agentPrice ? Number(t.agentPrice) : null,
        })),
      } : undefined,
      seasonPeriods: seasonPeriods?.length ? {
        create: (seasonPeriods as PeriodInput[]).map(p => ({
          season: p.season,
          startDate: new Date(p.startDate),
          endDate: new Date(p.endDate),
        })),
      } : undefined,
    },
    include: { translations: true, priceTiers: true, seasonPeriods: { orderBy: { startDate: "asc" } } },
  });
  return NextResponse.json(pkg);
}
