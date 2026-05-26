import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

type PlanTripJson = {
  boatId?: string;
  schedule?: {
    scheduleId?: string;
    departureDate?: string;
    returnDate?: string | null;
  };
};

type Gap = {
  start: string;
  end: string;
  days: number;
};

const pickByLang = <T extends { lang: string }>(arr: T[], lang: string) =>
  arr.find((t) => t.lang === lang) || arr.find((t) => t.lang === "en") || arr[0];

function computeGaps(trips: PlanTripJson[]): Gap[] {
  const scheduled = trips
    .filter((t) => t.schedule?.departureDate)
    .map((t) => ({
      dep: t.schedule!.departureDate!,
      ret: t.schedule!.returnDate || t.schedule!.departureDate!,
    }))
    .sort((a, b) => a.dep.localeCompare(b.dep));

  if (scheduled.length === 0) return [];

  const gaps: Gap[] = [];
  const WINDOW_DAYS = 5;

  // Before first trip
  const firstDep = scheduled[0].dep;
  const beforeStart = addDays(firstDep, -WINDOW_DAYS);
  const beforeEnd = addDays(firstDep, -1);
  if (beforeStart <= beforeEnd) {
    gaps.push({ start: beforeStart, end: beforeEnd, days: daysBetween(beforeStart, beforeEnd) });
  }

  // Between trips
  for (let i = 0; i < scheduled.length - 1; i++) {
    const gapStart = addDays(scheduled[i].ret, 1);
    const gapEnd = addDays(scheduled[i + 1].dep, -1);
    if (gapStart <= gapEnd) {
      gaps.push({ start: gapStart, end: gapEnd, days: daysBetween(gapStart, gapEnd) });
    }
  }

  // After last trip
  const lastRet = scheduled[scheduled.length - 1].ret;
  const afterStart = addDays(lastRet, 1);
  const afterEnd = addDays(lastRet, WINDOW_DAYS);
  gaps.push({ start: afterStart, end: afterEnd, days: daysBetween(afterStart, afterEnd) });

  return gaps;
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000) + 1;
}

