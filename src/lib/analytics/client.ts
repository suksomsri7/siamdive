"use client";

// Browser-side analytics SDK. Minimal, no external deps, sendBeacon on unload.
// Public surface: track(), flush(). Lifecycle managed by <AnalyticsProvider/>.

import type { AnalyticsEventType, TrackBatch, TrackEventInput } from "./types";

const STORAGE_VISITOR = "sd_vid";
const STORAGE_SESSION = "sd_sid";
const STORAGE_SESSION_META = "sd_sid_meta";           // JSON: {startedAt, lastSeenAt, firstUtm, firstReferrer, landingPath}
const STORAGE_FIRST_TOUCH = "sd_first_touch";         // JSON: {utm, referrer, landingPath}
const SESSION_TTL_MS = 30 * 60 * 1000;                // 30 min sliding
const BATCH_INTERVAL_MS = 5000;
const BATCH_MAX = 10;
const ENDPOINT = "/api/track";

type SessionMeta = {
  startedAt: string;
  lastSeenAt: string;
};

type FirstTouch = {
  utm?: {
    source?: string | null;
    medium?: string | null;
    campaign?: string | null;
    term?: string | null;
    content?: string | null;
  };
  referrer?: string | null;
  landingPath?: string | null;
};

let queue: Array<TrackEventInput & { ts: string }> = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let sessionId: string | null = null;
let visitorId: string | null = null;
let sessionStartedAt: string | null = null;
let currentLang: string | null = null;
let initialized = false;

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  // Fallback RFC4122 v4
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function readLs(key: string): string | null {
  try { return window.localStorage.getItem(key); } catch { return null; }
}

function writeLs(key: string, val: string): void {
  try { window.localStorage.setItem(key, val); } catch {}
}

function parseUtm(): FirstTouch["utm"] {
  try {
    const qs = new URLSearchParams(window.location.search);
    const out: NonNullable<FirstTouch["utm"]> = {};
    const src = qs.get("utm_source");
    const med = qs.get("utm_medium");
    const cmp = qs.get("utm_campaign");
    const trm = qs.get("utm_term");
    const cnt = qs.get("utm_content");
    if (src) out.source = src;
    if (med) out.medium = med;
    if (cmp) out.campaign = cmp;
    if (trm) out.term = trm;
    if (cnt) out.content = cnt;
    return Object.keys(out).length ? out : undefined;
  } catch {
    return undefined;
  }
}

function getOrCreateVisitor(): string {
  let v = readLs(STORAGE_VISITOR);
  if (!v) {
    v = uuid();
    writeLs(STORAGE_VISITOR, v);
  }
  return v;
}

function getOrCreateSession(): string {
  const now = Date.now();
  const existingId = readLs(STORAGE_SESSION);
  const existingMetaRaw = readLs(STORAGE_SESSION_META);

  if (existingId && existingMetaRaw) {
    try {
      const meta: SessionMeta = JSON.parse(existingMetaRaw);
      const last = new Date(meta.lastSeenAt).getTime();
      if (now - last < SESSION_TTL_MS) {
        sessionStartedAt = meta.startedAt;
        meta.lastSeenAt = new Date(now).toISOString();
        writeLs(STORAGE_SESSION_META, JSON.stringify(meta));
        return existingId;
      }
    } catch {
      // fall through — create new
    }
  }

  const id = uuid();
  const meta: SessionMeta = {
    startedAt: new Date(now).toISOString(),
    lastSeenAt: new Date(now).toISOString(),
  };
  sessionStartedAt = meta.startedAt;
  writeLs(STORAGE_SESSION, id);
  writeLs(STORAGE_SESSION_META, JSON.stringify(meta));
  return id;
}

function getFirstTouch(): FirstTouch {
  const existing = readLs(STORAGE_FIRST_TOUCH);
  if (existing) {
    try { return JSON.parse(existing); } catch {}
  }
  const ft: FirstTouch = {
    utm: parseUtm(),
    referrer: document.referrer || null,
    landingPath: window.location.pathname + window.location.search,
  };
  writeLs(STORAGE_FIRST_TOUCH, JSON.stringify(ft));
  return ft;
}

function touchSession(): void {
  const metaRaw = readLs(STORAGE_SESSION_META);
  if (!metaRaw) return;
  try {
    const meta: SessionMeta = JSON.parse(metaRaw);
    meta.lastSeenAt = new Date().toISOString();
    writeLs(STORAGE_SESSION_META, JSON.stringify(meta));
  } catch {}
}

function buildBatch(): TrackBatch {
  const ft = getFirstTouch();
  return {
    sessionId: sessionId!,
    visitorId: visitorId!,
    lang: currentLang,
    viewportW: typeof window !== "undefined" ? window.innerWidth : undefined,
    viewportH: typeof window !== "undefined" ? window.innerHeight : undefined,
    startedAt: sessionStartedAt ?? undefined,
    firstUtm: ft.utm,
    lastUtm: parseUtm(),
    referrer: ft.referrer ?? null,
    landingPath: ft.landingPath ?? null,
    events: queue,
  };
}

export function flush(useBeacon = false): void {
  if (!initialized || queue.length === 0) return;
  const batch = buildBatch();
  queue = [];
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }

  const body = JSON.stringify(batch);

  if (useBeacon && typeof navigator !== "undefined" && "sendBeacon" in navigator) {
    try {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
      return;
    } catch {
      // fall through
    }
  }

  try {
    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // swallow — analytics must never throw into page
  }
}

