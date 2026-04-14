import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import TripListClient, { type TripListItem } from "@/components/TripListClient";

const TYPE_MAP: Record<string, string> = {
  "scuba":    "SCUBA_COURSES",
  "freedive": "FREEDIVE_COURSES",
};

const TYPE_LABEL: Record<string, string> = {
  "scuba":    "Scuba Diving Courses",
  "freedive": "Freedive Courses",
};

export default async function CoursesTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const boatType = TYPE_MAP[type];
  if (!boatType) return notFound();

  const boats = await prisma.boat.findMany({
    where: { type: boatType as never, status: "PUBLISHED" },
    include: {
      translations: { select: { lang: true, title: true, slug: true, excerpt: true } },
      priceTiers:   { select: { regularPrice: true, salePrice: true } },
      serviceAreas: { include: { serviceArea: { include: { translations: { select: { lang: true, name: true } } } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const trips: TripListItem[] = boats.map(b => {
    const trans = b.translations.find(t => t.lang === "en") || b.translations[0];
    const prices = b.priceTiers.map(t => t.salePrice ?? t.regularPrice).filter(p => p > 0);
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const area = b.serviceAreas[0]?.serviceArea.translations.find(t => t.lang === "en")
      || b.serviceAreas[0]?.serviceArea.translations[0];

    return {
      id: b.id,
      slug: trans?.slug || b.id,
      title: trans?.title || b.name,
      price: minPrice,
      duration: "",
      type: "DAYTRIP",
      destinationName: area?.name || "",
      imageUrl: b.covers[0] || undefined,
      description: trans?.excerpt || undefined,
      nextDeparture: null,
      nextStatus: null,
    };
  });

  return (
    <main style={{ background: "#0d0d0d", minHeight: "100vh" }}>
      <TripListClient label={TYPE_LABEL[type]} trips={trips} />
    </main>
  );
}
