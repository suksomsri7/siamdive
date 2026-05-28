import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, canDo } from "@/lib/apiAuth";

const LANGS = ["en", "th", "cn", "de", "fr", "ru", "ko", "ja"];

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "countries.read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const countries = await prisma.country.findMany({
    include: {
      translations: true,
      _count: { select: { serviceAreas: true } },
    },
    orderBy: [{ order: "asc" }, { code: "asc" }],
  });
  return NextResponse.json(countries);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "countries.write")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { code, flag, order, status, translations } = await req.json();
  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "code is required" }, { status: 400 });
  }

  const exists = await prisma.country.findUnique({ where: { code: code.toUpperCase() } });
  if (exists) return NextResponse.json({ error: "code already exists" }, { status: 409 });

  const country = await prisma.country.create({
    data: {
      code: code.toUpperCase(),
      flag: flag ?? "",
      order: typeof order === "number" ? order : 0,
      status: status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
      translations: {
        create: LANGS.map(lang => {
          const tr = (translations ?? []).find((t: { lang: string }) => t.lang === lang) ?? {};
          return { lang, name: tr.name ?? "" };
        }),
      },
    },
    include: { translations: true },
  });
  return NextResponse.json(country, { status: 201 });
}
