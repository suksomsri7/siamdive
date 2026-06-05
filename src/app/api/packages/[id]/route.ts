import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, canDo, BOAT_TYPE_PERM } from "@/lib/apiAuth";

const LANGS = ["en", "th", "cn", "de", "fr", "ru", "ko", "ja"];
type TierInput = { tier: string; costPrice?: number | null; regularPrice?: number; salePrice?: number | null; agentPrice?: number | null };
type PeriodInput = { season: string; startDate: string; endDate: string };

async function getBoatPermRes(packageId: string): Promise<string | null> {
  const pkg = await prisma.package.findUnique({ where: { id: packageId }, select: { boat: { select: { type: true } } } });
  if (!pkg) return null;
  return BOAT_TYPE_PERM[pkg.boat.type] ?? "daytrip";
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const permRes = await getBoatPermRes(id);
  if (permRes === null) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canDo(auth, `${permRes}.read`)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const pkg = await prisma.package.findUnique({
    where: { id },
    include: {
      boat: { include: { translations: true } },
      translations: true,
      priceTiers: true,
      seasonPeriods: { orderBy: { startDate: "asc" } },
    },
  });
  if (!pkg) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(pkg);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const permRes = await getBoatPermRes(id);
  if (permRes === null) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canDo(auth, `${permRes}.write`)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, totalSeats, status, photos, translations, priceTiers, seasonPeriods,
    bedType, occupancyMin, occupancyMax, roomSizeSqm, amenities, pricePerNight } = body;
  const pkgNum = (v: unknown) => (v === "" || v == null ? null : Number(v));
  await prisma.packageTranslation.deleteMany({ where: { packageId: id } });
  await prisma.packagePriceTier.deleteMany({ where: { packageId: id } });
  await prisma.packageSeasonPeriod.deleteMany({ where: { packageId: id } });
  const pkg = await prisma.package.update({
    where: { id },
    data: {
      name,
      totalSeats: totalSeats ? Number(totalSeats) : null,
      photos: photos ?? [],
      status: status ?? "DRAFT",
      ...(bedType !== undefined ? { bedType: bedType ?? null } : {}),
      ...(occupancyMin !== undefined ? { occupancyMin: pkgNum(occupancyMin) } : {}),
      ...(occupancyMax !== undefined ? { occupancyMax: pkgNum(occupancyMax) } : {}),
      ...(roomSizeSqm !== undefined ? { roomSizeSqm: pkgNum(roomSizeSqm) } : {}),
      ...(amenities !== undefined ? { amenities: Array.isArray(amenities) ? amenities : [] } : {}),
      ...(pricePerNight !== undefined ? { pricePerNight: pkgNum(pricePerNight) } : {}),
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

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const permRes = await getBoatPermRes(id);
  if (permRes === null) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canDo(auth, `${permRes}.delete`)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.package.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
