import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

async function verifyOwner(planId: string, deviceId: string) {
  const user = await prisma.planUser.findUnique({ where: { deviceId } });
  if (!user) return false;
  const plan = await prisma.userPlan.findFirst({ where: { id: planId, userId: user.id } });
  return !!plan;
}

// POST /api/plans/[id]/members — invite member
export async function POST(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const { deviceId, email, name, role } = (await req.json()) as {
      deviceId: string; email: string; name?: string; role?: string;
    };

    if (!deviceId || !email) {
      return NextResponse.json({ error: "deviceId and email required" }, { status: 400 });
    }

    if (!(await verifyOwner(id, deviceId))) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const normalized = email.toLowerCase().trim();
    const validRole = role === "EDITOR" ? "EDITOR" : "VIEWER";

    const member = await prisma.planMember.upsert({
      where: { planId_email: { planId: id, email: normalized } },
      update: { name, role: validRole },
      create: { planId: id, email: normalized, name, role: validRole },
    });

    await prisma.planActivity.create({
      data: { planId: id, action: "MEMBER_ADDED", actorEmail: deviceId, detail: { email: normalized, role: validRole } },
    });

    return NextResponse.json({
      id: member.id, email: member.email, name: member.name,
      role: member.role, joinedAt: member.joinedAt.toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// DELETE /api/plans/[id]/members?deviceId=xxx&email=xxx — remove member
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const deviceId = req.nextUrl.searchParams.get("deviceId");
    const email = req.nextUrl.searchParams.get("email");

    if (!deviceId || !email) {
      return NextResponse.json({ error: "deviceId and email required" }, { status: 400 });
    }

    if (!(await verifyOwner(id, deviceId))) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    await prisma.planMember.deleteMany({ where: { planId: id, email: email.toLowerCase().trim() } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
