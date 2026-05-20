import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ItineraryPageClient from "./ItineraryPageClient";
import SharedPlanClient from "./SharedPlanClient";

type Params = { lang: string; shortId: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { shortId } = await params;

  const itinerary = await prisma.itinerary.findUnique({ where: { shortId } });
  if (itinerary) {
    const title = `${itinerary.title} — SiamDive Trip Plan`;
    const description = `${itinerary.durationDays}-day dive trip plan: ${itinerary.areas.join(", ")}. ${itinerary.totalDives} dives, ${itinerary.totalTours} tours.`;
    const ogImage = `/api/og/plan?id=${shortId}`;
    return {
      title, description,
      openGraph: { title, description, type: "article", images: [{ url: ogImage, width: 1200, height: 630 }] },
      twitter: { card: "summary_large_image", title, description, images: [ogImage] },
      robots: itinerary.viewCount >= 5 ? "index, follow" : "noindex, nofollow",
    };
  }

  const userPlan = await prisma.userPlan.findUnique({ where: { shortId } });
  if (userPlan) {
    const title = `${userPlan.name} — SiamDive`;
    return { title, robots: "noindex, nofollow" };
  }

  return { title: "Plan Not Found" };
}

export default async function PlanPage({ params }: { params: Promise<Params> }) {
  const { lang, shortId } = await params;

  // Try AI-generated itinerary first
  const itinerary = await prisma.itinerary.findUnique({ where: { shortId } });
  if (itinerary && itinerary.expiresAt >= new Date()) {
    await prisma.itinerary.update({
      where: { shortId },
      data: { viewCount: { increment: 1 } },
    });

    const boatIds = itinerary.boatIds || [];
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
          shortId: itinerary.shortId,
          title: itinerary.title,
          lang: itinerary.lang,
          days: itinerary.days as any,
          budget: itinerary.budget as any,
          areas: itinerary.areas,
          durationDays: itinerary.durationDays,
          totalDives: itinerary.totalDives,
          totalTours: itinerary.totalTours,
          viewCount: itinerary.viewCount + 1,
          createdAt: itinerary.createdAt.toISOString(),
        }}
        boatMap={boatMap}
        currentLang={lang}
      />
    );
  }

  // Try collaborative UserPlan
  const userPlan = await prisma.userPlan.findUnique({
    where: { shortId },
    include: {
      user: { select: { name: true, email: true } },
      members: { select: { id: true, email: true, name: true, role: true } },
    },
  });
  if (!userPlan) notFound();

  // Bump the social view counter once per page load. Best-effort — never
  // block the render. Owner re-views still count for MVP; refine later
  // if abuse becomes a concern.
  prisma.userPlan.update({
    where: { id: userPlan.id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => {});

  const trips = (userPlan.trips as any[]) || [];

  return (
    <SharedPlanClient
      plan={{
        shortId: userPlan.shortId,
        name: userPlan.name,
        coverUrl: userPlan.coverUrl,
        status: userPlan.status,
        trips,
        ownerName: userPlan.user.name || userPlan.user.email?.split("@")[0] || null,
        followerCount: userPlan.members.length,
        viewCount:     userPlan.viewCount + 1,
        shareCount:    userPlan.shareCount,
        createdAt: userPlan.createdAt.toISOString(),
      }}
      currentLang={lang}
    />
  );
}
