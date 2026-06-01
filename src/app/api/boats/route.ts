import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, canDo, BOAT_TYPE_PERM } from "@/lib/apiAuth";

type TransInput = { lang: string; title: string; slug: string; excerpt: string; content: string; keywords: string[] };
type VideoInput = { url: string; name: string };
type TierInput = { tier: string; costPrice?: number | null; regularPrice: number; salePrice?: number | null; agentPrice?: number | null };

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  if (auth.source === "apiKey") {
    if (type) {
      const permRes = BOAT_TYPE_PERM[type] ?? "daytrip";
      if (!canDo(auth, `${permRes}.read`)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    } else {
      const hasAnyTripRead = Object.values(BOAT_TYPE_PERM).some(r => canDo(auth, `${r}.read`));
      if (!hasAnyTripRead) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const companyId = searchParams.get("companyId");
  const typeCast = type as "DAYTRIP" | "LIVEABOARD" | "DIVE_RESORT" | "FREEDIVE" | "LAND_TOUR" | "SNORKELING" | null;
  const boats = await prisma.boat.findMany({
    where: { ...(companyId ? { companyId } : {}), ...(typeCast ? { type: typeCast } : {}) },
    include: {
      company: { include: { translations: true } },
      translations: true,
      videos: { orderBy: { order: "asc" } },
      priceTiers: true,
      schedules: { orderBy: { departureDate: "asc" }, include: { translations: true, packages: { include: { priceTiers: true } } } },
      serviceAreas: {
        include: {
          serviceArea: {
            include: {
              translations: true,
              country: { include: { translations: true } },
            },
          },
        },
      },
      _count: { select: { schedules: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(boats);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { companyId, name, type, capacity, photos, covers, status, featured, currency, translations, videos, priceTiers, serviceAreaIds, sourceUrl, sourceId } = await req.json();

  if (auth.source === "apiKey") {
    const permRes = BOAT_TYPE_PERM[type] ?? "daytrip";
    if (!canDo(auth, `${permRes}.write`)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const boat = await prisma.boat.create({
    data: {
      ...(companyId ? { company: { connect: { id: companyId } } } : {}),
      name, type, capacity: capacity ? Number(capacity) : null,
      photos: photos ?? [], covers: covers ?? [],
      status: status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
      featured: !!featured,
      currency: currency || "THB",
      sourceUrl: sourceUrl ?? null,
      sourceId: sourceId ?? null,
      translations: { create: (translations as TransInput[] ?? []).filter(t => t.title?.trim() || t.slug?.trim()).map(t => ({ lang: t.lang, title: t.title, slug: t.slug || slugify(t.title) + "-" + Date.now().toString(36), excerpt: t.excerpt, content: t.content, keywords: t.keywords ?? [] })) },
      videos: { create: (videos as VideoInput[] ?? []).map((v, i) => ({ url: v.url, name: v.name, order: i })) },
      priceTiers: { create: (priceTiers as TierInput[] ?? []).map(p => ({ tier: p.tier, costPrice: p.costPrice ?? null, regularPrice: p.regularPrice, salePrice: p.salePrice ?? null, agentPrice: p.agentPrice ?? null })) },
      serviceAreas: serviceAreaIds?.length ? { create: (serviceAreaIds as string[]).map(id => ({ serviceAreaId: id })) } : undefined,
    },
    include: { translations: true, videos: true, priceTiers: true, serviceAreas: true },
  });
  return NextResponse.json(boat, { status: 201 });
}

function slugify(t: string) { return t.toLowerCase().replace(/[^a-z0-9ก-๙]+/g, "-").replace(/^-+|-+$/g, ""); }
