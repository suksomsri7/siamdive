import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function planJson(p: {
  id: string; shortId: string; name: string; coverUrl: string | null;
  status: string; trips: unknown;
  viewCount?: number; shareCount?: number;
  createdAt: Date; updatedAt: Date;
  _count?: { members: number; media: number };
}) {
  return {
    id: p.id,
    shortId: p.shortId,
    name: p.name,
    coverUrl: p.coverUrl,
    status: p.status,
    trips: p.trips,
    memberCount: p._count?.members ?? 0,
    mediaCount:  p._count?.media   ?? 0,
    viewCount:   p.viewCount  ?? 0,
    shareCount:  p.shareCount ?? 0,
    createdAt:   p.createdAt.toISOString(),
    updatedAt:   p.updatedAt.toISOString(),
  };
}

// GET /api/plans?deviceId=xxx — get all plans for device (owned + member-of)
//
// The legacy ?email= recovery branch is intentionally removed: it returned the
// matched user's deviceId (a bearer credential) to anyone who knew an email,
// with no verification — an account-takeover path. Cross-device recovery, if
// revived, must go through a verified magic-link flow (needs email infra).
export async function GET(req: NextRequest) {
  const deviceId = req.nextUrl.searchParams.get("deviceId");

  if (!deviceId) {
    return NextResponse.json({ error: "deviceId required" }, { status: 400 });
  }

  try {
    const user = await prisma.planUser.findUnique({ where: { deviceId } });
    if (!user) {
      return NextResponse.json({ deviceId, plans: [], email: null });
    }

    // Own plans
    const ownPlans = await prisma.userPlan.findMany({
      where: { userId: user.id },
      include: { _count: { select: { members: true, media: true } } },
      orderBy: { createdAt: "asc" },
    });

    // Plans where user is a member (invited)
    const memberEmail = user.email;
    let memberPlans: typeof ownPlans = [];
    if (memberEmail) {
      const memberships = await prisma.planMember.findMany({
        where: { email: memberEmail },
        select: { planId: true },
      });
      const memberPlanIds = memberships.map((m) => m.planId);
      const ownPlanIds = new Set(ownPlans.map((p) => p.id));
      const otherIds = memberPlanIds.filter((id) => !ownPlanIds.has(id));
      if (otherIds.length > 0) {
        memberPlans = await prisma.userPlan.findMany({
          where: { id: { in: otherIds } },
          include: { _count: { select: { members: true, media: true } } },
          orderBy: { createdAt: "asc" },
        });
      }
    }

    return NextResponse.json({
      deviceId: user.deviceId,
      email: user.email,
      plans: [...ownPlans, ...memberPlans].map(planJson),
    });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// POST /api/plans — create a new plan
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { deviceId, name, trips } = body as {
      deviceId: string;
      name?: string;
      trips?: unknown[];
    };

    if (!deviceId) {
      return NextResponse.json({ error: "deviceId required" }, { status: 400 });
    }

    let user = await prisma.planUser.findUnique({ where: { deviceId } });
    if (!user) {
      user = await prisma.planUser.create({ data: { deviceId } });
    }

    const plan = await prisma.userPlan.create({
      data: {
        userId: user.id,
        name: name || "My Plan",
        trips: (trips as never) || [],
      },
      include: { _count: { select: { members: true, media: true } } },
    });

    return NextResponse.json(planJson(plan));
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
