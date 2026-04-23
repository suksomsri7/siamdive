import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const idsParam = req.nextUrl.searchParams.get("ids") || "";
  const lang = req.nextUrl.searchParams.get("lang") || "en";
  const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 20);
  if (!ids.length) return NextResponse.json([]);

  const boats = await prisma.boat.findMany({
    where: { id: { in: ids }, status: "PUBLISHED" },
    include: {
      translations: { select: { lang: true, title: true, slug: true, excerpt: true } },
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

  const result = ordered.map((b) => {
    const bt = b.translations.find((t) => t.lang === lang)
      || b.translations.find((t) => t.lang === "en")
      || b.translations[0];
    const area = b.serviceAreas[0]?.serviceArea.translations.find((t) => t.lang === lang)
      || b.serviceAreas[0]?.serviceArea.translations.find((t) => t.lang === "en")
      || b.serviceAreas[0]?.serviceArea.translations[0];
    const prices = b.priceTiers.map((p) => p.salePrice ?? p.regularPrice).filter((p) => p > 0);
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const isLiveaboard = ["LIVEABOARD", "DIVE_RESORT"].includes(b.type);
    return {
      id: b.id,
      slug: bt?.slug || b.id,
      title: bt?.title || b.name || "",
      destinationName: area?.name || "",
      price: minPrice,
      type: isLiveaboard ? ("LIVEABOARD" as const) : ("DAYTRIP" as const),
      imageUrl: b.covers[0] || undefined,
      covers: b.covers,
      boatType: b.type,
      boatId: b.id,
    };
  });

  return NextResponse.json(result);
}
