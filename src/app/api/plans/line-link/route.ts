import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// The LINE Login channel id that owns the MyPlan LIFF app. The LIFF id is
// formatted `{channelId}-{hash}`, so the prefix is the channel id used as the
// `client_id` when verifying an ID token. An explicit env wins if set.
const LINE_CHANNEL_ID =
  process.env.LINE_LOGIN_CHANNEL_ID ||
  process.env.NEXT_PUBLIC_LIFF_ID_MYPLAN?.split("-")[0] ||
  null;

type VerifiedLineProfile = { sub: string; email?: string; name?: string; picture?: string };

/**
 * Verify a LIFF-issued ID token against LINE so we can trust the LINE user id
 * (`sub`) instead of believing a client-supplied `lineUserId`. Returns null
 * when the token is invalid/expired, or when no channel id is configured (in
 * which case the caller falls back to the legacy unverified path so a missing
 * env doesn't hard-break the live LINE rich-menu entry).
 */
async function verifyLineIdToken(idToken: string): Promise<VerifiedLineProfile | null> {
  if (!LINE_CHANNEL_ID) return null;
  try {
    const res = await fetch("https://api.line.me/oauth2/v2.1/verify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ id_token: idToken, client_id: LINE_CHANNEL_ID }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { sub?: string; email?: string; name?: string; picture?: string };
    if (!data.sub) return null;
    return { sub: data.sub, email: data.email, name: data.name, picture: data.picture };
  } catch {
    return null;
  }
}

/**
 * POST /api/plans/line-link
 *
 * Body: { idToken, lineUserId?, displayName?, pictureUrl?, email?, deviceId? }
 *
 * Called by /[lang]/myplan after liff.init + getProfile. The LINE identity is
 * verified server-side from `idToken` (liff.getIDToken()) — we never trust a
 * client-supplied lineUserId/email when a verified token is available. Resolves
 * the LINE user to a canonical PlanUser.deviceId so the rest of the app (which
 * keys everything off deviceId in localStorage) works unchanged.
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
      idToken?: string;
      lineUserId?: string;
      displayName?: string;
      pictureUrl?: string;
      email?: string;
      deviceId?: string;
    };

    // Verify the ID token server-side. When a channel id is configured a token
    // is REQUIRED and must verify — a valid `sub` is the only trusted lineUserId
    // / email source. Only when verification is unavailable (no channel id) do
    // we fall back to the client-supplied lineUserId to preserve the live flow.
    let verified: VerifiedLineProfile | null = null;
    if (body.idToken) verified = await verifyLineIdToken(body.idToken);

    if (LINE_CHANNEL_ID && !verified) {
      return NextResponse.json({ error: "invalid_id_token" }, { status: 401 });
    }

    const lineUserId = (verified?.sub || body.lineUserId)?.trim();
    if (!lineUserId) {
      return NextResponse.json({ error: "lineUserId required" }, { status: 400 });
    }

    // Prefer verified claims; fall back to client values only for cosmetic
    // fields (name/picture) and only when no token verification occurred.
    const normalizedEmail = (verified?.email || (verified ? undefined : body.email))?.toLowerCase().trim() || undefined;
    const displayName = (verified?.name || body.displayName)?.trim() || undefined;
    const pictureUrl = (verified?.picture || body.pictureUrl)?.trim() || undefined;
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
