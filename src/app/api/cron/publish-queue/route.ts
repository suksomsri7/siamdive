import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCronSecret } from "@/lib/cronAuth";
import { generateBlogCover } from "@/lib/blogCoverGen";

const MAX_PUBLISH_PER_DAY = 4;
const REQUIRED_LANGS = ["en", "th", "cn", "ja", "ko", "de", "fr", "ru"] as const;
const MIN_CONTENT_CHARS = 800;
const COVER_MODEL = "seedream-v5-lite";

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
 * Priority order:
 *   1. APPROVED queue — pick oldest with cover + 8 langs, flip to PUBLISHED
 *      (the human already reviewed and approved it).
 *   2. DRAFT queue (fallback) — oldest that passes content validation.
 *      Generates the cover with Nano Banana 2 if missing, then publishes.
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

  // ── Path A: APPROVED exists → original behaviour ─────────────────────
  // If any APPROVED blog exists at all, stay in the classic flow — do not
  // touch the DRAFT queue even when no APPROVED is "ready" yet. This keeps
  // the cron from racing a human review.
  const approvedCount = await prisma.blog.count({ where: { status: "APPROVED" } });
  if (approvedCount > 0) {
    const approved = await prisma.blog.findMany({
      where: { status: "APPROVED" },
      include: { translations: { select: { lang: true } } },
      orderBy: [{ updatedAt: "asc" }, { createdAt: "asc" }],
      take: 10,
    });

    const approvedReady = approved.find((b) => {
      const hasCover = b.covers.length > 0 && b.covers[0]?.trim();
      const langs = new Set(b.translations.map((t) => t.lang));
      const hasAllLangs = REQUIRED_LANGS.every((l) => langs.has(l));
      return hasCover && hasAllLangs;
    });

    if (!approvedReady) {
      await prisma.cronAuditLog.create({
        data: {
          event: "publisher.empty",
          detail: `approved=${approvedCount}, none ready (needs cover + 8 langs). DRAFT fallback skipped while approved queue non-empty.`,
        },
      });
      return NextResponse.json(
        { skipped: true, reason: "approved exist but none ready", approvedCount },
        { status: 200 },
      );
    }

    const published = await prisma.blog.update({
      where: { id: approvedReady.id },
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
        blogId: approvedReady.id,
        detail: `source=approved, slug=${published.translations[0]?.slug ?? ""}, dailyCount=${publishedToday + 1}/${MAX_PUBLISH_PER_DAY}`,
      },
    });

    return NextResponse.json({
      source: "approved",
      blogId: approvedReady.id,
      slug: published.translations[0]?.slug ?? null,
      title: published.translations[0]?.title ?? null,
      coverGenerated: false,
      publishedToday: publishedToday + 1,
      dailyCap: MAX_PUBLISH_PER_DAY,
    });
  }

  // ── Path B: No APPROVED at all → fall back to DRAFT queue ─────────────
  const drafts = await prisma.blog.findMany({
    where: { status: "DRAFT" },
    include: {
      translations: { select: { lang: true, title: true, excerpt: true, content: true, slug: true } },
    },
    orderBy: [{ updatedAt: "asc" }, { createdAt: "asc" }],
    take: 10,
  });

  const skipped: Array<{ id: string; reason: string }> = [];
  let chosen: BlogCandidate | null = null;
  for (const c of drafts) {
    const check = translationsOk(c);
    if (check.ok) { chosen = c; break; }
    skipped.push({ id: c.id, reason: check.reason });
  }

  if (!chosen) {
    await prisma.cronAuditLog.create({
      data: {
        event: "publisher.empty",
        detail: `approved=0, draft=${drafts.length} none-passed. draftSkips=${JSON.stringify(skipped).slice(0, 300)}`,
      },
    });
    return NextResponse.json(
      { skipped: true, reason: "no ready draft blogs", validationSkips: skipped },
      { status: 200 },
    );
  }

  let generatedCover: string | null = null;
  if (chosen.covers.length === 0) {
    if (!chosen.mjPrompt?.trim()) {
      await prisma.cronAuditLog.create({
        data: {
          event: "publisher.skipped",
          blogId: chosen.id,
          detail: "draft had no cover and mjPrompt is empty — cannot generate",
        },
      });
      return NextResponse.json(
        { skipped: true, reason: "draft has no cover and no mjPrompt", blogId: chosen.id },
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
      return NextResponse.json(
        { skipped: true, reason: "cover generation failed", error: msg, blogId: chosen.id },
        { status: 502 },
      );
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
      detail: `source=draft, slug=${published.translations[0]?.slug ?? ""}, cover=${generatedCover ? "generated" : "existing"}, dailyCount=${publishedToday + 1}/${MAX_PUBLISH_PER_DAY}, draftSkips=${skipped.length}`,
    },
  });

  return NextResponse.json({
    source: "draft",
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
