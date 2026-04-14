import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, canDo, BOAT_TYPE_PERM } from "@/lib/apiAuth";

async function getBoatPermRes(packageId: string): Promise<string | null> {
  const pkg = await prisma.package.findUnique({ where: { id: packageId }, select: { boat: { select: { type: true } } } });
  if (!pkg) return null;
  return BOAT_TYPE_PERM[pkg.boat.type] ?? "daytrip";
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; optionId: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id, optionId } = await params;
  const permRes = await getBoatPermRes(id);
  if (permRes === null) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canDo(auth, `${permRes}.write`)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, price, description } = await req.json();
  const opt = await prisma.packageOption.update({
    where: { id: optionId },
    data: { name, price: Number(price) || 0, description: description ?? "" },
  });
  return NextResponse.json(opt);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; optionId: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id, optionId } = await params;
  const permRes = await getBoatPermRes(id);
  if (permRes === null) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canDo(auth, `${permRes}.delete`)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.packageOption.delete({ where: { id: optionId } });
  return NextResponse.json({ ok: true });
}
