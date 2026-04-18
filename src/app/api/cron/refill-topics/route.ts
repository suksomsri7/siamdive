import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCronSecret } from "@/lib/cronAuth";

const CATEGORIES = ["INSPIRATION", "LIFESTYLE", "GEAR", "GUIDE", "SAFETY", "EDUCATION"] as const;
type Category = (typeof CATEGORIES)[number];

// Refill tuning: run when any category has < MIN_PER_CAT unused, top up to TARGET_PER_CAT.
const MIN_PER_CAT    = 15;
const TARGET_PER_CAT = 25;

// Similarity rejection threshold for inbound titles (over both existing BlogTopic
// titles and recent PUBLISHED Blog EN titles).
const JACCARD_REJECT = 0.55;

const STOPWORDS = new Set([
  "the","a","an","and","or","of","in","to","for","with","on","at","by",
  "your","you","is","are","how","what","why","vs","that","this","its",
  "actually","really","when","where","from","about","as","it","be","do",
  "does","did","have","has","get","got","not","no","but","so","if","then",
]);

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function wordSet(s: string): Set<string> {
  return new Set(normalize(s).split(" ").filter((w) => w.length > 2 && !STOPWORDS.has(w)));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const w of a) if (b.has(w)) inter++;
  return inter / (a.size + b.size - inter);
}

/**
 * GET /api/cron/refill-topics
 *
 * Diagnostic + agent-context endpoint. Returns stock counts, per-category
 * deficits versus the refill target, and all existing topic titles plus the
 * recent PUBLISHED blog EN titles so the agent can avoid proposing dupes.
 */
export async function GET(req: NextRequest) {
  const authErr = requireCronSecret(req);
  if (authErr) return authErr;

  const topics = await prisma.blogTopic.findMany({
    select: { category: true, title: true, used: true },
  });
  const recentBlogs = await prisma.blog.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { updatedAt: "desc" },
    take: 80,
    select: { translations: { where: { lang: "en" }, select: { title: true } } },
  });
  const recentBlogTitles = recentBlogs
    .map((b) => b.translations[0]?.title)
    .filter((t): t is string => !!t);

  const byCat = Object.fromEntries(
    CATEGORIES.map((c) => [c, { unused: 0, used: 0, titles: [] as string[] }]),
  ) as Record<Category, { unused: number; used: number; titles: string[] }>;

  for (const t of topics) {
    const slot = byCat[t.category as Category];
    if (!slot) continue;
    slot.titles.push(t.title);
    if (t.used) slot.used++;
    else slot.unused++;
  }

  const deficits = CATEGORIES
    .map((c) => ({
      category: c,
      unused: byCat[c].unused,
      target: TARGET_PER_CAT,
      needed: Math.max(0, TARGET_PER_CAT - byCat[c].unused),
      belowThreshold: byCat[c].unused < MIN_PER_CAT,
    }))
    .sort((a, b) => a.unused - b.unused);

  return NextResponse.json({
    thresholds: { minPerCategory: MIN_PER_CAT, targetPerCategory: TARGET_PER_CAT, jaccardReject: JACCARD_REJECT },
    deficits,
    byCategory: CATEGORIES.map((c) => ({
      category: c,
      unused: byCat[c].unused,
      used: byCat[c].used,
      titles: byCat[c].titles,
    })),
    recentBlogTitles,
  });
}

type IncomingTopic = {
  category: string;
  title: string;
  keywords?: string[];
  note?: string;
};

/**
 * POST /api/cron/refill-topics
 *
 * Body: { topics: IncomingTopic[] }
 *
 * Inserts new topics with two-layer dedup:
 *   1. Normalized exact-title match against all existing BlogTopic rows.
 *   2. Jaccard word-set similarity ≥ JACCARD_REJECT against both existing
 *      BlogTopic titles and recent PUBLISHED blog EN titles.
 *
 * Returns the counts and the list of rejected titles with reasons so the
 * generator can learn from the rejection on subsequent runs.
 */
