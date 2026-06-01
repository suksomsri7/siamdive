import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, canDo, BOAT_TYPE_PERM } from "@/lib/apiAuth";

type TransInput = { lang: string; title: string; slug: string; excerpt: string; content: string; keywords: string[] };
type VideoInput = { url: string; name: string };
type TierInput = { tier: string; costPrice?: number | null; regularPrice: number; salePrice?: number | null; agentPrice?: number | null };

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const boat = await prisma.boat.findUnique({
    where: { id },
    include: {
      company: { include: { translations: true } },
      translations: true,
      videos: { orderBy: { order: "asc" } },
      priceTiers: true,
      schedules: { orderBy: { departureDate: "asc" }, include: { translations: true, packages: { include: { priceTiers: true } } } },
      serviceAreas: { include: { serviceArea: { include: { translations: true } } } },
      options: { orderBy: { order: "asc" }, include: { translations: true } },
    },
  });
  if (!boat) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const permRes = BOAT_TYPE_PERM[boat.type] ?? "daytrip";
  if (!canDo(auth, `${permRes}.read`)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json(boat);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const existing = await prisma.boat.findUnique({ where: { id }, select: { type: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const permRes = BOAT_TYPE_PERM[existing.type] ?? "daytrip";
  if (!canDo(auth, `${permRes}.write`)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { companyId, name, type, capacity, photos, covers, status, featured, currency, translations, videos, priceTiers, serviceAreaIds } = await req.json();
  await prisma.boatTranslation.deleteMany({ where: { boatId: id } });
  await prisma.boatVideo.deleteMany({ where: { boatId: id } });
  await prisma.boatPriceTier.deleteMany({ where: { boatId: id } });
  await prisma.boatServiceArea.deleteMany({ where: { boatId: id } });
  const boat = await prisma.boat.update({
    where: { id },
    data: {
      ...(companyId ? { company: { connect: { id: companyId } } } : { company: { disconnect: true } }),
      name, type, capacity: capacity ? Number(capacity) : null,
      photos: photos ?? [], covers: covers ?? [],
      status: status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
      featured: !!featured,
      ...(currency !== undefined ? { currency: currency || "THB" } : {}),
      translations: { create: (translations as TransInput[] ?? []).filter(t => t.title?.trim() || t.slug?.trim()).map(t => ({ lang: t.lang, title: t.title, slug: t.slug || slugify(t.title) + "-" + id.slice(-4), excerpt: t.excerpt, content: t.content, keywords: t.keywords ?? [] })) },
      videos: { create: (videos as VideoInput[] ?? []).map((v, i) => ({ url: v.url, name: v.name, order: i })) },
      priceTiers: { create: (priceTiers as TierInput[] ?? []).map(p => ({ tier: p.tier, costPrice: p.costPrice ?? null, regularPrice: p.regularPrice, salePrice: p.salePrice ?? null, agentPrice: p.agentPrice ?? null })) },
      serviceAreas: serviceAreaIds?.length ? { create: (serviceAreaIds as string[]).map((saId: string) => ({ serviceAreaId: saId })) } : undefined,
    },
    include: { translations: true, videos: true, priceTiers: true, serviceAreas: true },
  });
  return NextResponse.json(boat);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const existing = await prisma.boat.findUnique({ where: { id }, select: { type: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const permRes = BOAT_TYPE_PERM[existing.type] ?? "daytrip";
  if (!canDo(auth, `${permRes}.delete`)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.boat.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

function slugify(t: string) { return t.toLowerCase().replace(/[^a-z0-9ก-๙]+/g, "-").replace(/^-+|-+$/g, ""); }
