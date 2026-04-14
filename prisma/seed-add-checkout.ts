/**
 * Add "Check Out" day to all language itineraries — matching the Thai original.
 * Thai has Check Out day in every template; other languages are missing it.
 * Then re-apply templates to all 62 schedules and re-inject dates.
 */
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "postgresql://siamdive:siamdive_password@localhost:5432/siamdive_db" });
const prisma = new PrismaClient({ adapter });

const BOAT_ID = "cmn94ruo8000ctlkz550rc2ul";

// Check Out day content per language (same for all route types)
const CHECKOUT: Record<string, string> = {
  en: `

<h3>Check Out</h3>
<p>Breakfast on board<br>
09:00 Check-out, pack luggage<br>
Transfer to Phuket Airport (recommend booking flights after noon)</p>`,
  cn: `

<h3>离船</h3>
<p>船上早餐<br>
09:00 退房，整理行李<br>
送至普吉机场（建议预订中午后航班）</p>`,
  de: `

<h3>Check-out</h3>
<p>Frühstück an Bord<br>
09:00 Check-out, Gepäck packen<br>
Transfer zum Flughafen Phuket (Flüge nach Mittag empfohlen)</p>`,
  fr: `

<h3>Check-out</h3>
<p>Petit-déjeuner à bord<br>
09:00 Check-out, bagages<br>
Transfert à l'aéroport de Phuket (vols après midi recommandés)</p>`,
  ru: `

<h3>Выселение</h3>
<p>Завтрак на борту<br>
09:00 Выселение, сбор вещей<br>
Трансфер в аэропорт Пхукета (рекомендуется бронировать рейсы после полудня)</p>`,
  ko: `

<h3>체크아웃</h3>
<p>선상 조식<br>
09:00 체크아웃, 짐 정리<br>
푸켓 공항 드롭오프 (오후 이후 항공편 권장)</p>`,
  ja: `

<h3>チェックアウト</h3>
<p>船上で朝食<br>
09:00 チェックアウト、荷物整理<br>
プーケット空港へ送迎（正午以降のフライト推奨）</p>`,
};

// Template IDs
const TEMPLATES = {
  N_ANDAMAN:  "cmnrmfir40000tckzp5kvsepr",
  S_ANDAMAN:  "cmnrmfitk001ctckz4z2xy09w",
  HIN_MUANG:  "cmnrmfiut002otckzxu34rnkm",
  RACHA_PP:   "cmnrmfiw00040tckzgtwwi0nk",
  KOH_LIPE:   "cmnrmfiwr005ctckzl6mndyww",
  NS_ANDAMAN: "cmnrmfj0i00cotckzdn5yrmrp",
  RACHA_2D:   "cmnrmfj1j00f0tckz9var2ybi",
} as const;
const templateIds = new Set(Object.values(TEMPLATES));

// ── Date injection helpers ──
const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const MONTHS_CN = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];
const MONTHS_DE = ["Jan.","Feb.","Mär.","Apr.","Mai","Jun.","Jul.","Aug.","Sep.","Okt.","Nov.","Dez."];
const MONTHS_FR = ["janv.","févr.","mars","avr.","mai","juin","juil.","août","sept.","oct.","nov.","déc."];
const MONTHS_RU = ["янв.","февр.","мар.","апр.","мая","июн.","июл.","авг.","сент.","окт.","нояб.","дек."];
const MONTHS_KO = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
const MONTHS_JA = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];

function fmtDate(lang: string, d: Date): string {
  const day = d.getUTCDate(), m = d.getUTCMonth();
  switch (lang) {
    case "en": return `${MONTHS_EN[m]} ${day}`;
    case "cn": return `${MONTHS_CN[m]}${day}日`;
    case "de": return `${day}. ${MONTHS_DE[m]}`;
    case "fr": return `${day} ${MONTHS_FR[m]}`;
    case "ru": return `${day} ${MONTHS_RU[m]}`;
    case "ko": return `${day} ${MONTHS_KO[m]}`;
    case "ja": return `${day} ${MONTHS_JA[m]}`;
    case "th": return `${day} ${MONTHS_TH[m]}`;
    default: return `${MONTHS_EN[m]} ${day}`;
  }
}

// Inject dates into non-TH itinerary (Day N / Tag N / etc.)
const PATTERNS: Record<string, RegExp> = {
  en: /<h3>Day (\d+)/g,
  cn: /<h3>第(\d+)天/g,
  de: /<h3>Tag (\d+)/g,
  fr: /<h3>Jour (\d+)/g,
  ru: /<h3>День (\d+)/g,
  ko: /<h3>(\d+)일차/g,
  ja: /<h3>(\d+)日目/g,
};

