import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const accounts = await prisma.socialAccount.findMany({
    where: { active: true },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, pageName: true, pageUrl: true, avatarUrl: true,
      language: true, provider: true, bufferProfileId: true,
      expiresAt: true, createdAt: true,
    },
  });
  return NextResponse.json({ accounts });
}
