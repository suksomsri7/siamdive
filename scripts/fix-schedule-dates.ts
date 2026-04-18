// Fix "Daily Program" dates in ScheduleTranslation.content so that the dates
// match the actual schedule.departureDate / returnDate. Many schedules were
// seeded from a template whose day-1 was "10 Apr" — we rewrite the date
// sequence to start at the real departure date for each schedule.
//
// Run:  cd /root/projects/siamdive && bun run scripts/fix-schedule-dates.ts [--dry]

import { prisma } from "../src/lib/prisma";

const DRY = process.argv.includes("--dry");

// ── Date formatters & parsers per lang ──────────────────────────────────────
const EN_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const TH_MONTHS = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
const DE_MONTHS = ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"];
const FR_MONTHS = ["janv","févr","mars","avr","mai","juin","juil","août","sept","oct","nov","déc"];
const RU_MONTHS = ["янв","фев","мар","апр","мая","июн","июл","авг","сен","окт","ноя","дек"];

type LangCfg = {
  pattern: RegExp;  // global flag; captures day / month
  parse:   (m: RegExpMatchArray) => { day: number; month: number } | null;
  format:  (d: Date) => string;
};

const LANGS: Record<string, LangCfg> = {
  en: {
    pattern: /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/g,
    parse: (m) => {
      const idx = EN_MONTHS.indexOf(m[2]);
      return idx < 0 ? null : { day: parseInt(m[1]), month: idx };
    },
    format: (d) => `${d.getUTCDate()} ${EN_MONTHS[d.getUTCMonth()]}`,
  },
  th: {
    pattern: /(\d{1,2})\s+(ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.)/g,
    parse: (m) => {
      const idx = TH_MONTHS.indexOf(m[2]);
      return idx < 0 ? null : { day: parseInt(m[1]), month: idx };
    },
    format: (d) => `${d.getUTCDate()} ${TH_MONTHS[d.getUTCMonth()]}`,
  },
  de: {
    pattern: /(\d{1,2})\.\s*(Jan|Feb|Mär|Apr|Mai|Jun|Jul|Aug|Sep|Okt|Nov|Dez)\b/g,
    parse: (m) => {
      const idx = DE_MONTHS.indexOf(m[2]);
      return idx < 0 ? null : { day: parseInt(m[1]), month: idx };
    },
    format: (d) => `${d.getUTCDate()}. ${DE_MONTHS[d.getUTCMonth()]}`,
  },
  fr: {
    pattern: /(\d{1,2})\s+(janv|févr|mars|avr|mai|juin|juil|août|sept|oct|nov|déc)\.?/g,
    parse: (m) => {
      const idx = FR_MONTHS.indexOf(m[2]);
      return idx < 0 ? null : { day: parseInt(m[1]), month: idx };
    },
    format: (d) => `${d.getUTCDate()} ${FR_MONTHS[d.getUTCMonth()]}`,
  },
  ru: {
    // \b doesn't work on Cyrillic letters in JS regex — use explicit boundary.
    pattern: /(\d{1,2})\s+(янв|фев|мар|апр|мая|июн|июл|авг|сен|окт|ноя|дек)(?=[^а-яё]|$)/g,
    parse: (m) => {
      const idx = RU_MONTHS.indexOf(m[2]);
      return idx < 0 ? null : { day: parseInt(m[1]), month: idx };
    },
    format: (d) => `${d.getUTCDate()} ${RU_MONTHS[d.getUTCMonth()]}`,
  },
  ja: {
    pattern: /(\d{1,2})月(\d{1,2})日/g,
    parse: (m) => ({ day: parseInt(m[2]), month: parseInt(m[1]) - 1 }),
    format: (d) => `${d.getUTCMonth() + 1}月${d.getUTCDate()}日`,
  },
  cn: {
    pattern: /(\d{1,2})月(\d{1,2})日/g,
    parse: (m) => ({ day: parseInt(m[2]), month: parseInt(m[1]) - 1 }),
    format: (d) => `${d.getUTCMonth() + 1}月${d.getUTCDate()}日`,
  },
  ko: {
    pattern: /(\d{1,2})월\s*(\d{1,2})일/g,
    parse: (m) => ({ day: parseInt(m[2]), month: parseInt(m[1]) - 1 }),
    format: (d) => `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일`,
  },
};

