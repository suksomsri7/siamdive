import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, canDo } from "@/lib/apiAuth";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "settings.read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await prisma.siteSeo.findMany();
  return NextResponse.json(rows);
}
