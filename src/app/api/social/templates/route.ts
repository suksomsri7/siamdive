import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const templates = await prisma.socialImageTemplate.findMany({
    orderBy: [{ isSystem: "desc" }, { order: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ templates });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const body = await req.json().catch(() => ({})) as {
    name?: string; width?: number; height?: number;
    layout?: Record<string, unknown>;
    thumbnailUrl?: string;
  };
  if (!body.name || !body.width || !body.height) {
    return NextResponse.json({ error: "name + width + height required" }, { status: 400 });
  }
  const tpl = await prisma.socialImageTemplate.create({
    data: {
      name: body.name,
      width: body.width,
      height: body.height,
      layout: body.layout ?? {},
      thumbnailUrl: body.thumbnailUrl ?? "",
      isSystem: false,
    },
  });
  return NextResponse.json(tpl);
}
