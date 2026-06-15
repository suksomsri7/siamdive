import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/apiAuth";
import { computeBookerFinance } from "@/lib/bookings";

// GET /api/bookings — list trips with payment summary
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const includeArchived =
    req.nextUrl.searchParams.get("archived") === "1";
  const q = req.nextUrl.searchParams.get("q")?.trim() || "";

  try {
    const trips = await prisma.bookingTrip.findMany({
      where: {
        ...(includeArchived ? {} : { status: "ACTIVE" }),
        ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
      },
      include: {
        bookers: {
          where: { status: { not: "CANCELLED" } },
          select: {
            totalAmount: true,
            installments: { select: { amount: true, status: true, dueDate: true } },
          },
        },
        _count: { select: { bookers: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    const now = new Date();
    return NextResponse.json({
      trips: trips.map((t) => {
        let totalExpected = 0;
        let totalPaid = 0;
        let overdueCount = 0;
        for (const b of t.bookers) {
          const f = computeBookerFinance(b.totalAmount, b.installments, now);
          totalExpected += f.total;
          totalPaid += f.paidAmount;
          overdueCount += f.overdueCount;
        }
        return {
          id: t.id,
          name: t.name,
          coverUrl: t.coverUrl,
          status: t.status,
          bookerCount: t._count.bookers,
          totalExpected,
          totalPaid,
          remaining: Math.max(0, totalExpected - totalPaid),
          overdueCount,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
        };
      }),
    });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// POST /api/bookings — create a trip
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    if (!name) return NextResponse.json({ error: "name_required" }, { status: 400 });

    const trip = await prisma.bookingTrip.create({
      data: {
        name,
        coverUrl: body.coverUrl || null,
        photos: Array.isArray(body.photos) ? body.photos.filter(Boolean) : [],
        brochureUrl: body.brochureUrl || null,
        note: body.note || null,
      },
    });
    return NextResponse.json({ id: trip.id });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
