/**
 * Enter 1 sample trip for each of the 3 new routes:
 * 1. Andaman #139 (4-9 Nov 2026) — copy from N. Andaman Issara template, change title
 * 2. Koh Tao #115 (30 May - 3 Jun 2026) — new content
 * 3. Losin #120 (3-7 Jul 2026) — new content
 */
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "postgresql://siamdive:siamdive_password@localhost:5432/siamdive_db" });
const prisma = new PrismaClient({ adapter });

// ── Helper: date formatting ──
const MONTHS_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
function fmtTh(d: Date): string { return `${d.getDate()} ${MONTHS_TH[d.getMonth()]}`; }
function addDays(d: Date, n: number): Date { const r = new Date(d); r.setDate(r.getDate() + n); return r; }

// ── 1. ANDAMAN #139 — copy N. Andaman template, change title ──
async function seedAndaman() {
  const TEMPLATE_N = "cmnrmfir40000tckzp5kvsepr";
  const TEMPLATE_DEP = new Date("2026-04-10");
  const TRIP_DEP = new Date("2026-11-04");
  const SCHEDULE_ID = "sch_aquarian_139";

  const MONTHS_EN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const MONTHS_FR = ["janv","févr","mars","avr","mai","juin","juil","août","sept","oct","nov","déc"];
  const MONTHS_DE = ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"];
  const MONTHS_RU = ["янв","фев","мар","апр","мая","июн","июл","авг","сен","окт","ноя","дек"];

  function formatDate(d: Date, lang: string): string {
    const day = d.getDate(), m = d.getMonth();
    switch (lang) {
      case "th": return `${day} ${MONTHS_TH[m]}`;
      case "en": return `${day} ${MONTHS_EN[m]}`;
      case "de": return `${day}. ${MONTHS_DE[m]}`;
      case "fr": return `${day} ${MONTHS_FR[m]}`;
      case "ru": return `${day} ${MONTHS_RU[m]}`;
      case "cn": case "ja": return `${m+1}月${day}日`;
      case "ko": return `${m+1}월 ${day}일`;
      default: return `${day} ${MONTHS_EN[m]}`;
    }
  }

  const TITLES: Record<string, string> = {
    th: "อันดามัน 4 วัน 5 คืน",
    en: "Andaman 4 Days 5 Nights",
    cn: "安达曼 4天5夜",
    de: "Andamanen 4 Tage 5 Nächte",
    fr: "Andaman 4 Jours 5 Nuits",
    ru: "Андаман 4 дня 5 ночей",
    ko: "안다만 4일 5박",
    ja: "アンダマン 4日間5泊",
  };

  const templates = await prisma.scheduleTranslation.findMany({ where: { scheduleId: TEMPLATE_N } });

  for (const tmpl of templates) {
    let itinerary = tmpl.itinerary;
    for (let offset = 0; offset <= 5; offset++) {
      const old = formatDate(addDays(TEMPLATE_DEP, offset), tmpl.lang);
      itinerary = itinerary.split(old).join(`__D${offset}__`);
    }
    for (let offset = 0; offset <= 5; offset++) {
      const nw = formatDate(addDays(TRIP_DEP, offset), tmpl.lang);
      itinerary = itinerary.split(`__D${offset}__`).join(nw);
    }

    await prisma.scheduleTranslation.updateMany({
      where: { scheduleId: SCHEDULE_ID, lang: tmpl.lang },
      data: {
        title: TITLES[tmpl.lang] || tmpl.title,
        slug: "aquarian-andaman-4d5n",
        excerpt: tmpl.excerpt,
        content: tmpl.content,
        itinerary,
        route: tmpl.route,
        keywords: tmpl.keywords,
      },
    });
  }
  console.log("  [OK] Andaman #139 (4-9 Nov 2026) — 8 langs");
}

