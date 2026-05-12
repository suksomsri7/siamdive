import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { authorizeUrl } from "@/lib/social/buffer";
import { randomBytes } from "crypto";

// Kicks off Buffer OAuth — backoffice-only. Stores a CSRF state cookie and
// 302s to Buffer's authorize endpoint.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = process.env.BUFFER_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: "BUFFER_CLIENT_ID not set" }, { status: 500 });

  const url = new URL(req.url);
  const origin = process.env.NEXTAUTH_URL || `${url.protocol}//${url.host}`;
  const redirectUri = `${origin}/api/social/buffer/oauth/callback`;
  const state = randomBytes(24).toString("hex");

  const res = NextResponse.redirect(authorizeUrl(clientId, redirectUri, state));
  res.cookies.set("buffer_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: origin.startsWith("https"),
    maxAge: 600, // 10 minutes
    path: "/",
  });
  return res;
}
