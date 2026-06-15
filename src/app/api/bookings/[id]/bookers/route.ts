import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/apiAuth";

type Ctx = { params: Promise<{ id: string }> };

// POST /api/bookings/[id]/bookers — add a booker to a trip
export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id: tripId } = await ctx.params;

  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    if (!name) return NextResponse.json({ error: "name_required" }, { status: 400 });

    const trip = await prisma.bookingTrip.findUnique({
      where: { id: tripId },
      select: { id: true },
    });
    if (!trip) return NextResponse.json({ error: "trip_not_found" }, { status: 404 });

    const last = await prisma.booker.findFirst({
      where: { tripId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    const order = (last?.order ?? 0) + 1;

    const booker = await prisma.booker.create({
      data: {
        tripId,
        order,
        name,
        email: body.email || null,
        phone: body.phone || null,
        note: body.note || null,
        totalAmount: Number(body.totalAmount) || 0,
        status:
          ["TENTATIVE", "CONFIRMED", "TRAVELED", "CANCELLED"].includes(body.status)
            ? body.status
            : "TENTATIVE",
      },
    });

    await prisma.bookingTrip.update({
      where: { id: tripId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ id: booker.id });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
