import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

// Sitemap is regenerated at most once per hour. Adding/publishing a blog will
// show up within 1 hour without a redeploy. Lower this if you want it faster.
export const dynamic = "force-dynamic";
export const revalidate = 3600;

const BASE = "https://siamdive.com";
const LANGS = ["en", "th", "cn", "ja", "ko", "de", "fr", "ru"] as const;
const TRIP_SEGMENTS = ["daytrip", "snorkeling", "land-tour", "liveaboard", "dive-resort", "freedive"];
const COURSE_TYPES = ["scuba", "freedive", "scuba-instructor", "freedive-instructor"];

function staticAlternates(path: string): Record<string, string> {
  return Object.fromEntries(LANGS.map((l) => [l, `${BASE}/${l}${path}`]));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  const now = new Date();

  // ── Static pages ────────────────────────────────────────────────────────────
  const staticPaths: { path: string; priority: number; change: "daily" | "weekly" | "monthly" }[] = [
    { path: "",         priority: 1.0, change: "daily" },
    { path: "/blogs",   priority: 0.8, change: "daily" },
    { path: "/trips",   priority: 0.9, change: "daily" },
    { path: "/courses", priority: 0.8, change: "weekly" },
    ...TRIP_SEGMENTS.map((s) => ({ path: `/trips/${s}`, priority: 0.8, change: "daily" as const })),
    ...COURSE_TYPES.map((t)  => ({ path: `/courses/${t}`, priority: 0.7, change: "weekly" as const })),
  ];

  for (const { path, priority, change } of staticPaths) {
    const alternates = staticAlternates(path);
    for (const lang of LANGS) {
      entries.push({
        url: `${BASE}/${lang}${path}`,
        lastModified: now,
        changeFrequency: change,
        priority,
        alternates: { languages: alternates },
      });
    }
  }

  // ── Blogs (PUBLISHED only) ──────────────────────────────────────────────────
  // Each blog can have a different slug per language. We emit one entry per
  // (blog × translation) and attach hreflang alternates so Google knows which
  // version to serve to which locale.
  const blogs = await prisma.blog.findMany({
    where: { status: "PUBLISHED" },
    select: {
      updatedAt: true,
      translations: { select: { lang: true, slug: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  for (const b of blogs) {
    const langSlug: Record<string, string> = {};
    for (const t of b.translations) langSlug[t.lang] = t.slug;

    // Build the alternates map once per blog (same for every translation row)
    const languages: Record<string, string> = {};
    for (const [l, s] of Object.entries(langSlug)) {
      languages[l] = `${BASE}/${l}/blogs/${s}`;
    }

    for (const t of b.translations) {
      entries.push({
        url: `${BASE}/${t.lang}/blogs/${t.slug}`,
        lastModified: b.updatedAt,
        changeFrequency: "monthly",
        priority: 0.6,
        alternates: { languages },
      });
    }
  }

  // ── Future: Boat / Course / Company / School detail pages ───────────────────
  // No individual detail routes exist yet (only segment/type list pages).
  // When `/[lang]/trips/[segment]/[slug]`, `/[lang]/companies/[id]` etc. are
  // added, fetch their PUBLISHED rows here and push entries the same way as
  // blogs above. The hreflang map should use the per-language slug from the
  // matching translation row.

  return entries;
}
