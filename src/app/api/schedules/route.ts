import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, canDo, BOAT_TYPE_PERM } from "@/lib/apiAuth";

const LANGS = ["en", "th", "cn", "de", "fr", "ru", "ko", "ja"];

type PriceTierInput = { tier: string; costPrice?: string; regularPrice?: string; salePrice?: string; agentPrice?: string };
type PackageInput = { packageId: string; availableSeats?: number | null; isFull?: boolean; appendScheduleDetail?: boolean; priceTiers?: PriceTierInput[] };

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const boatId = searchParams.get("boatId");

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

  const schedules = await prisma.schedule.findMany({
    where: boatId ? { boatId } : {},
    include: {
      boat: { include: { company: { include: { translations: true } }, translations: true } },
      translations: true,
      packages: { include: { priceTiers: true } },
    },
    orderBy: { departureDate: "asc" },
  });
  return NextResponse.json(schedules);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { boatId, dateType, departureDate, returnDate, weekDays, status, season, note, totalSeats, availableSeats, sourceUrl, sourceId, translations, packages } = await req.json();

  if (auth.source === "apiKey") {
    const boat = await prisma.boat.findUnique({ where: { id: boatId }, select: { type: true } });
    if (!boat) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const permRes = BOAT_TYPE_PERM[boat.type] ?? "daytrip";
    if (!canDo(auth, `${permRes}.write`)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const s = await prisma.schedule.create({
    data: {
      boatId,
      dateType: dateType ?? "single",
      departureDate: departureDate ? new Date(departureDate) : null,
      returnDate: returnDate ? new Date(returnDate) : null,
      weekDays: weekDays ?? [],
      status: status ?? "OPEN",
      season: season ?? null,
      note: note ?? null,
      totalSeats: totalSeats != null ? Number(totalSeats) : null,
      availableSeats: availableSeats != null ? Number(availableSeats) : null,
      sourceUrl: sourceUrl ?? null,
      sourceId: sourceId ?? null,
      itinerary: translations?.find((t: { lang: string }) => t.lang === "en")?.itinerary ?? "",
      translations: {
        create: LANGS.map(lang => {
          const tr = translations?.find((t: { lang: string }) => t.lang === lang) ?? {};
          return {
            lang,
            title: tr.title ?? "",
            slug: tr.slug ?? "",
            excerpt: tr.excerpt ?? "",
            content: tr.content ?? "",
            itinerary: tr.itinerary ?? "",
            route: "",
            keywords: tr.keywords ?? [],
          };
        }),
      },
      packages: packages?.length ? {
        create: (packages as PackageInput[]).map(p => ({
          packageId: p.packageId,
          availableSeats: p.availableSeats ?? null,
          isFull: p.isFull ?? false,
          appendScheduleDetail: p.appendScheduleDetail ?? false,
          priceTiers: p.priceTiers?.length ? {
            create: p.priceTiers.map(t => ({
              tier: t.tier,
              costPrice: t.costPrice ? Number(t.costPrice) : null,
              regularPrice: Number(t.regularPrice) || 0,
              salePrice: t.salePrice ? Number(t.salePrice) : null,
              agentPrice: t.agentPrice ? Number(t.agentPrice) : null,
            })),
          } : undefined,
        })),
      } : undefined,
    },
    include: { translations: true, packages: { include: { priceTiers: true } } },
  });
  return NextResponse.json(s, { status: 201 });
}
