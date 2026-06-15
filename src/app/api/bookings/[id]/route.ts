import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/apiAuth";
import { computeBookerFinance } from "@/lib/bookings";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/bookings/[id] — trip detail with bookers + installments
export async function GET(req: NextRequest, ctx: Ctx) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;

  try {
    const trip = await prisma.bookingTrip.findUnique({
      where: { id },
      include: {
        bookers: {
          orderBy: { order: "asc" },
          include: { installments: { orderBy: { seq: "asc" } } },
        },
      },
    });
    if (!trip) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const now = new Date();
    return NextResponse.json({
      id: trip.id,
      name: trip.name,
      coverUrl: trip.coverUrl,
      photos: trip.photos,
      brochureUrl: trip.brochureUrl,
      note: trip.note,
      status: trip.status,
      createdAt: trip.createdAt.toISOString(),
      updatedAt: trip.updatedAt.toISOString(),
      bookers: trip.bookers.map((b) => {
        const finance = computeBookerFinance(b.totalAmount, b.installments, now);
        return {
          id: b.id,
          order: b.order,
          name: b.name,
          email: b.email,
          phone: b.phone,
          status: b.status,
          note: b.note,
          totalAmount: b.totalAmount,
          installments: b.installments.map((i) => ({
            id: i.id,
            seq: i.seq,
            amount: i.amount,
            dueDate: i.dueDate ? i.dueDate.toISOString() : null,
            paidAt: i.paidAt ? i.paidAt.toISOString() : null,
            status: i.status,
            proofUrl: i.proofUrl,
            receiptUrl: i.receiptUrl,
            note: i.note,
          })),
          finance,
        };
      }),
    });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// PATCH /api/bookings/[id] — update trip info
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;

  try {
    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (typeof body.name === "string") data.name = body.name.trim();
    if ("coverUrl" in body) data.coverUrl = body.coverUrl || null;
    if ("brochureUrl" in body) data.brochureUrl = body.brochureUrl || null;
    if ("note" in body) data.note = body.note || null;
    if (Array.isArray(body.photos)) data.photos = body.photos.filter(Boolean);
    if (body.status === "ACTIVE" || body.status === "ARCHIVED") data.status = body.status;

    await prisma.bookingTrip.update({ where: { id }, data });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// DELETE /api/bookings/[id] — delete trip (cascades bookers + installments)
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;

  try {
    await prisma.bookingTrip.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
