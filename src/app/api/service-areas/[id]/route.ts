import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, canDo } from "@/lib/apiAuth";

const LANGS = ["en", "th", "cn", "de", "fr", "ru", "ko", "ja"];

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "service-areas.read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const area = await prisma.serviceArea.findUnique({
    where: { id },
    include: {
      translations: true,
      country: { include: { translations: true } },
    },
  });
  if (!area) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(area);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "service-areas.write")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { translations, countryId } = body;
  await prisma.serviceAreaTranslation.deleteMany({ where: { serviceAreaId: id } });
  const area = await prisma.serviceArea.update({
    where: { id },
    data: {
      ...(countryId !== undefined ? { countryId: countryId || null } : {}),
      translations: {
        create: LANGS.map(lang => {
          const tr = (translations ?? []).find((t: { lang: string }) => t.lang === lang) ?? {};
          return { lang, name: tr.name ?? "" };
        }),
      },
    },
    include: {
      translations: true,
      country: { include: { translations: true } },
    },
  });
  return NextResponse.json(area);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "service-areas.delete")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.serviceArea.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
