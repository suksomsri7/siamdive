import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/plans/email — attach email to device user
export async function POST(req: NextRequest) {
  try {
    const { deviceId, email } = (await req.json()) as {
      deviceId: string;
      email: string;
    };

    if (!deviceId || !email) {
      return NextResponse.json({ error: "deviceId and email required" }, { status: 400 });
    }

    const normalized = email.toLowerCase().trim();

    const user = await prisma.planUser.findUnique({ where: { deviceId } });
    if (!user) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    // Check if another user already has this email
    const existing = await prisma.planUser.findFirst({
      where: { email: normalized, NOT: { id: user.id } },
      include: { plans: true },
    });

    if (existing) {
      // Merge: move plans from existing user to current user, then delete old user
      await prisma.userPlan.updateMany({
        where: { userId: existing.id },
        data: { userId: user.id },
      });
      await prisma.planUser.delete({ where: { id: existing.id } });
    }

    await prisma.planUser.update({
      where: { id: user.id },
      data: { email: normalized },
    });

    return NextResponse.json({ ok: true, email: normalized });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
