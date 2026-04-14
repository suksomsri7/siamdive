import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { requireAuth, canDo } from "@/lib/apiAuth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "admins.read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const admin = await prisma.admin.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true, permissions: true, active: true, createdAt: true },
  });
  if (!admin) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(admin);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "admins.write")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { name, email, password, role, permissions, active } = await req.json();
  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (email !== undefined) data.email = email;
  if (password?.trim()) data.password = await bcrypt.hash(password, 10);
  if (role !== undefined) data.role = role;
  if (permissions !== undefined) data.permissions = permissions;
  if (active !== undefined) data.active = active;
  const admin = await prisma.admin.update({
    where: { id },
    data,
    select: { id: true, email: true, name: true, role: true, permissions: true, active: true, createdAt: true },
  });
  return NextResponse.json(admin);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "admins.delete")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.admin.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
