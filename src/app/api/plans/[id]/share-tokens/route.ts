import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

async function verifyOwner(planId: string, deviceId: string) {
  const user = await prisma.planUser.findUnique({ where: { deviceId } });
  if (!user) return false;
  const plan = await prisma.userPlan.findFirst({ where: { id: planId, userId: user.id } });
  return !!plan;
}

// POST /api/plans/[id]/share-tokens — create or reuse a share token for the
// given role. Body: { deviceId, role: 'VIEWER' | 'EDITOR' }. Returns the token
// + the role it was issued with. One token per (planId, role) by unique index,
// so re-issuing for the same role returns the existing string.
export async function POST(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const { deviceId, role } = (await req.json()) as { deviceId?: string; role?: string };
    if (!deviceId) return NextResponse.json({ error: "deviceId required" }, { status: 400 });
    if (!(await verifyOwner(id, deviceId))) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    const validRole = role === "EDITOR" ? "EDITOR" : "VIEWER";

    const existing = await prisma.planShareToken.findUnique({
      where: { planId_role: { planId: id, role: validRole } },
    });
    const token = existing
      ? existing
      : await prisma.planShareToken.create({
          data: { planId: id, role: validRole },
        });

    // Bump the plan's share count every time the owner opens the share
    // sheet. Channel clicks all hit this endpoint at least once thanks to
    // the client-side token cache, so one increment per share session.
    await prisma.userPlan.update({
      where: { id },
      data: { shareCount: { increment: 1 } },
    }).catch(() => {});

    return NextResponse.json({ token: token.token, role: token.role });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
