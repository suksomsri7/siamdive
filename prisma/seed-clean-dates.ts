/**
 * Clean duplicate dates from itineraries and re-inject correctly.
 * Fix: strip ALL date annotations first, then inject fresh dates.
 */
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "postgresql://siamdive:siamdive_password@localhost:5432/siamdive_db" });
const prisma = new PrismaClient({ adapter });

const BOAT_ID = "cmn94ruo8000ctlkz550rc2ul";

// Month names for formatting
const M = {
  th: ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."],
  en: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
  cn: ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"],
  de: ["Jan.","Feb.","Mär.","Apr.","Mai","Jun.","Jul.","Aug.","Sep.","Okt.","Nov.","Dez."],
  fr: ["janv.","févr.","mars","avr.","mai","juin","juil.","août","sept.","oct.","nov.","déc."],
  ru: ["янв.","февр.","мар.","апр.","мая","июн.","июл.","авг.","сент.","окт.","нояб.","дек."],
  ko: ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"],
  ja: ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"],
};

function fmtDate(lang: string, d: Date): string {
  const day = d.getUTCDate(), m = d.getUTCMonth();
  const months = M[lang as keyof typeof M] || M.en;
  switch (lang) {
    case "en": return `${months[m]} ${day}`;
    case "cn": return `${months[m]}${day}日`;
    case "de": return `${day}. ${months[m]}`;
    default:   return `${day} ${months[m]}`;
  }
}

// ── STEP 1: Strip all existing date annotations from non-TH languages ──

// Patterns to strip: "Day N (date1) (date2)..." → "Day N"
// Also handle checkout dates
const STRIP_PATTERNS: Record<string, RegExp[]> = {
  en: [/(<h3>Day \d+)(?: \([^)]+\))+/g, /(<h3>Check Out)(?: \([^)]+\))+/g],
  cn: [/(<h3>第\d+天)(?: \([^)]+\))+/g, /(<h3>离船)(?: \([^)]+\))+/g],
  de: [/(<h3>Tag \d+)(?: \([^)]+\))+/g, /(<h3>Check-out)(?: \([^)]+\))+/g],
  fr: [/(<h3>Jour \d+)(?: \([^)]+\))+/g, /(<h3>Check-out)(?: \([^)]+\))+/g],
  ru: [/(<h3>День \d+)(?: \([^)]+\))+/g, /(<h3>Выселение)(?: \([^)]+\))+/g],
  ko: [/(<h3>\d+일차)(?: \([^)]+\))+/g, /(<h3>체크아웃)(?: \([^)]+\))+/g],
  ja: [/(<h3>\d+日目)(?: \([^)]+\))+/g, /(<h3>チェックアウト)(?: \([^)]+\))+/g],
};

function stripDates(itinerary: string, lang: string): string {
  const patterns = STRIP_PATTERNS[lang];
  if (!patterns) return itinerary;
  let result = itinerary;
  for (const pat of patterns) {
    pat.lastIndex = 0;
    result = result.replace(pat, "$1");
  }
  return result;
}

// ── STEP 2: Inject fresh dates ──

const DAY_PATS: Record<string, RegExp> = {
  en: /<h3>Day (\d+)/g,
  cn: /<h3>第(\d+)天/g,
  de: /<h3>Tag (\d+)/g,
  fr: /<h3>Jour (\d+)/g,
  ru: /<h3>День (\d+)/g,
  ko: /<h3>(\d+)일차/g,
  ja: /<h3>(\d+)日目/g,
};

const CHECKOUT_PATS: Record<string, [RegExp, string]> = {
  en: [/<h3>Check Out<\/h3>/g, "Check Out"],
  cn: [/<h3>离船<\/h3>/g, "离船"],
  de: [/<h3>Check-out<\/h3>/g, "Check-out"],
  fr: [/<h3>Check-out<\/h3>/g, "Check-out"],
  ru: [/<h3>Выселение<\/h3>/g, "Выселение"],
  ko: [/<h3>체크아웃<\/h3>/g, "체크아웃"],
  ja: [/<h3>チェックアウト<\/h3>/g, "チェックアウト"],
};

function injectDates(itinerary: string, lang: string, dep: Date): string {
  const dayPat = DAY_PATS[lang];
  if (!dayPat) return itinerary;
  dayPat.lastIndex = 0;

  // Find max day number for checkout date calc
  let maxDay = 0;
  let result = itinerary.replace(dayPat, (match, dayNum) => {
    const n = parseInt(dayNum);
    if (n > maxDay) maxDay = n;
    const d = new Date(dep);
    d.setUTCDate(d.getUTCDate() + n - 1);
    const ds = fmtDate(lang, d);
    switch (lang) {
      case "en": return `<h3>Day ${dayNum} (${ds})`;
      case "cn": return `<h3>第${dayNum}天 (${ds})`;
      case "de": return `<h3>Tag ${dayNum} (${ds})`;
      case "fr": return `<h3>Jour ${dayNum} (${ds})`;
      case "ru": return `<h3>День ${dayNum} (${ds})`;
      case "ko": return `<h3>${dayNum}일차 (${ds})`;
      case "ja": return `<h3>${dayNum}日目 (${ds})`;
      default:   return match;
    }
  });

  // Inject checkout date
  const coPat = CHECKOUT_PATS[lang];
  if (coPat && maxDay > 0) {
    const [pat, label] = coPat;
    pat.lastIndex = 0;
    const coDate = new Date(dep);
    coDate.setUTCDate(coDate.getUTCDate() + maxDay);
    const ds = fmtDate(lang, coDate);
    result = result.replace(pat, `<h3>${label} (${ds})</h3>`);
  }

  return result;
}

// ── Thai dates ──
const TH_MONTHS_RE = M.th.map(m => m.replace(/\./g, "\\.")).join("|");
const TH_DATE_PAT = new RegExp(`<h3>(\\d{1,2})\\s+(${TH_MONTHS_RE})`, "g");

function fixThaiDates(itinerary: string, dep: Date): string {
  let offset = 0;
  return itinerary.replace(TH_DATE_PAT, () => {
    const d = new Date(dep);
    d.setUTCDate(d.getUTCDate() + offset);
    offset++;
    return `<h3>${fmtDate("th", d)}`;
  });
}

async function main() {
  const all = await prisma.schedule.findMany({
    where: { boatId: BOAT_ID },
    include: { translations: true },
    orderBy: { departureDate: "asc" },
  });

  console.log(`Processing ${all.length} schedules...\n`);

  for (const sched of all) {
    if (!sched.departureDate) continue;
    const dep = new Date(sched.departureDate);
    const depStr = dep.toISOString().slice(0, 10);

    for (const t of sched.translations) {
      if (!t.itinerary) continue;
      let updated: string;

      if (t.lang === "th") {
        updated = fixThaiDates(t.itinerary, dep);
      } else {
        // Strip old dates first, then inject fresh
        const clean = stripDates(t.itinerary, t.lang);
        updated = injectDates(clean, t.lang, dep);
      }

      if (updated !== t.itinerary) {
        await prisma.scheduleTranslation.updateMany({
          where: { scheduleId: sched.id, lang: t.lang },
          data: { itinerary: updated },
        });
      }
    }

    const thTitle = sched.translations.find(t => t.lang === "th")?.title || "";
    console.log(`  ${depStr} | ${thTitle}`);
  }

  console.log("\n✓ All dates cleaned and re-injected");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