// ── 2. KOH TAO #115 — new Thai content ──
async function seedKohTao() {
  const SCHEDULE_ID = "sch_aquarian_115";
  const d = (offset: number) => fmtTh(addDays(new Date("2026-05-30"), offset));

  await prisma.scheduleTranslation.updateMany({
    where: { scheduleId: SCHEDULE_ID, lang: "th" },
    data: {
      title: "เกาะเต่า 3 วัน 4 คืน",
      slug: "aquarian-koh-tao-3d4n",
      route: "Sail Rock — Chumphon Pinnacle — HTMS Sattakut — เกาะนางยวน — Southwest Pinnacle",
      excerpt: "ดำน้ำ 12 ไดฟ์รอบเกาะเต่าและจุดดำน้ำระดับตำนานของอ่าวไทย สำรวจ Sail Rock ลุ้นฉลามวาฬ ดำซากเรือรบ HTMS Sattakut และวนรอบ Chumphon Pinnacle",
      keywords: ["เกาะเต่า", "Koh Tao", "Sail Rock", "Chumphon Pinnacle", "HTMS Sattakut", "ฉลามวาฬ", "อ่าวไทย", "liveaboard"],
      content: `<h3>ไฮไลท์</h3>
<ul>
<li><strong>Sail Rock (หินใบ)</strong> — เสาหินใต้น้ำกลางทะเล Chimney swim-through แนวตั้ง ลุ้นพบฉลามวาฬ ฝูง Barracuda และปลากะมง</li>
<li><strong>Chumphon Pinnacle</strong> — กองหินใต้น้ำขนาดใหญ่ กระแสน้ำแรง ฝูงปลาแจ็คฟิชนับพัน ลุ้นฉลามวาฬและกระเบนนก</li>
<li><strong>HTMS Sattakut Wreck</strong> — ซากเรือรบหลวงยาว 49 เมตร จมที่ความลึก 18-30 เมตร เต็มไปด้วยปะการังอ่อนและฝูงปลา</li>
<li><strong>Southwest Pinnacle</strong> — กองหินใต้น้ำ ฉลามเสือดาว เต่าทะเล ปะการังอ่อนสีสด</li>
<li><strong>เกาะนางยวน</strong> — Green Rock, Japanese Garden น้ำใส ทัศนวิสัยดี ปะการังหลากสี</li>
</ul>

<h3>จุดดำน้ำ (Dive Sites)</h3>
<ul>
<li>Sail Rock (หินใบ) — Chimney, Vertical Swim-through (5-40 ม.)</li>
<li>Chumphon Pinnacle (8-36 ม.)</li>
<li>HTMS Sattakut Wreck (18-30 ม.)</li>
<li>Southwest Pinnacle (15-30 ม.)</li>
<li>White Rock (5-30 ม.)</li>
<li>Shark Island (5-20 ม.)</li>
<li>Green Rock — เกาะนางยวน (10-28 ม.)</li>
<li>Japanese Garden — เกาะนางยวน (5-18 ม.)</li>
<li>Twins — เกาะนางยวน (5-18 ม.)</li>
</ul>

<h3>รวมในราคา (Included)</h3>
<ul>
<li>ห้องพักปรับอากาศ พร้อมห้องน้ำในตัว 3 คืน</li>
<li>อาหาร 3 มื้อ + ขนม ผลไม้ เครื่องดื่มไม่จำกัด (ไม่รวมแอลกอฮอล์)</li>
<li>อุปกรณ์ดำน้ำครบชุด (BCD, Regulator, Computer, Wetsuit, ไฟฉาย, หน้ากาก, ฟิน)</li>
<li>ประกันดำน้ำ</li>
<li>Dive Guide กลุ่มเล็ก (1 DM : 4-5 คน)</li>
</ul>

<h3>ไม่รวมในราคา (Excluded)</h3>
<ul>
<li>เครื่องดื่มแอลกอฮอล์</li>
<li>Nitrox (มีให้เช่าบนเรือ)</li>
<li>ทิป (แนะนำ 1,000-2,000 ฿/คน)</li>
<li>ค่าที่พักก่อน/หลังทริป</li>
<li>ของใช้ส่วนตัว</li>
</ul>

<h3>ข้อมูลท่าเรือ</h3>
<ul>
<li><strong>ท่าเรือ:</strong> ท่าเรืออ่าวฉลอง (Chalong Pier) ภูเก็ต</li>
<li><strong>เดินทาง:</strong> เรือออกจากภูเก็ตข้ามคืน อ้อมแหลมเข้าอ่าวไทย (~12-18 ชม.)</li>
<li><strong>ถึงเกาะเต่า:</strong> เช้าวันถัดไป พร้อมดำน้ำเลย</li>
</ul>`,
      itinerary: `<h3>${d(0)} — ลงเรือ & ออกเดินทาง</h3>
<p>เย็น เช็คอินที่ท่าเรืออ่าวฉลอง จัดอุปกรณ์ รับฟังบรีฟ ทานอาหารเย็นบนเรือ<br>
เรือออกเดินทางมุ่งหน้าเกาะเต่า อ้อมแหลมเข้าอ่าวไทย (เดินทางข้ามคืน ไม่มีไดฟ์)</p>

<h3>${d(1)} — Chumphon Pinnacle & Wreck (4 ไดฟ์)</h3>
<p>07:30 ไดฟ์ 1 — <strong>Chumphon Pinnacle</strong> (กองหินใต้น้ำ ฝูงปลาแจ็คฟิช ลุ้นฉลามวาฬ)<br>
10:30 ไดฟ์ 2 — <strong>HTMS Sattakut Wreck</strong> (ซากเรือรบ ปะการังอ่อน ฝูงปลา)<br>
14:00 ไดฟ์ 3 — <strong>White Rock</strong> (เต่าทะเล ปลาไหลมอเรย์ ปะการัง)<br>
17:00 ไดฟ์ 4 — <strong>Green Rock</strong> (Night Dive, เกาะนางยวน)</p>

<h3>${d(2)} — Sail Rock & เกาะเต่าใต้ (4 ไดฟ์)</h3>
<p>07:30 ไดฟ์ 5 — <strong>Sail Rock</strong> (Chimney swim-through ลุ้นฉลามวาฬ)<br>
10:30 ไดฟ์ 6 — <strong>Sail Rock</strong> (ฝูง Barracuda กระเบนนก)<br>
14:00 ไดฟ์ 7 — <strong>Southwest Pinnacle</strong> (ฉลามเสือดาว เต่า ปะการังอ่อน)<br>
17:00 ไดฟ์ 8 — <strong>Shark Island</strong> (Sunset Dive, ฉลามหูดำ)</p>

<h3>${d(3)} — เกาะนางยวน & กลับ (4 ไดฟ์)</h3>
<p>07:30 ไดฟ์ 9 — <strong>Japanese Garden</strong> (สวนปะการัง ปลาการ์ตูน)<br>
10:30 ไดฟ์ 10 — <strong>Twins</strong> (เต่า ปลาผีเสื้อ)<br>
13:00 ไดฟ์ 11 — <strong>White Rock</strong> (Farewell Dive)<br>
14:00 ไดฟ์ 12 — <strong>Chumphon Pinnacle</strong> (Farewell Dive)<br>
เย็น เรือเดินทางกลับภูเก็ต (ข้ามคืน)</p>

<h3>${d(4)} — ถึงภูเก็ต</h3>
<p>เช้า ถึงท่าเรืออ่าวฉลอง เช็คเอาท์</p>`,
    },
  });
  console.log("  [OK] Koh Tao #115 (30 May - 3 Jun 2026) — Thai");
}

