import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, canDo } from "@/lib/apiAuth";

const LANGS = ["en", "th", "cn", "de", "fr", "ru", "ko", "ja"];

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "countries.read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const country = await prisma.country.findUnique({
    where: { id },
    include: {
      translations: true,
      _count: { select: { serviceAreas: true } },
    },
  });
  if (!country) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(country);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "countries.write")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { code, flag, order, status, translations } = await req.json();

  if (code) {
    const dup = await prisma.country.findFirst({
      where: { code: code.toUpperCase(), NOT: { id } },
    });
    if (dup) return NextResponse.json({ error: "code already exists" }, { status: 409 });
  }

  await prisma.countryTranslation.deleteMany({ where: { countryId: id } });
  const country = await prisma.country.update({
    where: { id },
    data: {
      ...(code ? { code: code.toUpperCase() } : {}),
      ...(flag !== undefined ? { flag } : {}),
      ...(typeof order === "number" ? { order } : {}),
      ...(status ? { status: status === "INACTIVE" ? "INACTIVE" : "ACTIVE" } : {}),
      translations: {
        create: LANGS.map(lang => {
          const tr = (translations ?? []).find((t: { lang: string }) => t.lang === lang) ?? {};
          return { lang, name: tr.name ?? "" };
        }),
      },
    },
    include: { translations: true },
  });
  return NextResponse.json(country);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "countries.delete")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const count = await prisma.serviceArea.count({ where: { countryId: id } });
  if (count > 0) {
    return NextResponse.json(
      { error: `ลบไม่ได้ — มี ${count} พื้นที่ที่อยู่ใต้ประเทศนี้` },
      { status: 409 }
    );
  }

  await prisma.country.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
