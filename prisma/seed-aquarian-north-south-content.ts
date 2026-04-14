/**
 * Copy full 8-language content from Issara N/S Andaman templates
 * to Aquarian N/S Andaman schedules, replacing dates in itinerary.
 */
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "postgresql://siamdive:siamdive_password@localhost:5432/siamdive_db" });
const prisma = new PrismaClient({ adapter });

// Issara template schedule IDs (already have full 8-lang content)
const TEMPLATE_N = "cmnrmfir40000tckzp5kvsepr"; // N. Andaman, departs 2026-04-10
const TEMPLATE_S = "cmnrmfitk001ctckz4z2xy09w"; // S. Andaman, departs 2026-05-06

const TEMPLATE_N_DEPARTURE = new Date("2026-04-10");
const TEMPLATE_S_DEPARTURE = new Date("2026-05-06");

// Aquarian trips
type Trip = { id: string; departure: string; route: "N" | "S"; duration: "4D5N" | "3D4N" };

const trips: Trip[] = [
  // North Andaman
  { id: "sch_aquarian_109", departure: "2026-04-08", route: "N", duration: "4D5N" },
  { id: "sch_aquarian_110", departure: "2026-04-15", route: "N", duration: "3D4N" },
  { id: "sch_aquarian_111", departure: "2026-04-22", route: "N", duration: "4D5N" },
  { id: "sch_aquarian_113", departure: "2026-05-05", route: "N", duration: "4D5N" },
  { id: "sch_aquarian_140", departure: "2026-11-11", route: "N", duration: "4D5N" },
  { id: "sch_aquarian_143", departure: "2026-12-02", route: "N", duration: "4D5N" },
  { id: "sch_aquarian_144", departure: "2026-12-09", route: "N", duration: "4D5N" },
  { id: "sch_aquarian_145", departure: "2026-12-16", route: "N", duration: "4D5N" },
  { id: "sch_aquarian_159", departure: "2027-03-24", route: "N", duration: "4D5N" },
  { id: "sch_aquarian_197", departure: "2027-12-15", route: "N", duration: "4D5N" },
  // South Andaman
  { id: "sch_aquarian_112", departure: "2026-04-29", route: "S", duration: "4D5N" },
  { id: "sch_aquarian_135", departure: "2026-10-08", route: "S", duration: "4D5N" },
  { id: "sch_aquarian_136", departure: "2026-10-13", route: "S", duration: "4D5N" },
  { id: "sch_aquarian_137", departure: "2026-10-21", route: "S", duration: "4D5N" },
  { id: "sch_aquarian_138", departure: "2026-10-28", route: "S", duration: "4D5N" },
  { id: "sch_aquarian_141", departure: "2026-11-17", route: "S", duration: "4D5N" },
  { id: "sch_aquarian_188", departure: "2027-10-13", route: "S", duration: "4D5N" },
  { id: "sch_aquarian_191", departure: "2027-11-02", route: "S", duration: "4D5N" },
];

// ── Date formatting per language ────────────────────────────────────────────

const MONTHS_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_FR = ["janv", "févr", "mars", "avr", "mai", "juin", "juil", "août", "sept", "oct", "nov", "déc"];
const MONTHS_DE = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
const MONTHS_RU = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

function formatDate(d: Date, lang: string): string {
  const day = d.getDate();
  const month = d.getMonth();
  switch (lang) {
    case "th": return `${day} ${MONTHS_TH[month]}`;
    case "en": return `${day} ${MONTHS_EN[month]}`;
    case "de": return `${day}. ${MONTHS_DE[month]}`;
    case "fr": return `${day} ${MONTHS_FR[month]}`;
    case "ru": return `${day} ${MONTHS_RU[month]}`;
    case "cn":
    case "ja": return `${month + 1}月${day}日`;
    case "ko": return `${month + 1}월 ${day}일`;
    default: return `${day} ${MONTHS_EN[month]}`;
  }
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/**
 * Replace template dates with actual trip dates in itinerary text.
 * Uses placeholder tokens to avoid cascading replacements.
 * Templates have 6 days (days 0..5) for 4D5N.
 */
function replaceDates(itinerary: string, lang: string, templateDep: Date, tripDep: Date): string {
  let result = itinerary;
  // Pass 1: replace template dates with unique placeholders
  for (let offset = 0; offset <= 5; offset++) {
    const oldDate = addDays(templateDep, offset);
    const oldStr = formatDate(oldDate, lang);
    result = result.split(oldStr).join(`__DATE_${offset}__`);
  }
  // Pass 2: replace placeholders with actual trip dates
  for (let offset = 0; offset <= 5; offset++) {
    const newDate = addDays(tripDep, offset);
    const newStr = formatDate(newDate, lang);
    result = result.split(`__DATE_${offset}__`).join(newStr);
  }
  return result;
}

async function main() {
  // 1. Load Issara template translations (all 8 languages)
  const nTemplateTrans = await prisma.scheduleTranslation.findMany({ where: { scheduleId: TEMPLATE_N } });
  const sTemplateTrans = await prisma.scheduleTranslation.findMany({ where: { scheduleId: TEMPLATE_S } });

  const nByLang = new Map(nTemplateTrans.map(t => [t.lang, t]));
  const sByLang = new Map(sTemplateTrans.map(t => [t.lang, t]));

  console.log(`Loaded N. Andaman template: ${nByLang.size} langs (content: ${nByLang.get("th")?.content.length} chars)`);
  console.log(`Loaded S. Andaman template: ${sByLang.size} langs (content: ${sByLang.get("th")?.content.length} chars)`);

  // 2. Update each Aquarian trip
  let updated = 0;
  for (const trip of trips) {
    const templateMap = trip.route === "N" ? nByLang : sByLang;
    const templateDep = trip.route === "N" ? TEMPLATE_N_DEPARTURE : TEMPLATE_S_DEPARTURE;
    const tripDep = new Date(trip.departure);

    let langCount = 0;
    for (const [lang, tmpl] of templateMap) {
      const newItinerary = replaceDates(tmpl.itinerary, lang, templateDep, tripDep);

      await prisma.scheduleTranslation.updateMany({
        where: { scheduleId: trip.id, lang },
        data: {
          title: tmpl.title,
          slug: tmpl.slug,
          excerpt: tmpl.excerpt,
          content: tmpl.content,
          itinerary: newItinerary,
          route: tmpl.route,
          keywords: tmpl.keywords,
        },
      });
      langCount++;
    }

    console.log(`  [OK] ${trip.id} (${trip.departure}) — ${trip.route === "N" ? "N. Andaman" : "S. Andaman"} ${trip.duration} — ${langCount} langs`);
    updated++;
  }

  console.log(`\nDone! Updated ${updated} schedules × 8 languages = ${updated * 8} translations`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