function injectDatesNonTH(itinerary: string, lang: string, dep: Date): string {
  const pat = PATTERNS[lang];
  if (!pat) return itinerary;
  pat.lastIndex = 0;
  return itinerary.replace(pat, (match, dayNum) => {
    const d = new Date(dep);
    d.setUTCDate(d.getUTCDate() + parseInt(dayNum) - 1);
    const ds = fmtDate(lang, d);
    switch (lang) {
      case "en": return `<h3>Day ${dayNum} (${ds})`;
      case "cn": return `<h3>第${dayNum}天 (${ds})`;
      case "de": return `<h3>Tag ${dayNum} (${ds})`;
      case "fr": return `<h3>Jour ${dayNum} (${ds})`;
      case "ru": return `<h3>День ${dayNum} (${ds})`;
      case "ko": return `<h3>${dayNum}일차 (${ds})`;
      case "ja": return `<h3>${dayNum}日目 (${ds})`;
      default: return match;
    }
  });
}

// Inject checkout date for non-TH languages
function injectCheckoutDate(checkoutHtml: string, lang: string, dep: Date, totalDays: number): string {
  const checkoutDate = new Date(dep);
  checkoutDate.setUTCDate(checkoutDate.getUTCDate() + totalDays);
  const ds = fmtDate(lang, checkoutDate);

  // Replace the generic header with dated version
  const headers: Record<string, [string, string]> = {
    en: ["<h3>Check Out</h3>", `<h3>Check Out (${ds})</h3>`],
    cn: ["<h3>离船</h3>", `<h3>离船 (${ds})</h3>`],
    de: ["<h3>Check-out</h3>", `<h3>Check-out (${ds})</h3>`],
    fr: ["<h3>Check-out</h3>", `<h3>Check-out (${ds})</h3>`],
    ru: ["<h3>Выселение</h3>", `<h3>Выселение (${ds})</h3>`],
    ko: ["<h3>체크아웃</h3>", `<h3>체크아웃 (${ds})</h3>`],
    ja: ["<h3>チェックアウト</h3>", `<h3>チェックアウト (${ds})</h3>`],
  };
  const [from, to] = headers[lang] || ["", ""];
  return from ? checkoutHtml.replace(from, to) : checkoutHtml;
}

// Fix Thai dates (same as previous script)
const TH_MONTHS_RE = MONTHS_TH.map(m => m.replace(/\./g, "\\.")).join("|");
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

// ── Template mapping ──
function getTemplateId(thTitle: string, thRoute: string): string {
  if (thTitle.includes("เหนือ+ใต้") || thRoute === "N+S. Andaman") return TEMPLATES.NS_ANDAMAN;
  if (thTitle.includes("อันดามันเหนือ") || thRoute === "N. Andaman") return TEMPLATES.N_ANDAMAN;
  if (thTitle.includes("อันดามันใต้") || thRoute === "S. Andaman") return TEMPLATES.S_ANDAMAN;
  if (thTitle.includes("หินม่วง") || thRoute === "Hin Muang-Hin Daeng") return TEMPLATES.HIN_MUANG;
  if (thTitle.includes("ราชา-พีพี") || thRoute === "Racha-PhiPhi") return TEMPLATES.RACHA_PP;
  if (thTitle.includes("หลีเป๊ะ") || thRoute === "Koh Lipe") return TEMPLATES.KOH_LIPE;
  if (thTitle.includes("ราชา") || thRoute === "Racha") return TEMPLATES.RACHA_2D;
  if (thTitle.includes("อันดามัน") || thRoute === "Andaman") return TEMPLATES.N_ANDAMAN;
  return TEMPLATES.N_ANDAMAN;
}

function isGenericAndaman(thTitle: string, thRoute: string): boolean {
  if (thTitle.includes("เหนือ") || thTitle.includes("ใต้")) return false;
  if (thRoute === "N. Andaman" || thRoute === "S. Andaman" || thRoute === "N+S. Andaman") return false;
  return thTitle.includes("อันดามัน") || thRoute === "Andaman";
}

const GENERIC_TITLES: Record<string, { title: string; slug: string }> = {
  th: { title: "อันดามัน 4 วัน 5 คืน", slug: "andaman-4d5n" },
  en: { title: "Andaman 4 Days 5 Nights", slug: "andaman-4d5n" },
  cn: { title: "安达曼 4天5夜", slug: "andaman-4d5n" },
  de: { title: "Andamanen 4 Tage 5 Nächte", slug: "andamanen-4t5n" },
  fr: { title: "Andaman 4 Jours 5 Nuits", slug: "andaman-4j5n" },
  ru: { title: "Андаман 4 дня 5 ночей", slug: "andaman-4d5n" },
  ko: { title: "안다만 4일 5박", slug: "andaman-4d5n" },
  ja: { title: "アンダマン 4日間5泊", slug: "andaman-4d5n" },
};

