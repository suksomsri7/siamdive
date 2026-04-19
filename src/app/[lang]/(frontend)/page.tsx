import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import HeroSlider from "@/components/HeroSlider";
import HomeContent, { type Section } from "@/components/HomeContent";
import {
  trendingBoatIdsByType,
  trendingUpcomingScheduleIds,
  isTrendingAllowed,
  ALL_TRIPS_ITEM_TYPE,
  type TrendingItemType,
} from "@/lib/analytics/trending";

const VALID_LANGS = ["en", "th", "cn", "ja", "ko", "de", "fr", "ru"];

function getDuration(dep: Date | string | null, ret: Date | string | null, boatType: string): string {
  if (dep && ret) {
    // unstable_cache serialises Dates to ISO strings — accept both shapes.
    const d = typeof dep === "string" ? new Date(dep) : dep;
    const r = typeof ret === "string" ? new Date(ret) : ret;
    const days = Math.round((r.getTime() - d.getTime()) / 86400000);
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
    const boatIds     = [...new Set(rows.flatMap(r => r.items.filter(i => i.refType === "BOAT").map(i => i.refId)))];
    const blogIds     = [...new Set(rows.flatMap(r => r.items.filter(i => i.refType === "BLOG").map(i => i.refId)))];

    // Auto pools: any BLOG row with autoLatest or randomMode pulls from the
    // latest PUBLISHED blogs. randomMode shuffles a pool of up to 50; autoLatest
    // takes the top N. One fetch shared across all auto rows.
    const hasAutoLatestBlog = rows.some(r => r.itemType === "BLOG" && r.autoLatest);
    const hasRandomBlog     = rows.some(r => r.itemType === "BLOG" && r.randomMode);
    const autoLatestCap     = Math.max(...rows.filter(r => r.itemType === "BLOG" && r.autoLatest).map(r => r.maxItems ?? 20), 20);
    const latestBlogsLimit  = hasRandomBlog ? Math.max(autoLatestCap, 50) : autoLatestCap;

    // autoTrending rows: query analytics for top boat IDs per row. Map rowId →
    // ranked boat IDs so the resolver can swap curated items with trending.
    // Run queries in parallel; each query is a single grouped-count read.
    const trendingRows = rows.filter(r => r.autoTrending && isTrendingAllowed(r.itemType));
    const trendingById = new Map<string, string[]>();
    if (trendingRows.length > 0) {
      const results = await Promise.all(
        trendingRows.map(r =>
          trendingBoatIdsByType(r.itemType as TrendingItemType, 7, r.maxItems ?? 6)
            .then(ids => ({ rowId: r.id, ids }))
            .catch(() => ({ rowId: r.id, ids: [] as string[] })), // analytics tables may not exist in dev — fail open
        ),
      );
      for (const r of results) trendingById.set(r.rowId, r.ids);
      // Feed trending IDs into the batched Boat fetch below so we don't make
      // a second round-trip per row.
      for (const ids of results) for (const id of ids.ids) boatIds.push(id);
    }

    // ALL_TRIPS autoTrending rows: monthly top upcoming schedules across all
    // boat types, dedup'd one-per-boat. Separate from the BOAT-level trending
    // above because the return type is schedule IDs, not boat IDs.
    const allTripsRows = rows.filter(r => r.autoTrending && r.itemType === ALL_TRIPS_ITEM_TYPE);
    const allTripsByRowId: Record<string, string[]> = {};
    if (allTripsRows.length > 0) {
      const results = await Promise.all(
        allTripsRows.map(r =>
          trendingUpcomingScheduleIds(30, r.maxItems ?? 21)
            .then(ids => ({ rowId: r.id, ids }))
            .catch(() => ({ rowId: r.id, ids: [] as string[] })),
        ),
      );
      for (const r of results) {
        allTripsByRowId[r.rowId] = r.ids;
        for (const id of r.ids) scheduleIds.push(id);
      }
    }

    const boatInclude = {
      translations: { select: { lang: true, title: true, slug: true, excerpt: true } },
      priceTiers:   { select: { regularPrice: true, salePrice: true } },
      serviceAreas: { include: { serviceArea: { include: { translations: { select: { lang: true, name: true } } } } } },
      videos:       { select: { id: true }, take: 1 },
    } as const;

    const [schedules, boats, blogs, latestBlogs] = await Promise.all([
      scheduleIds.length
        ? prisma.schedule.findMany({
            where: { id: { in: scheduleIds } },
            include: { boat: { include: boatInclude } },
          })
        : Promise.resolve([]),

      boatIds.length
        ? prisma.boat.findMany({
            where: { id: { in: boatIds } },
            include: boatInclude,
          })
        : Promise.resolve([]),

      blogIds.length
        ? prisma.blog.findMany({
            where: { id: { in: blogIds }, status: "PUBLISHED" },
            include: { translations: { select: { lang: true, title: true, slug: true, excerpt: true } } },
          })
        : Promise.resolve([]),

      (hasAutoLatestBlog || hasRandomBlog)
        ? prisma.blog.findMany({
            where: { status: "PUBLISHED" },
            orderBy: { createdAt: "desc" },
            take: latestBlogsLimit,
            include: { translations: { select: { lang: true, title: true, slug: true, excerpt: true } } },
          })
        : Promise.resolve([]),
    ]);

    // Convert trendingById Map to plain object so it survives the
    // unstable_cache boundary (Maps aren't serialisable).
    const trendingByRowId: Record<string, string[]> = {};
    for (const [k, v] of trendingById) trendingByRowId[k] = v;

    return { rows, schedules, boats, blogs, latestBlogs, trendingByRowId, allTripsByRowId };
  },
  ["homepage-data"],
  { revalidate: 60 },
);

