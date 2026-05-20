import { notFound, redirect } from "next/navigation";
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
        },
      },
    },
  });

  // Token revoked or never existed — show the plain plan view rather than a
  // 404 so the link still goes somewhere useful.
  if (!row || row.plan.shortId !== shortId) {
    redirect(`/${lang}/plan/${shortId}`);
  }

  const trips = (row.plan.trips as unknown[]) || [];
  const ownerName = row.plan.user.name || row.plan.user.email?.split("@")[0] || null;

  if (!row.plan) notFound();

  return (
    <JoinPlanClient
      lang={lang}
      token={token}
      plan={{
        shortId:     row.plan.shortId,
        name:        row.plan.name,
        coverUrl:    row.plan.coverUrl,
        tripCount:   Array.isArray(trips) ? trips.length : 0,
        memberCount: row.plan._count.members + 1,
        ownerName,
        role:        row.role,
      }}
    />
  );
}
