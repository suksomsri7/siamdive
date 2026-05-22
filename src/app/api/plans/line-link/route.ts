import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/plans/line-link
 *
 * Body: { lineUserId, displayName?, pictureUrl?, email?, deviceId? }
 *
 * Called by /[lang]/myplan after liff.init + getProfile. Resolves the LINE
 * user to a canonical PlanUser.deviceId so the rest of the app (which keys
 * everything off deviceId in localStorage) works unchanged.
 *
 * Resolution order:
 *   1. Match by lineUserId → return that user's deviceId.
 *   2. Match by deviceId (the visitor's existing sd_vid) → attach lineUserId
 *      to that row so first-time LINE tappers don't lose plans they built on
 *      the same browser before linking.
 *   3. Match by email → reuse that PlanUser, attach lineUserId.
 *   4. Create a fresh PlanUser with synthetic deviceId `line:{lineUserId}`.
 *
 * Email collisions across PlanUser rows are not merged here — that already
 * happens in /api/plans/email when the user explicitly sets the email. We
 * only WRITE email when the matched row had none, to avoid clobbering.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      lineUserId?: string;
      displayName?: string;
      pictureUrl?: string;
      email?: string;
      deviceId?: string;
    };

    const lineUserId = body.lineUserId?.trim();
    if (!lineUserId) {
      return NextResponse.json({ error: "lineUserId required" }, { status: 400 });
    }

    const normalizedEmail = body.email?.toLowerCase().trim() || undefined;
    const displayName = body.displayName?.trim() || undefined;
    const pictureUrl = body.pictureUrl?.trim() || undefined;
    const incomingDeviceId = body.deviceId?.trim() || undefined;

    // 1. Match by lineUserId
    let user = await prisma.planUser.findUnique({ where: { lineUserId } });

    // 2. Match by incoming deviceId
    if (!user && incomingDeviceId) {
      const byDevice = await prisma.planUser.findUnique({
        where: { deviceId: incomingDeviceId },
      });
      if (byDevice && !byDevice.lineUserId) {
        user = await prisma.planUser.update({
          where: { id: byDevice.id },
          data: {
            lineUserId,
            lineDisplayName: displayName,
            linePictureUrl: pictureUrl,
            ...(normalizedEmail && !byDevice.email ? { email: normalizedEmail } : {}),
            ...(displayName && !byDevice.name ? { name: displayName } : {}),
            ...(pictureUrl && !byDevice.avatarUrl ? { avatarUrl: pictureUrl } : {}),
          },
        });
      }
    }

    // 3. Match by email
    if (!user && normalizedEmail) {
      const byEmail = await prisma.planUser.findFirst({
        where: { email: normalizedEmail, lineUserId: null },
      });
      if (byEmail) {
        user = await prisma.planUser.update({
          where: { id: byEmail.id },
          data: {
            lineUserId,
            lineDisplayName: displayName,
            linePictureUrl: pictureUrl,
            ...(displayName && !byEmail.name ? { name: displayName } : {}),
            ...(pictureUrl && !byEmail.avatarUrl ? { avatarUrl: pictureUrl } : {}),
          },
        });
      }
    }

    // 4. Create new
    if (!user) {
      user = await prisma.planUser.create({
        data: {
          deviceId: `line:${lineUserId}`,
          lineUserId,
          lineDisplayName: displayName,
          linePictureUrl: pictureUrl,
          name: displayName,
          avatarUrl: pictureUrl,
          email: normalizedEmail,
        },
      });
    } else {
      // Refresh LINE profile snapshot on every visit so display name / picture
      // changes in LINE propagate. Don't overwrite the user's own name/avatar
      // if they've customised those via the web app.
      const refresh: Record<string, string | null> = {};
      if (displayName && displayName !== user.lineDisplayName) refresh.lineDisplayName = displayName;
      if (pictureUrl && pictureUrl !== user.linePictureUrl) refresh.linePictureUrl = pictureUrl;
      if (Object.keys(refresh).length) {
        await prisma.planUser.update({ where: { id: user.id }, data: refresh });
      }
    }

    return NextResponse.json({
      ok: true,
      deviceId: user.deviceId,
      email: user.email,
      name: user.name || user.lineDisplayName,
      avatarUrl: user.avatarUrl || user.linePictureUrl,
    });
  } catch (e) {
    console.error("[line-link] error", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
