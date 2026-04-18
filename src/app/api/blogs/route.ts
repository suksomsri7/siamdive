import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, canDo } from "@/lib/apiAuth";
import { normalizeStatus } from "@/lib/blogStatus";
import { validateTranslationParity } from "@/lib/blogParity";

// GET /api/blogs — list all blogs with translations
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "blogs.read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const blogs = await prisma.blog.findMany({
    include: { translations: true, videos: { orderBy: { order: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(blogs);
}

// POST /api/blogs — create new blog
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "blogs.write")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { status, covers, imageIds, videos, translations, mjPrompt } = body;

  const valid = (translations as { lang: string; title: string; slug?: string; excerpt?: string; content?: string; keywords?: string[]; ogTitle?: string; ogDescription?: string; ogImage?: string }[] ?? [])
    .filter((t) => t.lang && t.title?.trim());
  const enEntry = valid.find((t) => t.lang === "en");
  const enSlug = enEntry?.slug?.trim() || slugify(enEntry?.title ?? "");

  // Creation always starts in DRAFT — cannot create blogs in APPROVED or PUBLISHED
  // state. Content must always flow DRAFT → APPROVED → PUBLISHED.
  const requestedStatus = normalizeStatus(status);
  if (requestedStatus && requestedStatus !== "DRAFT") {
    return NextResponse.json(
      { error: "New blogs must be created in DRAFT status" },
      { status: 400 },
    );
  }

  // Anti-drop guard. Minimum 20% of EN char length per translation — catches
  // AI returning empty or near-empty translations. Structural parity (h2/ul/
  // table counts) was removed 2026-04-18 because it forced mirrored EN
  // structure and produced unnatural prose in target languages.
  // See src/lib/blogParity.ts.
  const parityBypass =
    auth.source === "session" && req.headers.get("x-skip-parity") === "1";
  if (!parityBypass) {
    const parity = validateTranslationParity(valid);
    if (!parity.ok) {
      return NextResponse.json(
        {
          error: "translation_too_short",
          message:
            "One or more non-EN translations are shorter than the anti-drop floor (20% of EN char length). Expand the translation with the missing content — you do not need to match EN structure.",
          baseline: parity.baseline,
          failures: parity.failures,
        },
        { status: 422 },
      );
    }
  }

  const blog = await prisma.blog.create({
    data: {
      status: "DRAFT",
      covers: covers ?? [],
      imageIds: imageIds ?? [],
      mjPrompt: mjPrompt ?? "",
      translations: {
        create: valid.map((t) => ({
            lang: t.lang,
            title: t.title,
            slug: t.slug?.trim() || buildSlug(t.title, t.lang, enSlug),
            excerpt: t.excerpt ?? "",
            content: t.content ?? "",
            keywords: t.keywords ?? [],
            ogTitle: t.ogTitle ?? "",
            ogDescription: t.ogDescription ?? "",
            ogImage: t.ogImage ?? "",
          })),
      },
      videos: {
        create: (videos as { url: string; name: string }[] ?? []).map((v, i) => ({
          url: v.url,
          name: v.name,
          order: i,
        })),
      },
    },
    include: { translations: true, videos: true },
  });

  return NextResponse.json(blog, { status: 201 });
}

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9ก-๙]+/g, "-").replace(/^-+|-+$/g, "");
}

// Build slug: all languages use the EN slug (no lang suffix needed)
// URL already has /lang/ prefix: /en/blogs/slug, /th/blogs/slug
function buildSlug(title: string, lang: string, enSlug: string): string {
  if (enSlug) return enSlug;
  const fromTitle = slugify(title);
  return fromTitle.length > 3 ? fromTitle : "blog";
}
