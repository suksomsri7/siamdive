import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, canDo } from "@/lib/apiAuth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "companies.read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const c = await prisma.company.findUnique({ where: { id }, include: { translations: true, boats: true } });
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(c);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "companies.write")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { logo, phone, email, lineId, status, covers, photos, translations } = await req.json();
  await prisma.companyTranslation.deleteMany({ where: { companyId: id } });
  const c = await prisma.company.update({
    where: { id },
    data: {
      logo, phone, email, lineId,
      status: status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
      covers: covers ?? [],
      photos: photos ?? [],
      translations: { create: translations?.filter((t: { name: string }) => t.name?.trim()).map((t: { lang: string; name: string; description: string }) => ({ lang: t.lang, name: t.name, description: t.description ?? "" })) ?? [] },
    },
    include: { translations: true },
  });
  return NextResponse.json(c);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "companies.delete")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.company.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
