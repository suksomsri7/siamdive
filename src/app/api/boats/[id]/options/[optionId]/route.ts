import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, canDo, BOAT_TYPE_PERM } from "@/lib/apiAuth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; optionId: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id, optionId } = await params;
  const boat = await prisma.boat.findUnique({ where: { id }, select: { type: true } });
  if (!boat) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const permRes = BOAT_TYPE_PERM[boat.type] ?? "daytrip";
  if (!canDo(auth, `${permRes}.write`)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { price, translations } = await req.json();

  await prisma.boatOptionTranslation.deleteMany({ where: { optionId } });
  const opt = await prisma.boatOption.update({
    where: { id: optionId },
    data: {
      price: Number(price) || 0,
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
  return NextResponse.json(opt);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; optionId: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id, optionId } = await params;
  const boat = await prisma.boat.findUnique({ where: { id }, select: { type: true } });
  if (!boat) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const permRes = BOAT_TYPE_PERM[boat.type] ?? "daytrip";
  if (!canDo(auth, `${permRes}.delete`)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.boatOption.delete({ where: { id: optionId } });
  return NextResponse.json({ ok: true });
}
