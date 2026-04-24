import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCronSecret } from "@/lib/cronAuth";

export async function POST(req: NextRequest) {
  const authError = requireCronSecret(req);
  if (authError) return authError;

  const now = new Date();
  const { count } = await prisma.itinerary.deleteMany({
    where: { expiresAt: { lt: now } },
  });

  return NextResponse.json({ deleted: count, at: now.toISOString() });
}
