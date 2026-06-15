import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/apiAuth";

type Ctx = { params: Promise<{ bookerId: string }> };

// POST /api/bookings/bookers/[bookerId]/installments — add an installment
export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { bookerId } = await ctx.params;

  try {
    const body = await req.json();

    const booker = await prisma.booker.findUnique({
      where: { id: bookerId },
      select: { id: true },
    });
    if (!booker) return NextResponse.json({ error: "booker_not_found" }, { status: 404 });

    const last = await prisma.paymentInstallment.findFirst({
      where: { bookerId },
      orderBy: { seq: "desc" },
      select: { seq: true },
    });
    const seq = (last?.seq ?? 0) + 1;

    const inst = await prisma.paymentInstallment.create({
      data: {
        bookerId,
        seq,
        amount: Number(body.amount) || 0,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        note: body.note || null,
      },
    });
    return NextResponse.json({ id: inst.id });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
