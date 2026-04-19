import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, canDo } from "@/lib/apiAuth";

const include = {
  items: { orderBy: { order: "asc" as const } },
  translations: true,
};

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "display-rows.read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await prisma.displayRow.findMany({
    include,
    orderBy: { order: "asc" },
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "display-rows.write")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { topic, layout, itemType, order, active, maxItems, autoLatest, randomMode, autoTrending, items, translations } = await req.json();
  const row = await prisma.displayRow.create({
    data: {
      topic, layout: layout ?? "HORIZONTAL",
      itemType, order: order ?? 0, active: active ?? true,
      maxItems: maxItems ?? null,
      autoLatest: autoLatest === true,
      randomMode: randomMode === true,
      autoTrending: autoTrending === true,
      items: items?.length ? {
        create: (items as { refId: string; refType: string; order: number }[]).map(i => ({ refId: i.refId, refType: i.refType ?? "SCHEDULE", order: i.order })),
      } : undefined,
      translations: translations?.length ? {
        create: (translations as { lang: string; title: string; subtitle: string }[]).map(t => ({ lang: t.lang, title: t.title ?? "", subtitle: t.subtitle ?? "" })),
      } : undefined,
    },
    include,
  });
  return NextResponse.json(row, { status: 201 });
}
