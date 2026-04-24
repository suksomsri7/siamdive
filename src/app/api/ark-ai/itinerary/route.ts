import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function generateShortId(len = 7): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < len; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.days) {
    return NextResponse.json({ error: "title and days required" }, { status: 400 });
  }

  let shortId = generateShortId();
  const existing = await prisma.itinerary.findUnique({ where: { shortId } });
  if (existing) shortId = generateShortId(9);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 90);

  const itinerary = await prisma.itinerary.create({
    data: {
      shortId,
      title: body.title,
      lang: body.lang || "th",
      days: body.days,
      budget: body.budget || {},
      boatIds: body.boatIds || [],
      blogIds: body.blogIds || [],
      totalDives: body.totalDives || 0,
      totalTours: body.totalTours || 0,
      areas: body.areas || [],
      durationDays: body.durationDays || 1,
      expiresAt,
    },
  });

  return NextResponse.json({ shortId: itinerary.shortId, id: itinerary.id });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode");

  if (mode === "popular") {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const plans = await prisma.itinerary.findMany({
      where: {
        viewCount: { gte: 3 },
        createdAt: { gte: sevenDaysAgo },
        expiresAt: { gt: new Date() },
      },
      orderBy: { viewCount: "desc" },
      take: 10,
      select: {
        shortId: true, title: true, lang: true, areas: true,
        durationDays: true, totalDives: true, totalTours: true,
        budget: true, viewCount: true, createdAt: true,
      },
    });
    return NextResponse.json(plans);
  }

  const ids = searchParams.get("ids");
  if (!ids) {
    return NextResponse.json({ error: "ids param required" }, { status: 400 });
  }

  const shortIds = ids.split(",").slice(0, 20);
  const plans = await prisma.itinerary.findMany({
    where: { shortId: { in: shortIds }, expiresAt: { gt: new Date() } },
    select: {
      shortId: true, title: true, lang: true, areas: true,
      durationDays: true, totalDives: true, totalTours: true,
      budget: true, viewCount: true, createdAt: true,
    },
  });
  return NextResponse.json(plans);
}
