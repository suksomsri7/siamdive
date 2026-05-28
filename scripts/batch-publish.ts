/**
 * One-shot batch publish: gen cover + flip DRAFT→PUBLISHED
 * for all DRAFTs except the 4 newest (which remain in queue).
 *
 * Usage: bun scripts/batch-publish.ts
 *
 * Skips blogs that fail translation validation.
 * Deletes blogs with completely empty content (unrecoverable).
 */

import { prisma } from "../src/lib/prisma";
import { generateBlogCover } from "../src/lib/blogCoverGen";

const COVER_MODEL = "seedream-v5-lite";
const KEEP_NEWEST = 4;
const REQUIRED_LANGS = ["en", "th", "cn", "ja", "ko", "de", "fr", "ru"] as const;
const MIN_CONTENT_CHARS = 800;

function translationsOk(translations: Array<{ lang: string; title: string; excerpt: string; content: string; slug: string }>): { ok: true } | { ok: false; reason: string } {
  const byLang = new Map(translations.map((t) => [t.lang, t]));
  for (const lang of REQUIRED_LANGS) {
    const t = byLang.get(lang);
    if (!t) return { ok: false, reason: `missing lang=${lang}` };
    if (!t.title?.trim()) return { ok: false, reason: `${lang}.title empty` };
    if (!t.slug?.trim()) return { ok: false, reason: `${lang}.slug empty` };
    if (!t.excerpt?.trim()) return { ok: false, reason: `${lang}.excerpt empty` };
    if (!t.content?.trim() || t.content.length < MIN_CONTENT_CHARS) {
      return { ok: false, reason: `${lang}.content too short (${t.content?.length ?? 0})` };
    }
  }
  return { ok: true };
}

async function main() {
  const allDrafts = await prisma.blog.findMany({
    where: { status: "DRAFT" },
    include: {
      translations: { select: { lang: true, title: true, excerpt: true, content: true, slug: true } },
    },
    orderBy: [{ createdAt: "asc" }],
  });

  const toPublish = allDrafts.slice(0, allDrafts.length - KEEP_NEWEST);
  const keep = allDrafts.slice(allDrafts.length - KEEP_NEWEST);

  console.log(`Total DRAFT: ${allDrafts.length} | publish target: ${toPublish.length} | keep: ${keep.length}`);
  console.log(`Keep IDs: ${keep.map((k) => k.id).join(", ")}`);
  console.log("---");

  let published = 0;
  let deleted = 0;
  let skipped = 0;
  let coverGenErrors = 0;

  for (let i = 0; i < toPublish.length; i++) {
    const blog = toPublish[i];
    const label = `[${i + 1}/${toPublish.length}] ${blog.id}`;

    const check = translationsOk(blog.translations);
    if (!check.ok) {
      const allEmpty = blog.translations.every((t) => !t.content?.trim());
      if (allEmpty) {
        await prisma.blog.delete({ where: { id: blog.id } });
        deleted++;
        console.log(`${label} DELETED (content empty all langs)`);
      } else {
        skipped++;
        console.log(`${label} SKIPPED: ${check.reason}`);
      }
      continue;
    }

    // Gen cover if missing
    if (blog.covers.length === 0) {
      if (!blog.mjPrompt?.trim()) {
        skipped++;
        console.log(`${label} SKIPPED: no mjPrompt`);
        continue;
      }
      try {
        const result = await generateBlogCover({
          prompt: blog.mjPrompt,
          modelId: COVER_MODEL,
          aspectRatio: "16:9",
          blogId: blog.id,
          attachToBlog: true,
        });
        console.log(`${label} cover OK → ${result.coverUrl.split("/").pop()}`);
      } catch (e) {
        coverGenErrors++;
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`${label} COVER FAILED: ${msg}`);
        continue; // don't publish without cover
      }
    }

    // Flip to PUBLISHED
    await prisma.blog.update({
      where: { id: blog.id },
      data: { status: "PUBLISHED" },
    });
    published++;

    if (published % 10 === 0) {
      console.log(`--- progress: ${published} published, ${coverGenErrors} cover errors, ${deleted} deleted, ${skipped} skipped ---`);
    }
  }

  console.log("===== DONE =====");
  console.log(`Published: ${published}`);
  console.log(`Deleted: ${deleted}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Cover errors: ${coverGenErrors}`);

  const remaining = await prisma.blog.count({ where: { status: "DRAFT" } });
  console.log(`Remaining DRAFT: ${remaining}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
