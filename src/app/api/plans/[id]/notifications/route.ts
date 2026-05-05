import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

// Sprint 3 B5 — list active (un-dismissed) notifications for a plan.
// Accepts either the plan id or shortId via path param. Public read — the
// notifications themselves don't expose anything more sensitive than what
// the plan page already shows (trip names, dates).

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const plan = await prisma.userPlan.findFirst({
    where: { OR: [{ id }, { shortId: id }] },
    select: { id: true },
  });
  if (!plan) {
    return NextResponse.json({ error: "plan_not_found" }, { status: 404 });
  }

  const notifications = await prisma.planNotification.findMany({
    where: { planId: plan.id, dismissedAt: null },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return NextResponse.json({
    notifications: notifications.map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      payload: n.payload,
      scheduleId: n.scheduleId,
      blogId: n.blogId,
      createdAt: n.createdAt.toISOString(),
    })),
  });
}
