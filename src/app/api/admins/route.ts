import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { requireAuth, canDo } from "@/lib/apiAuth";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "admins.read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admins = await prisma.admin.findMany({
    select: { id: true, email: true, name: true, role: true, permissions: true, active: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(admins);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "admins.write")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, email, password, role, permissions, active } = await req.json();
  if (!name?.trim() || !email?.trim() || !password?.trim())
    return NextResponse.json({ error: "name, email, password required" }, { status: 400 });
  const hashed = await bcrypt.hash(password, 10);
  const admin = await prisma.admin.create({
    data: { name, email, password: hashed, role: role ?? "ADMIN", permissions: permissions ?? [], active: active ?? true },
    select: { id: true, email: true, name: true, role: true, permissions: true, active: true, createdAt: true },
  });
  return NextResponse.json(admin, { status: 201 });
}
