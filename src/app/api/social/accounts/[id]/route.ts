import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const body = await req.json().catch(() => ({})) as {
    language?: "th" | "en";
    pageName?: string;
    pageUrl?: string;
    active?: boolean;
  };

  const data: { language?: string; pageName?: string; pageUrl?: string; active?: boolean } = {};
  if (body.language) data.language = body.language;
  if (body.pageName !== undefined) data.pageName = body.pageName;
  if (body.pageUrl !== undefined) data.pageUrl = body.pageUrl;
  if (body.active !== undefined) data.active = body.active;

  const updated = await prisma.socialAccount.update({
    where: { id },
    data,
    select: { id: true, pageName: true, pageUrl: true, language: true, active: true },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  await prisma.socialAccount.update({ where: { id }, data: { active: false } });
  return NextResponse.json({ ok: true });
}
