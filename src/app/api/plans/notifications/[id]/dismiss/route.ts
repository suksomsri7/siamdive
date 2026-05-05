import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

// Sprint 3 B5 — dismiss a single notification. No auth beyond knowing the
// notification id, mirroring the rest of the plan API surface (deviceId-
// gated reads, but writes that don't require account auth). Re-running on a
// dismissed notification is a no-op.

export async function POST(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    await prisma.planNotification.update({
      where: { id },
      data: { dismissedAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
}
