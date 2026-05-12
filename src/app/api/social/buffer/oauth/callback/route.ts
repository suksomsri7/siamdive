import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { exchangeCode, listProfiles } from "@/lib/social/buffer";
import { encrypt } from "@/lib/ark-ai/encryption";
import { prisma } from "@/lib/prisma";

// Buffer redirects here with ?code=...&state=...
// We exchange the code for an access token, then fetch the list of Buffer
// profiles. For each Facebook page profile we upsert a SocialAccount row.
// The account's `language` is set on first save (admin can edit later).
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = req.cookies.get("buffer_oauth_state")?.value;
  if (!code) return NextResponse.json({ error: "missing code" }, { status: 400 });
  if (!state || state !== cookieState) return NextResponse.json({ error: "state mismatch" }, { status: 400 });

  const clientId = process.env.BUFFER_CLIENT_ID;
  const clientSecret = process.env.BUFFER_CLIENT_SECRET;
  if (!clientId || !clientSecret) return NextResponse.json({ error: "Buffer credentials not set" }, { status: 500 });

  const origin = process.env.NEXTAUTH_URL || `${url.protocol}//${url.host}`;
  const redirectUri = `${origin}/api/social/buffer/oauth/callback`;

  let token: { access_token: string; expires_in?: number; refresh_token?: string };
  try {
    token = await exchangeCode({ clientId, clientSecret, code, redirectUri });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "token exchange failed" }, { status: 502 });
  }

  let profiles;
  try {
    profiles = await listProfiles(token.access_token);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "list profiles failed" }, { status: 502 });
  }

  const fbProfiles = profiles.filter(p => p.service === "facebook");
  const encrypted = encrypt(token.access_token);
  const expiresAt = token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : null;

  const created: string[] = [];
  for (const p of fbProfiles) {
    const existing = await prisma.socialAccount.findUnique({ where: { bufferProfileId: p.id } });
    if (existing) {
      await prisma.socialAccount.update({
        where: { id: existing.id },
        data: {
          pageName: p.formatted_username,
          avatarUrl: p.avatar || "",
          accessToken: encrypted,
          refreshToken: token.refresh_token ?? null,
          expiresAt,
          active: true,
        },
      });
    } else {
      // Default new account to "en"; admin edits in /backoffice/social/accounts
      const newAcc = await prisma.socialAccount.create({
        data: {
          bufferProfileId: p.id,
          pageName: p.formatted_username,
          avatarUrl: p.avatar || "",
          language: "en",
          accessToken: encrypted,
          refreshToken: token.refresh_token ?? null,
          expiresAt,
        },
      });
      created.push(newAcc.id);
    }
  }

  const res = NextResponse.redirect(`${origin}/backoffice/social/accounts?connected=${fbProfiles.length}&new=${created.length}`);
  res.cookies.delete("buffer_oauth_state");
  return res;
}
