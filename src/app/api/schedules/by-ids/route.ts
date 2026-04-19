import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public, read-only lookup for schedule cards by ID. Used by the homepage
// Recently Viewed row, which stores scheduleIds in localStorage and asks
// the server to hydrate minimal card data (schedule title, boat name,
// departure date, cover).
//
// Filters out past / DRAFT / CANCELLED / COMPLETED so the user only sees
// still-bookable trips in their history. Capped at 20 IDs per request.

export async function GET(req: NextRequest) {
  const idsParam = req.nextUrl.searchParams.get("ids") || "";
  const lang = req.nextUrl.searchParams.get("lang") || "en";
  const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 20);
  if (!ids.length) return NextResponse.json([]);

  const schedules = await prisma.schedule.findMany({
    where: {
      id: { in: ids },
      departureDate: { gte: new Date() },
      status: { in: ["OPEN", "FULL"] },
    },
    include: {
      translations: { select: { lang: true, title: true } },
      boat: {
        include: {
          translations: { select: { lang: true, title: true, slug: true } },
          priceTiers: { select: { regularPrice: true, salePrice: true } },
        },
      },
    },
  });

  const byId = new Map(schedules.map((s) => [s.id, s]));
  const ordered = ids
    .map((id) => byId.get(id))
    .filter((s): s is (typeof schedules)[number] => !!s);

  const result = ordered.map((s) => {
    const bt =
      s.boat.translations.find((t) => t.lang === lang) ||
      s.boat.translations.find((t) => t.lang === "en") ||
      s.boat.translations[0];
    const st =
      s.translations.find((t) => t.lang === lang) ||
      s.translations.find((t) => t.lang === "en") ||
      s.translations[0];
    const prices = s.boat.priceTiers.map((p) => p.salePrice ?? p.regularPrice).filter((p) => p > 0);
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const isLiveaboard = ["LIVEABOARD", "DIVE_RESORT"].includes(s.boat.type);
    return {
      id: s.id,
      scheduleTitle: st?.title || "",
      slug: bt?.slug || s.boat.id,
      title: bt?.title || s.boat.name || "",
      price: minPrice,
      type: isLiveaboard ? ("LIVEABOARD" as const) : ("DAYTRIP" as const),
      imageUrl: s.boat.covers[0] || undefined,
      covers: s.boat.covers,
      boatType: s.boat.type,
      boatId: s.boat.id,
      departureDate: s.departureDate ? s.departureDate.toISOString() : undefined,
    };
  });

  return NextResponse.json(result);
}
