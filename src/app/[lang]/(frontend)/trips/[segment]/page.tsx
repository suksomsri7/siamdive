import { unstable_cache } from "next/cache";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import TripListClient, { type TripListItem } from "@/components/TripListClient";

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

export function generateStaticParams() {
  const langs = ["en", "th", "cn", "ja", "ko", "de", "fr", "ru"];
  const segments = ["daytrip", "snorkeling", "land-tour", "liveaboard", "dive-resort", "freedive"];
  return langs.flatMap(lang => segments.map(segment => ({ lang, segment })));
}

export default async function TripSegmentPage({
  params,
}: {
  params: Promise<{ segment: string }>;
}) {
  const { segment } = await params;
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
  const enTrans = b.translations.find(t => t.lang === "en") || trans;
  const prices = b.priceTiers.map(t => t.salePrice ?? t.regularPrice).filter(p => p > 0);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const area = b.serviceAreas[0]?.serviceArea.translations.find(t => t.lang === "en")
    || b.serviceAreas[0]?.serviceArea.translations[0];

  return (
    <main style={{ background: "#0d0d0d", minHeight: "100vh" }}>
      {/* Hero */}
      <div style={{ position: "relative", height: "55vh", minHeight: 320 }}>
        {b.covers[0]
          ? <Image src={b.covers[0]} alt={enTrans.title} fill className="object-cover" priority sizes="100vw" />
          : <div style={{ width: "100%", height: "100%", background: "linear-gradient(160deg,#0f172a,#1e3a5f)" }} />
        }
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #0d0d0d 0%, rgba(13,13,13,0.3) 60%, transparent 100%)" }} />
      </div>

      {/* Content */}
      <div style={{ maxWidth: 860, margin: "-80px auto 0", padding: "0 24px 80px", position: "relative" }}>
        {area?.name && (
          <p style={{ fontSize: 11, color: "#3b82f6", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>{area.name}</p>
        )}
        <h1 style={{ fontSize: "clamp(1.8rem,5vw,3rem)", fontWeight: 900, lineHeight: 1.1, color: "#fff", marginBottom: 22 }}>{enTrans.title}</h1>

        {minPrice > 0 && (
          <div style={{ display: "inline-block", background: "#111", border: "1px solid #1a1a1a", borderRadius: 12, padding: "12px 22px", marginBottom: 28 }}>
            <p style={{ fontSize: 10, color: "#444", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>ราคาเริ่มต้น</p>
            <p style={{ fontSize: 24, fontWeight: 900, color: "#60a5fa" }}>฿{minPrice.toLocaleString()}</p>
          </div>
        )}

        {enTrans.excerpt && (
          <p style={{ fontSize: 15, color: "#888", lineHeight: 1.8, marginBottom: 28 }}>{enTrans.excerpt}</p>
        )}
        {enTrans.content && (
          <div style={{ color: "#777", fontSize: 14, lineHeight: 1.9 }} dangerouslySetInnerHTML={{ __html: enTrans.content }} />
        )}

        <div style={{ marginTop: 36, display: "flex", gap: 12 }}>
          <a href="https://lin.ee/wayWuGH" target="_blank" rel="noopener noreferrer"
            style={{ background: "#3b82f6", color: "#fff", padding: "13px 32px", borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
            Schedule / Book
          </a>
        </div>
      </div>
    </main>
  );
}