function fixContent(content: string, langKey: string, departureDate: Date, duration: number): { result: string; replacements: number } {
  const cfg = LANGS[langKey];
  if (!cfg) return { result: content, replacements: 0 };

  // Anchor on the "(Itinerary)" heading so we only rewrite dates inside the
  // day program section — ignore incidental dates earlier in the content
  // (e.g. "peak Feb-Apr" or season markers).
  const anchor = content.indexOf("(Itinerary)");
  if (anchor < 0) return { result: content, replacements: 0 };

  // Find all matches AFTER the anchor, parsed to day/month.
  const matches: Array<{ match: RegExpMatchArray; idx: number; parsed: { day: number; month: number } }> = [];
  let m: RegExpExecArray | null;
  const regex = new RegExp(cfg.pattern.source, "g");
  regex.lastIndex = anchor;
  while ((m = regex.exec(content)) !== null) {
    const parsed = cfg.parse(m);
    if (parsed) matches.push({ match: m, idx: m.index ?? 0, parsed });
  }
  if (matches.length < duration) return { result: content, replacements: 0 };

  // Use the first `duration` matches as the itinerary day headers. Template
  // seeds that either have sequential dates (10 Apr, 11 Apr, …) or all-same
  // placeholders (8 Jun, 8 Jun, …) are both covered by this simple take-first
  // approach — we rewrite each with depDate + i regardless of original.
  const start = 0;

  // Build target dates: depDate, depDate+1, ..., depDate+duration-1.
  const targets: string[] = [];
  for (let i = 0; i < duration; i++) {
    const t = new Date(departureDate);
    t.setUTCDate(departureDate.getUTCDate() + i);
    targets.push(cfg.format(t));
  }

  // Replace matches[start..start+duration-1] with targets, right-to-left so
  // indices stay valid as we splice.
  let result = content;
  for (let i = duration - 1; i >= 0; i--) {
    const { match, idx } = matches[start + i];
    const end = idx + match[0].length;
    result = result.slice(0, idx) + targets[i] + result.slice(end);
  }

  return { result, replacements: duration };
}

async function main() {
  // "(Itinerary)" is the English parenthetical that all language versions
  // keep in the Day Program heading, so it's a reliable universal marker.
  const translations = await prisma.scheduleTranslation.findMany({
    where: { content: { contains: "(Itinerary)" } },
    include: { schedule: { select: { departureDate: true, returnDate: true } } },
  });

  console.log(`Scanning ${translations.length} translation rows...`);

  let updated = 0;
  let skipped = 0;
  const skipReasons: Record<string, number> = {};

  for (const t of translations) {
    if (!t.schedule.departureDate) { skipped++; skipReasons.no_dep = (skipReasons.no_dep ?? 0) + 1; continue; }
    const dep = new Date(t.schedule.departureDate);

    let duration = 6; // default fallback (5D5N liveaboard)
    if (t.schedule.returnDate) {
      const ret = new Date(t.schedule.returnDate);
      duration = Math.round((ret.getTime() - dep.getTime()) / 86400000) + 1;
      if (duration < 2 || duration > 14) duration = 6;
    }

    const { result, replacements } = fixContent(t.content, t.lang, dep, duration);
    if (replacements === 0 || result === t.content) {
      skipped++;
      skipReasons[`no_match_${t.lang}`] = (skipReasons[`no_match_${t.lang}`] ?? 0) + 1;
      continue;
    }

    if (DRY) {
      console.log(`[dry] would update ${t.scheduleId}/${t.lang}: ${replacements} dates`);
    } else {
      await prisma.scheduleTranslation.update({ where: { id: t.id }, data: { content: result } });
    }
    updated++;
  }

  console.log(`\nResult: updated=${updated}, skipped=${skipped}`);
  if (Object.keys(skipReasons).length) console.log("Skip reasons:", skipReasons);

  await prisma.$disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
