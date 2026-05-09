import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordDeletedSignature } from "@/lib/ark-ai/deleted-sigs";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/plans/[id]?deviceId=xxx — full plan detail (trips + members + media + checklist + notes)
export async function GET(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const deviceId = req.nextUrl.searchParams.get("deviceId");
  const shortId = req.nextUrl.searchParams.get("shortId");

  try {
    const plan = await prisma.userPlan.findFirst({
      where: shortId ? { shortId: id } : { id },
      include: {
        user: { select: { email: true, name: true, deviceId: true } },
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

    // Determine access level
    let role: "OWNER" | "EDITOR" | "VIEWER" = "VIEWER";
    if (deviceId && plan.user.deviceId === deviceId) {
      role = "OWNER";
    } else if (deviceId) {
      const user = await prisma.planUser.findUnique({ where: { deviceId } });
      if (user?.email) {
        const membership = plan.members.find((m) => m.email === user.email);
        if (membership) role = membership.role as "EDITOR" | "VIEWER";
      }
    }

    return NextResponse.json({
      id: plan.id,
      shortId: plan.shortId,
      name: plan.name,
      coverUrl: plan.coverUrl,
      status: plan.status,
      trips: plan.trips,
      role,
      owner: { email: plan.user.email, name: plan.user.name },
      members: plan.members.map((m) => ({
        id: m.id, email: m.email, name: m.name, avatarUrl: m.avatarUrl,
        role: m.role, certLevel: m.certLevel, joinedAt: m.joinedAt.toISOString(),
      })),
      media: plan.media.map((m) => ({
        id: m.id, url: m.url, thumbUrl: m.thumbUrl, type: m.type,
        uploadedBy: m.uploadedBy, caption: m.caption, createdAt: m.createdAt.toISOString(),
      })),
      checklists: plan.checklists.map((c) => ({
        id: c.id, category: c.category, item: c.item, assignedTo: c.assignedTo,
        checked: c.checked, checkedBy: c.checkedBy, sortOrder: c.sortOrder,
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

// PATCH /api/plans/[id] — update plan
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const { deviceId, name, trips, coverUrl, status } = body as {
      deviceId: string;
      name?: string;
      trips?: unknown[];
      coverUrl?: string | null;
      status?: string;
    };

    if (!deviceId) {
      return NextResponse.json({ error: "deviceId required" }, { status: 400 });
    }

    const user = await prisma.planUser.findUnique({ where: { deviceId } });
    if (!user) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    const existing = await prisma.userPlan.findFirst({ where: { id, userId: user.id } });
    if (!existing) {
      // Check if user is an editor member
      if (user.email) {
        const membership = await prisma.planMember.findFirst({
          where: { planId: id, email: user.email, role: "EDITOR" },
        });
        if (!membership) {
          return NextResponse.json({ error: "plan_not_found" }, { status: 404 });
        }
      } else {
        return NextResponse.json({ error: "plan_not_found" }, { status: 404 });
      }
    }

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (trips !== undefined) data.trips = trips as never;
    if (coverUrl !== undefined) data.coverUrl = coverUrl;
    if (status !== undefined) data.status = status;

    const plan = await prisma.userPlan.update({ where: { id }, data });

    return NextResponse.json({
      id: plan.id, shortId: plan.shortId, name: plan.name,
      coverUrl: plan.coverUrl, status: plan.status, trips: plan.trips,
      createdAt: plan.createdAt.toISOString(), updatedAt: plan.updatedAt.toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// DELETE /api/plans/[id]?deviceId=xxx — delete plan (owner only)
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const deviceId = req.nextUrl.searchParams.get("deviceId");
    if (!deviceId) {
      return NextResponse.json({ error: "deviceId required" }, { status: 400 });
    }

    const user = await prisma.planUser.findUnique({ where: { deviceId } });
    if (!user) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    const existing = await prisma.userPlan.findFirst({ where: { id, userId: user.id } });
    if (!existing) {
      return NextResponse.json({ error: "plan_not_found" }, { status: 404 });
    }

    // Stash the AI-built plan's signature so /api/ark-ai/build-plan can
    // detect a same-trip rebuild from a stale chat and prompt the user
    // before silently recreating what they just removed.
    if (existing.source === "ARK_AI" && existing.planSignature) {
      await recordDeletedSignature(user.id, existing.planSignature, existing.name).catch((err) => {
        console.error("[plans/delete] recordDeletedSignature failed:", err);
      });
    }

    await prisma.userPlan.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
