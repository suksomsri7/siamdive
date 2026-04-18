import { NextRequest, NextResponse } from "next/server";
import { requireAuth, canDo } from "@/lib/apiAuth";
import { generateBlogCover, VALID_ASPECTS, MODELS, type AspectRatio } from "@/lib/blogCoverGen";

// POST /api/blog-images/generate
// body: { prompt: string, aspectRatio?: "16:9"|"1:1"|..., blogId?: string,
//         attachToBlog?: boolean, model?: string }
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "upload.write")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body?.prompt || typeof body.prompt !== "string") {
    return NextResponse.json({ error: "prompt required" }, { status: 400 });
  }
  const aspectRatio: AspectRatio = VALID_ASPECTS.has(body.aspectRatio) ? body.aspectRatio : "16:9";

  try {
    const result = await generateBlogCover({
      prompt: body.prompt,
      modelId: body.model,
      aspectRatio,
      blogId: body.blogId,
      attachToBlog: body.attachToBlog !== false,
    });
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

// GET — list available models for UI
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "blogs.read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({
    models: MODELS.map((m) => ({ id: m.id, label: m.label, blurb: m.blurb, price: m.price })),
  });
}
