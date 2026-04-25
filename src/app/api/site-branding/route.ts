import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, canDo } from "@/lib/apiAuth";

// GET /api/site-branding — fetch the singleton branding settings + all watermarks
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "blogs.read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let branding = await prisma.siteBranding.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });

  // Migration: if legacy watermarkUrl exists but no Watermark rows, auto-create one
  const watermarkCount = await prisma.watermark.count();
  if (watermarkCount === 0 && branding.watermarkUrl) {
    const wm = await prisma.watermark.create({
      data: { name: "Default", url: branding.watermarkUrl, order: 0 },
    });
    branding = await prisma.siteBranding.update({
      where: { id: "default" },
      data: { defaultWatermarkId: wm.id },
    });
  }

  const watermarks = await prisma.watermark.findMany({ orderBy: { order: "asc" } });

  // Only auto-default on first-ever watermark creation (no rows existed before migration block above)
  if (!branding.defaultWatermarkId && watermarks.length === 1 && watermarks[0].name === "Default") {
    branding = await prisma.siteBranding.update({
      where: { id: "default" },
      data: { defaultWatermarkId: watermarks[0].id },
    });
  }

  return NextResponse.json({ ...branding, watermarks });
}

// PUT /api/site-branding — update branding settings
export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "blogs.write")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { watermarkUrl, defaultWatermarkId, watermarkEnabled, watermarkOpacity, watermarkPosition, watermarkScale } = body;

  const branding = await prisma.siteBranding.upsert({
    where: { id: "default" },
    update: {
      ...(watermarkUrl !== undefined && { watermarkUrl }),
      ...(defaultWatermarkId !== undefined && { defaultWatermarkId }),
      ...(watermarkEnabled !== undefined && { watermarkEnabled }),
      ...(watermarkOpacity !== undefined && { watermarkOpacity }),
      ...(watermarkPosition !== undefined && { watermarkPosition }),
      ...(watermarkScale !== undefined && { watermarkScale }),
    },
    create: {
      id: "default",
      watermarkUrl: watermarkUrl ?? "",
      defaultWatermarkId: defaultWatermarkId ?? "",
      watermarkEnabled: watermarkEnabled ?? false,
      watermarkOpacity: watermarkOpacity ?? 60,
      watermarkPosition: watermarkPosition ?? "bottom-right",
      watermarkScale: watermarkScale ?? 15,
    },
  });

  const watermarks = await prisma.watermark.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json({ ...branding, watermarks });
}
