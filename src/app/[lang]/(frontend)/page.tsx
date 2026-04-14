import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import HeroSlider from "@/components/HeroSlider";
import HomeContent, { type Section } from "@/components/HomeContent";

const VALID_LANGS = ["en", "th", "cn", "ja", "ko", "de", "fr", "ru"];

function getDuration(dep: Date | null, ret: Date | null, boatType: string): string {
  if (dep && ret) {
    const days = Math.round((ret.getTime() - dep.getTime()) / 86400000);
    return `${days + 1}D${days}N`;
  }
  if (["DAYTRIP", "SNORKELING", "LAND_TOUR"].includes(boatType)) return "1 Day";
  return "";
}

const getHomepageData = unstable_cache(
  async () => {
    const rows = await prisma.displayRow.findMany({
      where: { active: true },
      include: { translations: true, items: { orderBy: { order: "asc" } } },
      orderBy: { order: "asc" },
    });

    const scheduleIds = [...new Set(rows.flatMap(r => r.items.filter(i => i.refType === "SCHEDULE").map(i => i.refId)))];
    const blogIds     = [...new Set(rows.flatMap(r => r.items.filter(i => i.refType === "BLOG").map(i => i.refId)))];

    // Auto-latest: any BLOG row with autoLatest=true pulls the most recent
    // PUBLISHED blogs (capped at maxItems ?? 20). Fetched once and shared
    // across all auto rows so we don't double-query the same data.
    const hasAutoLatestBlog = rows.some(r => r.itemType === "BLOG" && r.autoLatest);
    const latestBlogsLimit = Math.max(...rows.filter(r => r.itemType === "BLOG" && r.autoLatest).map(r => r.maxItems ?? 20), 20);

    const [schedules, blogs, latestBlogs] = await Promise.all([
      scheduleIds.length
        ? prisma.schedule.findMany({
            where: { id: { in: scheduleIds } },
            include: {
              boat: {
                include: {
                  translations: { select: { lang: true, title: true, slug: true, excerpt: true } },
                  priceTiers:   { select: { regularPrice: true, salePrice: true } },
                  serviceAreas: { include: { serviceArea: { include: { translations: { select: { lang: true, name: true } } } } } },
                  videos:       { select: { id: true }, take: 1 },
                },
              },
            },
          })
        : Promise.resolve([]),

      blogIds.length
        ? prisma.blog.findMany({
            where: { id: { in: blogIds }, status: "PUBLISHED" },
            include: { translations: { select: { lang: true, title: true, slug: true, excerpt: true } } },
          })
        : Promise.resolve([]),

      hasAutoLatestBlog
        ? prisma.blog.findMany({
            where: { status: "PUBLISHED" },
            orderBy: { createdAt: "desc" },
            take: latestBlogsLimit,
            include: { translations: { select: { lang: true, title: true, slug: true, excerpt: true } } },
          })
        : Promise.resolve([]),
    ]);

    return { rows, schedules, blogs, latestBlogs };
  },
  ["homepage-data"],
  { revalidate: 60 },
);

export function generateStaticParams() {
  return ["en", "th", "cn", "ja", "ko", "de", "fr", "ru"].map(lang => ({ lang }));
}

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const l = VALID_LANGS.includes(lang) ? lang : "en";

  const { rows, schedules, blogs, latestBlogs } = await getHomepageData();

  const schedMap = new Map(schedules.map(s => [s.id, s]));
  const blogMap  = new Map(blogs.map(b => [b.id, b]));

  // ── Resolve each row into a Section ───────────────────────────────────────
  const sections: Section[] = rows.map(row => {
    const trans = row.translations.find(t => t.lang === l)
      || row.translations.find(t => t.lang === "en");
    const title    = trans?.title    || row.topic;
    const subtitle = trans?.subtitle || undefined;
    const limit    = row.maxItems ?? row.items.length;

    const trips: Section["trips"] = [];
    const resolvedBlogs: Section["blogs"] = [];

    // Auto-latest BLOG row: bypass curated items, use the latestBlogs query result
    if (row.itemType === "BLOG" && row.autoLatest) {
      const cap = row.maxItems ?? 20;
      for (const b of latestBlogs.slice(0, cap)) {
        const bt = b.translations.find(t => t.lang === l)
          || b.translations.find(t => t.lang === "en")
          || b.translations[0];
        if (!bt) continue;
        resolvedBlogs.push({
          id:      b.id,
          slug:    bt.slug,
          title:   bt.title,
          excerpt: bt.excerpt || "",
          cover:   b.covers[0] || "",
        });
      }
      return { id: row.id, layout: row.layout, title, subtitle, trips, blogs: resolvedBlogs };
    }

    for (const item of row.items.slice(0, limit)) {
      if (item.refType === "SCHEDULE") {
        const s = schedMap.get(item.refId);
        if (!s) continue;
        const bt = s.boat.translations.find(t => t.lang === l)
          || s.boat.translations.find(t => t.lang === "en")
          || s.boat.translations[0];
        const prices = s.boat.priceTiers.map(p => p.salePrice ?? p.regularPrice).filter(p => p > 0);
        const minPrice = prices.length ? Math.min(...prices) : 0;
        const area = s.boat.serviceAreas[0]?.serviceArea.translations.find(t => t.lang === l)
          || s.boat.serviceAreas[0]?.serviceArea.translations.find(t => t.lang === "en")
          || s.boat.serviceAreas[0]?.serviceArea.translations[0];
        const isLiveaboard = ["LIVEABOARD", "DIVE_RESORT"].includes(s.boat.type);
        trips.push({
          id:              item.refId,
          slug:            bt?.slug || s.boat.id,
          title:           bt?.title || s.boat.name || "",
          price:           minPrice,
          duration:        getDuration(s.departureDate, s.returnDate, s.boat.type),
          type:            isLiveaboard ? "LIVEABOARD" : "DAYTRIP",
          destinationName: area?.name || "",
          imageUrl:        s.boat.covers[0] || undefined,
          covers:          s.boat.covers,
          description:     bt?.excerpt || undefined,
          boatId:          s.boat.id,
          boatType:        s.boat.type,
          hasVideos:       (s.boat.videos?.length ?? 0) > 0,
        });
      }

      if (item.refType === "BLOG") {
        const b = blogMap.get(item.refId);
        if (!b) continue;
        const bt = b.translations.find(t => t.lang === l)
          || b.translations.find(t => t.lang === "en")
          || b.translations[0];
        if (!bt) continue;
        resolvedBlogs.push({
          id:      b.id,
          slug:    bt.slug,
          title:   bt.title,
          excerpt: bt.excerpt || "",
          cover:   b.covers[0] || "",
        });
      }
    }

    return { id: row.id, layout: row.layout, title, subtitle, trips, blogs: resolvedBlogs };
  });

  return (
    <main style={{ background: "#0d0d0d", minHeight: "100vh" }}>
      <HomeContent sections={sections} lang={l} />
    </main>
  );
}
