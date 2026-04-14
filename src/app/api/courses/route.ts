import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, canDo, type AuthResult } from "@/lib/apiAuth";

type AuthOk = Extract<AuthResult, { ok: true }>;

function canDoCourse(auth: AuthOk, action: string): boolean {
  return canDo(auth, `scuba-courses.${action}`) || canDo(auth, `freedive-courses.${action}`);
}

type TransInput = { lang: string; title: string; slug: string; excerpt: string; content: string; keywords: string[] };
type VideoInput = { url: string; name: string };
type PriceInput = { costPrice?: number | null; regularPrice: number; salePrice?: number | null; agentPrice?: number | null };

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDoCourse(auth, "read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const schoolId = searchParams.get("schoolId");
  const courses = await prisma.course.findMany({
    where: schoolId ? { schoolId } : {},
    include: { school: { include: { translations: true } }, translations: true, price: true, _count: { select: { videos: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(courses);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDoCourse(auth, "write")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { schoolId, level, duration, status, covers, translations, videos, price } = await req.json();
  const course = await prisma.course.create({
    data: {
      schoolId, level, duration: duration ?? null,
      status: status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
      covers: covers ?? [],
      translations: { create: (translations as TransInput[] ?? []).filter(t => t.title?.trim()).map(t => ({ ...t, slug: t.slug || slugify(t.title) })) },
      videos: { create: (videos as VideoInput[] ?? []).map((v, i) => ({ url: v.url, name: v.name, order: i })) },
      price: price ? { create: { costPrice: price.costPrice ?? null, regularPrice: price.regularPrice, salePrice: price.salePrice ?? null, agentPrice: price.agentPrice ?? null } } : undefined,
    },
    include: { translations: true, price: true, videos: true },
  });
  return NextResponse.json(course, { status: 201 });
}

function slugify(t: string) { return t.toLowerCase().replace(/[^a-z0-9ก-๙]+/g, "-").replace(/^-+|-+$/g, ""); }
