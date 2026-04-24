import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ItineraryPageClient from "./ItineraryPageClient";

type Params = { lang: string; shortId: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { shortId } = await params;
  const plan = await prisma.itinerary.findUnique({ where: { shortId } });
  if (!plan) return { title: "Plan Not Found" };

  const title = `${plan.title} — SiamDive Trip Plan`;
  const description = `${plan.durationDays}-day dive trip plan: ${plan.areas.join(", ")}. ${plan.totalDives} dives, ${plan.totalTours} tours.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary_large_image", title, description },
    robots: plan.viewCount >= 5 ? "index, follow" : "noindex, nofollow",
  };
}

export default async function ItineraryPage({ params }: { params: Promise<Params> }) {
  const { lang, shortId } = await params;

  const plan = await prisma.itinerary.findUnique({ where: { shortId } });
  if (!plan || plan.expiresAt < new Date()) notFound();

  await prisma.itinerary.update({
    where: { shortId },
    data: { viewCount: { increment: 1 } },
  });

  const boatIds = plan.boatIds || [];
  const boats = boatIds.length
    ? await prisma.boat.findMany({
        where: { id: { in: boatIds } },
        include: {
          translations: { select: { lang: true, title: true, slug: true, excerpt: true } },
          priceTiers: { select: { regularPrice: true, salePrice: true } },
          serviceAreas: { include: { serviceArea: { include: { translations: { select: { lang: true, name: true } } } } } },
        },
      })
    : [];

  const pick = <T extends { lang: string }>(arr: T[]) =>
    arr.find(t => t.lang === lang) || arr.find(t => t.lang === "en") || arr[0];

  const boatMap: Record<string, { title: string; slug: string; cover: string | null; area: string; minPrice: number; type: string }> = {};
  for (const b of boats) {
    const t = pick(b.translations);
    const area = b.serviceAreas[0]?.serviceArea ? pick(b.serviceAreas[0].serviceArea.translations) : null;
    const prices = b.priceTiers.map(p => p.salePrice ?? p.regularPrice).filter(p => p > 0);
    boatMap[b.id] = {
      title: t?.title || b.name,
      slug: t?.slug || b.id,
      cover: b.covers[0] || null,
      area: (area as any)?.name || "",
      minPrice: prices.length ? Math.min(...prices) : 0,
      type: b.type,
    };
  }

  return (
    <ItineraryPageClient
      plan={{
        shortId: plan.shortId,
        title: plan.title,
        lang: plan.lang,
        days: plan.days as any,
        budget: plan.budget as any,
        areas: plan.areas,
        durationDays: plan.durationDays,
        totalDives: plan.totalDives,
        totalTours: plan.totalTours,
        viewCount: plan.viewCount + 1,
        createdAt: plan.createdAt.toISOString(),
      }}
      boatMap={boatMap}
      currentLang={lang}
    />
  );
}