export async function POST(req: NextRequest) {
  const authErr = requireCronSecret(req);
  if (authErr) return authErr;

  const body = await req.json().catch(() => null);
  const incoming: IncomingTopic[] = Array.isArray(body?.topics) ? body.topics : [];
  if (incoming.length === 0) {
    return NextResponse.json({ error: "body.topics[] required" }, { status: 400 });
  }

  // Pull the full dedup corpus: all existing topics + recent blog titles.
  const existingTopics = await prisma.blogTopic.findMany({ select: { title: true } });
  const recentBlogs = await prisma.blog.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { updatedAt: "desc" },
    take: 120,
    select: { translations: { where: { lang: "en" }, select: { title: true } } },
  });

  const existingNormSet = new Set(existingTopics.map((t) => normalize(t.title)));
  const corpus: Array<{ raw: string; wordSet: Set<string> }> = [
    ...existingTopics.map((t) => ({ raw: t.title, wordSet: wordSet(t.title) })),
    ...recentBlogs.flatMap((b) =>
      b.translations[0]?.title
        ? [{ raw: b.translations[0].title, wordSet: wordSet(b.translations[0].title) }]
        : [],
    ),
  ];

  const accepted: IncomingTopic[] = [];
  const rejected: Array<{ title: string; reason: string; match?: string }> = [];

  // Also dedup within the incoming batch itself so a single call can't import
  // two near-duplicates of its own topics.
  const batchNormSet = new Set<string>();
  const batchWordSets: Array<{ raw: string; wordSet: Set<string> }> = [];

  for (const raw of incoming) {
    const title = String(raw.title ?? "").trim();
    const category = String(raw.category ?? "").toUpperCase();

    if (!title) { rejected.push({ title, reason: "empty title" }); continue; }
    if (!CATEGORIES.includes(category as Category)) {
      rejected.push({ title, reason: `invalid category: ${category}` });
      continue;
    }
    if (title.length > 200) { rejected.push({ title, reason: "title too long (>200)" }); continue; }

    const norm = normalize(title);
    if (existingNormSet.has(norm)) {
      rejected.push({ title, reason: "exact duplicate of existing topic" });
      continue;
    }
    if (batchNormSet.has(norm)) {
      rejected.push({ title, reason: "duplicate within this batch" });
      continue;
    }

    const ws = wordSet(title);
    let bestMatch: { raw: string; score: number } | null = null;
    for (const c of corpus) {
      const s = jaccard(ws, c.wordSet);
      if (!bestMatch || s > bestMatch.score) bestMatch = { raw: c.raw, score: s };
      if (s >= JACCARD_REJECT) break;
    }
    if (bestMatch && bestMatch.score >= JACCARD_REJECT) {
      rejected.push({ title, reason: `too similar (jaccard=${bestMatch.score.toFixed(2)})`, match: bestMatch.raw });
      continue;
    }
    for (const b of batchWordSets) {
      const s = jaccard(ws, b.wordSet);
      if (s >= JACCARD_REJECT) {
        rejected.push({ title, reason: `too similar to batch-mate (jaccard=${s.toFixed(2)})`, match: b.raw });
        continue;
      }
    }

    accepted.push({ category, title, keywords: raw.keywords ?? [], note: raw.note ?? "" });
    batchNormSet.add(norm);
    batchWordSets.push({ raw: title, wordSet: ws });
  }

  // Persist. order defaults to 0 — they'll queue in by createdAt ASC, which
  // mirrors how the seed script appended.
  if (accepted.length) {
    await prisma.blogTopic.createMany({
      data: accepted.map((t) => ({
        category: t.category as Category,
        title:    t.title,
        keywords: t.keywords ?? [],
        note:     t.note ?? "",
      })),
    });
  }

  await prisma.cronAuditLog.create({
    data: {
      event: "refill.topics",
      detail: `inserted=${accepted.length}, rejected=${rejected.length}, batchSize=${incoming.length}`.slice(0, 500),
    },
  });

  return NextResponse.json({
    requested: incoming.length,
    inserted:  accepted.length,
    rejected,
  });
}
