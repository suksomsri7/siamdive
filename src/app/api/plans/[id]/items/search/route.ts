import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { searchFlights, searchHotels } from "@/lib/travel-search";

type Ctx = { params: Promise<{ id: string }> };

// Rate limit: 10 AI searches/day per planId. DB-backed via SearchRateLimit
// table — survives Vercel serverless cold-starts (in-memory state would be
// wiped between workers).
const RATE_LIMIT = 10;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

async function checkRate(planId: string): Promise<{ allowed: boolean; remaining: number }> {
  const date = todayKey();
  const row = await prisma.searchRateLimit.upsert({
    where: { planId_date: { planId, date } },
    create: { planId, date, count: 1 },
    update: { count: { increment: 1 } },
  });
  if (row.count > RATE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }
  return { allowed: true, remaining: RATE_LIMIT - row.count };
}

// POST /api/plans/[id]/items/search
// body for FLIGHT:  { type: "FLIGHT", from, to, date, returnDate?, adults? }
// body for HOTEL:   { type: "HOTEL", cityName, checkin, checkout, adults? }
export async function POST(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;

  try {
    const planExists = await prisma.userPlan.findUnique({ where: { id }, select: { id: true } });
    if (!planExists) {
      return NextResponse.json({ error: "plan_not_found" }, { status: 404 });
    }

    const rate = await checkRate(id);
    if (!rate.allowed) {
      return NextResponse.json({ error: "rate_limit", message: "เกินจำนวนการค้นหาต่อวัน (10 ครั้ง)" }, { status: 429 });
    }

    const body = await req.json();

    if (body.type === "FLIGHT") {
      const { from, to, date, returnDate, adults } = body;
      if (!from || !to || !date) {
        return NextResponse.json({ error: "from_to_date_required" }, { status: 400 });
      }
      const offers = await searchFlights({ from, to, date, returnDate, adults: adults ?? 1 });
      return NextResponse.json({ offers, remaining: rate.remaining });
    }

    if (body.type === "HOTEL") {
      const { cityName, countryCode, checkin, checkout, adults } = body;
      if (!cityName || !checkin || !checkout) {
        return NextResponse.json({ error: "cityName_checkin_checkout_required" }, { status: 400 });
      }
      const offers = await searchHotels({
        cityName,
        countryCode: countryCode || "TH",
        checkin,
        checkout,
        adults: adults ?? 2,
      });
      return NextResponse.json({ offers, remaining: rate.remaining });
    }

    return NextResponse.json({ error: "invalid_type" }, { status: 400 });
  } catch (err) {
    console.error("[items search]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
