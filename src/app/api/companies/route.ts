import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, canDo } from "@/lib/apiAuth";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "companies.read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const companies = await prisma.company.findMany({
    include: { translations: true, boats: { include: { _count: { select: { schedules: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(companies);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "companies.write")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { logo, phone, email, lineId, status, covers, photos, translations } = await req.json();
  const company = await prisma.company.create({
    data: {
      logo, phone, email, lineId,
      status: status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
      covers: covers ?? [],
      photos: photos ?? [],
      translations: { create: translations?.filter((t: { name: string }) => t.name?.trim()).map((t: { lang: string; name: string; description: string }) => ({ lang: t.lang, name: t.name, description: t.description ?? "" })) ?? [] },
    },
    include: { translations: true },
  });
  return NextResponse.json(company, { status: 201 });
}
