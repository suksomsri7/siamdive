import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { destroyUpdate } from "@/lib/social/buffer";
import { decrypt } from "@/lib/ark-ai/encryption";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const post = await prisma.socialPost.findUnique({
    where: { id },
    include: {
      account: { select: { pageName: true, language: true, avatarUrl: true } },
      blog: { select: { covers: true, translations: { select: { lang: true, title: true, slug: true } } } },
    },
  });
  if (!post) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(post);
}

// Cancel a queued post — destroys it on Buffer and marks CANCELLED locally.
// Posted ones can be soft-cancelled (locally) but cannot be unposted on FB.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const post = await prisma.socialPost.findUnique({ where: { id }, include: { account: true } });
  if (!post) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (post.status === "QUEUED" && post.bufferUpdateId && post.account) {
    const token = decrypt(post.account.accessToken);
    if (token) {
      try { await destroyUpdate(token, post.bufferUpdateId); } catch { /* ignore — record locally anyway */ }
    }
  }
  await prisma.socialPost.update({ where: { id }, data: { status: "CANCELLED" } });
  return NextResponse.json({ ok: true });
}
