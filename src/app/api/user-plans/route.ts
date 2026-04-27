import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/apiAuth";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const q = req.nextUrl.searchParams.get("q")?.trim() || "";
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page")) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.nextUrl.searchParams.get("limit")) || 20));

  const where = q
    ? {
        OR: [
          { shortId: { startsWith: q } },
          { id: { startsWith: q } },
          { user: { email: { contains: q, mode: "insensitive" as const } } },
          { name: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  try {
    const [plans, total] = await Promise.all([
      prisma.userPlan.findMany({
        where,
        include: {
          user: { select: { email: true, name: true } },
          _count: { select: { members: true, media: true, checklists: true, chatMessages: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.userPlan.count({ where }),
    ]);

    return NextResponse.json({
      plans: plans.map((p) => ({
        id: p.id,
        shortId: p.shortId,
        name: p.name,
        status: p.status,
        coverUrl: p.coverUrl,
        ownerEmail: p.user.email,
        ownerName: p.user.name,
        tripCount: Array.isArray(p.trips) ? (p.trips as unknown[]).length : 0,
        totalQty: Array.isArray(p.trips)
          ? (p.trips as { schedule?: { packages?: { qty?: number }[] } }[]).reduce((sum, t) =>
              sum + (t.schedule?.packages?.reduce((s, pkg) => s + (pkg.qty || 1), 0) || 0), 0)
          : 0,
        memberCount: p._count.members,
        mediaCount: p._count.media,
        checklistCount: p._count.checklists,
        chatCount: p._count.chatMessages,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      total,
      page,
      limit,
    });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
