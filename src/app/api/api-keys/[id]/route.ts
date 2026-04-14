import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, canDo } from "@/lib/apiAuth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "api-keys.write")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { name, permissions, active, expiresAt } = await req.json();
  const data: Record<string, unknown> = {};
  if (name       !== undefined) data.name        = name;
  if (permissions !== undefined) data.permissions = permissions;
  if (active      !== undefined) data.active      = active;
  if (expiresAt   !== undefined) data.expiresAt   = expiresAt ? new Date(expiresAt) : null;
  const key = await prisma.apiKey.update({
    where: { id },
    data,
    select: {
      id: true, name: true, keyPrefix: true, permissions: true,
      active: true, lastUsedAt: true, expiresAt: true, createdAt: true,
    },
  });
  return NextResponse.json(key);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "api-keys.delete")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.apiKey.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
