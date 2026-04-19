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
    GROUP BY e."entityId"
    ORDER BY views DESC
    LIMIT ${limit}
  `;

  return rows.map((r) => r.entityId);
}
