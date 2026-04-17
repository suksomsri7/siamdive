import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCronSecret } from "@/lib/cronAuth";

const MAX_PUBLISH_PER_DAY = 4;
const REQUIRED_LANGS = ["en", "th", "cn", "ja", "ko", "de", "fr", "ru"] as const;

/**
 * Returns today's date in Bangkok time as YYYY-MM-DD. Used to reset the
 * daily publish counter when a new Thai-day starts.
 */
function bkkDate(): string {
  const now = new Date();
  const bkkMs = now.getTime() + 7 * 60 * 60 * 1000;
  return new Date(bkkMs).toISOString().slice(0, 10);
}

/**
 * POST /api/cron/publish-queue
 *
 * Picks the oldest APPROVED blog that has a cover image and all 8 language
 * translations, and transitions it to PUBLISHED. Honours the daily cap and
 * the kill switch. Returns 202 when it deliberately skipped, 204 when there
 * is nothing to publish, 200 with the blog on success.
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

  // Oldest APPROVED blog first. Ties broken by updatedAt for predictability.
  const candidates = await prisma.blog.findMany({
    where: { status: "APPROVED" },
    include: { translations: { select: { lang: true } } },
    orderBy: [{ updatedAt: "asc" }, { createdAt: "asc" }],
    take: 10,
  });

  const ready = candidates.find((b) => {
    const hasCover = b.covers.length > 0 && b.covers[0]?.trim();
    const langs = new Set(b.translations.map((t) => t.lang));
    const hasAllLangs = REQUIRED_LANGS.every((l) => langs.has(l));
    return hasCover && hasAllLangs;
  });

  if (!ready) {
    await prisma.cronAuditLog.create({
      data: {
        event: "publisher.empty",
        detail: `approved=${candidates.length}, none ready (needs cover + 8 langs)`,
      },
    });
    return NextResponse.json({ skipped: true, reason: "no ready approved blogs" }, { status: 204 });
  }

  const published = await prisma.blog.update({
    where: { id: ready.id },
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
      blogId: ready.id,
      detail: `slug=${published.translations[0]?.slug ?? ""}, dailyCount=${publishedToday + 1}/${MAX_PUBLISH_PER_DAY}`,
    },
  });

  return NextResponse.json({
    blogId: ready.id,
    slug: published.translations[0]?.slug ?? null,
    title: published.translations[0]?.title ?? null,
    publishedToday: publishedToday + 1,
    dailyCap: MAX_PUBLISH_PER_DAY,
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
