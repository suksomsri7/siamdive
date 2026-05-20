import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ token: string }> };

// GET /api/plans/share/[token] — public preview the join page renders so the
// recipient sees what they're joining before submitting name + email. No
// secrets leak: just the plan name, cover, trip count, owner display name,
// and the role the token will grant.
export async function GET(_req: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;
  try {
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
    if (!row) return NextResponse.json({ error: "token_not_found" }, { status: 404 });

    const trips = (row.plan.trips as unknown[]) || [];
    const ownerName = row.plan.user.name || row.plan.user.email?.split("@")[0] || null;

    return NextResponse.json({
      shortId:     row.plan.shortId,
      name:        row.plan.name,
      coverUrl:    row.plan.coverUrl,
      tripCount:   Array.isArray(trips) ? trips.length : 0,
      memberCount: row.plan._count.members + 1,
      ownerName,
      role:        row.role,
    });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
