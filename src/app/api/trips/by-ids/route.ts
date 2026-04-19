import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public, read-only lookup for boat cards by ID. Used by the homepage
// "Recently Viewed" row which reads IDs from localStorage and asks the
// server to hydrate minimal card data for them.
//
// Capped at 20 IDs per request to bound the query.

export async function GET(req: NextRequest) {
  const idsParam = req.nextUrl.searchParams.get("ids") || "";
  const lang = req.nextUrl.searchParams.get("lang") || "en";
  const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 20);
  if (!ids.length) return NextResponse.json([]);

  const boats = await prisma.boat.findMany({
    where: { id: { in: ids } },
    include: {
      translations: { select: { lang: true, title: true, slug: true } },
      priceTiers: { select: { regularPrice: true, salePrice: true } },
      serviceAreas: {
        include: {
          serviceArea: { include: { translations: { select: { lang: true, name: true } } } },
        },
      },
    },
  });

  const byId = new Map(boats.map((b) => [b.id, b]));
  const ordered = ids.map((id) => byId.get(id)).filter((b): b is (typeof boats)[number] => !!b);

  const result = ordered.map((boat) => {
    const bt =
      boat.translations.find((t) => t.lang === lang) ||
      boat.translations.find((t) => t.lang === "en") ||
      boat.translations[0];
    const prices = boat.priceTiers.map((p) => p.salePrice ?? p.regularPrice).filter((p) => p > 0);
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const area =
      boat.serviceAreas[0]?.serviceArea.translations.find((t) => t.lang === lang) ||
      boat.serviceAreas[0]?.serviceArea.translations.find((t) => t.lang === "en") ||
      boat.serviceAreas[0]?.serviceArea.translations[0];
    const isLiveaboard = ["LIVEABOARD", "DIVE_RESORT"].includes(boat.type);
    return {
      id: boat.id,
      slug: bt?.slug || boat.id,
      title: bt?.title || boat.name || "",
      price: minPrice,
      type: isLiveaboard ? "LIVEABOARD" : "DAYTRIP",
      destinationName: area?.name || "",
      imageUrl: boat.covers[0] || undefined,
      covers: boat.covers,
      boatType: boat.type,
    };
  });

  return NextResponse.json(result);
}