// Count total diving days from itinerary (how many Day N headers exist)
function countDays(itinerary: string, lang: string): number {
  const pat = PATTERNS[lang];
  if (!pat) return 0;
  pat.lastIndex = 0;
  let count = 0;
  while (pat.exec(itinerary)) count++;
  return count;
}

async function main() {
  // ══════════════════════════════════════════════════════════════════
  // STEP 1: Add Check Out to template schedules (non-TH languages)
  // ══════════════════════════════════════════════════════════════════
  console.log("=== STEP 1: Adding Check Out day to 7 templates ===\n");

  for (const [name, tid] of Object.entries(TEMPLATES)) {
    const trans = await prisma.scheduleTranslation.findMany({ where: { scheduleId: tid } });

    for (const t of trans) {
      if (t.lang === "th") continue; // Thai already has Check Out
      const co = CHECKOUT[t.lang];
      if (!co) continue;

      // Check if checkout already exists
      const hasCheckout = t.itinerary.includes("Check Out") || t.itinerary.includes("Check-out")
        || t.itinerary.includes("离船") || t.itinerary.includes("Выселение")
        || t.itinerary.includes("체크아웃") || t.itinerary.includes("チェックアウト");

      if (!hasCheckout) {
        await prisma.scheduleTranslation.updateMany({
          where: { scheduleId: tid, lang: t.lang },
          data: { itinerary: t.itinerary + co },
        });
      }
    }
    console.log(`  [${name}] Check Out added to 7 languages`);
  }

  // ══════════════════════════════════════════════════════════════════
  // STEP 2: Re-load templates and apply to remaining 55 schedules
  // ══════════════════════════════════════════════════════════════════
  console.log("\n=== STEP 2: Re-applying templates to 55 schedules ===\n");

  const templateTransMap = new Map<string, Map<string, any>>();
  for (const tid of templateIds) {
    const trans = await prisma.scheduleTranslation.findMany({ where: { scheduleId: tid } });
    const langMap = new Map<string, any>();
    for (const t of trans) langMap.set(t.lang, t);
    templateTransMap.set(tid, langMap);
  }

  const schedules = await prisma.schedule.findMany({
    where: { boatId: BOAT_ID },
    include: { translations: true },
    orderBy: { departureDate: "asc" },
  });

  const remaining = schedules.filter(s => !templateIds.has(s.id));
  for (const sched of remaining) {
    const thTrans = sched.translations.find(t => t.lang === "th");
    const thTitle = thTrans?.title || "";
    const thRoute = thTrans?.route || "";
    const templateId = getTemplateId(thTitle, thRoute);
    const templateLangs = templateTransMap.get(templateId)!;
    const generic = isGenericAndaman(thTitle, thRoute);

    for (const [lang, tmpl] of templateLangs) {
      let title = tmpl.title, slug = tmpl.slug;
      if (generic && GENERIC_TITLES[lang]) {
        title = GENERIC_TITLES[lang].title;
        slug = GENERIC_TITLES[lang].slug;
      }
      await prisma.scheduleTranslation.updateMany({
        where: { scheduleId: sched.id, lang },
        data: { title, slug, excerpt: tmpl.excerpt, content: tmpl.content, itinerary: tmpl.itinerary, route: tmpl.route, keywords: tmpl.keywords },
      });
    }
  }
  console.log(`  Applied to ${remaining.length} schedules`);

  // ══════════════════════════════════════════════════════════════════
  // STEP 3: Inject actual dates into ALL 62 schedules
  // ══════════════════════════════════════════════════════════════════
  console.log("\n=== STEP 3: Injecting dates into all 62 schedules ===\n");

  const all = await prisma.schedule.findMany({
    where: { boatId: BOAT_ID },
    include: { translations: true },
    orderBy: { departureDate: "asc" },
  });

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
        // First inject day dates
        updated = injectDatesNonTH(t.itinerary, t.lang, dep);

        // Then inject checkout date
        const days = countDays(t.itinerary, t.lang);
        if (days > 0) {
          updated = injectCheckoutDate(updated, t.lang, dep, days);
        }
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

  console.log("\n✓ All 62 schedules updated with Check Out + correct dates in all 8 languages");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
