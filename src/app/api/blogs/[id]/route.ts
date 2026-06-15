import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, canDo } from "@/lib/apiAuth";
import { normalizeStatus, canTransition, transitionError } from "@/lib/blogStatus";

// GET /api/blogs/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "blogs.read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const blog = await prisma.blog.findUnique({
    where: { id },
    include: { translations: true, videos: { orderBy: { order: "asc" } } },
  });
  if (!blog) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(blog);
}

// PUT /api/blogs/[id] — full update
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "blogs.write")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const exists = await prisma.blog.findUnique({ where: { id }, select: { id: true, status: true } });
  if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { status, covers, imageIds, videos, translations, mjPrompt, category } = body;

  // Resolve target status through transition validator. If no status is
  // provided, keep the current one.
  const requestedStatus = normalizeStatus(status);
  const nextStatus = requestedStatus ?? exists.status;
  if (requestedStatus && !canTransition(exists.status, requestedStatus)) {
    return NextResponse.json(
      { error: transitionError(exists.status, requestedStatus) },
      { status: 400 },
    );
  }

  const valid = (translations as { lang: string; title: string; slug?: string; excerpt?: string; content?: string; keywords?: string[]; ogTitle?: string; ogDescription?: string; ogImage?: string }[] ?? [])
    .filter((t) => t.lang && t.title?.trim());
  const enEntry = valid.find((t) => t.lang === "en");
  const enSlug = enEntry?.slug?.trim() || slugify(enEntry?.title ?? "");

  // Replace translations and videos
  await prisma.blogTranslation.deleteMany({ where: { blogId: id } });
  await prisma.blogVideo.deleteMany({ where: { blogId: id } });

  const blog = await prisma.blog.update({
    where: { id },
    data: {
      status: nextStatus,
      ...(category !== undefined && { category }),
      covers: covers ?? [],
      ...(imageIds !== undefined && { imageIds }),
      ...(mjPrompt !== undefined && { mjPrompt }),
      translations: {
        create: valid.map((t) => ({
            lang: t.lang,
            title: t.title,
            slug: collapseLangSuffix((t.slug?.trim() || buildSlug(t.title, t.lang, enSlug)), t.lang),
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
          url: v.url, name: v.name, order: i,
        })),
      },
    },
    include: { translations: true, videos: true },
  });

  return NextResponse.json(blog);
}

// PATCH /api/blogs/[id] — add or update translations (upsert by lang, keeps existing)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "blogs.write")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const blog = await prisma.blog.findUnique({ where: { id }, select: { id: true, status: true } });
  if (!blog) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { mjPrompt, status, covers, imageIds, category } = body;
  const translations = body.translations as { lang: string; title: string; slug?: string; excerpt?: string; content?: string; keywords?: string[]; ogTitle?: string; ogDescription?: string; ogImage?: string }[] ?? [];

  const valid = translations.filter((t) => t.lang && t.title?.trim());
  const requestedStatus = normalizeStatus(status);
  const hasUpdate =
    valid.length > 0 ||
    mjPrompt !== undefined ||
    requestedStatus !== null ||
    covers !== undefined ||
    imageIds !== undefined;
  if (!hasUpdate) {
    return NextResponse.json({ error: "No valid translations, mjPrompt, status, covers, or imageIds provided" }, { status: 400 });
  }

  // Validate status transition before any writes
  if (requestedStatus && !canTransition(blog.status, requestedStatus)) {
    return NextResponse.json(
      { error: transitionError(blog.status, requestedStatus) },
      { status: 400 },
    );
  }

  // Update blog-level fields (mjPrompt, status, covers, imageIds, category) in a single call
  const blogUpdates: Record<string, unknown> = {};
  if (mjPrompt !== undefined) blogUpdates.mjPrompt = mjPrompt;
  if (requestedStatus) blogUpdates.status = requestedStatus;
  if (covers !== undefined) blogUpdates.covers = covers;
  if (imageIds !== undefined) blogUpdates.imageIds = imageIds;
  if (category !== undefined) blogUpdates.category = category;
  if (Object.keys(blogUpdates).length > 0) {
    await prisma.blog.update({ where: { id }, data: blogUpdates });
  }

  // Resolve EN slug: from incoming translations, or from existing DB record
  const enEntry = valid.find((t) => t.lang === "en");
  let enSlug = enEntry?.slug?.trim() || slugify(enEntry?.title ?? "");
  if (!enSlug) {
    const existing = await prisma.blogTranslation.findUnique({ where: { blogId_lang: { blogId: id, lang: "en" } } });
    enSlug = existing?.slug ?? "";
  }

  // Upsert each translation by (blogId, lang)
  for (const t of valid) {
    const slug = collapseLangSuffix((t.slug?.trim() || buildSlug(t.title, t.lang, enSlug)), t.lang);
    await prisma.blogTranslation.upsert({
      where: { blogId_lang: { blogId: id, lang: t.lang } },
      update: {
        title: t.title,
        slug,
        excerpt: t.excerpt ?? "",
        content: t.content ?? "",
        keywords: t.keywords ?? [],
        ogTitle: t.ogTitle ?? "",
        ogDescription: t.ogDescription ?? "",
        ogImage: t.ogImage ?? "",
      },
      create: {
        blogId: id,
        lang: t.lang,
        title: t.title,
        slug,
        excerpt: t.excerpt ?? "",
        content: t.content ?? "",
        keywords: t.keywords ?? [],
        ogTitle: t.ogTitle ?? "",
        ogDescription: t.ogDescription ?? "",
        ogImage: t.ogImage ?? "",
      },
    });
  }

  const updated = await prisma.blog.findUnique({
    where: { id },
    include: { translations: true, videos: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json(updated);
}

// DELETE /api/blogs/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!canDo(auth, "blogs.delete")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.blog.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9ก-๙]+/g, "-").replace(/^-+|-+$/g, "");
}

// Collapse a repeated trailing language suffix ("x-de-de-de" → "x-de"). PATCH
// re-translate used to re-append "-<lang>" each pass, growing spammy slugs.
function collapseLangSuffix(slug: string, lang: string): string {
  return slug.replace(new RegExp(`(?:-${lang})+$`), `-${lang}`);
}

function buildSlug(title: string, lang: string, enSlug: string): string {
  if (enSlug) return enSlug;
  const fromTitle = slugify(title);
  return fromTitle.length > 3 ? fromTitle : "blog";
}
