import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseUa } from "@/lib/analytics/uaParse";
import { isBotUa } from "@/lib/analytics/botFilter";
import type { AnalyticsEventType as TypeAlias } from "@/lib/analytics/types";

// The endpoint must be tolerant: never 5xx on malformed input, swallow bad
// rows, always return 204/200. Analytics must never break the page.

export const dynamic = "force-dynamic";

type RawEvent = {
  type: string;
  ts?: string;
  path?: string;
  entityType?: string | null;
  entityId?: string | null;
  dwellMs?: number | null;
  scrollPct?: number | null;
  properties?: Record<string, unknown> | null;
};

type RawBatch = {
  sessionId?: string;
  visitorId?: string;
  lang?: string | null;
  viewportW?: number;
  viewportH?: number;
  startedAt?: string;
  firstUtm?: {
    source?: string | null;
    medium?: string | null;
    campaign?: string | null;
    term?: string | null;
    content?: string | null;
  };
  lastUtm?: {
    source?: string | null;
    medium?: string | null;
    campaign?: string | null;
  };
  referrer?: string | null;
  landingPath?: string | null;
  events?: RawEvent[];
};

const EVENT_TYPES = new Set<string>([
  "PAGE_VIEW","ROW_CLICK","LANGUAGE_SWITCH","TRIP_VIEW","SCHEDULE_VIEW",
  "SCHEDULE_SHARE","BLOG_VIEW","BLOG_READ_COMPLETE","SEARCH","SEARCH_RESULT_CLICK",
  "FILTER_APPLY","BOOKING_INTENT_LINE","BOOKING_INTENT_WHATSAPP",
  "BOOKING_INTENT_EMAIL","BOOKING_INTENT_CALL","BOOKING_INTENT_MESSENGER",
  "BOOKING_INTENT_WECHAT","SESSION_START","SESSION_END","ERROR",
]);

const BOOKING_INTENT_TYPES = new Set<string>([
  "BOOKING_INTENT_LINE","BOOKING_INTENT_WHATSAPP","BOOKING_INTENT_EMAIL",
  "BOOKING_INTENT_CALL","BOOKING_INTENT_MESSENGER","BOOKING_INTENT_WECHAT",
]);

function normalizeSearchQuery(q: string): string {
  return q.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}

function clampStr(s: string | null | undefined, max: number): string | null {
  if (!s) return null;
  return s.length > max ? s.slice(0, max) : s;
}

