import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, canDo } from "@/lib/apiAuth";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "company-sources.read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get("companyId");
  const boatId = searchParams.get("boatId");

  const where: { companyId?: string; boatId?: string } = {};
  if (companyId) where.companyId = companyId;
  if (boatId) where.boatId = boatId;

  const sources = await prisma.companySource.findMany({
    where,
    orderBy: { collectedAt: "desc" },
  });
  return NextResponse.json(sources);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "company-sources.write")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { companyId, type, url, content, filename, collectedBy, note, boatId } = body;

  if (!companyId || !type) {
    return NextResponse.json({ error: "companyId and type are required" }, { status: 400 });
  }

  const source = await prisma.companySource.create({
    data: {
      companyId,
      type,
      url: url ?? null,
      content: content ?? null,
      filename: filename ?? null,
      collectedBy: collectedBy ?? null,
      note: note ?? null,
      boatId: boatId ?? null,
    },
  });
  return NextResponse.json(source, { status: 201 });
}
