import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlanAccess, canEdit } from "@/lib/plan-access";

type Ctx = { params: Promise<{ id: string; itemId: string }> };

// PATCH /api/plans/[id]/items/[itemId] — update a single PlanItem field
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id, itemId } = await ctx.params;
  try {
    const body = await req.json();
    const {
      deviceId,
      title,
      location,
      startAt,
      endAt,
      externalUrl,
      bookingRef,
      cost,
      currency,
      notes,
      order,
    } = body as {
      deviceId?: string;
      title?: string;
      location?: string | null;
      startAt?: string;
      endAt?: string | null;
      externalUrl?: string | null;
      bookingRef?: string | null;
      cost?: number | null;
      currency?: string;
      notes?: string | null;
      order?: number;
    };

    const { plan, role } = await getPlanAccess(id, deviceId);
    if (!plan) return NextResponse.json({ error: "plan_not_found" }, { status: 404 });
    if (!canEdit(role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title;
    if (location !== undefined) data.location = location;
    if (startAt !== undefined) {
      const start = new Date(startAt);
      if (Number.isNaN(start.getTime())) {
        return NextResponse.json({ error: "invalid_startAt" }, { status: 400 });
      }
      data.startAt = start;
    }
    if (endAt !== undefined) {
      if (endAt === null) {
        data.endAt = null;
      } else {
        const e = new Date(endAt);
        if (Number.isNaN(e.getTime())) {
          return NextResponse.json({ error: "invalid_endAt" }, { status: 400 });
        }
        data.endAt = e;
      }
    }
    if (externalUrl !== undefined) data.externalUrl = externalUrl;
    if (bookingRef !== undefined) data.bookingRef = bookingRef;
    if (cost !== undefined) data.cost = cost;
    if (currency !== undefined) data.currency = currency;
    if (notes !== undefined) data.notes = notes;
    if (order !== undefined) data.order = order;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "no_fields_to_update" }, { status: 400 });
    }

    const updated = await prisma.planItem.update({
      where: { id: itemId, planId: id },
      data,
    });

    return NextResponse.json({
      id: updated.id,
      type: updated.type,
      title: updated.title,
      startAt: updated.startAt.toISOString(),
      endAt: updated.endAt?.toISOString() ?? null,
      cost: updated.cost,
      currency: updated.currency,
    });
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === "P2025") {
      return NextResponse.json({ error: "item_not_found" }, { status: 404 });
    }
    console.error("[plan item PATCH]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// DELETE /api/plans/[id]/items/[itemId]?deviceId=xxx
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { id, itemId } = await ctx.params;
  try {
    const deviceId = req.nextUrl.searchParams.get("deviceId");
    const { plan, role } = await getPlanAccess(id, deviceId);
    if (!plan) return NextResponse.json({ error: "plan_not_found" }, { status: 404 });
    if (!canEdit(role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

    const result = await prisma.planItem.deleteMany({
      where: { id: itemId, planId: id },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "item_not_found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
