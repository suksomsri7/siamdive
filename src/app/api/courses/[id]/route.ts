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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDoCourse(auth, "read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      school: { include: { translations: true } },
      translations: true,
      videos: { orderBy: { order: "asc" } },
      price: true,
    },
  });
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(course);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDoCourse(auth, "write")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const exists = await prisma.course.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { schoolId, level, duration, status, covers, translations, videos, price } = await req.json();
  await prisma.courseTranslation.deleteMany({ where: { courseId: id } });
  await prisma.courseVideo.deleteMany({ where: { courseId: id } });
  await prisma.coursePrice.deleteMany({ where: { courseId: id } });
  const course = await prisma.course.update({
    where: { id },
    data: {
      schoolId, level, duration: duration ?? null,
      status: status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
      covers: covers ?? [],
      translations: { create: (translations as TransInput[] ?? []).filter(t => t.title?.trim()).map(t => ({ ...t, slug: t.slug || slugify(t.title) + "-" + id.slice(-4) })) },
      videos: { create: (videos as VideoInput[] ?? []).map((v, i) => ({ url: v.url, name: v.name, order: i })) },
      price: price ? { create: { costPrice: price.costPrice ?? null, regularPrice: price.regularPrice, salePrice: price.salePrice ?? null, agentPrice: price.agentPrice ?? null } } : undefined,
    },
    include: { translations: true, price: true, videos: true },
  });
  return NextResponse.json(course);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDoCourse(auth, "delete")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.course.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

function slugify(t: string) { return t.toLowerCase().replace(/[^a-z0-9ก-๙]+/g, "-").replace(/^-+|-+$/g, ""); }
