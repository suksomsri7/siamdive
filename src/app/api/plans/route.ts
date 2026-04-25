import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function planJson(p: {
  id: string; shortId: string; name: string; coverUrl: string | null;
  status: string; trips: unknown;
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
    mediaCount: p._count?.media ?? 0,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

// GET /api/plans?deviceId=xxx — get all plans for device (owned + member-of)
// GET /api/plans?email=xxx  — recover plans by email
export async function GET(req: NextRequest) {
  const deviceId = req.nextUrl.searchParams.get("deviceId");
  const email = req.nextUrl.searchParams.get("email");

  if (!deviceId && !email) {
    return NextResponse.json({ error: "deviceId or email required" }, { status: 400 });
  }

  try {
    let user;

    if (email) {
      user = await prisma.planUser.findFirst({
        where: { email: email.toLowerCase().trim() },
      });
      if (!user) {
        return NextResponse.json({ error: "not_found" }, { status: 404 });
      }
    } else {
      user = await prisma.planUser.findUnique({ where: { deviceId: deviceId! } });
      if (!user) {
        return NextResponse.json({ deviceId, plans: [], email: null });
      }
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
