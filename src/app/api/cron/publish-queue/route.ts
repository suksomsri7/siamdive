import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCronSecret } from "@/lib/cronAuth";
import { generateBlogCover } from "@/lib/blogCoverGen";

const MAX_PUBLISH_PER_DAY = 4;
const REQUIRED_LANGS = ["en", "th", "cn", "ja", "ko", "de", "fr", "ru"] as const;
const MIN_CONTENT_CHARS = 800;
const COVER_MODEL = "nano-banana-2";

// Returns today's date in Bangkok time as YYYY-MM-DD.
function bkkDate(): string {
  const now = new Date();
  const bkkMs = now.getTime() + 7 * 60 * 60 * 1000;
  return new Date(bkkMs).toISOString().slice(0, 10);
}

type BlogCandidate = {
  id: string;
  covers: string[];
  mjPrompt: string | null;
  translations: Array<{ lang: string; title: string; excerpt: string; content: string; slug: string }>;
};

// A translation is "complete" when title/slug/excerpt/content are all non-empty
// and content meets a minimum length.
function translationsOk(b: BlogCandidate): { ok: true } | { ok: false; reason: string } {
  const byLang = new Map(b.translations.map((t) => [t.lang, t]));
  for (const lang of REQUIRED_LANGS) {
    const t = byLang.get(lang);
    if (!t) return { ok: false, reason: `missing lang=${lang}` };
    if (!t.title?.trim()) return { ok: false, reason: `${lang}.title empty` };
    if (!t.slug?.trim())  return { ok: false, reason: `${lang}.slug empty` };
    if (!t.excerpt?.trim()) return { ok: false, reason: `${lang}.excerpt empty` };
    if (!t.content?.trim() || t.content.length < MIN_CONTENT_CHARS) {
      return { ok: false, reason: `${lang}.content too short (${t.content?.length ?? 0} < ${MIN_CONTENT_CHARS})` };
    }
  }
  return { ok: true };
}

/**
 * POST /api/cron/publish-queue
 *
 * Walk the DRAFT queue oldest-first. For each candidate:
 *   - validate 8 languages + per-lang content completeness
 *   - if valid & no cover → generate cover with Nano Banana 2 (fal.ai)
 *   - transition DRAFT → PUBLISHED and bump the daily counter
 *   - on failure, skip and try the next candidate
 *
 * Honours the daily cap (4/day) and the autoPublishEnabled kill switch.
 */
export async function POST(req: NextRequest) {
  const authErr = requireCronSecret(req);
  if (authErr) return authErr;

  const state = await prisma.cronState.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {},
  });

  if (!state.autoPublishEnabled) {
    await prisma.cronAuditLog.create({
      data: { event: "publisher.skipped", detail: "autoPublishEnabled=false" },
    });
    return NextResponse.json(
      { skipped: true, reason: "auto publish disabled" },
      { status: 202 },
    );
  }

  const today = bkkDate();
  const publishedToday = state.publishedDate === today ? state.publishedToday : 0;

  if (publishedToday >= MAX_PUBLISH_PER_DAY) {
    await prisma.cronAuditLog.create({
      data: {
        event: "publisher.skipped",
        detail: `daily cap reached (${publishedToday}/${MAX_PUBLISH_PER_DAY})`,
      },
    });
    return NextResponse.json(
      { skipped: true, reason: "daily cap reached", publishedToday },
      { status: 202 },
    );
  }

  // Oldest DRAFT first. Take a small batch so we can skip incomplete ones.
  const candidates = await prisma.blog.findMany({
    where: { status: "DRAFT" },
    include: {
      translations: { select: { lang: true, title: true, excerpt: true, content: true, slug: true } },
    },
    orderBy: [{ updatedAt: "asc" }, { createdAt: "asc" }],
    take: 10,
  });

  const skipped: Array<{ id: string; reason: string }> = [];
  let chosen: BlogCandidate | null = null;
  for (const c of candidates) {
    const check = translationsOk(c);
    if (check.ok) { chosen = c; break; }
    skipped.push({ id: c.id, reason: check.reason });
  }

  if (!chosen) {
    await prisma.cronAuditLog.create({
      data: {
        event: "publisher.empty",
        detail: `draft=${candidates.length}, none passed validation. skipped=${JSON.stringify(skipped).slice(0, 400)}`,
      },
    });
    return NextResponse.json({ skipped: true, reason: "no ready draft blogs", validationSkips: skipped }, { status: 204 });
  }

  // Generate cover if missing. Requires mjPrompt to be non-empty.
  let generatedCover: string | null = null;
  if (chosen.covers.length === 0) {
    if (!chosen.mjPrompt?.trim()) {
      await prisma.cronAuditLog.create({
        data: {
          event: "publisher.skipped",
          blogId: chosen.id,
          detail: "no cover and mjPrompt is empty — cannot generate",
        },
      });
      return NextResponse.json(
        { skipped: true, reason: "no cover and no mjPrompt", blogId: chosen.id },
        { status: 202 },
      );
    }
    try {
      const result = await generateBlogCover({
        prompt: chosen.mjPrompt,
        modelId: COVER_MODEL,
        aspectRatio: "16:9",
        blogId: chosen.id,
        attachToBlog: true,
      });
      generatedCover = result.coverUrl;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await prisma.cronAuditLog.create({
        data: { event: "publisher.skipped", blogId: chosen.id, detail: `cover gen failed: ${msg}`.slice(0, 500) },
      });
      return NextResponse.json({ skipped: true, reason: "cover generation failed", error: msg, blogId: chosen.id }, { status: 502 });
    }
  }

  const published = await prisma.blog.update({
    where: { id: chosen.id },
    data: { status: "PUBLISHED" },
    include: { translations: { where: { lang: "en" }, select: { slug: true, title: true } } },
  });

  await prisma.cronState.update({
    where: { id: "default" },
    data: {
      lastPublishedAt: new Date(),
      publishedToday: publishedToday + 1,
      publishedDate: today,
    },
  });

  await prisma.cronAuditLog.create({
    data: {
      event: "publisher.published",
      blogId: chosen.id,
      detail: `slug=${published.translations[0]?.slug ?? ""}, cover=${generatedCover ? "generated" : "existing"}, dailyCount=${publishedToday + 1}/${MAX_PUBLISH_PER_DAY}, skipped=${skipped.length}`,
    },
  });

  return NextResponse.json({
    blogId: chosen.id,
    slug: published.translations[0]?.slug ?? null,
    title: published.translations[0]?.title ?? null,
    coverGenerated: Boolean(generatedCover),
    publishedToday: publishedToday + 1,
    dailyCap: MAX_PUBLISH_PER_DAY,
    validationSkips: skipped,
  });
}

/**
 * GET /api/cron/publish-queue — diagnostic status.
 */
export async function GET(req: NextRequest) {
  const authErr = requireCronSecret(req);
  if (authErr) return authErr;

  const state = await prisma.cronState.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {},
  });

  const today = bkkDate();
  const publishedToday = state.publishedDate === today ? state.publishedToday : 0;
  const approved = await prisma.blog.count({ where: { status: "APPROVED" } });
  const draft = await prisma.blog.count({ where: { status: "DRAFT" } });
  const published = await prisma.blog.count({ where: { status: "PUBLISHED" } });

  return NextResponse.json({
    autoPublishEnabled: state.autoPublishEnabled,
    today,
    publishedToday,
    dailyCap: MAX_PUBLISH_PER_DAY,
    remainingToday: Math.max(0, MAX_PUBLISH_PER_DAY - publishedToday),
    queue: { draft, approved, published },
    lastPublishedAt: state.lastPublishedAt,
  });
}
