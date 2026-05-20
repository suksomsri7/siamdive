import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import JoinPlanClient from "./JoinPlanClient";

type Params = { lang: string; shortId: string };
type Search = { t?: string };

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Join trip plan — SiamDive",
  robots: "noindex, nofollow",
};

export default async function JoinPlanPage({
  params, searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  const { lang, shortId } = await params;
  const { t: token } = await searchParams;

  // No token → bounce to the public plan view (read-only). Recipients without
  // a token can still see the plan but they can't become a member by accident.
  if (!token) redirect(`/${lang}/plan/${shortId}`);

  const row = await prisma.planShareToken.findUnique({
    where: { token },
    include: {
      plan: {
        include: {
          user: { select: { email: true, name: true } },
          _count: { select: { members: true } },
          items: { orderBy: [{ startAt: "asc" }, { order: "asc" }] },
        },
      },
    },
  });

  // Token revoked / mismatched → fall through to the plain plan view rather
  // than a 404 so the link still goes somewhere useful.
  if (!row || row.plan.shortId !== shortId) {
    redirect(`/${lang}/plan/${shortId}`);
  }

  // Bump the social view counter once per join-page load. Best-effort,
  // doesn't block the render.
  prisma.userPlan.update({
    where: { id: row.plan.id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => {});

  const trips = (row.plan.trips as unknown[]) || [];
  const ownerName = row.plan.user.name || row.plan.user.email?.split("@")[0] || null;
  const items = row.plan.items.map(i => ({
    id: i.id,
    type: i.type,
    title: i.title,
    location: i.location,
    startAt: i.startAt.toISOString(),
    endAt: i.endAt?.toISOString() ?? null,
    externalUrl: i.externalUrl,
    bookingRef: i.bookingRef,
    cost: i.cost,
    currency: i.currency,
    source: i.source,
    notes: i.notes,
    order: i.order,
  }));

  return (
    <JoinPlanClient
      lang={lang}
      token={token}
      plan={{
        id:          row.plan.id,
        shortId:     row.plan.shortId,
        name:        row.plan.name,
        coverUrl:    row.plan.coverUrl,
        status:      row.plan.status,
        trips:       trips as unknown[],
        items,
        tripCount:   Array.isArray(trips) ? trips.length : 0,
        memberCount: row.plan._count.members + 1,
        followerCount: row.plan._count.members,
        viewCount:    row.plan.viewCount + 1,
        shareCount:   row.plan.shareCount,
        ownerName,
        role:        row.role,
        createdAt:   row.plan.createdAt.toISOString(),
      }}
    />
  );
}
