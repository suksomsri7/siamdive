import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, canDo, BOAT_TYPE_PERM } from "@/lib/apiAuth";

type TransInput = { lang: string; title: string; slug: string; excerpt: string; content: string; keywords: string[] };
type VideoInput = { url: string; name: string };
type TierInput = { tier: string; costPrice?: number | null; regularPrice: number; salePrice?: number | null; agentPrice?: number | null };
type DivePkgInput = { numberOfDives: number | string; price?: number | null };
type MealPlanInput = { name: string; price?: number | null; included?: boolean; description?: string };

const num = (v: unknown) => (v === "" || v == null ? null : Number(v));
function boatResortData(b: { stars?: unknown; latitude?: unknown; longitude?: unknown; ecoLabels?: unknown; tripadvisorRating?: unknown }) {
  return {
    stars: b.stars == null || b.stars === "" ? null : Number(b.stars),
    latitude: num(b.latitude),
    longitude: num(b.longitude),
    ecoLabels: Array.isArray(b.ecoLabels) ? (b.ecoLabels as string[]) : [],
    tripadvisorRating: num(b.tripadvisorRating),
  };
}
function divePackageCreates(dp: unknown) {
  return ((dp as DivePkgInput[]) ?? [])
    .filter(p => p && p.numberOfDives != null && p.numberOfDives !== "")
    .map((p, i) => ({ numberOfDives: Number(p.numberOfDives), price: num(p.price), order: i }));
}
function mealPlanCreates(mp: unknown) {
  return ((mp as MealPlanInput[]) ?? [])
    .filter(m => m && m.name?.trim())
    .map((m, i) => ({ name: m.name.trim(), price: num(m.price), included: !!m.included, description: m.description ?? "", order: i }));
}

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
      divePackages: { orderBy: { order: "asc" } },
      mealPlans: { orderBy: { order: "asc" } },
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

  const { companyId, name, type, capacity, photos, covers, status, featured, currency, translations, videos, priceTiers, serviceAreaIds,
    stars, latitude, longitude, ecoLabels, tripadvisorRating, divePackages, mealPlans } = await req.json();
  await prisma.boatTranslation.deleteMany({ where: { boatId: id } });
  await prisma.boatVideo.deleteMany({ where: { boatId: id } });
  await prisma.boatPriceTier.deleteMany({ where: { boatId: id } });
  await prisma.boatServiceArea.deleteMany({ where: { boatId: id } });
  // Only replace resort sub-records when the payload includes them, so editing
  // a liveaboard/daytrip (which never sends these) doesn't wipe anything.
  if (divePackages !== undefined) await prisma.divePackage.deleteMany({ where: { boatId: id } });
  if (mealPlans !== undefined) await prisma.mealPlan.deleteMany({ where: { boatId: id } });
  const boat = await prisma.boat.update({
    where: { id },
    data: {
      ...(companyId ? { company: { connect: { id: companyId } } } : { company: { disconnect: true } }),
      name, type, capacity: capacity ? Number(capacity) : null,
      photos: photos ?? [], covers: covers ?? [],
      status: status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
      featured: !!featured,
      ...(currency !== undefined ? { currency: currency || "THB" } : {}),
      ...boatResortData({ stars, latitude, longitude, ecoLabels, tripadvisorRating }),
      translations: { create: (translations as TransInput[] ?? []).filter(t => t.title?.trim() || t.slug?.trim()).map(t => ({ lang: t.lang, title: t.title, slug: t.slug || slugify(t.title) + "-" + id.slice(-4), excerpt: t.excerpt, content: t.content, keywords: t.keywords ?? [] })) },
      videos: { create: (videos as VideoInput[] ?? []).map((v, i) => ({ url: v.url, name: v.name, order: i })) },
      priceTiers: { create: (priceTiers as TierInput[] ?? []).map(p => ({ tier: p.tier, costPrice: p.costPrice ?? null, regularPrice: p.regularPrice, salePrice: p.salePrice ?? null, agentPrice: p.agentPrice ?? null })) },
      ...(divePackages !== undefined ? { divePackages: { create: divePackageCreates(divePackages) } } : {}),
      ...(mealPlans !== undefined ? { mealPlans: { create: mealPlanCreates(mealPlans) } } : {}),
      serviceAreas: serviceAreaIds?.length ? { create: (serviceAreaIds as string[]).map((saId: string) => ({ serviceAreaId: saId })) } : undefined,
    },
    include: { translations: true, videos: true, priceTiers: true, serviceAreas: true, divePackages: true, mealPlans: true },
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
