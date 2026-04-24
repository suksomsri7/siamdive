import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ shortId: string }> },
) {
  const { shortId } = await params;

  const itinerary = await prisma.itinerary.findUnique({ where: { shortId } });
  if (!itinerary || itinerary.expiresAt < new Date()) {
    return NextResponse.json({ error: "Plan not found or expired" }, { status: 404 });
  }

  await prisma.itinerary.update({
    where: { shortId },
    data: { viewCount: { increment: 1 } },
  });

  return NextResponse.json(itinerary);
}
