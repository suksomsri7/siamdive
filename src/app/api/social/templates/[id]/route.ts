import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const existing = await prisma.socialImageTemplate.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (existing.isSystem) return NextResponse.json({ error: "system template is read-only" }, { status: 403 });

  const body = await req.json().catch(() => ({})) as {
    name?: string; width?: number; height?: number;
    layout?: Record<string, unknown>;
    thumbnailUrl?: string;
    order?: number;
  };
  const updated = await prisma.socialImageTemplate.update({
    where: { id },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.width !== undefined ? { width: body.width } : {}),
      ...(body.height !== undefined ? { height: body.height } : {}),
      ...(body.layout !== undefined ? { layout: body.layout } : {}),
      ...(body.thumbnailUrl !== undefined ? { thumbnailUrl: body.thumbnailUrl } : {}),
      ...(body.order !== undefined ? { order: body.order } : {}),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const existing = await prisma.socialImageTemplate.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (existing.isSystem) return NextResponse.json({ error: "system template cannot be deleted" }, { status: 403 });
  await prisma.socialImageTemplate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
