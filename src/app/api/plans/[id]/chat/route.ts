import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlanAccess, canView, canEdit } from "@/lib/plan-access";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/plans/[id]/chat?after=timestamp — poll messages
export async function GET(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const after = req.nextUrl.searchParams.get("after");
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") || "50"), 100);

  try {
    const where: Record<string, unknown> = { planId: id };
    if (after) {
      where.createdAt = { gt: new Date(after) };
    }

    const messages = await prisma.planChat.findMany({
      where,
      orderBy: { createdAt: "asc" },
      take: limit,
    });

    return NextResponse.json({
      messages: messages.map((m) => ({
        id: m.id, authorEmail: m.authorEmail, authorName: m.authorName,
        message: m.message, imageUrl: m.imageUrl, pinned: m.pinned,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// POST /api/plans/[id]/chat — send message
export async function POST(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const { deviceId, message, imageUrl } = (await req.json()) as {
      deviceId: string; message: string; imageUrl?: string;
    };

    if (!deviceId || (!message && !imageUrl)) {
      return NextResponse.json({ error: "deviceId and message required" }, { status: 400 });
    }

    const { plan, role } = await getPlanAccess(id, deviceId);
    if (!plan) return NextResponse.json({ error: "plan_not_found" }, { status: 404 });
    if (!canView(role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

    const user = await prisma.planUser.findUnique({ where: { deviceId } });
    if (!user) return NextResponse.json({ error: "user_not_found" }, { status: 404 });

    const authorEmail = user.email || deviceId;
    const authorName = user.name || user.email?.split("@")[0] || "Anonymous";

    const msg = await prisma.planChat.create({
      data: {
        planId: id, authorEmail, authorName,
        message: message || "", imageUrl: imageUrl || null,
      },
    });

    return NextResponse.json({
      id: msg.id, authorEmail: msg.authorEmail, authorName: msg.authorName,
      message: msg.message, imageUrl: msg.imageUrl, pinned: msg.pinned,
      createdAt: msg.createdAt.toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// PATCH /api/plans/[id]/chat — pin/unpin message
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const { deviceId, messageId, pinned } = (await req.json()) as {
      deviceId?: string; messageId: string; pinned: boolean;
    };

    const { plan, role } = await getPlanAccess(id, deviceId);
    if (!plan) return NextResponse.json({ error: "plan_not_found" }, { status: 404 });
    if (!canEdit(role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

    // Scope the update to this plan so a valid messageId from another plan
    // can't be toggled through this route.
    const result = await prisma.planChat.updateMany({
      where: { id: messageId, planId: id },
      data: { pinned },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "message_not_found" }, { status: 404 });
    }

    return NextResponse.json({ id: messageId, pinned });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
