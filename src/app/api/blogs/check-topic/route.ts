import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, canDo } from "@/lib/apiAuth";

// GET /api/blogs/check-topic?q=richelieu+rock
// Checks if a blog topic already exists by searching title, slug, and keywords.
// Returns { exists: boolean, matches: [...] }
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "blogs.read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });

  // Normalize: lowercase, split into search terms
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);

  // Search BlogTranslation where lang=en for title/slug/keywords match
  const translations = await prisma.blogTranslation.findMany({
    where: { lang: "en" },
    select: {
      blogId: true,
      title: true,
      slug: true,
      keywords: true,
      blog: { select: { status: true } },
    },
  });

  const matches = translations.filter((t) => {
    const titleLower = t.title.toLowerCase();
    const slugLower = t.slug.toLowerCase();
    const keywordsLower = t.keywords.map((k) => k.toLowerCase());

    // Match if ALL search terms appear in title, slug, or any keyword
    return terms.every(
      (term) =>
        titleLower.includes(term) ||
        slugLower.includes(term) ||
        keywordsLower.some((k) => k.includes(term)),
    );
  });

  return NextResponse.json({
    exists: matches.length > 0,
    query: q,
    matches: matches.map((m) => ({
      blogId: m.blogId,
      title: m.title,
      slug: m.slug,
      status: m.blog.status,
      keywords: m.keywords,
    })),
  });
}
