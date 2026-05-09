import { NextRequest, NextResponse } from "next/server";
import { requireAuth, canDo } from "@/lib/apiAuth";
import { coverFromUrl } from "@/lib/blogCoverGen";

// POST /api/blog-images/from-url
// body: { url: string, blogId?: string, attachToBlog?: boolean, modelLabel?: string }
//
// Imports an external image (e.g. from Midjourney CDN) and runs the full
// cover/OG/watermark pipeline. Restricted to a small allowlist of known image
// hosts in coverFromUrl() to mitigate SSRF.
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "upload.write")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body?.url || typeof body.url !== "string") {
    return NextResponse.json({ error: "url required" }, { status: 400 });
  }

  try {
    const result = await coverFromUrl({
      url: body.url,
      blogId: body.blogId,
      attachToBlog: body.attachToBlog !== false,
      modelLabel: body.modelLabel,
    });
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
