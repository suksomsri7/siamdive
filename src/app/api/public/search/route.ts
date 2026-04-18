import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/public/search
 *
 * Public trip search. Filters PUBLISHED boats by type, then returns schedules
 * whose departureDate matches the selection.
 *
 * Params:
 *  - type=DAYTRIP|LIVEABOARD (required)
 *  - date=YYYY-MM-DD  → DAYTRIP: exact day match
 *  - month=YYYY-MM    → LIVEABOARD: any schedule in that month
 *
 * Returns: array of { id, departureDate, returnDate, status, boat:{slug,title,cover,area,minPrice,type,lang:"en|th|..."} }
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const typeParam = searchParams.get("type");
  const date      = searchParams.get("date");
  const month     = searchParams.get("month");
  const lang      = searchParams.get("lang") || "en";

  if (typeParam !== "DAYTRIP" && typeParam !== "LIVEABOARD") {
    return NextResponse.json({ error: "type must be DAYTRIP or LIVEABOARD" }, { status: 400 });
  }

  // Build departureDate date-range filter
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

  // DAYTRIP groups: daytrip-ish types; LIVEABOARD groups: liveaboard-ish
  const boatTypes = typeParam === "DAYTRIP"
    ? ["DAYTRIP", "SNORKELING", "LAND_TOUR", "FREEDIVE"]
    : ["LIVEABOARD", "DIVE_RESORT"];

  const schedules = await prisma.schedule.findMany({
    where: {
      status: { in: ["OPEN", "FULL"] },
      departureDate: { gte, lt },
      boat: {
        status: "PUBLISHED",
        type: { in: boatTypes as never[] },
      },
    },
    include: {
      boat: {
        include: {
          translations: { select: { lang: true, title: true, slug: true, excerpt: true } },
          priceTiers:   { select: { regularPrice: true, salePrice: true } },
          serviceAreas: { include: { serviceArea: { include: { translations: { select: { lang: true, name: true } } } } } },
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
    const minPrice = prices.length ? Math.min(...prices) : 0;

    return {
      scheduleId:    s.id,
      departureDate: s.departureDate,
      returnDate:    s.returnDate,
      status:        s.status,
      boat: {
        id:       b.id,
        slug:     bt?.slug || b.id,
        title:    bt?.title || b.name,
        excerpt:  bt?.excerpt || "",
        type:     b.type,
        cover:    b.covers[0] || null,
        area:     area?.name || "",
        minPrice,
      },
    };
  });

  return NextResponse.json(results);
}
