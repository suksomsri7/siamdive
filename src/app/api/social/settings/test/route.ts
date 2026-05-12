import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { generateCaption } from "@/lib/social/ai";

// Smoke-test the current SocialAiConfig — sends a tiny prompt and returns the
// generated caption + estimated cost. Lets admin verify "is my key working?"
// without going through the drawer.
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const started = Date.now();
  try {
    const caption = await generateCaption({
      title: "Test: Diving in Similan Islands",
      excerpt: "A short test post to verify the AI provider is configured correctly.",
      language: "en",
      tone: "invite",
    });
    return NextResponse.json({ ok: true, caption, ms: Date.now() - started });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "unknown", ms: Date.now() - started }, { status: 502 });
  }
}
