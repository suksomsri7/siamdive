import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/public/search
 *
 * Public trip search.
 *
 * Params:
 *  - type=DAYTRIP|LIVEABOARD (required)
 *  - date=YYYY-MM-DD  → DAYTRIP: exact day match
 *  - month=YYYY-MM    → LIVEABOARD: any schedule in that month
 *  - serviceAreaId=... → optional; restrict to boats in that area
 *  - lang=en|th|...    → pick translation language
 *
 * Returns schedule rows, each with boat info and inline package list so the
 * UI can show price breakdowns without a second round trip.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const typeParam       = searchParams.get("type");
  const date            = searchParams.get("date");
  const month           = searchParams.get("month");
  const serviceAreaId   = searchParams.get("serviceAreaId");
  const lang            = searchParams.get("lang") || "en";

  if (typeParam !== "DAYTRIP" && typeParam !== "LIVEABOARD") {
    return NextResponse.json({ error: "type must be DAYTRIP or LIVEABOARD" }, { status: 400 });
  }

  let gte: Date | undefined;
  let lt:  Date | undefined;
  if (typeParam === "DAYTRIP") {
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "date=YYYY-MM-DD is required for DAYTRIP" }, { status: 400 });
    }
    gte = new Date(`${date}T00:00:00.000Z`);
    lt  = new Date(`${date}T23:59:59.999Z`);
  } else {
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: "month=YYYY-MM is required for LIVEABOARD" }, { status: 400 });
    }
    const [y, m] = month.split("-").map(Number);
    gte = new Date(Date.UTC(y, m - 1, 1));
    lt  = new Date(Date.UTC(y, m, 1));
  }

  const boatTypes = typeParam === "DAYTRIP"
    ? ["DAYTRIP", "SNORKELING", "LAND_TOUR", "FREEDIVE"]
    : ["LIVEABOARD", "DIVE_RESORT"];

  const boatWhere: Record<string, unknown> = {
    status: "PUBLISHED",
    type: { in: boatTypes },
  };
  if (serviceAreaId) {
    boatWhere.serviceAreas = { some: { serviceAreaId } };
  }

  const schedules = await prisma.schedule.findMany({
    where: {
      status: { in: ["OPEN", "FULL"] },
      departureDate: { gte, lt },
      boat: boatWhere,
    },
    include: {
      translations: { select: { lang: true, title: true } },
      boat: {
        include: {
          translations: { select: { lang: true, title: true, slug: true, excerpt: true } },
          priceTiers:   { select: { regularPrice: true, salePrice: true } },
          serviceAreas: { include: { serviceArea: { include: { translations: { select: { lang: true, name: true } } } } } },
        },
      },
      packages: {
        include: {
          package: {
            include: {
              translations: { select: { lang: true, title: true } },
              priceTiers:   { select: { regularPrice: true, salePrice: true } },
            },
          },
          priceTiers: true,
        },
      },
    },
    orderBy: { departureDate: "asc" },
    take: 50,
  });

  const pick = <T extends { lang: string }>(arr: T[]) =>
    arr.find(t => t.lang === lang) || arr.find(t => t.lang === "en") || arr[0];

  const results = schedules.map(s => {
    const b = s.boat;
    const bt = pick(b.translations);
    const area = b.serviceAreas[0]?.serviceArea
      ? pick(b.serviceAreas[0].serviceArea.translations)
      : null;
    const prices = b.priceTiers.map(p => p.salePrice ?? p.regularPrice).filter(p => p > 0);
    const boatMinPrice = prices.length ? Math.min(...prices) : 0;

    const packages = s.packages.map(sp => {
      const pt = pick(sp.package.translations);
      // Prefer schedule-package overrides; fall back to package defaults.
      const overrides = sp.priceTiers
        .map(t => t.salePrice ?? t.regularPrice)
        .filter(p => p > 0);
      const defaults = sp.package.priceTiers
        .map(t => t.salePrice ?? t.regularPrice)
        .filter(p => p > 0);
      const effective = overrides.length ? overrides : defaults;
      const minPrice = effective.length ? Math.min(...effective) : 0;
      return {
        id:             sp.package.id,
        title:          pt?.title || sp.package.name,
        availableSeats: sp.availableSeats,
        isFull:         sp.isFull,
        minPrice,
      };
    });

    const scheduleTitle = pick(s.translations)?.title || null;

    return {
      scheduleId:    s.id,
      scheduleTitle,
      departureDate: s.departureDate,
      returnDate:    s.returnDate,
      status:        s.status,
      boat: {
        id:        b.id,
        slug:      bt?.slug || b.id,
        title:     bt?.title || b.name,
        excerpt:   bt?.excerpt || "",
        type:      b.type,
        cover:     b.covers[0] || null,
        area:      area?.name || "",
        minPrice:  boatMinPrice,
      },
      packages,
    };
  });

  return NextResponse.json(results);
}
