// Run with: bun test src/lib/ark-ai/profile.test.ts
//
// Tests pure functions only (mergeProfiles + formatProfileSummary cold-start).
// DB-touching paths are validated by the smoke test on Vercel preview.
import { test, expect } from "bun:test";
import { mergeProfiles, formatProfileSummary, _internal } from "./profile";

const emptyRaw = {
  visitorId: "",
  viewedBoatIds: [] as string[],
  viewedTypes: [] as { type: string; count: number }[],
  viewedAreas: [] as string[],
  searches: [] as string[],
  planTrips: [] as string[],
  removedTrips: [] as string[],
  bookingIntents: [] as string[],
  totalActivity: 0,
};

test("mergeProfiles dedupes boat ids across devices", () => {
  const merged = mergeProfiles("d1", ["d1", "d2"], [
    { ...emptyRaw, visitorId: "d1", viewedBoatIds: ["b1", "b2"] },
    { ...emptyRaw, visitorId: "d2", viewedBoatIds: ["b2", "b3"] },
  ]);
  expect(merged.viewedBoatIds.sort()).toEqual(["b1", "b2", "b3"]);
  expect(merged.mergedDeviceIds).toEqual(["d1", "d2"]);
});

test("mergeProfiles sums type counts and re-sorts by total", () => {
  const merged = mergeProfiles("d1", ["d1", "d2"], [
    { ...emptyRaw, visitorId: "d1", viewedTypes: [{ type: "DAYTRIP", count: 3 }, { type: "LIVEABOARD", count: 1 }] },
    { ...emptyRaw, visitorId: "d2", viewedTypes: [{ type: "LIVEABOARD", count: 5 }, { type: "DAYTRIP", count: 2 }] },
  ]);
  expect(merged.viewedTypes).toEqual([
    { type: "LIVEABOARD", count: 6 },
    { type: "DAYTRIP", count: 5 },
  ]);
});

test("mergeProfiles sums totalActivity across devices", () => {
  const merged = mergeProfiles("d1", ["d1", "d2", "d3"], [
    { ...emptyRaw, visitorId: "d1", totalActivity: 10 },
    { ...emptyRaw, visitorId: "d2", totalActivity: 7 },
    { ...emptyRaw, visitorId: "d3", totalActivity: 3 },
  ]);
  expect(merged.totalActivity).toBe(20);
});

test("mergeProfiles dedupes searches and caps to 10", () => {
  const profileWithMany = (vid: string, searches: string[]) => ({
    ...emptyRaw, visitorId: vid, searches,
  });
  const merged = mergeProfiles("d1", ["d1", "d2"], [
    profileWithMany("d1", ["similan", "phi phi", "racha", "koh tao", "koh lipe", "samui"]),
    profileWithMany("d2", ["similan", "richelieu", "surin", "tachai", "boon sung", "stonehenge", "anita", "junker"]),
  ]);
  expect(merged.searches.length).toBeLessThanOrEqual(10);
  // similan must appear only once
  expect(merged.searches.filter(s => s === "similan").length).toBe(1);
});

test("formatProfileSummary returns empty string for cold-start visitor", async () => {
  const cold = mergeProfiles("d1", ["d1"], [
    { ...emptyRaw, visitorId: "d1", totalActivity: _internal.COLD_START_MIN_ACTIVITY - 1, viewedAreas: ["a1"] },
  ]);
  const out = await formatProfileSummary(cold, "th");
  expect(out).toBe("");
});

test("formatProfileSummary returns empty string when totalActivity exactly at threshold but no signal", async () => {
  // totalActivity at threshold but no viewed areas/types/searches/boats → no useful hints
  const noSignal = mergeProfiles("d1", ["d1"], [
    { ...emptyRaw, visitorId: "d1", totalActivity: _internal.COLD_START_MIN_ACTIVITY },
  ]);
  const out = await formatProfileSummary(noSignal, "th");
  expect(out).toBe("");
});

test("formatProfileSummary includes warm-visitor hints (no DB lookup needed when only types/searches/boats)", async () => {
  const warm = mergeProfiles("d1", ["d1"], [
    {
      ...emptyRaw,
      visitorId: "d1",
      totalActivity: 12,
      viewedTypes: [{ type: "LIVEABOARD", count: 3 }, { type: "DAYTRIP", count: 1 }],
      searches: ["similan", "richelieu rock"],
      viewedBoatIds: ["b1", "b2", "b3"],
    },
  ]);
  const out = await formatProfileSummary(warm, "th");
  expect(out).toContain("Visitor Behavior Profile");
  expect(out).toContain("LIVEABOARD (3)");
  expect(out).toContain("similan");
  expect(out).toContain("Has viewed 3 boat");
  // Cold-start hint should NOT mention the user explicitly
  expect(out).toContain("do NOT mention");
});

test("formatProfileSummary mentions cross-device merge when ≥2 devices", async () => {
  const multi = mergeProfiles("d1", ["d1", "d2", "d3"], [
    { ...emptyRaw, visitorId: "d1", totalActivity: 8, viewedBoatIds: ["b1"] },
    { ...emptyRaw, visitorId: "d2", totalActivity: 0 },
    { ...emptyRaw, visitorId: "d3", totalActivity: 0 },
  ]);
  const out = await formatProfileSummary(multi, "th");
  expect(out).toContain("merged across 3 devices");
});

test("cold-start threshold is 5", () => {
  expect(_internal.COLD_START_MIN_ACTIVITY).toBe(5);
});

test("cache TTL is 1 hour", () => {
  expect(_internal.CACHE_TTL_MS).toBe(60 * 60 * 1000);
});
