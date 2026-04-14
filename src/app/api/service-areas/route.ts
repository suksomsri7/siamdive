import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, canDo } from "@/lib/apiAuth";

const LANGS = ["en", "th", "cn", "de", "fr", "ru", "ko", "ja"];

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "service-areas.read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const areas = await prisma.serviceArea.findMany({
    include: { translations: true },
    orderBy: { id: "asc" },
  });
  return NextResponse.json(areas);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "service-areas.write")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { translations } = await req.json();
  const area = await prisma.serviceArea.create({
    data: {
      translations: {
        create: LANGS.map(lang => {
          const tr = (translations ?? []).find((t: { lang: string }) => t.lang === lang) ?? {};
          return { lang, name: tr.name ?? "" };
        }),
      },
    },
    include: { translations: true },
  });
  return NextResponse.json(area, { status: 201 });
}
