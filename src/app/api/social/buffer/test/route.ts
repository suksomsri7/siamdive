import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/ark-ai/encryption";
import { getAccountInfo, listProfiles } from "@/lib/social/buffer";

// Quick test: decrypt stored token → call Buffer → report status.
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const account = await prisma.socialAccount.findFirst({
    where: { active: true },
    orderBy: { createdAt: "asc" },
  });
  if (!account) {
    return NextResponse.json({ ok: false, error: "ยังไม่ได้เชื��อม Buffer account" }, { status: 412 });
  }

  const token = decrypt(account.accessToken);
  if (!token) {
    return NextResponse.json({ ok: false, error: "token decrypt failed" }, { status: 500 });
  }

  const start = Date.now();
  try {
    const info = await getAccountInfo(token);
    const profiles = await listProfiles(token);
    const ms = Date.now() - start;
    return NextResponse.json({
      ok: true,
      email: info.email,
      channels: profiles.length,
      profiles: profiles.map(p => ({ id: p.id, name: p.displayName, service: p.service })),
      ms,
    });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      error: e instanceof Error ? e.message : "unknown",
      ms: Date.now() - start,
    }, { status: 502 });
  }
}
