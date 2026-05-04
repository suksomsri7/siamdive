// Run with: bun test src/lib/ark-ai/safety.test.ts
import { test, expect } from "bun:test";
import {
  detectMedicalConcern,
  buildMedicalRedirect,
  maxDepthForCert,
  extractDepthsMentioned,
  flagOverdepthRecommendation,
  findFabricatedBoatNames,
} from "./safety";

// ── Medical detection ────────────────────────────────────────────────────────

test("detect heart concern (English)", () => {
  expect(detectMedicalConcern("I have heart problems, can I dive?")).toBe("heart");
  expect(detectMedicalConcern("Hypertension is bad for diving?")).toBe("heart");
});

test("detect heart concern (Thai)", () => {
  expect(detectMedicalConcern("ผมเป็นโรคหัวใจ ดำได้ไหม")).toBe("heart");
});

test("detect ear concern", () => {
  expect(detectMedicalConcern("My eardrum burst last year")).toBe("ear");
  expect(detectMedicalConcern("ผมเคยปวดหู ทำให้ดำไม่ได้")).toBe("ear");
});

test("detect asthma", () => {
  expect(detectMedicalConcern("I have asthma since I was a kid")).toBe("lung");
  expect(detectMedicalConcern("เป็นหอบหืดมานานแล้ว")).toBe("lung");
});

test("detect pregnancy", () => {
  expect(detectMedicalConcern("I'm pregnant, can I still dive?")).toBe("pregnancy");
  expect(detectMedicalConcern("ตั้งครรภ์ 3 เดือน ดำได้ไหม")).toBe("pregnancy");
});

test("clean message returns null", () => {
  expect(detectMedicalConcern("Recommend a Similan liveaboard")).toBeNull();
  expect(detectMedicalConcern("อยากไปดำที่พีพี 3 วัน")).toBeNull();
});

// ── Medical redirect text ────────────────────────────────────────────────────

test("Thai medical redirect mentions LINE/WhatsApp", () => {
  const out = buildMedicalRedirect("heart", "th");
  expect(out).toContain("LINE/WhatsApp");
  expect(out).toContain("แพทย์");
});

test("English medical redirect mentions doctor", () => {
  const out = buildMedicalRedirect("ear", "en");
  expect(out.toLowerCase()).toContain("doctor");
});

test("unknown lang falls back to English", () => {
  const out = buildMedicalRedirect("heart", "zz");
  expect(out.length).toBeGreaterThan(20);
});

// ── Cert depth ───────────────────────────────────────────────────────────────

test("OW cert maps to 18m", () => expect(maxDepthForCert("OPEN_WATER")).toBe(18));
test("AOW cert maps to 30m", () => expect(maxDepthForCert("ADVANCED")).toBe(30));
test("no cert maps to 0m (snorkel only)", () => expect(maxDepthForCert("NONE")).toBe(0));
test("unknown cert defaults to OW (18m)", () => expect(maxDepthForCert("MARTIAN_BLUE")).toBe(18));

// ── Depth extraction ─────────────────────────────────────────────────────────

test("extractDepthsMentioned finds 30m, 50 metres, 40 เมตร", () => {
  const depths = extractDepthsMentioned("Dive to 30m at Richelieu, max 50 metres on the wreck, ลึก 40 เมตร");
  expect(depths.sort((a, b) => a - b)).toEqual([30, 40, 50]);
});

test("extractDepthsMentioned ignores non-depth numbers", () => {
  const depths = extractDepthsMentioned("Trip is 5 days for 12 people");
  expect(depths).toEqual([]);
});

test("flagOverdepthRecommendation catches OW user → 30m mention", () => {
  const result = flagOverdepthRecommendation("Recommend dive site at 30m", "OPEN_WATER");
  expect(result.exceeded).toBe(true);
  expect(result.maxDepth).toBe(18);
  expect(result.mentioned).toContain(30);
});

test("flagOverdepthRecommendation accepts AOW → 30m mention", () => {
  const result = flagOverdepthRecommendation("Recommend dive site at 30m", "ADVANCED");
  expect(result.exceeded).toBe(false);
});

// ── Boat name fabrication ────────────────────────────────────────────────────

test("findFabricatedBoatNames catches MV that's not in allowed list", () => {
  const allowed = ["MV Aquarian", "MV Issara"];
  const fakes = findFabricatedBoatNames("I recommend MV Made Up Boat for the trip.", allowed);
  expect(fakes).toContain("MV Made Up Boat");
});

test("findFabricatedBoatNames passes when boat is in allowed list", () => {
  const allowed = ["MV Aquarian Liveaboard"];
  const fakes = findFabricatedBoatNames("MV Aquarian Liveaboard goes to Similan.", allowed);
  expect(fakes.length).toBe(0);
});

test("findFabricatedBoatNames is case-insensitive", () => {
  const allowed = ["MV Aquarian"];
  const fakes = findFabricatedBoatNames("mv aquarian is a good choice.", allowed);
  expect(fakes.length).toBe(0);
});
