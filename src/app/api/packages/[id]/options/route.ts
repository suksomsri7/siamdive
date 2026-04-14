import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, canDo, BOAT_TYPE_PERM } from "@/lib/apiAuth";

async function getBoatPermRes(packageId: string): Promise<string | null> {
  const pkg = await prisma.package.findUnique({ where: { id: packageId }, select: { boat: { select: { type: true } } } });
  if (!pkg) return null;
  return BOAT_TYPE_PERM[pkg.boat.type] ?? "daytrip";
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const permRes = await getBoatPermRes(id);
  if (permRes === null) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canDo(auth, `${permRes}.read`)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const options = await prisma.packageOption.findMany({
    where: { packageId: id },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(options);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const permRes = await getBoatPermRes(id);
  if (permRes === null) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canDo(auth, `${permRes}.write`)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, price, description } = await req.json();
  const count = await prisma.packageOption.count({ where: { packageId: id } });
  const opt = await prisma.packageOption.create({
    data: { packageId: id, name, price: Number(price) || 0, description: description ?? "", order: count },
  });
  return NextResponse.json(opt, { status: 201 });
}
