import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlanAccess, canEdit } from "@/lib/plan-access";

type Ctx = { params: Promise<{ id: string }> };

// POST /api/plans/[id]/checklist — add item or bulk-add template
export async function POST(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const { deviceId, items } = body as {
      deviceId: string;
      items: { category: string; item: string; assignedTo?: string }[];
    };

    if (!deviceId || !items?.length) {
      return NextResponse.json({ error: "deviceId and items required" }, { status: 400 });
    }

    const { plan, role } = await getPlanAccess(id, deviceId);
    if (!plan) return NextResponse.json({ error: "plan_not_found" }, { status: 404 });
    if (!canEdit(role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

    const maxOrder = await prisma.planChecklist.aggregate({
      where: { planId: id }, _max: { sortOrder: true },
    });
    let order = (maxOrder._max.sortOrder ?? -1) + 1;

    const created = await prisma.planChecklist.createMany({
      data: items.map((it) => ({
        planId: id, category: it.category, item: it.item,
        assignedTo: it.assignedTo || null, sortOrder: order++,
      })),
    });

    return NextResponse.json({ count: created.count });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// PATCH /api/plans/[id]/checklist — toggle check or update item
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const { deviceId, itemId, checked, assignedTo } = (await req.json()) as {
      deviceId: string; itemId: string; checked?: boolean; assignedTo?: string | null;
    };

    if (!deviceId || !itemId) {
      return NextResponse.json({ error: "deviceId and itemId required" }, { status: 400 });
    }

    const { plan, role, user } = await getPlanAccess(id, deviceId);
    if (!plan) return NextResponse.json({ error: "plan_not_found" }, { status: 404 });
    if (!canEdit(role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

    const checkerEmail = user?.email || deviceId;

    const data: Record<string, unknown> = {};
    if (checked !== undefined) {
      data.checked = checked;
      data.checkedBy = checked ? checkerEmail : null;
    }
    if (assignedTo !== undefined) data.assignedTo = assignedTo;

    // Scope to this plan so a checklist row from another plan can't be toggled.
    const result = await prisma.planChecklist.updateMany({
      where: { id: itemId, planId: id },
      data,
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "item_not_found" }, { status: 404 });
    }
    const item = await prisma.planChecklist.findUnique({ where: { id: itemId } });

    return NextResponse.json({
      id: item!.id, category: item!.category, item: item!.item,
      assignedTo: item!.assignedTo, checked: item!.checked, checkedBy: item!.checkedBy,
    });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// DELETE /api/plans/[id]/checklist?itemId=xxx&deviceId=xxx
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const itemId = req.nextUrl.searchParams.get("itemId");
    const deviceId = req.nextUrl.searchParams.get("deviceId");
    if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });

    const { plan, role } = await getPlanAccess(id, deviceId);
    if (!plan) return NextResponse.json({ error: "plan_not_found" }, { status: 404 });
    if (!canEdit(role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

    await prisma.planChecklist.deleteMany({ where: { id: itemId, planId: id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
