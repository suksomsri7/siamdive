import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

const BASE = "https://siamdive.com";
const LANGS = ["en", "th", "cn", "ja", "ko", "de", "fr", "ru"] as const;
const TRIP_SEGMENTS = [
  "daytrip",
  "snorkeling",
  "land-tour",
  "liveaboard",
  "dive-resort",
  "freedive",
];
const LIVEABOARD_COUNTRY_SEGMENTS = [
  "liveaboard-thailand",
  "liveaboard-maldives",
  "liveaboard-red-sea",
  "liveaboard-indonesia",
  "liveaboard-palau",
  "liveaboard-philippines",
];
// Type+area pages (Phuket / Samui) — same priority as the generic type pages.
const AREA_TYPE_SEGMENTS = [
  "daytrip-phuket",
  "daytrip-samui",
  "land-tour-phuket",
  "land-tour-samui",
  "snorkeling-phuket",
  "snorkeling-samui",
];
const COURSE_TYPES = [
  "scuba",
  "freedive",
  "scuba-instructor",
  "freedive-instructor",
];

function staticAlternates(path: string): Record<string, string> {
  return Object.fromEntries(LANGS.map((l) => [l, `${BASE}/${l}${path}`]));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  const now = new Date();

  // ── Static pages ──────────────────────────────────────────────────────────
  const staticPaths: {
    path: string;
    priority: number;
    change: "daily" | "weekly" | "monthly";
  }[] = [
    { path: "", priority: 1.0, change: "daily" },
    { path: "/blogs", priority: 0.8, change: "daily" },
    { path: "/trips", priority: 0.9, change: "daily" },
    { path: "/courses", priority: 0.8, change: "weekly" },
    ...TRIP_SEGMENTS.map((s) => ({
      path: `/trips/${s}`,
      priority: 0.8,
      change: "daily" as const,
    })),
    ...LIVEABOARD_COUNTRY_SEGMENTS.map((s) => ({
      path: `/trips/${s}`,
      priority: 0.8,
      change: "daily" as const,
    })),
    ...AREA_TYPE_SEGMENTS.map((s) => ({
      path: `/trips/${s}`,
      priority: 0.8,
      change: "daily" as const,
    })),
    ...COURSE_TYPES.map((t) => ({
      path: `/courses/${t}`,
      priority: 0.7,
      change: "weekly" as const,
    })),
    { path: "/about", priority: 0.5, change: "monthly" as const },
    { path: "/privacy", priority: 0.3, change: "monthly" as const },
    { path: "/terms", priority: 0.3, change: "monthly" as const },
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

  // ── Blogs (PUBLISHED only) ────────────────────────────────────────────────
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

  // ── Trips / Boats (PUBLISHED only) ────────────────────────────────────────
  const boats = await prisma.boat.findMany({
    where: { status: "PUBLISHED" },
    select: {
      updatedAt: true,
      translations: {
        select: { lang: true, slug: true },
        where: { slug: { not: "" } },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  for (const boat of boats) {
    if (boat.translations.length === 0) continue;

    const languages: Record<string, string> = {};
    for (const t of boat.translations) {
      languages[t.lang] = `${BASE}/${t.lang}/trips/${t.slug}`;
    }

    for (const t of boat.translations) {
      entries.push({
        url: `${BASE}/${t.lang}/trips/${t.slug}`,
        lastModified: boat.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
        alternates: { languages },
      });
    }
  }

  return entries;
}
