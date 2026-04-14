import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, canDo } from "@/lib/apiAuth";

const VALID_LANGS = ["en", "th", "cn", "ja", "ko", "de", "fr", "ru"];

export async function PUT(req: NextRequest, { params }: { params: Promise<{ lang: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "settings.write")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { lang } = await params;
  if (!VALID_LANGS.includes(lang)) {
    return NextResponse.json({ error: "Invalid lang" }, { status: 400 });
  }

  const body = await req.json();
  const { title, description, keywords, ogTitle, ogDescription, ogImage } = body;

  const row = await prisma.siteSeo.upsert({
    where: { lang },
    create: {
      lang,
      title: title ?? "",
      description: description ?? "",
      keywords: Array.isArray(keywords) ? keywords : [],
      ogTitle: ogTitle ?? "",
      ogDescription: ogDescription ?? "",
      ogImage: ogImage ?? "",
    },
    update: {
      title: title ?? "",
      description: description ?? "",
      keywords: Array.isArray(keywords) ? keywords : [],
      ogTitle: ogTitle ?? "",
      ogDescription: ogDescription ?? "",
      ogImage: ogImage ?? "",
    },
  });

  return NextResponse.json(row);
}
