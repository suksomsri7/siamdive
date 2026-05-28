// Phase 3 — Pure helpers for /api/ark-ai/build-plan.
// Match Schedule rows to slot intent (region + date window + cert level), pick
// gap-fill blogs, and emit human-readable warnings. The DB query and write
// happen in the route handler — this file is logic only so it stays unit-testable.

import type { Slots, Region, CertLevel } from "./slots";

// Region heuristics. Match against ServiceArea translation name (any lang).
// Lowercase everything before comparing. "both" (TH either coast) → no filter.
// Each region has a list of substrings — if the area name in any language
// contains one of these, the area is considered to belong to that region.
const REGION_KEYWORDS: Record<Exclude<Region, "both">, string[]> = {
  andaman: [
    "andaman", "phuket", "krabi", "phi phi", "similan", "surin", "lipe",
    "phang nga", "khao lak", "racha", "hin daeng", "hin muang",
    "ภูเก็ต", "กระบี่", "พีพี", "สิมิลัน", "สุรินทร์", "ลีเป๊ะ",
    "อันดามัน", "พังงา", "เขาหลัก", "ราชา", "หินแดง", "หินม่วง",
  ],
  gulf: [
    "gulf", "ko tao", "koh tao", "pha ngan", "phangan", "samui",
    "chumphon", "sail rock",
    "เกาะเต่า", "พงัน", "พะงัน", "สมุย", "ชุมพร", "อ่าวไทย", "หินใบ",
  ],
  maldives: [
    "maldives", "male", "atoll", "ari", "vaavu", "baa", "lhaviyani",
    "noonu", "rasdhoo", "fuvahmulah",
    "มัลดีฟส์",
  ],
  red_sea: [
    "red sea", "egypt", "hurghada", "dahab", "sharm", "marsa alam",
    "brothers", "elphinstone", "daedalus",
    "ทะเลแดง", "อียิปต์",
  ],
  indonesia: [
    "indonesia", "komodo", "raja ampat", "bali", "lembeh", "bunaken",
    "alor", "ambon", "manado",
    "อินโดนีเซีย", "คอมโด", "ราจาอัมพัท", "บาหลี",
  ],
  palau: [
    "palau", "koror", "blue corner", "german channel",
    "ปาเลา",
  ],
  philippines: [
    "philippines", "tubbataha", "anilao", "coron", "puerto galera",
    "cebu", "malapascua", "moalboal", "dumaguete",
    "ฟิลิปปินส์",
  ],
  malaysia: [
    "malaysia", "sipadan", "layang", "mabul", "kapalai", "tioman",
    "perhentian", "redang",
    "มาเลเซีย",
  ],
};

export function regionMatchesArea(region: Region, areaName: string): boolean {
  if (region === "both") return true;
  const lower = areaName.toLowerCase();
  const list = REGION_KEYWORDS[region];
  if (!list) return false;
  return list.some(k => lower.includes(k));
}

// Same idea but matches against the canonical Country.code on the
// service-area. Preferred over name-substring matching when callers can
// supply the country code, since it's the canonical relation introduced
// 2026-05-28. Falls back to area-name matching for the legacy Thai
// regions (andaman/gulf/both) — those split a single country into coasts.
export function regionMatchesCountry(region: Region, countryCode?: string | null): boolean {
  if (!countryCode) return false;
  switch (region) {
    case "maldives":    return countryCode === "MV";
    case "red_sea":     return countryCode === "EG";
    case "indonesia":   return countryCode === "ID";
    case "palau":       return countryCode === "PW";
    case "philippines": return countryCode === "PH";
    case "malaysia":    return countryCode === "MY";
    case "andaman":
    case "gulf":
    case "both":
      return countryCode === "TH";
  }
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
    andaman:     { th: "อันดามัน",   en: "Andaman" },
    gulf:        { th: "อ่าวไทย",    en: "Gulf" },
    both:        { th: "ไทย",        en: "Thailand" },
    maldives:    { th: "มัลดีฟส์",    en: "Maldives" },
    red_sea:     { th: "ทะเลแดง",   en: "Red Sea" },
    indonesia:   { th: "อินโดนีเซีย", en: "Indonesia" },
    palau:       { th: "ปาเลา",      en: "Palau" },
    philippines: { th: "ฟิลิปปินส์",   en: "Philippines" },
    malaysia:    { th: "มาเลเซีย",   en: "Malaysia" },
  };
  const r = slots.region ? regionLabel[slots.region] : null;
  // Sprint 3 B2 — annotate the plan name when the group is mixed so the
  // user can tell at a glance that a parallel programme is expected.
  const nonDivers = slots.companions?.nonDivers ?? 0;
  const mixSuffix = nonDivers > 0
    ? (lang === "th" ? ` (มี ${nonDivers} คนไม่ดำ)` : ` (+${nonDivers} non-diver${nonDivers === 1 ? "" : "s"})`)
    : "";
  if (lang === "th") {
    return `แผนทริป${r?.th || ""} ${dateText} ${partyText}${mixSuffix}`.replace(/\s+/g, " ").trim();
  }
  return `${r?.en || "Dive"} trip — ${dateText}, ${partyText}${mixSuffix}`.replace(/\s+/g, " ").trim();
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
