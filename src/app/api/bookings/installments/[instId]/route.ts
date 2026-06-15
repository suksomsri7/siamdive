import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/apiAuth";

type Ctx = { params: Promise<{ instId: string }> };

// PATCH /api/bookings/installments/[instId] — update an installment
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { instId } = await ctx.params;

  try {
    const body = await req.json();
    const data: Record<string, unknown> = {};

    if ("amount" in body) data.amount = Number(body.amount) || 0;
    if ("dueDate" in body) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if ("proofUrl" in body) data.proofUrl = body.proofUrl || null;
    if ("receiptUrl" in body) data.receiptUrl = body.receiptUrl || null;
    if ("note" in body) data.note = body.note || null;

    if (body.status === "PAID" || body.status === "PENDING") {
      data.status = body.status;
      if (body.status === "PAID") {
        // mark paid date (use provided paidAt, else now)
        data.paidAt = body.paidAt ? new Date(body.paidAt) : new Date();
      } else {
        data.paidAt = null;
      }
    } else if ("paidAt" in body) {
      data.paidAt = body.paidAt ? new Date(body.paidAt) : null;
    }

    await prisma.paymentInstallment.update({ where: { id: instId }, data });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// DELETE /api/bookings/installments/[instId] — delete an installment
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { instId } = await ctx.params;

  try {
    await prisma.paymentInstallment.delete({ where: { id: instId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
