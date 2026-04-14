import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, canDo, type AuthResult } from "@/lib/apiAuth";

type AuthOk = Extract<AuthResult, { ok: true }>;

function canDoSchool(auth: AuthOk, action: string): boolean {
  return canDo(auth, `scuba-courses.${action}`) || canDo(auth, `freedive-courses.${action}`);
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDoSchool(auth, "read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const schools = await prisma.school.findMany({
    include: { translations: true, _count: { select: { courses: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(schools);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDoSchool(auth, "write")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { logo, certBody, phone, email, lineId, website, serviceArea, keywords, status, translations } = await req.json();
  const school = await prisma.school.create({
    data: {
      logo, certBody, phone, email, lineId, website: website ?? null, serviceArea: serviceArea ?? null, keywords: keywords ?? [],
      status: status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
      translations: { create: translations?.filter((t: { name: string }) => t.name?.trim()).map((t: { lang: string; name: string; description: string; information: string }) => ({ lang: t.lang, name: t.name, description: t.description ?? "", information: t.information ?? "" })) ?? [] },
    },
    include: { translations: true },
  });
  return NextResponse.json(school, { status: 201 });
}
