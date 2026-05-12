import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { composeSocialImage, type ComposeLayout } from "@/lib/social/compose";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => ({})) as {
    backgroundUrl?: string;
    width?: number;
    height?: number;
    layout?: ComposeLayout;
  };
  if (!body.backgroundUrl) return NextResponse.json({ error: "backgroundUrl required" }, { status: 400 });
  if (!body.width || !body.height) return NextResponse.json({ error: "width + height required" }, { status: 400 });

  try {
    const result = await composeSocialImage({
      backgroundUrl: body.backgroundUrl,
      width: body.width,
      height: body.height,
      layout: body.layout ?? {},
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "compose failed" }, { status: 500 });
  }
}
