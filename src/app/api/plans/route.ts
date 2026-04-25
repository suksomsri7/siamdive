import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/plans?deviceId=xxx — get all plans for device
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
        include: { plans: { orderBy: { createdAt: "asc" } } },
      });
      if (!user) {
        return NextResponse.json({ error: "not_found" }, { status: 404 });
      }
    } else {
      user = await prisma.planUser.findUnique({
        where: { deviceId: deviceId! },
        include: { plans: { orderBy: { createdAt: "asc" } } },
      });
      if (!user) {
        return NextResponse.json({ deviceId, plans: [], email: null });
      }
    }

    return NextResponse.json({
      deviceId: user.deviceId,
      email: user.email,
      plans: user.plans.map((p) => ({
        id: p.id,
        name: p.name,
        startDate: p.startDate,
        trips: p.trips,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
    });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// POST /api/plans — init device + create first plan, or create additional plan
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { deviceId, name, startDate, trips } = body as {
      deviceId: string;
      name?: string;
      startDate?: string | null;
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
        startDate: startDate || null,
        trips: (trips as never) || [],
      },
    });

    return NextResponse.json({
      id: plan.id,
      name: plan.name,
      startDate: plan.startDate,
      trips: plan.trips,
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
