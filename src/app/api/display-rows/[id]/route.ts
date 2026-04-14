import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, canDo } from "@/lib/apiAuth";

const include = {
  items: { orderBy: { order: "asc" as const } },
  translations: true,
};

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "display-rows.write")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { topic, layout, itemType, order, active, maxItems, autoLatest, items, translations } = await req.json();

  await prisma.displayRowItem.deleteMany({ where: { rowId: id } });
  await prisma.displayRowTranslation.deleteMany({ where: { rowId: id } });

  const row = await prisma.displayRow.update({
    where: { id },
    data: {
      topic, layout, itemType,
      order: order ?? 0,
      active: active ?? true,
      maxItems: maxItems ?? null,
      autoLatest: autoLatest === true,
      items: items?.length ? {
        create: (items as { refId: string; refType: string; order: number }[]).map(i => ({ refId: i.refId, refType: i.refType ?? "SCHEDULE", order: i.order })),
      } : undefined,
      translations: translations?.length ? {
        create: (translations as { lang: string; title: string; subtitle: string }[]).map(t => ({ lang: t.lang, title: t.title ?? "", subtitle: t.subtitle ?? "" })),
      } : undefined,
    },
    include,
  });
  return NextResponse.json(row);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "display-rows.write")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const data = await req.json();
  const row = await prisma.displayRow.update({ where: { id }, data });
  return NextResponse.json(row);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "display-rows.delete")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.displayRow.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
