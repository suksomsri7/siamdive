// Homepage-facing trending query. Separate from adminQueries so the homepage
// doesn't accidentally pull in admin-level filters, and so the return shape can
// stay minimal (just the ranked boat IDs).
//
// Called by src/app/[lang]/(frontend)/page.tsx for DisplayRow rows with
// autoTrending=true. Rank is by raw TRIP_VIEW count over the last N days,
// filtered to non-bot sessions. Boats are joined so we can filter by BoatType
// to match the row's itemType.

import { prisma } from "@/lib/prisma";

// Allowed itemType values that support autoTrending. Must match entries in
// BoatType enum (schema.prisma line 746). BLOG rows use autoLatest/randomMode
// instead — they're handled separately in page.tsx.
export const TRENDING_ALLOWED_ITEM_TYPES = [
  "LIVEABOARD",
  "DAYTRIP",
  "DIVE_RESORT",
  "LAND_TOUR",
] as const;

export type TrendingItemType = (typeof TRENDING_ALLOWED_ITEM_TYPES)[number];

export function isTrendingAllowed(itemType: string): itemType is TrendingItemType {
  return (TRENDING_ALLOWED_ITEM_TYPES as readonly string[]).includes(itemType);
}

// Pseudo-itemType for "monthly top trips across all boat types" rows. Not a
// BoatType — the resolver treats this as SCHEDULE-refType synthetic items.
export const ALL_TRIPS_ITEM_TYPE = "ALL_TRIPS" as const;

/**
 * Top N boat IDs ranked by TRIP_VIEW event count in the last `days` days,
 * filtered to a specific BoatType and to non-bot sessions. Returns empty array
 * if no events exist in window (caller falls back to curated items).
 *
 * Rolling window — last 7 days from now by default, NOT ISO week.
 */
export async function trendingBoatIdsByType(
  boatType: TrendingItemType,
  days = 7,
  limit = 6,
): Promise<string[]> {
  const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Filter by Boat.type via join so we only pull the matching type's events.
  // ::"BoatType" cast needed because Prisma parameterises as text.
  const rows = await prisma.$queryRaw<Array<{ entityId: string; views: number }>>`
    SELECT
      e."entityId",
      COUNT(*)::int AS views
    FROM "AnalyticsEvent" e
    JOIN "AnalyticsSession" s ON s.id = e."sessionId"
    JOIN "Boat" b ON b.id = e."entityId"
    WHERE e.ts >= ${start}
      AND s."isBot" = FALSE
      AND e."entityType" = 'BOAT'
      AND e.type = 'TRIP_VIEW'
      AND e."entityId" IS NOT NULL
      AND b.type = ${boatType}::"BoatType"
      AND b.status = 'PUBLISHED'::"PublishStatus"
    GROUP BY e."entityId"
    ORDER BY views DESC
    LIMIT ${limit}
  `;

  return rows.map((r) => r.entityId);
}

/**
 * Top N *upcoming* schedules across all boat types, ranked by parent-boat
 * TRIP_VIEW count over the last `days` days. Each boat contributes only its
 * nearest future schedule (dedup by boatId), so one popular boat can't
 * monopolise the row. Past trips (departureDate < now) and inactive statuses
 * (DRAFT/CANCELLED/COMPLETED) are excluded. When analytics data is sparse
 * (common early on), views is 0 for most boats and the order falls back to
 * soonest-departing schedules, so the row is always populated as long as
 * there are upcoming trips.
 */
export async function trendingUpcomingScheduleIds(
  days = 30,
  limit = 21,
): Promise<string[]> {
  const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const rows = await prisma.$queryRaw<Array<{ schedule_id: string }>>`
    WITH boat_views AS (
      SELECT e."entityId" AS boat_id, COUNT(*)::int AS views
      FROM "AnalyticsEvent" e
      JOIN "AnalyticsSession" s ON s.id = e."sessionId"
      WHERE e.ts >= ${start}
        AND s."isBot" = FALSE
        AND e."entityType" = 'BOAT'
        AND e.type = 'TRIP_VIEW'
        AND e."entityId" IS NOT NULL
      GROUP BY e."entityId"
    ),
    ranked AS (
      SELECT
        s.id AS schedule_id,
        s."boatId" AS boat_id,
        COALESCE(v.views, 0) AS views,
        s."departureDate",
        ROW_NUMBER() OVER (
          PARTITION BY s."boatId"
          ORDER BY s."departureDate" ASC
        ) AS rn
      FROM "Schedule" s
      LEFT JOIN boat_views v ON v.boat_id = s."boatId"
      WHERE s."departureDate" >= NOW()
        AND s.status IN ('OPEN', 'FULL')
    )
    SELECT schedule_id
    FROM ranked
    WHERE rn = 1
    ORDER BY views DESC, "departureDate" ASC
    LIMIT ${limit}
  `;

  return rows.map((r) => r.schedule_id);
}
