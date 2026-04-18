import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import * as Q from "@/lib/analytics/adminQueries";

// Dynamic admin analytics endpoint — reuses the same auth guard as the
// rest of /api/*. Routes:
//   /api/analytics/overview?range=30d
//   /api/analytics/top-trips?range=7d&limit=10
//   /api/analytics/top-blogs?range=30d&limit=10
//   /api/analytics/search-insights?range=30d
//   /api/analytics/country-heatmap?range=30d
//   /api/analytics/funnel?range=30d
//   /api/analytics/utm-roi?range=30d
//   /api/analytics/trending-now?limit=10
//   /api/analytics/hourly-pattern?range=30d

const VALID_RANGES = ["7d", "30d", "90d"] as const;

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ metric: string }> },
) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { metric } = await ctx.params;
  const url = new URL(req.url);
  const rangeRaw = url.searchParams.get("range") ?? "30d";
  const range = (VALID_RANGES.includes(rangeRaw as never) ? rangeRaw : "30d") as Q.RangeKey;
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? "10"), 1), 100);

  try {
    let data: unknown;
    switch (metric) {
      case "overview":         data = await Q.overview(range); break;
      case "top-trips":        data = await Q.topTrips(range, limit); break;
      case "top-blogs":        data = await Q.topBlogs(range, limit); break;
      case "search-insights":  data = await Q.searchInsights(range); break;
      case "country-heatmap":  data = await Q.countryHeatmap(range); break;
      case "funnel":           data = await Q.funnel(range); break;
      case "utm-roi":          data = await Q.utmRoi(range); break;
      case "trending-now":     data = await Q.trendingNow(limit); break;
      case "hourly-pattern":   data = await Q.hourlyPattern(range); break;
      default:
        return NextResponse.json({ error: `unknown metric: ${metric}` }, { status: 404 });
    }
    return NextResponse.json({ metric, range, data });
  } catch (err) {
    console.error(`[/api/analytics/${metric}] failed:`, err);
    return NextResponse.json(
      { error: "analytics query failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
