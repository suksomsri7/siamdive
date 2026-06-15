import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/apiAuth";

type Ctx = { params: Promise<{ bookerId: string }> };

// PATCH /api/bookings/bookers/[bookerId] — update a booker
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { bookerId } = await ctx.params;

  try {
    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (typeof body.name === "string") data.name = body.name.trim();
    if ("email" in body) data.email = body.email || null;
    if ("phone" in body) data.phone = body.phone || null;
    if ("note" in body) data.note = body.note || null;
    if ("totalAmount" in body) data.totalAmount = Number(body.totalAmount) || 0;
    if (["TENTATIVE", "CONFIRMED", "TRAVELED", "CANCELLED"].includes(body.status))
      data.status = body.status;
    if (typeof body.order === "number") data.order = body.order;

    await prisma.booker.update({ where: { id: bookerId }, data });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// DELETE /api/bookings/bookers/[bookerId] — delete a booker
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { bookerId } = await ctx.params;

  try {
    await prisma.booker.delete({ where: { id: bookerId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
