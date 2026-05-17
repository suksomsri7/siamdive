import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/ark-ai/encryption";
import { listProfiles, getAccountInfo } from "@/lib/social/buffer";

// BYOK: paste Buffer API token → verify → fetch channels → upsert SocialAccounts.
// Token from: publish.buffer.com/settings/api
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => ({})) as { token?: string };
  const token = body.token?.trim();
  if (!token) {
    return NextResponse.json({ error: "token required" }, { status: 400 });
  }

  // Verify token by fetching account info
  let accountInfo;
  try {
    accountInfo = await getAccountInfo(token);
  } catch (e) {
    return NextResponse.json({
      error: `Token ไม่ถูกต้อง: ${e instanceof Error ? e.message : "unknown"}`,
    }, { status: 401 });
  }

  // Fetch all channels/profiles
  let profiles;
  try {
    profiles = await listProfiles(token);
  } catch (e) {
    return NextResponse.json({
      error: `ดึง profiles ล้มเหลว: ${e instanceof Error ? e.message : "unknown"}`,
    }, { status: 502 });
  }

  if (!profiles.length) {
    return NextResponse.json({
      error: "ไม่พบ channels ใน Buffer account — เพิ่ม social pages ใน Buffer ก่อน",
    }, { status: 404 });
  }

  const encrypted = encrypt(token);
  let newCount = 0;

  for (const p of profiles) {
    const existing = await prisma.socialAccount.findUnique({
      where: { bufferProfileId: p.id },
    });
    if (existing) {
      // Update token + name
      await prisma.socialAccount.update({
        where: { bufferProfileId: p.id },
        data: {
          accessToken: encrypted,
          pageName: p.displayName,
          avatarUrl: p.avatar,
          active: true,
        },
      });
    } else {
      await prisma.socialAccount.create({
        data: {
          bufferProfileId: p.id,
          pageName: p.displayName,
          avatarUrl: p.avatar,
          pageUrl: "",
          language: "th",
          accessToken: encrypted,
          provider: "buffer",
          active: true,
        },
      });
      newCount++;
    }
  }

  return NextResponse.json({
    ok: true,
    email: accountInfo.email,
    total: profiles.length,
    new: newCount,
    updated: profiles.length - newCount,
    profiles: profiles.map(p => ({ id: p.id, name: p.displayName, service: p.service })),
  });
}
