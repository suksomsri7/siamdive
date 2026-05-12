import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { generateHashtags } from "@/lib/social/ai";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => ({})) as {
    blogId?: string;
    language?: string;
    count?: number;
  };
  if (!body.blogId) return NextResponse.json({ error: "blogId required" }, { status: 400 });
  const lang = body.language === "th" || body.language === "en" ? body.language : "en";

  const blog = await prisma.blog.findUnique({
    where: { id: body.blogId },
    include: { translations: { where: { lang } } },
  });
  if (!blog) return NextResponse.json({ error: "blog not found" }, { status: 404 });
  const trans = blog.translations[0];
  if (!trans) return NextResponse.json({ error: `no translation for ${lang}` }, { status: 404 });

  try {
    const hashtags = await generateHashtags({
      title: trans.title,
      excerpt: trans.excerpt,
      language: lang,
      category: blog.category,
      count: body.count,
    });
    return NextResponse.json({ hashtags, language: lang });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "ai failed" }, { status: 502 });
  }
}
