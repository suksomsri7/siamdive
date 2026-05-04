import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Thai province ISO 3166-2 subdivision codes → diving coast region.
// Vercel sends these via x-vercel-ip-country-region header.
const PROVINCE_TO_COAST: Record<string, string> = {
  // Andaman coast
  "83": "andaman", // Phuket
  "82": "andaman", // Phang Nga
  "81": "andaman", // Krabi
  "92": "andaman", // Trang
  "91": "andaman", // Satun
  "85": "andaman", // Ranong
  // Gulf of Thailand
  "84": "gulf", // Surat Thani
  "86": "gulf", // Chumphon
  "80": "gulf", // Nakhon Si Thammarat
  "77": "gulf", // Prachuap Khiri Khan
  // Eastern seaboard
  "20": "east", // Chonburi
  "21": "east", // Rayong
  "23": "east", // Trat
  "22": "east", // Chanthaburi
};

const COAST_PATTERNS: Record<string, RegExp> = {
  andaman: /similan|surin|phi phi|lanta|hin daeng|hin muang|richelieu|andaman|racha|koh haa|rok|phuket|krabi|phang nga|trang|satun|ranong|mergui|myanmar|burma|เกาะพีพี|สิมิลัน|ราชา|หลีเป๊ะ|อันดามัน/i,
  gulf: /tao|samui|ang thong|chumphon|sail rock|gulf|nang yuan|phangan|เต่า|สมุย|อ่างทอง|ชุมพร|พะงัน/i,
  east: /chang|pattaya|sattahip|chonburi|rayong|trat|samed|ช้าง|พัทยา|สัตหีบ|เสม็ด/i,
};

export async function GET(req: NextRequest) {
  const lang = req.nextUrl.searchParams.get("lang") || "en";

  const country =
    req.headers.get("x-vercel-ip-country") ??
    req.headers.get("cf-ipcountry") ??
    null;
  const region = req.headers.get("x-vercel-ip-country-region") ?? null;

  if (!country) return NextResponse.json([]);

  let coast: string | null = null;
  if (country === "TH" && region) {
    coast = PROVINCE_TO_COAST[region] ?? null;
  } else if (country === "TH") {
    coast = null;
  } else {
    return NextResponse.json([]);
  }

  if (!coast) return NextResponse.json([]);

  const allAreas = await prisma.serviceArea.findMany({
    include: { translations: { select: { lang: true, name: true } } },
  });

  const pattern = COAST_PATTERNS[coast];
  const matchingAreaIds = allAreas
    .filter((a) => a.translations.some((t) => pattern.test(t.name)))
    .map((a) => a.id);

  if (matchingAreaIds.length === 0) return NextResponse.json([]);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const boats = await prisma.boat.findMany({
    where: {
      status: "PUBLISHED",
      serviceAreas: { some: { serviceAreaId: { in: matchingAreaIds } } },
    },
    include: {
      translations: {
        select: { lang: true, title: true, slug: true, excerpt: true },
      },
      priceTiers: { select: { regularPrice: true, salePrice: true } },
      serviceAreas: {
        include: {
          serviceArea: {
            include: { translations: { select: { lang: true, name: true } } },
          },
        },
      },
    },
    take: 20,
  });

  const nextSchedules = await prisma.schedule.findMany({
    where: {
      boatId: { in: boats.map((b) => b.id) },
      departureDate: { gte: startOfToday },
      status: { not: "CANCELLED" },
    },
    orderBy: { departureDate: "asc" },
    select: { boatId: true, departureDate: true },
  });

  const nextDepByBoat = new Map<string, string>();
  for (const s of nextSchedules) {
    if (!nextDepByBoat.has(s.boatId) && s.departureDate) {
      nextDepByBoat.set(s.boatId, s.departureDate.toISOString());
    }
  }

  const withDep = boats.filter((b) => nextDepByBoat.has(b.id));
  const withoutDep = boats.filter((b) => !nextDepByBoat.has(b.id));
  const sorted = [...withDep, ...withoutDep].slice(0, 10);

  const pick = <T extends { lang: string }>(arr: T[]) =>
    arr.find((t) => t.lang === lang) ||
    arr.find((t) => t.lang === "en") ||
    arr[0];

  const result = sorted.map((b) => {
    const bt = pick(b.translations);
    const area = pick(
      b.serviceAreas[0]?.serviceArea.translations ?? [],
    );
    const prices = b.priceTiers
      .map((p) => p.salePrice ?? p.regularPrice)
      .filter((p) => p > 0);
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
      nextDeparture: nextDepByBoat.get(b.id) || undefined,
    };
  });

  return NextResponse.json(result, {
    headers: { "Cache-Control": "private, max-age=300" },
  });
}