// ── 3. LOSIN #120 — new Thai content ──
async function seedLosin() {
  const SCHEDULE_ID = "sch_aquarian_120";
  const d = (offset: number) => fmtTh(addDays(new Date("2026-07-03"), offset));

  await prisma.scheduleTranslation.updateMany({
    where: { scheduleId: SCHEDULE_ID, lang: "th" },
    data: {
      title: "โลซิน 3 วัน 4 คืน",
      slug: "aquarian-losin-3d4n",
      route: "กองหินโลซิน — ปะการังเทียมลอปี — ตู้รถไฟ — รถถัง",
      excerpt: "ดำน้ำ 11 ไดฟ์ ที่กองหินโลซิน จุดดำน้ำที่สมบูรณ์ที่สุดของอ่าวไทย ลุ้นพบฉลามวาฬ กระเบนนก ปลานกแก้วหัวโหนก ท่ามกลางแนวปะการังแข็งสมบูรณ์กลางทะเลลึก",
      keywords: ["โลซิน", "Losin", "ฉลามวาฬ", "กระเบนนก", "อ่าวไทย", "กองหิน", "ปะการังเทียม", "liveaboard"],
      content: `<h3>ไฮไลท์</h3>
<ul>
<li><strong>กองหินโลซิน</strong> — กองหินโผล่กลางอ่าวไทย ห่างฝั่งปัตตานี 72 กม. แนวปะการังแข็งสมบูรณ์ที่สุดในอ่าวไทย ล้อมรอบด้วยกัลปังหาขนาดใหญ่และแส้ทะเล</li>
<li><strong>ฉลามวาฬ (Whale Shark)</strong> — โอกาสพบสูง แวะเวียนมาบริเวณกองหินเป็นประจำ</li>
<li><strong>ฝูงปลาขนาดยักษ์</strong> — ฝูงปลาแจ็คฟิช (Giant Trevally) นับพัน ฝูง Barracuda ปลาหูช้าง (Batfish)</li>
<li><strong>กระเบนนก (Eagle Ray)</strong> — พบเป็นประจำรอบกองหิน</li>
<li><strong>ปลานกแก้วหัวโหนก (Humphead Parrotfish)</strong> — สัตว์หายากที่พบได้ที่โลซิน</li>
<li><strong>ปะการังเทียม</strong> — ลอปี ตู้รถไฟ รถถัง สร้างระบบนิเวศใต้น้ำที่อุดมสมบูรณ์</li>
</ul>

<h3>จุดดำน้ำ (Dive Sites)</h3>
<ul>
<li>กองหินโลซิน — North Ridge, South Wall, East Slope, West Drop-off (10-40 ม.)</li>
<li>โลซิน Shallow Reef — ปะการังแข็ง เต่ากระ (5-15 ม.)</li>
<li>โลซิน Deep Wall — ปะการังอ่อน กัลปังหา ลุ้นปลาใหญ่ (25-40 ม.)</li>
<li>ปะการังเทียมลอปี (Lopee) (10-30 ม.)</li>
<li>ตู้รถไฟ (Train Carriage) (10-30 ม.)</li>
<li>รถถัง (Tank) (10-30 ม.)</li>
</ul>

<h3>รวมในราคา (Included)</h3>
<ul>
<li>ห้องพักปรับอากาศ พร้อมห้องน้ำในตัว 3 คืน</li>
<li>อาหาร 3 มื้อ + ขนม ผลไม้ เครื่องดื่มไม่จำกัด (ไม่รวมแอลกอฮอล์)</li>
<li>อุปกรณ์ดำน้ำครบชุด (BCD, Regulator, Computer, Wetsuit, ไฟฉาย, หน้ากาก, ฟิน)</li>
<li>ประกันดำน้ำ</li>
<li>Dive Guide กลุ่มเล็ก (1 DM : 4-5 คน)</li>
</ul>

<h3>ไม่รวมในราคา (Excluded)</h3>
<ul>
<li>เครื่องดื่มแอลกอฮอล์</li>
<li>Nitrox (มีให้เช่าบนเรือ)</li>
<li>ทิป (แนะนำ 1,000-2,000 ฿/คน)</li>
<li>ค่าที่พักก่อน/หลังทริป</li>
<li>ของใช้ส่วนตัว</li>
</ul>

<h3>ข้อมูลท่าเรือ</h3>
<ul>
<li><strong>ท่าเรือ:</strong> ท่าเรือสงขลา (ใกล้สนามบินหาดใหญ่ ~1 ชม.)</li>
<li><strong>เดินทาง:</strong> เรือออกจากสงขลาข้ามคืน (~10-11 ชม.) ถึงโลซินเช้าวันถัดไป</li>
<li><strong>สภาพน้ำ:</strong> ทัศนวิสัย 10-20 ม. อุณหภูมิ 26-31°C กระแสน้ำนิ่งถึงปานกลาง</li>
</ul>`,
      itinerary: `<h3>${d(0)} — ลงเรือ & ออกเดินทาง</h3>
<p>เย็น รถรับจากสนามบินหาดใหญ่ → ท่าเรือสงขลา<br>
เช็คอิน จัดอุปกรณ์ รับฟังบรีฟ ทานอาหารเย็นบนเรือ<br>
เรือออกเดินทางมุ่งหน้ากองหินโลซิน (เดินทางข้ามคืน ~10-11 ชม. ไม่มีไดฟ์)</p>

<h3>${d(1)} — กองหินโลซิน (4 ไดฟ์)</h3>
<p>07:30 ไดฟ์ 1 — <strong>โลซิน North Ridge</strong> (ปะการังแข็ง ฝูงปลาแจ็คฟิช กระเบนนก)<br>
10:30 ไดฟ์ 2 — <strong>โลซิน South Wall</strong> (ผนังดิ่ง กัลปังหา ลุ้นฉลามวาฬ)<br>
14:00 ไดฟ์ 3 — <strong>โลซิน East Slope</strong> (เต่ากระ ปลานกแก้วหัวโหนก)<br>
17:00 ไดฟ์ 4 — <strong>โลซิน Shallow Reef</strong> (Night Dive, ปลาหมึก ชีวิตกลางคืน)</p>

<h3>${d(2)} — กองหินโลซิน & ปะการังเทียม (4 ไดฟ์)</h3>
<p>07:30 ไดฟ์ 5 — <strong>โลซิน West Drop-off</strong> (ผนังลึก ปะการังอ่อน ลุ้นปลาใหญ่)<br>
10:30 ไดฟ์ 6 — <strong>โลซิน Deep Wall</strong> (25-40 ม. กัลปังหา แส้ทะเล ฉลามครีบดำ)<br>
14:00 ไดฟ์ 7 — <strong>ปะการังเทียมลอปี</strong> (ฝูงปลาหูช้าง Barracuda)<br>
17:00 ไดฟ์ 8 — <strong>ตู้รถไฟ & รถถัง</strong> (Sunset Dive)</p>

<h3>${d(3)} — กองหินโลซิน & กลับ (3 ไดฟ์)</h3>
<p>07:30 ไดฟ์ 9 — <strong>โลซิน North Ridge</strong> (ลุ้นฉลามวาฬรอบเช้า)<br>
10:30 ไดฟ์ 10 — <strong>โลซิน Shallow Reef</strong> (เต่ากระ ปะการังแข็ง)<br>
13:00 ไดฟ์ 11 — <strong>โลซิน South Wall</strong> (Farewell Dive)<br>
15:00 เรือเดินทางกลับท่าเรือสงขลา (ข้ามคืน)</p>

<h3>${d(4)} — ถึงสงขลา</h3>
<p>เช้า ถึงท่าเรือสงขลา เช็คเอาท์<br>
รถส่งกลับสนามบินหาดใหญ่</p>`,
    },
  });
  console.log("  [OK] Losin #120 (3-7 Jul 2026) — Thai");
}

async function main() {
  console.log("Seeding 3 sample trips...");
  await seedAndaman();
  await seedKohTao();
  await seedLosin();
  console.log("\nDone!");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
