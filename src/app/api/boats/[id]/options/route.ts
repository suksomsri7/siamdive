import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, canDo, BOAT_TYPE_PERM } from "@/lib/apiAuth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const boat = await prisma.boat.findUnique({ where: { id }, select: { type: true } });
  if (!boat) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const permRes = BOAT_TYPE_PERM[boat.type] ?? "daytrip";
  if (!canDo(auth, `${permRes}.read`)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const options = await prisma.boatOption.findMany({
    where: { boatId: id },
    include: { translations: true },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(options);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const boat = await prisma.boat.findUnique({ where: { id }, select: { type: true } });
  if (!boat) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const permRes = BOAT_TYPE_PERM[boat.type] ?? "daytrip";
  if (!canDo(auth, `${permRes}.write`)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { price, translations } = await req.json();
  const count = await prisma.boatOption.count({ where: { boatId: id } });
  const opt = await prisma.boatOption.create({
    data: {
      boatId: id,
      price: Number(price) || 0,
      order: count,
      translations: {
        create: (translations ?? []).map((t: { lang: string; name: string; description: string }) => ({
          lang: t.lang,
          name: t.name ?? "",
          description: t.description ?? "",
        })),
      },
    },
    include: { translations: true },
  });
  return NextResponse.json(opt, { status: 201 });
}
