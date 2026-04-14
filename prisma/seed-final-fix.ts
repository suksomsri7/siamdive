/**
 * Final fix:
 * 1. Add Check Out day to DE, KO, JA (was skipped because "Check-out" exists in Day 5 body)
 * 2. Fix KO/JA date format: "10 4월" → "4월 10일", "10 4月" → "4月10日"
 */
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "postgresql://siamdive:siamdive_password@localhost:5432/siamdive_db" });
const prisma = new PrismaClient({ adapter });

const BOAT_ID = "cmn94ruo8000ctlkz550rc2ul";

const M_EN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const M_DE = ["Jan.","Feb.","Mär.","Apr.","Mai","Jun.","Jul.","Aug.","Sep.","Okt.","Nov.","Dez."];
const M_KO = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
const M_JA = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];

function fmtKO(d: Date): string {
  return `${M_KO[d.getUTCMonth()]} ${d.getUTCDate()}일`;  // 4월 10일
}
function fmtJA(d: Date): string {
  return `${M_JA[d.getUTCMonth()]}${d.getUTCDate()}日`;   // 4月10日
}
function fmtDE(d: Date): string {
  return `${d.getUTCDate()}. ${M_DE[d.getUTCMonth()]}`;   // 10. Apr.
}

// Check Out sections
const CHECKOUT_DE = `

<h3>Check-out</h3>
<p>Frühstück an Bord<br>
09:00 Check-out, Gepäck packen<br>
Transfer zum Flughafen Phuket (Flüge nach Mittag empfohlen)</p>`;

const CHECKOUT_KO = `

<h3>체크아웃</h3>
<p>선상 조식<br>
09:00 체크아웃, 짐 정리<br>
푸켓 공항 드롭오프 (오후 이후 항공편 권장)</p>`;

const CHECKOUT_JA = `

<h3>チェックアウト</h3>
<p>船上で朝食<br>
09:00 チェックアウト、荷物整理<br>
プーケット空港へ送迎（正午以降のフライト推奨）</p>`;

function hasCheckoutHeader(itinerary: string, lang: string): boolean {
  // Check specifically for <h3> header, not body text
  switch (lang) {
    case "de": return /<h3>Check-out/.test(itinerary);
    case "ko": return /<h3>체크아웃/.test(itinerary);
    case "ja": return /<h3>チェックアウト/.test(itinerary);
    default: return true;
  }
}

async function main() {
  const all = await prisma.schedule.findMany({
    where: { boatId: BOAT_ID },
    include: { translations: true },
    orderBy: { departureDate: "asc" },
  });

  console.log(`Processing ${all.length} schedules...\n`);

  let fixes = 0;
  for (const sched of all) {
    if (!sched.departureDate) continue;
    const dep = new Date(sched.departureDate);
    const depStr = dep.toISOString().slice(0, 10);

    for (const t of sched.translations) {
      if (!t.itinerary) continue;
      let updated = t.itinerary;
      let changed = false;

      // ── Fix 1: Add missing Check Out for DE, KO, JA ──
      if ((t.lang === "de" || t.lang === "ko" || t.lang === "ja") && !hasCheckoutHeader(updated, t.lang)) {
        const checkout = t.lang === "de" ? CHECKOUT_DE : t.lang === "ko" ? CHECKOUT_KO : CHECKOUT_JA;
        updated += checkout;
        changed = true;
      }

      // ── Fix 2: Fix KO date format "(\d+) (\d+월)" → "N월 D일" ──
      if (t.lang === "ko") {
        // Fix day headers: "1일차 (10 4월)" → "1일차 (4월 10일)"
        updated = updated.replace(/<h3>(\d+)일차 \((\d+) (\d+월)\)/g, (_, dayNum, d, mon) => {
          return `<h3>${dayNum}일차 (${mon} ${d}일)`;
        });
        // Fix checkout header: "체크아웃 (10 4월)" → "체크아웃 (4월 10일)"
        updated = updated.replace(/<h3>체크아웃 \((\d+) (\d+월)\)/g, (_, d, mon) => {
          return `<h3>체크아웃 (${mon} ${d}일)`;
        });
        if (updated !== t.itinerary) changed = true;

        // If checkout was just added (no date yet), inject date
        if (updated.includes("<h3>체크아웃</h3>")) {
          // Count day headers to get checkout day offset
          const dayCount = (updated.match(/<h3>\d+일차/g) || []).length;
          const coDate = new Date(dep);
          coDate.setUTCDate(coDate.getUTCDate() + dayCount);
          updated = updated.replace("<h3>체크아웃</h3>", `<h3>체크아웃 (${fmtKO(coDate)})</h3>`);
          changed = true;
        }
      }

      // ── Fix 3: Fix JA date format "(\d+) (\d+月)" → "N月D日" ──
      if (t.lang === "ja") {
        // Fix day headers: "1日目 (10 4月)" → "1日目 (4月10日)"
        updated = updated.replace(/<h3>(\d+)日目 \((\d+) (\d+月)\)/g, (_, dayNum, d, mon) => {
          return `<h3>${dayNum}日目 (${mon}${d}日)`;
        });
        // Fix checkout header
        updated = updated.replace(/<h3>チェックアウト \((\d+) (\d+月)\)/g, (_, d, mon) => {
          return `<h3>チェックアウト (${mon}${d}日)`;
        });
        if (updated !== t.itinerary) changed = true;

        // If checkout was just added (no date), inject date
        if (updated.includes("<h3>チェックアウト</h3>")) {
          const dayCount = (updated.match(/<h3>\d+日目/g) || []).length;
          const coDate = new Date(dep);
          coDate.setUTCDate(coDate.getUTCDate() + dayCount);
          updated = updated.replace("<h3>チェックアウト</h3>", `<h3>チェックアウト (${fmtJA(coDate)})</h3>`);
          changed = true;
        }
      }

      // ── Fix 4: DE checkout date injection ──
      if (t.lang === "de" && updated.includes("<h3>Check-out</h3>")) {
        const dayCount = (updated.match(/<h3>Tag \d+/g) || []).length;
        const coDate = new Date(dep);
        coDate.setUTCDate(coDate.getUTCDate() + dayCount);
        updated = updated.replace("<h3>Check-out</h3>", `<h3>Check-out (${fmtDE(coDate)})</h3>`);
        changed = true;
      }

      if (changed) {
        await prisma.scheduleTranslation.updateMany({
          where: { scheduleId: sched.id, lang: t.lang },
          data: { itinerary: updated },
        });
        fixes++;
      }
    }
  }

  console.log(`✓ Fixed ${fixes} translation records (DE/KO/JA Check Out + date format)\n`);

  // Verify one schedule
  console.log("=== Verification: Trip Apr 10 ===\n");
  const verify = await prisma.scheduleTranslation.findMany({
    where: { scheduleId: "cmnrmfir40000tckzp5kvsepr" },
    orderBy: { lang: "asc" },
  });
  for (const t of verify) {
    const headers = t.itinerary.match(/<h3>[^<]+<\/h3>/g) || [];
    console.log(`[${t.lang}] ${headers.length} days: ${headers.map(h => h.replace(/<\/?h3>/g, "")).join(" | ")}`);
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
