import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, canDo, BOAT_TYPE_PERM } from "@/lib/apiAuth";

const LANGS = ["en", "th", "cn", "de", "fr", "ru", "ko", "ja"];

type PriceTierInput = { tier: string; costPrice?: string; regularPrice?: string; salePrice?: string; agentPrice?: string };
type PackageInput = { packageId: string; availableSeats?: number | null; isFull?: boolean; appendScheduleDetail?: boolean; priceTiers?: PriceTierInput[] };

async function getScheduleBoatPermRes(scheduleId: string): Promise<string | null> {
  const schedule = await prisma.schedule.findUnique({ where: { id: scheduleId }, select: { boat: { select: { type: true } } } });
  if (!schedule) return null;
  return BOAT_TYPE_PERM[schedule.boat.type] ?? "daytrip";
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const permRes = await getScheduleBoatPermRes(id);
  if (permRes === null) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canDo(auth, `${permRes}.read`)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const schedule = await prisma.schedule.findUnique({
    where: { id },
    include: {
      boat: { include: { company: { include: { translations: true } }, translations: true } },
      translations: true,
      packages: { include: { package: { include: { translations: true } }, priceTiers: true } },
    },
  });
  if (!schedule) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(schedule);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const permRes = await getScheduleBoatPermRes(id);
  if (permRes === null) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canDo(auth, `${permRes}.write`)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { dateType, departureDate, returnDate, weekDays, status, season, note, totalSeats, availableSeats, fromPrice, sourceUrl, sourceId, translations, packages } = body;

  // Partial-safe: only touch translations / packages if the client explicitly sent them.
  // Old behavior wiped both unconditionally — backoffice form that omits these fields was
  // destroying all per-language content and package selections on every save.
  const touchTranslations = translations !== undefined;
  const touchPackages = packages !== undefined;

  if (touchTranslations) {
    await prisma.scheduleTranslation.deleteMany({ where: { scheduleId: id } });
  }
  // Preserve existing priceTiers when form doesn't send them back
  let oldPackagePriceTiers: Map<string, { tier: string; costPrice: number | null; regularPrice: number; salePrice: number | null; agentPrice: number | null }[]> = new Map();
  if (touchPackages) {
    const oldPkgs = await prisma.schedulePackage.findMany({
      where: { scheduleId: id },
      include: { priceTiers: true },
    });
    for (const op of oldPkgs) {
      oldPackagePriceTiers.set(op.packageId, op.priceTiers.map(t => ({
        tier: t.tier, costPrice: t.costPrice, regularPrice: t.regularPrice, salePrice: t.salePrice, agentPrice: t.agentPrice,
      })));
    }
    await prisma.schedulePackage.deleteMany({ where: { scheduleId: id } });
  }

  const updateData: Record<string, unknown> = {};
  if (dateType !== undefined) updateData.dateType = dateType ?? "single";
  if (departureDate !== undefined) updateData.departureDate = departureDate ? new Date(departureDate) : null;
  if (returnDate !== undefined) updateData.returnDate = returnDate ? new Date(returnDate) : null;
  if (weekDays !== undefined) updateData.weekDays = weekDays ?? [];
  if (status !== undefined) updateData.status = status ?? "OPEN";
  if (season !== undefined) updateData.season = season ?? null;
  if (note !== undefined) updateData.note = note ?? null;
  if (totalSeats !== undefined) updateData.totalSeats = totalSeats != null ? Number(totalSeats) : null;
  if (availableSeats !== undefined) updateData.availableSeats = availableSeats != null ? Number(availableSeats) : null;
  if (fromPrice !== undefined) updateData.fromPrice = fromPrice != null && fromPrice !== "" ? Number(fromPrice) : null;
  if (sourceUrl !== undefined) updateData.sourceUrl = sourceUrl ?? null;
  if (sourceId !== undefined) updateData.sourceId = sourceId ?? null;

  if (touchTranslations) {
    updateData.itinerary = translations?.find((t: { lang: string }) => t.lang === "en")?.itinerary ?? "";
    updateData.translations = {
      create: LANGS.map(lang => {
        const tr = translations?.find((t: { lang: string }) => t.lang === lang) ?? {};
        return {
          lang,
          title: tr.title ?? "",
          slug: tr.slug ?? "",
          excerpt: tr.excerpt ?? "",
          content: tr.content ?? "",
          itinerary: tr.itinerary ?? "",
          route: tr.route ?? "",
          keywords: tr.keywords ?? [],
          included: tr.included ?? [],
          excluded: tr.excluded ?? [],
        };
      }),
    };
  }

  if (touchPackages && packages?.length) {
    updateData.packages = {
      create: (packages as PackageInput[]).map(p => {
        // If form didn't send priceTiers, carry forward old ones
        const oldTiers = oldPackagePriceTiers.get(p.packageId);
        const hasTiers = p.priceTiers && p.priceTiers.length > 0;
        const tierData = hasTiers
          ? p.priceTiers!.map(t => ({
              tier: t.tier,
              costPrice: t.costPrice ? Number(t.costPrice) : null,
              regularPrice: Number(t.regularPrice) || 0,
              salePrice: t.salePrice ? Number(t.salePrice) : null,
              agentPrice: t.agentPrice ? Number(t.agentPrice) : null,
            }))
          : oldTiers ?? [];
        return {
          packageId: p.packageId,
          availableSeats: p.availableSeats != null && p.availableSeats !== "" ? Number(p.availableSeats) : null,
          isFull: p.isFull ?? false,
          appendScheduleDetail: p.appendScheduleDetail ?? false,
          priceTiers: tierData.length ? { create: tierData } : undefined,
        };
      }),
    };
  }

  const s = await prisma.schedule.update({
    where: { id },
    data: updateData,
    include: { translations: true, packages: { include: { priceTiers: true } } },
  });
  return NextResponse.json(s);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const permRes = await getScheduleBoatPermRes(id);
  if (permRes === null) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canDo(auth, `${permRes}.delete`)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.schedule.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
