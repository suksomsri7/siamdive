// Phase 3 — Pure helpers for /api/ark-ai/build-plan.
// Match Schedule rows to slot intent (region + date window + cert level), pick
// gap-fill blogs, and emit human-readable warnings. The DB query and write
// happen in the route handler — this file is logic only so it stays unit-testable.

import type { Slots, Region, CertLevel } from "./slots";

// Region heuristics. Match against ServiceArea translation name (any lang).
// Lowercase everything before comparing. "both" → no filter.
const ANDAMAN_KEYWORDS = [
  "andaman", "phuket", "krabi", "phi phi", "similan", "surin", "lipe",
  "phang nga", "khao lak", "racha", "hin daeng", "hin muang",
  "ภูเก็ต", "กระบี่", "พีพี", "สิมิลัน", "สุรินทร์", "ลีเป๊ะ",
  "อันดามัน", "พังงา", "เขาหลัก", "ราชา", "หินแดง", "หินม่วง",
];
const GULF_KEYWORDS = [
  "gulf", "ko tao", "koh tao", "pha ngan", "phangan", "samui",
  "chumphon", "sail rock",
  "เกาะเต่า", "พงัน", "พะงัน", "สมุย", "ชุมพร", "อ่าวไทย", "หินใบ",
];

export function regionMatchesArea(region: Region, areaName: string): boolean {
  if (region === "both") return true;
  const lower = areaName.toLowerCase();
  const list = region === "andaman" ? ANDAMAN_KEYWORDS : GULF_KEYWORDS;
  return list.some(k => lower.includes(k));
}

// Days off the requested window. 0 = within range. >0 = N days before/after.
// Used to rank schedules; lower is better. Missing date → Infinity.
export function dateProximity(scheduleDate: string | null, from: string, to?: string): number {
  if (!scheduleDate) return Number.POSITIVE_INFINITY;
  const sd = Date.parse(scheduleDate + "T00:00:00Z");
  const fd = Date.parse(from + "T00:00:00Z");
  const td = to ? Date.parse(to + "T00:00:00Z") : fd;
  if (Number.isNaN(sd) || Number.isNaN(fd) || Number.isNaN(td)) return Number.POSITIVE_INFINITY;
  if (sd >= fd && sd <= td) return 0;
  const diff = Math.min(Math.abs(sd - fd), Math.abs(sd - td));
  return Math.round(diff / 86_400_000);
}

// The lowest cert in a group constrains what packages are appropriate.
// "none" = snorkel only. Empty/undefined falls back to "ow" (most common).
export function lowestCert(certs?: CertLevel[]): CertLevel {
  if (!certs?.length) return "ow";
  const order: CertLevel[] = ["none", "ow", "aow", "rescue+"];
  let lowest = order[order.length - 1];
  for (const c of certs) {
    if (order.indexOf(c) < order.indexOf(lowest)) lowest = c;
  }
  return lowest;
}

// Similan & Surin national parks close mid-May → mid-Oct each year.
// We only use the start date for the trip — if a multi-day window straddles
// the boundary the warning still fires, which is the right call for safety.
export function similanClosed(fromIso: string): boolean {
  const d = new Date(fromIso + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return false;
  const m = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  if (m > 5 && m < 10) return true;
  if (m === 5 && day >= 16) return true;
  if (m === 10 && day <= 14) return true;
  return false;
}

export function buildPlanName(slots: Slots, lang: string): string {
  const dates = slots.dates;
  const adults = slots.headcount?.adults ?? 0;
  const kids = slots.headcount?.kids ?? 0;
  const partyText = lang === "th"
    ? `${adults}${kids ? `+${kids}` : ""} คน`
    : `${adults}${kids ? `+${kids}` : ""} ppl`;
  const dateText = dates?.label
    || (dates?.to && dates.to !== dates.from ? `${dates.from} → ${dates.to}` : dates?.from || "");
  const regionLabel: Record<Region, { th: string; en: string }> = {
    andaman: { th: "อันดามัน", en: "Andaman" },
    gulf: { th: "อ่าวไทย", en: "Gulf" },
    both: { th: "ไทย", en: "Thailand" },
  };
  const r = slots.region ? regionLabel[slots.region] : null;
  if (lang === "th") {
    return `แผนทริป${r?.th || ""} ${dateText} ${partyText}`.replace(/\s+/g, " ").trim();
  }
  return `${r?.en || "Dive"} trip — ${dateText}, ${partyText}`.replace(/\s+/g, " ").trim();
}

// Snorkel-only filter: keep schedules that have at least one NON_DIVER tier
// or a package whose title hints at snorkel/skin-dive. Conservative — when a
// package only lists DIVER tiers we drop it for "none" certs.
export function packageIsSnorkelFriendly(
  tiers: { tier: string }[],
  packageTitle: string,
): boolean {
  if (tiers.some(t => t.tier === "NON_DIVER")) return true;
  const t = packageTitle.toLowerCase();
  return t.includes("snorkel") || t.includes("ดำผิวน้ำ") || t.includes("skin dive");
}
