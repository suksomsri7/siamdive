import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { searchFlights, searchHotels } from "@/lib/travel-search";

type Ctx = { params: Promise<{ id: string }> };

// Rate limit: 10 searches/day per planId. In-memory per serverless instance —
// good enough for cost guard. For production scale, swap to Redis/Upstash.
type RateBucket = { date: string; count: number };
const RATE_LIMIT = 10;
const rateState = new Map<string, RateBucket>();

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function checkRate(planId: string): { allowed: boolean; remaining: number } {
  const today = todayKey();
  const bucket = rateState.get(planId);
  if (!bucket || bucket.date !== today) {
    rateState.set(planId, { date: today, count: 1 });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }
  if (bucket.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }
  bucket.count += 1;
  return { allowed: true, remaining: RATE_LIMIT - bucket.count };
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

    const rate = checkRate(id);
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
