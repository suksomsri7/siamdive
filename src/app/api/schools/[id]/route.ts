import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, canDo, type AuthResult } from "@/lib/apiAuth";

type AuthOk = Extract<AuthResult, { ok: true }>;

function canDoSchool(auth: AuthOk, action: string): boolean {
  return canDo(auth, `scuba-courses.${action}`) || canDo(auth, `freedive-courses.${action}`);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDoSchool(auth, "read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const school = await prisma.school.findUnique({
    where: { id },
    include: {
      translations: true,
      courses: { include: { translations: true, price: true } },
    },
  });
  if (!school) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(school);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDoSchool(auth, "write")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { logo, certBody, phone, email, lineId, website, serviceArea, keywords, status, translations } = await req.json();
  await prisma.schoolTranslation.deleteMany({ where: { schoolId: id } });
  const school = await prisma.school.update({
    where: { id },
    data: {
      logo, certBody, phone, email, lineId, website: website ?? null, serviceArea: serviceArea ?? null, keywords: keywords ?? [],
      status: status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
      translations: { create: translations?.filter((t: { name: string }) => t.name?.trim()).map((t: { lang: string; name: string; description: string; information: string }) => ({ lang: t.lang, name: t.name, description: t.description ?? "", information: t.information ?? "" })) ?? [] },
    },
    include: { translations: true },
  });
  return NextResponse.json(school);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDoSchool(auth, "delete")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.school.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