function scheduleFlush(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(() => { flushTimer = null; flush(false); }, BATCH_INTERVAL_MS);
}

export function track(type: AnalyticsEventType, input: Omit<TrackEventInput, "type"> = {}): void {
  if (!initialized) return;
  touchSession();
  queue.push({
    ...input,
    type,
    ts: new Date().toISOString(),
    path: input.path ?? (typeof window !== "undefined" ? window.location.pathname : ""),
  });
  if (queue.length >= BATCH_MAX) flush(false);
  else scheduleFlush();
}

export function setLang(lang: string | null): void {
  currentLang = lang;
}

type InitState = { dwellStart: number; lastPath: string };
const initState: InitState = { dwellStart: 0, lastPath: "" };

export function initAnalytics(lang?: string | null): void {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  currentLang = lang ?? null;
  visitorId = getOrCreateVisitor();
  sessionId = getOrCreateSession();

  // Fresh session? fire SESSION_START
  const metaRaw = readLs(STORAGE_SESSION_META);
  if (metaRaw) {
    try {
      const meta: SessionMeta = JSON.parse(metaRaw);
      const justStarted = Date.now() - new Date(meta.startedAt).getTime() < 2000;
      if (justStarted) track("SESSION_START");
    } catch {}
  }

  // Initial PAGE_VIEW on mount
  initState.lastPath = window.location.pathname;
  initState.dwellStart = Date.now();
  track("PAGE_VIEW");

  // Flush on unload — sendBeacon fire-and-forget
  const onBeforeUnload = () => {
    const dwell = Date.now() - initState.dwellStart;
    queue.push({
      type: "SESSION_END",
      path: window.location.pathname,
      ts: new Date().toISOString(),
      dwellMs: dwell,
    });
    flush(true);
  };
  window.addEventListener("pagehide", onBeforeUnload);
  window.addEventListener("beforeunload", onBeforeUnload);

  // Visibility change: flush pending when user switches tab
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush(true);
  });
}

// Called by <AnalyticsProvider/> when Next navigates to a new route.
export function onRouteChange(path: string): void {
  if (!initialized) return;
  if (path === initState.lastPath) return;

  // Emit dwell for the previous page
  const dwell = Date.now() - initState.dwellStart;
  if (dwell > 200) {
    queue.push({
      type: "PAGE_VIEW",
      path: initState.lastPath,
      ts: new Date().toISOString(),
      dwellMs: dwell,
      properties: { phase: "leave" },
    });
  }

  initState.lastPath = path;
  initState.dwellStart = Date.now();
  track("PAGE_VIEW");
}

// ── Domain-event helpers (thin wrappers so components stay small) ──

export const trackTripView = (boatId: string, extra?: Record<string, unknown>) =>
  track("TRIP_VIEW", { entityType: "BOAT", entityId: boatId, properties: extra ?? null });

export const trackScheduleView = (scheduleId: string, extra?: Record<string, unknown>) =>
  track("SCHEDULE_VIEW", { entityType: "SCHEDULE", entityId: scheduleId, properties: extra ?? null });

export const trackScheduleShare = (scheduleId: string, channel: string) =>
  track("SCHEDULE_SHARE", { entityType: "SCHEDULE", entityId: scheduleId, properties: { channel } });

export const trackBlogView = (blogId: string, extra?: Record<string, unknown>) =>
  track("BLOG_VIEW", { entityType: "BLOG", entityId: blogId, properties: extra ?? null });

export const trackBlogReadComplete = (blogId: string, dwellMs: number, scrollPct: number) =>
  track("BLOG_READ_COMPLETE", { entityType: "BLOG", entityId: blogId, dwellMs, scrollPct });

export const trackSearch = (query: string, resultsCount: number, filters?: Record<string, unknown>) =>
  track("SEARCH", { properties: { query, resultsCount, filters: filters ?? null } });

export const trackSearchResultClick = (entityType: string, entityId: string, rank: number, query?: string) =>
  track("SEARCH_RESULT_CLICK", { entityType, entityId, properties: { rank, query: query ?? null } });

export const trackFilterApply = (filters: Record<string, unknown>) =>
  track("FILTER_APPLY", { properties: filters });

export const trackRowClick = (rowId: string, itemType: string, itemId: string, rank: number) =>
  track("ROW_CLICK", { entityType: "ROW", entityId: rowId, properties: { itemType, itemId, rank } });

export const trackLanguageSwitch = (from: string | null, to: string) =>
  track("LANGUAGE_SWITCH", { properties: { from, to } });

export type BookingChannel = "line" | "whatsapp" | "email" | "call" | "messenger" | "wechat";
const CHANNEL_TO_TYPE: Record<BookingChannel, AnalyticsEventType> = {
  line: "BOOKING_INTENT_LINE",
  whatsapp: "BOOKING_INTENT_WHATSAPP",
  email: "BOOKING_INTENT_EMAIL",
  call: "BOOKING_INTENT_CALL",
  messenger: "BOOKING_INTENT_MESSENGER",
  wechat: "BOOKING_INTENT_WECHAT",
};

export const trackBookingIntent = (
  channel: BookingChannel,
  target?: { type?: string; id?: string; priceTHB?: number; scheduleDate?: string },
) =>
  track(CHANNEL_TO_TYPE[channel], {
    entityType: target?.type ?? null,
    entityId: target?.id ?? null,
    properties: {
      channel,
      priceTHB: target?.priceTHB ?? null,
      scheduleDate: target?.scheduleDate ?? null,
    },
  });
