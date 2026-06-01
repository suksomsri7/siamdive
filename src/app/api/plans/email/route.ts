import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/plans/email — attach email to device user
export async function POST(req: NextRequest) {
  try {
    const { deviceId, email, name } = (await req.json()) as {
      deviceId: string;
      email: string;
      name?: string;
    };

    if (!deviceId || !email) {
      return NextResponse.json({ error: "deviceId and email required" }, { status: 400 });
    }

    const normalized = email.toLowerCase().trim();

    const user = await prisma.planUser.findUnique({ where: { deviceId } });
    if (!user) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    // NOTE: we deliberately do NOT merge/transfer plans from another PlanUser
    // that happens to hold this email. The email is unverified (no OTP / magic
    // link), so absorbing another row's plans + deleting it would let anyone
    // who knows a victim's email take over their plans. Cross-device unify is
    // handled non-destructively by recoverByEmail (adopting the canonical
    // deviceId), not by mutating other rows here.

    const data: { email: string; name?: string } = { email: normalized };
    if (name?.trim()) data.name = name.trim();

    await prisma.planUser.update({
      where: { id: user.id },
      data,
    });

    return NextResponse.json({ ok: true, email: normalized });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
