import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

// POST /api/plans/[id]/media — add media (after upload to Bunny)
export async function POST(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const { deviceId, url, thumbUrl, type, caption } = (await req.json()) as {
      deviceId: string; url: string; thumbUrl?: string; type?: string; caption?: string;
    };

    if (!deviceId || !url) {
      return NextResponse.json({ error: "deviceId and url required" }, { status: 400 });
    }

    const user = await prisma.planUser.findUnique({ where: { deviceId } });
    if (!user) return NextResponse.json({ error: "user_not_found" }, { status: 404 });

    const uploaderEmail = user.email || deviceId;

    const media = await prisma.planMedia.create({
      data: {
        planId: id, url, thumbUrl: thumbUrl || null,
        type: type === "VIDEO" ? "VIDEO" : "PHOTO",
        uploadedBy: uploaderEmail, caption: caption || null,
      },
    });

    await prisma.planActivity.create({
      data: { planId: id, action: "MEDIA_UPLOADED", actorEmail: uploaderEmail, detail: { mediaId: media.id, type: media.type } },
    });

    return NextResponse.json({
      id: media.id, url: media.url, thumbUrl: media.thumbUrl,
      type: media.type, uploadedBy: media.uploadedBy, caption: media.caption,
      createdAt: media.createdAt.toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// DELETE /api/plans/[id]/media?deviceId=xxx&mediaId=xxx
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const deviceId = req.nextUrl.searchParams.get("deviceId");
    const mediaId = req.nextUrl.searchParams.get("mediaId");
    if (!deviceId || !mediaId) {
      return NextResponse.json({ error: "deviceId and mediaId required" }, { status: 400 });
    }

    const user = await prisma.planUser.findUnique({ where: { deviceId } });
    if (!user) return NextResponse.json({ error: "user_not_found" }, { status: 404 });

    // Owner can delete any, uploader can delete own
    const plan = await prisma.userPlan.findFirst({ where: { id, userId: user.id } });
    const media = await prisma.planMedia.findUnique({ where: { id: mediaId } });
    if (!media || media.planId !== id) {
      return NextResponse.json({ error: "media_not_found" }, { status: 404 });
    }

    const isOwner = !!plan;
    const isUploader = media.uploadedBy === (user.email || deviceId);
    if (!isOwner && !isUploader) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    await prisma.planMedia.delete({ where: { id: mediaId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