export const dynamic = "force-dynamic";

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const l = VALID_LANGS.includes(lang) ? lang : "en";

  const { rows, schedules, boats, blogs, latestBlogs, trendingByRowId, allTripsByRowId } = await getHomepageData();

  const schedMap = new Map(schedules.map(s => [s.id, s]));
  const boatMap  = new Map(boats.map(b => [b.id, b]));
  const blogMap  = new Map(blogs.map(b => [b.id, b]));

  // ── Resolve each row into a Section ───────────────────────────────────────
  const sections: Section[] = rows.map(row => {
    const trans = row.translations.find(t => t.lang === l)
      || row.translations.find(t => t.lang === "en");
    const title    = trans?.title    || row.topic;
    const subtitle = trans?.subtitle || undefined;
    // ALL_TRIPS rows have no curated items so fall back to the trending-ids
    // count instead of 0 when maxItems is null.
    const allTripsCount = allTripsByRowId[row.id]?.length ?? 0;
    const limit    = row.maxItems
      ?? (row.itemType === "ALL_TRIPS" && row.autoTrending ? allTripsCount : row.items.length);

    const trips: Section["trips"] = [];
    const resolvedBlogs: Section["blogs"] = [];

    // Auto BLOG row: bypass curated items, use the latestBlogs query result.
    // randomMode wins over autoLatest if both are set — shuffle the pool first.
    if (row.itemType === "BLOG" && (row.autoLatest || row.randomMode)) {
      const cap = row.maxItems ?? 20;
      const pool = row.randomMode
        ? [...latestBlogs].sort(() => Math.random() - 0.5)
        : latestBlogs;
      for (const b of pool.slice(0, cap)) {
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

    // autoTrending row: swap curated items with synthetic BOAT items whose
    // refId is the top-N trending boat IDs for this row's itemType. If
    // analytics returned nothing (cold start or query error), fall back to the
    // curated items so the row still renders something.
    const trendingIds = trendingByRowId[row.id];
    const useTrending = row.autoTrending
      && row.itemType !== "BLOG"
      && row.itemType !== "ALL_TRIPS"
      && Array.isArray(trendingIds)
      && trendingIds.length > 0;

    // ALL_TRIPS autoTrending row: synthetic SCHEDULE items from monthly-top
    // upcoming schedule IDs. Skip curated items entirely — there's no fallback
    // pool for this mode (the trending function already falls back to
    // soonest-upcoming when analytics is sparse).
    const allTripsIds = allTripsByRowId[row.id];
    const useAllTrips = row.autoTrending
      && row.itemType === "ALL_TRIPS"
      && Array.isArray(allTripsIds)
      && allTripsIds.length > 0;

    // Non-BLOG row with randomMode: shuffle the curated items on every page load,
    // then slice maxItems. User controls the pool via backoffice; we randomise order.
    let itemsForRow: Array<{ id: string; rowId: string; refId: string; refType: string; order: number }>;
    if (useAllTrips) {
      itemsForRow = allTripsIds.map((id, i) => ({
        id: `alltrip-${row.id}-${id}`,
        rowId: row.id,
        refId: id,
        refType: "SCHEDULE",
        order: i,
      }));
    } else if (useTrending) {
      itemsForRow = trendingIds.map((id, i) => ({
        id: `trend-${row.id}-${id}`,
        rowId: row.id,
        refId: id,
        refType: "BOAT",
        order: i,
      }));
    } else if (row.randomMode && row.itemType !== "BLOG") {
      itemsForRow = [...row.items].sort(() => Math.random() - 0.5);
    } else {
      itemsForRow = row.items;
    }

    for (const item of itemsForRow.slice(0, limit)) {
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
          // ISO string survives unstable_cache serialisation; HomeContent
          // formats it per-lang. Only SCHEDULE items have this; BOAT items
          // (no specific departure) leave it undefined.
          departureDate:   s.departureDate
            ? (typeof s.departureDate === "string" ? s.departureDate : s.departureDate.toISOString())
            : undefined,
        });
      }

      if (item.refType === "BOAT") {
        const boat = boatMap.get(item.refId);
        if (!boat) continue;
        const bt = boat.translations.find(t => t.lang === l)
          || boat.translations.find(t => t.lang === "en")
          || boat.translations[0];
        const prices = boat.priceTiers.map(p => p.salePrice ?? p.regularPrice).filter(p => p > 0);
        const minPrice = prices.length ? Math.min(...prices) : 0;
        const area = boat.serviceAreas[0]?.serviceArea.translations.find(t => t.lang === l)
          || boat.serviceAreas[0]?.serviceArea.translations.find(t => t.lang === "en")
          || boat.serviceAreas[0]?.serviceArea.translations[0];
        const isLiveaboard = ["LIVEABOARD", "DIVE_RESORT"].includes(boat.type);
        trips.push({
          id:              boat.id,
          slug:            bt?.slug || boat.id,
          title:           bt?.title || boat.name || "",
          price:           minPrice,
          duration:        "",
          type:            isLiveaboard ? "LIVEABOARD" : "DAYTRIP",
          destinationName: area?.name || "",
          imageUrl:        boat.covers[0] || undefined,
          covers:          boat.covers,
          description:     bt?.excerpt || undefined,
          boatId:          boat.id,
          boatType:        boat.type,
          hasVideos:       (boat.videos?.length ?? 0) > 0,
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

    const variant: Section["variant"] | undefined =
      row.itemType === "ALL_TRIPS" && row.autoTrending ? "TOP_RANKED" : undefined;

    return { id: row.id, layout: row.layout, title, subtitle, variant, trips, blogs: resolvedBlogs };
  });

  return (
    <main style={{ background: "#0d0d0d", minHeight: "100vh" }}>
      <HomeContent sections={sections} lang={l} />
    </main>
  );
}