export async function POST(req: NextRequest) {
  let body: RawBatch;
  try {
    body = (await req.json()) as RawBatch;
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const sessionId = body.sessionId?.trim();
  const visitorId = body.visitorId?.trim();
  const events = Array.isArray(body.events) ? body.events : [];

  if (!sessionId || !visitorId || events.length === 0) {
    return new NextResponse(null, { status: 204 });
  }

  const ua = req.headers.get("user-agent") ?? "";
  const isBot = isBotUa(ua);
  const { device, os, browser } = parseUa(ua);

  const country = req.headers.get("x-vercel-ip-country")
              ?? req.headers.get("cf-ipcountry")
              ?? null;
  const region  = req.headers.get("x-vercel-ip-country-region") ?? null;
  const city    = req.headers.get("x-vercel-ip-city")
              ? decodeURIComponent(req.headers.get("x-vercel-ip-city") as string)
              : null;

  const now = new Date();
  const startedAtDate = body.startedAt ? new Date(body.startedAt) : now;

  try {
    // Upsert session — create on first hit, update last-touch on every batch.
    await prisma.analyticsSession.upsert({
      where: { id: sessionId },
      create: {
        id: sessionId,
        visitorId,
        startedAt: startedAtDate,
        lastSeenAt: now,
        eventCount: events.length,
        pageCount: events.filter((e) => e.type === "PAGE_VIEW").length,
        country: clampStr(country, 8),
        region: clampStr(region, 64),
        city: clampStr(city, 64),
        device,
        os,
        browser,
        firstUtmSource:   clampStr(body.firstUtm?.source, 64),
        firstUtmMedium:   clampStr(body.firstUtm?.medium, 64),
        firstUtmCampaign: clampStr(body.firstUtm?.campaign, 128),
        firstUtmTerm:     clampStr(body.firstUtm?.term, 128),
        firstUtmContent:  clampStr(body.firstUtm?.content, 128),
        firstReferrer:    clampStr(body.referrer, 512),
        firstLandingPath: clampStr(body.landingPath, 512),
        lastUtmSource:    clampStr(body.lastUtm?.source, 64),
        lastUtmMedium:    clampStr(body.lastUtm?.medium, 64),
        lastUtmCampaign:  clampStr(body.lastUtm?.campaign, 128),
        lang:             clampStr(body.lang ?? null, 8),
        isBot,
      },
      update: {
        lastSeenAt: now,
        eventCount: { increment: events.length },
        pageCount:  { increment: events.filter((e) => e.type === "PAGE_VIEW").length },
        lastUtmSource:    clampStr(body.lastUtm?.source, 64) ?? undefined,
        lastUtmMedium:    clampStr(body.lastUtm?.medium, 64) ?? undefined,
        lastUtmCampaign:  clampStr(body.lastUtm?.campaign, 128) ?? undefined,
        lang:             clampStr(body.lang ?? null, 8) ?? undefined,
      },
    });

    const eventRows = events
      .filter((e) => EVENT_TYPES.has(e.type))
      .map((e) => ({
        ts: e.ts ? new Date(e.ts) : now,
        sessionId,
        visitorId,
        type: e.type as TypeAlias,
        path: clampStr(e.path ?? "/", 512) ?? "/",
        lang: clampStr(body.lang ?? null, 8),
        entityType: clampStr(e.entityType ?? null, 32),
        entityId:   clampStr(e.entityId ?? null, 64),
        dwellMs:    typeof e.dwellMs === "number" ? Math.min(Math.max(e.dwellMs, 0), 6 * 60 * 60 * 1000) : null,
        scrollPct:  typeof e.scrollPct === "number" ? Math.min(Math.max(e.scrollPct, 0), 100) : null,
        viewportW:  body.viewportW ?? null,
        viewportH:  body.viewportH ?? null,
        properties: e.properties ?? undefined,
      }));

    if (eventRows.length > 0) {
      await prisma.analyticsEvent.createMany({ data: eventRows as never });
    }

    // ── Side tables ──────────────────────────────────────────────────
    // SEARCH → AnalyticsSearch
    const searchRows = events
      .filter((e) => e.type === "SEARCH" && e.properties && typeof e.properties.query === "string")
      .map((e) => {
        const p = (e.properties ?? {}) as { query: string; resultsCount?: number; filters?: Record<string, unknown> | null };
        return {
          ts: e.ts ? new Date(e.ts) : now,
          sessionId,
          visitorId,
          queryRaw: clampStr(p.query, 256) ?? "",
          queryNorm: clampStr(normalizeSearchQuery(p.query), 256) ?? "",
          lang: clampStr(body.lang ?? null, 8),
          country: clampStr(country, 8),
          resultsCount: typeof p.resultsCount === "number" ? p.resultsCount : 0,
          filters: p.filters ?? undefined,
        };
      })
      .filter((r) => r.queryRaw.length > 0);

    if (searchRows.length > 0) {
      await prisma.analyticsSearch.createMany({ data: searchRows as never });
    }

    // BOOKING_INTENT_* → AnalyticsAttribution
    const intentRows = events
      .filter((e) => BOOKING_INTENT_TYPES.has(e.type))
      .map((e) => {
        const p = (e.properties ?? {}) as { priceTHB?: number; scheduleDate?: string };
        const msFromSession = body.startedAt
          ? (e.ts ? new Date(e.ts).getTime() : now.getTime()) - new Date(body.startedAt).getTime()
          : null;
        return {
          ts: e.ts ? new Date(e.ts) : now,
          sessionId,
          visitorId,
          intentType: e.type as TypeAlias,
          targetType: clampStr(e.entityType ?? "UNKNOWN", 32) ?? "UNKNOWN",
          targetId:   clampStr(e.entityId ?? "", 64) ?? "",
          targetPriceTHB: typeof p.priceTHB === "number" ? p.priceTHB : null,
          scheduleDate:   p.scheduleDate ? new Date(p.scheduleDate) : null,
          firstUtmSource:   clampStr(body.firstUtm?.source, 64),
          firstUtmMedium:   clampStr(body.firstUtm?.medium, 64),
          firstUtmCampaign: clampStr(body.firstUtm?.campaign, 128),
          firstReferrer:    clampStr(body.referrer, 512),
          msFromSessionStart: msFromSession,
        };
      });

    if (intentRows.length > 0) {
      await prisma.analyticsAttribution.createMany({ data: intentRows as never });
    }
  } catch (err) {
    // Never 5xx into the client — swallow and move on.
    console.error("[/api/track] insert failed:", err);
  }

  return new NextResponse(null, { status: 204 });
}