// GET /api/plans/[id]/suggestions?deviceId=xxx&lang=th
export async function GET(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const lang = req.nextUrl.searchParams.get("lang") || "th";
  const deviceId = req.nextUrl.searchParams.get("deviceId");

  try {
    const plan = await prisma.userPlan.findFirst({
      where: { id },
      select: { id: true, userId: true, trips: true, user: { select: { deviceId: true } } },
    });

    if (!plan) {
      return NextResponse.json({ error: "plan_not_found" }, { status: 404 });
    }

    // Basic ownership / access check
    if (deviceId && plan.user.deviceId !== deviceId) {
      const user = await prisma.planUser.findUnique({ where: { deviceId } });
      if (!user?.email) {
        return NextResponse.json({ error: "unauthorized" }, { status: 403 });
      }
      const member = await prisma.planMember.findFirst({
        where: { planId: id, email: user.email },
      });
      if (!member) {
        return NextResponse.json({ error: "unauthorized" }, { status: 403 });
      }
    }

    const rawTrips = Array.isArray(plan.trips)
      ? (plan.trips as PlanTripJson[])
      : [];

    // Collect boatIds and existing scheduleIds
    const boatIds = rawTrips
      .map((t) => t.boatId)
      .filter((id): id is string => !!id);
    const existingScheduleIds = new Set(
      rawTrips
        .map((t) => t.schedule?.scheduleId)
        .filter((id): id is string => !!id),
    );

    // Get serviceAreaIds for the plan's boats
    let planAreaIds: string[] = [];
    if (boatIds.length > 0) {
      const boatAreas = await prisma.boatServiceArea.findMany({
        where: { boatId: { in: boatIds } },
        select: { serviceAreaId: true },
      });
      planAreaIds = [...new Set(boatAreas.map((b) => b.serviceAreaId))];
    }

    // ── Gap-fill trip suggestions ──
    const gaps = computeGaps(rawTrips);
    const gapResults: Array<{
      start: string;
      end: string;
      days: number;
      trips: Array<{
        boatId: string;
        title: string;
        slug: string;
        type: string;
        area: string;
        cover: string | null;
        schedule: {
          scheduleId: string;
          departureDate: string;
          returnDate: string | null;
          title: string;
          route: string;
          itinerary: string;
          priceMin: number;
          priceMax: number;
        };
      }>;
    }> = [];

    const MAX_PER_GAP = 3;

    for (const gap of gaps) {
      const schedules = await prisma.schedule.findMany({
        where: {
          status: "OPEN",
          departureDate: { gte: new Date(gap.start + "T00:00:00Z"), lte: new Date(gap.end + "T23:59:59Z") },
          ...(gap.days <= 2
            ? { returnDate: { lte: new Date(addDays(gap.end, 1) + "T00:00:00Z") } }
            : {}),
          boat: {
            status: "PUBLISHED",
            ...(planAreaIds.length > 0
              ? { serviceAreas: { some: { serviceAreaId: { in: planAreaIds } } } }
              : {}),
          },
        },
        include: {
          boat: {
            include: {
              translations: { select: { lang: true, title: true, slug: true } },
              serviceAreas: {
                include: {
                  serviceArea: {
                    include: { translations: { select: { lang: true, name: true } } },
                  },
                },
              },
            },
          },
          translations: { select: { lang: true, title: true, route: true, itinerary: true } },
          packages: {
            include: {
              package: {
                include: {
                  priceTiers: { select: { tier: true, regularPrice: true, salePrice: true } },
                },
              },
              priceTiers: { select: { tier: true, regularPrice: true, salePrice: true } },
            },
          },
        },
        orderBy: { departureDate: "asc" },
        take: 10,
      });

      // Filter: exclude already-in-plan schedules, dedupe by boat
      const seen = new Set<string>();
      const candidates = schedules.filter((s) => {
        if (existingScheduleIds.has(s.id)) return false;
        if (boatIds.includes(s.boatId) && existingScheduleIds.has(s.id)) return false;
        if (seen.has(s.boatId)) return false;
        // Check return date doesn't exceed gap for tight gaps
        if (s.returnDate) {
          const retStr = s.returnDate.toISOString().slice(0, 10);
          // For between-trip gaps, return must not overlap next trip
          if (gap.days <= 5 && retStr > addDays(gap.end, 1)) return false;
        }
        seen.add(s.boatId);
        return true;
      });

      const tripSuggestions = candidates.slice(0, MAX_PER_GAP).map((s) => {
        const bt = pickByLang(s.boat.translations, lang);
        const areaTrans = s.boat.serviceAreas[0]?.serviceArea
          ? pickByLang(s.boat.serviceAreas[0].serviceArea.translations, lang)
          : null;
        const st = pickByLang(s.translations, lang);
        const allPrices: number[] = [];
        for (const sp of s.packages) {
          const tiers = sp.priceTiers.length ? sp.priceTiers : sp.package.priceTiers;
          for (const t of tiers) {
            const price = t.salePrice ?? t.regularPrice;
            if (price > 0) allPrices.push(price);
          }
        }
        return {
          boatId: s.boatId,
          title: bt?.title || s.boat.name,
          slug: bt?.slug || s.boatId,
          type: s.boat.type,
          area: areaTrans?.name || "",
          cover: s.boat.covers?.[0] || null,
          schedule: {
            scheduleId: s.id,
            departureDate: s.departureDate?.toISOString().slice(0, 10) || "",
            returnDate: s.returnDate?.toISOString().slice(0, 10) || null,
            title: st?.title || bt?.title || s.boat.name,
            route: st?.route || "",
            itinerary: st?.itinerary || "",
            priceMin: allPrices.length ? Math.min(...allPrices) : 0,
            priceMax: allPrices.length ? Math.max(...allPrices) : 0,
          },
        };
      });

      if (tripSuggestions.length > 0) {
        gapResults.push({
          start: gap.start,
          end: gap.end,
          days: gap.days,
          trips: tripSuggestions,
        });
      }
    }

    // ── Contextual blog suggestions ──
    type BlogSuggestion = {
      blogId: string;
      title: string;
      slug: string;
      excerpt: string;
      cover: string | null;
      category: string;
    };
    let blogs: BlogSuggestion[] = [];
    if (planAreaIds.length > 0) {
      const blogsRaw = await prisma.blog.findMany({
        where: {
          status: "PUBLISHED",
          serviceAreaIds: { hasSome: planAreaIds },
        },
        include: {
          translations: {
            where: { lang },
            select: { title: true, slug: true, excerpt: true },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 6,
      });
      blogs = blogsRaw
        .filter((b) => b.translations.length > 0)
        .map((b) => ({
          blogId: b.id,
          title: b.translations[0].title,
          slug: b.translations[0].slug,
          excerpt: b.translations[0].excerpt,
          cover: b.covers?.[0] || null,
          category: b.category || "GENERAL",
        }));
    }

    return NextResponse.json({ gaps: gapResults, blogs });
  } catch (err) {
    console.error("[plan-suggestions]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
