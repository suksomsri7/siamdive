import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/apiAuth";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;

  try {
    const plan = await prisma.userPlan.findFirst({
      where: { OR: [{ id }, { shortId: id }] },
    });
    if (!plan) {
      return NextResponse.json({ error: "plan_not_found" }, { status: 404 });
    }
    await prisma.userPlan.delete({ where: { id: plan.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest, ctx: Ctx) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;

  try {
    const plan = await prisma.userPlan.findFirst({
      where: { OR: [{ id }, { shortId: id }] },
      include: {
        user: { select: { email: true, name: true, deviceId: true, createdAt: true } },
        members: { orderBy: { joinedAt: "asc" } },
        media: { orderBy: { createdAt: "desc" }, take: 50 },
        checklists: { orderBy: { sortOrder: "asc" } },
        notes: { orderBy: { createdAt: "desc" } },
        _count: { select: { chatMessages: true } },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: "plan_not_found" }, { status: 404 });
    }

    return NextResponse.json({
      id: plan.id,
      shortId: plan.shortId,
      name: plan.name,
      status: plan.status,
      coverUrl: plan.coverUrl,
      owner: {
        email: plan.user.email,
        name: plan.user.name,
        deviceId: plan.user.deviceId,
        createdAt: plan.user.createdAt.toISOString(),
      },
      trips: plan.trips,
      members: plan.members.map((m) => ({
        id: m.id, email: m.email, name: m.name, role: m.role,
        certLevel: m.certLevel, joinedAt: m.joinedAt.toISOString(),
      })),
      media: plan.media.map((m) => ({
        id: m.id, url: m.url, thumbUrl: m.thumbUrl, type: m.type,
        uploadedBy: m.uploadedBy, caption: m.caption, createdAt: m.createdAt.toISOString(),
      })),
      checklists: plan.checklists.map((c) => ({
        id: c.id, category: c.category, item: c.item,
        assignedTo: c.assignedTo, checked: c.checked,
      })),
      notes: plan.notes.map((n) => ({
        id: n.id, tripIndex: n.tripIndex, content: n.content,
        authorEmail: n.authorEmail, createdAt: n.createdAt.toISOString(),
      })),
      chatCount: plan._count.chatMessages,
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
