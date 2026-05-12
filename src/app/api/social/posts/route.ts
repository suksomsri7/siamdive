import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const blogId = searchParams.get("blogId");
  const status = searchParams.get("status");
  const accountId = searchParams.get("accountId");
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);

  const where: Record<string, unknown> = {};
  if (blogId) where.blogId = blogId;
  if (accountId) where.accountId = accountId;
  if (status) where.status = status;

  const posts = await prisma.socialPost.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      account: { select: { id: true, pageName: true, language: true, avatarUrl: true } },
      blog: { select: { id: true, covers: true, translations: { select: { lang: true, title: true, slug: true } } } },
    },
  });
  return NextResponse.json({ posts });
}
