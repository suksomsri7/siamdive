import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import TripListClient, { type TripListItem } from "@/components/TripListClient";
import TripDetailPage from "@/components/TripDetailPage";

const SEGMENT_TO_TYPE: Record<string, string> = {
  "daytrip":    "DAYTRIP",
  "snorkeling": "SNORKELING",
  "land-tour":  "LAND_TOUR",
  "liveaboard": "LIVEABOARD",
  "dive-resort":"DIVE_RESORT",
  "freedive":   "FREEDIVE",
};

const TYPE_LABEL: Record<string, string> = {
  "daytrip":    "Scuba Day Trips",
  "snorkeling": "Snorkeling",
  "land-tour":  "Land Tour",
  "liveaboard": "Liveaboard",
  "dive-resort":"Dive Resort",
  "freedive":   "Freedive Trips",
};

function boatToListItem(b: {
  id: string; name: string; type: string; covers: string[];
  translations: { lang: string; title: string; slug: string; excerpt: string }[];
  priceTiers: { regularPrice: number; salePrice: number | null }[];
  serviceAreas: { serviceArea: { translations: { lang: string; name: string }[] } }[];
  schedules: { departureDate: Date | null; returnDate: Date | null; status: string }[];
}): TripListItem {
  const trans = b.translations.find(t => t.lang === "en") || b.translations[0];
  const prices = b.priceTiers.map(t => t.salePrice ?? t.regularPrice).filter(p => p > 0);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const area = b.serviceAreas[0]?.serviceArea.translations.find(t => t.lang === "en")
    || b.serviceAreas[0]?.serviceArea.translations[0];
  const next = b.schedules[0];

  // Prisma 7 + adapter-pg returns dates as ISO strings, not Date objects.
  // Normalize defensively so this works regardless of which form Prisma yields.
  const depDate = next?.departureDate ? new Date(next.departureDate) : null;
  const retDate = next?.returnDate ? new Date(next.returnDate) : null;

  let duration = "";
  if (depDate && retDate) {
    const days = Math.round((retDate.getTime() - depDate.getTime()) / 86400000);
    duration = `${days + 1}D${days}N`;
  } else if (["DAYTRIP", "SNORKELING", "LAND_TOUR"].includes(b.type)) {
    duration = "1 Day";
  }

  return {
    id: b.id,
    slug: trans?.slug || b.id,
    title: trans?.title || b.name,
    price: minPrice,
    duration,
    type: ["LIVEABOARD", "DIVE_RESORT"].includes(b.type) ? "LIVEABOARD" : "DAYTRIP",
    destinationName: area?.name || "",
    imageUrl: b.covers[0] || undefined,
    description: trans?.excerpt || undefined,
    nextDeparture: depDate?.toISOString() ?? null,
    nextStatus: next?.status ?? null,
  };
}

const getBoatsByType = unstable_cache(
  async (boatType: string) => prisma.boat.findMany({
    where: { type: boatType as never, status: "PUBLISHED" },
    include: {
      translations: { select: { lang: true, title: true, slug: true, excerpt: true } },
      priceTiers:   { select: { regularPrice: true, salePrice: true } },
      serviceAreas: { include: { serviceArea: { include: { translations: { select: { lang: true, name: true } } } } } },
      schedules: {
        where: { status: { in: ["OPEN", "FULL"] }, departureDate: { gte: new Date() } },
        orderBy: { departureDate: "asc" },
        take: 1,
        select: { departureDate: true, returnDate: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  }),
  ["boats-by-type"],
  { revalidate: 60 },
);

export const dynamic = "force-dynamic";

export default async function TripSegmentPage({
  params,
}: {
  params: Promise<{ lang: string; segment: string }>;
}) {
  const { lang, segment } = await params;
  const boatType = SEGMENT_TO_TYPE[segment];

  // ── Listing page ────────────────────────────────────────────────────────────
  if (boatType) {
    const boats = await getBoatsByType(boatType);
    const trips = boats.map(boatToListItem);

    return (
      <main style={{ background: "#0d0d0d", minHeight: "100vh" }}>
        <TripListClient label={TYPE_LABEL[segment]} trips={trips} />
      </main>
    );
  }

  // ── Individual trip detail by slug ──────────────────────────────────────────
  const trans = await prisma.boatTranslation.findFirst({
    where: { slug: segment },
    include: {
      boat: {
        include: {
          translations: true,
          priceTiers:   { select: { regularPrice: true, salePrice: true } },
          serviceAreas: { include: { serviceArea: { include: { translations: true } } } },
        },
      },
    },
  });

  if (!trans || trans.boat.status !== "PUBLISHED") return notFound();

  const b = trans.boat;
  const langTrans = b.translations.find(t => t.lang === lang)
    || b.translations.find(t => t.lang === "en")
    || trans;
  const prices = b.priceTiers.map(t => t.salePrice ?? t.regularPrice).filter(p => p > 0);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const area = b.serviceAreas[0]?.serviceArea.translations.find(t => t.lang === lang)
    || b.serviceAreas[0]?.serviceArea.translations.find(t => t.lang === "en")
    || b.serviceAreas[0]?.serviceArea.translations[0];

  const trip = {
    slug:            langTrans.slug,
    title:           langTrans.title,
    description:     langTrans.excerpt || undefined,
    price:           minPrice,
    duration:        "",
    type:            (["LIVEABOARD", "DIVE_RESORT"].includes(b.type) ? "LIVEABOARD" : "DAYTRIP") as "LIVEABOARD" | "DAYTRIP",
    destinationName: area?.name || "",
    imageUrl:        b.covers[0] || undefined,
    boatId:          b.id,
  };

  return (
    <main style={{ background: "#0d0d0d", minHeight: "100vh" }}>
      <TripDetailPage trip={trip} lang={lang} />
    </main>
  );
}
