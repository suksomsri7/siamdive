import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "postgresql://siamdive:siamdive_password@localhost:5432/siamdive_db" });
const prisma = new PrismaClient({ adapter });

type RouteContent = {
  scheduleId: string;
  title: string;
  excerpt: string;
  content: string; // HTML — highlights, dive sites, include, exclude, extras
  itinerary: string; // HTML — day-by-day
  route: string;
  keywords: string[];
};

const samples: RouteContent[] = [
  // ── 1. N. Andaman 4D5N ─────────────────────────────────────────────────────
  {
    scheduleId: "cmnrmfir40000tckzp5kvsepr",
    title: "อันดามันเหนือ 4 วัน 5 คืน",
    route: "หมู่เกาะสิมิลัน — เกาะบอน — เกาะตาชัย — Richelieu Rock — หมู่เกาะสุรินทร์",
    excerpt: "สัมผัสจุดดำน้ำระดับโลก Richelieu Rock พร้อมลุ้นพบกระเบนราหูที่เกาะบอน ดำน้ำ 15 ไดฟ์ใน 4 วันเต็ม ท่ามกลางหมู่เกาะสิมิลันและสุรินทร์",
    keywords: ["สิมิลัน", "Richelieu Rock", "เกาะบอน", "กระเบนราหู", "เกาะตาชัย", "อันดามันเหนือ", "liveaboard"],
    content: `<h3>ไฮไลท์</h3>
<ul>
<li><strong>Richelieu Rock</strong> — จุดดำน้ำอันดับ 1 ของไทย ลุ้นพบฉลามวาฬ ม้าน้ำ และฝูงปลาแบร์ราคูด้า</li>
<li><strong>เกาะบอน</strong> — สถานีทำความสะอาดกระเบนราหู (Manta Ray) ช่วง ก.พ.-เม.ย.</li>
<li><strong>เกาะตาชัย Pinnacle</strong> — หินใต้น้ำเต็มไปด้วยปะการังอ่อนและฝูงปลา</li>
<li><strong>หมู่เกาะสิมิลัน</strong> — น้ำใส ปะการังสมบูรณ์ ถ่ายรูปใต้น้ำสวย</li>
<li><strong>15 ไดฟ์</strong> ใน 4 วัน กลุ่มเล็ก 1 Divemaster : 4-5 นักดำน้ำ</li>
</ul>

<h3>จุดดำน้ำ (Dive Sites)</h3>
<ul>
<li>Similan Islands — West of Eden, Anita's Reef, Christmas Point, Breakfast Bend</li>
<li>Koh Bon — West Ridge, Manta Cleaning Station</li>
<li>Koh Tachai — Pinnacle, Twin Peaks</li>
<li>Richelieu Rock</li>
<li>Surin Islands</li>
</ul>

<h3>รวมในราคา (Included)</h3>
<ul>
<li>ห้องพักปรับอากาศ พร้อมห้องน้ำในตัว 4 คืน</li>
<li>อาหาร 3 มื้อ + ขนม ผลไม้ เครื่องดื่มไม่จำกัด (ไม่รวมแอลกอฮอล์)</li>
<li>อุปกรณ์ดำน้ำครบชุด (BCD, Regulator, Computer, Wetsuit, ไฟฉาย, หน้ากาก, ฟิน)</li>
<li>ประกันดำน้ำ</li>
<li>Dive Guide กลุ่มเล็ก (1 DM : 4-5 คน)</li>
<li>รถรับ-ส่ง สนามบินภูเก็ต ⇄ ท่าเรือ (ฟรี)</li>
</ul>

<h3>ไม่รวมในราคา (Excluded)</h3>
<ul>
<li>ค่าอุทยานแห่งชาติ (ประมาณ 600-900 ฿/คน)</li>
<li>เครื่องดื่มแอลกอฮอล์</li>
<li>Nitrox (มีให้เช่าบนเรือ)</li>
<li>ทิป (แนะนำ 1,000-2,000 ฿/คน)</li>
<li>ค่าที่พักก่อน/หลังทริป</li>
<li>ของใช้ส่วนตัว</li>
</ul>

<h3>ข้อมูลท่าเรือ</h3>
<ul>
<li><strong>ท่าเรือ:</strong> ท่าเรืออ่าวฉลอง (Chalong Pier) ภูเก็ต</li>
<li><strong>เช็คอิน:</strong> รถรับจากสนามบินภูเก็ต 18:00-20:00</li>
<li><strong>เช็คเอาท์:</strong> ส่งกลับสนามบิน 09:00 (แนะนำเที่ยวบินหลังเที่ยง)</li>
</ul>`,
    itinerary: `<h3>วันที่ 1 — ลงเรือ</h3>
<p>18:00-20:00 รถรับจากสนามบินภูเก็ต → ท่าเรืออ่าวฉลอง<br>
เช็คอิน จัดอุปกรณ์ รับฟังบรีฟ ทานอาหารเย็นบนเรือ<br>
เรือออกเดินทางมุ่งหน้าหมู่เกาะสิมิลัน (ไม่มีไดฟ์)</p>

<h3>วันที่ 2 — หมู่เกาะสิมิลัน (4 ไดฟ์)</h3>
<p>07:30 ไดฟ์ 1 — <strong>Anita's Reef</strong> (สวนปะการัง)<br>
10:30 ไดฟ์ 2 — <strong>West of Eden</strong> (โขดหิน ถ้ำ ปะการังอ่อน)<br>
14:00 ไดฟ์ 3 — <strong>Christmas Point</strong> (swim-through ฉลาม)<br>
17:00 ไดฟ์ 4 — <strong>Breakfast Bend</strong> (Night Dive)</p>

<h3>วันที่ 3 — เกาะบอน & เกาะตาชัย (4 ไดฟ์)</h3>
<p>07:30 ไดฟ์ 5 — <strong>Koh Bon West Ridge</strong> (ลุ้น Manta Ray)<br>
10:30 ไดฟ์ 6 — <strong>Koh Bon Pinnacle</strong><br>
14:00 ไดฟ์ 7 — <strong>Koh Tachai Pinnacle</strong> (ปะการังอ่อน ฝูงปลา)<br>
17:00 ไดฟ์ 8 — <strong>Koh Tachai Twin Peaks</strong></p>

<h3>วันที่ 4 — Richelieu Rock & สุรินทร์ (4 ไดฟ์)</h3>
<p>07:30 ไดฟ์ 9 — <strong>Richelieu Rock</strong> (ม้าน้ำ ฉลามวาฬ)<br>
10:30 ไดฟ์ 10 — <strong>Richelieu Rock</strong> (ฝูง Barracuda)<br>
14:00 ไดฟ์ 11 — <strong>Surin Islands</strong><br>
17:00 ไดฟ์ 12 — <strong>Surin Islands</strong> (Sunset Dive)</p>

<h3>วันที่ 5 — สิมิลัน & กลับ (3 ไดฟ์)</h3>
<p>07:30 ไดฟ์ 13 — <strong>Koh Tachai</strong><br>
10:30 ไดฟ์ 14 — <strong>Koh Bon</strong><br>
13:00 ไดฟ์ 15 — <strong>Similan Islands</strong> (Farewell Dive)<br>
15:00 เดินทางกลับท่าเรือ เช็คเอาท์<br>
17:00 ส่งกลับสนามบินภูเก็ต</p>`,
  },

  // ── 2. S. Andaman 4D5N ─────────────────────────────────────────────────────
  {
    scheduleId: "cmnrmfitk001ctckz4z2xy09w",
    title: "อันดามันใต้ 4 วัน 5 คืน",
    route: "เกาะพีพี — Shark Point — King Cruiser Wreck — Anemone Reef — เกาะห้า — หินแดง — หินม่วง",
    excerpt: "ดำน้ำ 15 ไดฟ์ สำรวจจุดดำน้ำอันดามันใต้ ตั้งแต่ซากเรือ King Cruiser, Shark Point ไปจนถึง Cathedral Cave ที่เกาะห้า และหินแดง-หินม่วงที่ขึ้นชื่อเรื่องกระเบนราหู",
    keywords: ["อันดามันใต้", "เกาะพีพี", "Shark Point", "King Cruiser", "เกาะห้า", "หินแดง", "หินม่วง", "liveaboard"],
    content: `<h3>ไฮไลท์</h3>
<ul>
<li><strong>หินแดง & หินม่วง</strong> — จุดดำน้ำชั้นนำ ลุ้นพบกระเบนราหูและฉลามวาฬ</li>
<li><strong>เกาะห้า</strong> — Cathedral Cave, Lagoon Wall ปะการังสมบูรณ์</li>
<li><strong>King Cruiser Wreck</strong> — ซากเรือจมขนาดใหญ่ เต็มไปด้วยสัตว์ทะเล</li>
<li><strong>Shark Point</strong> — ฉลามเสือดาว (Leopard Shark) และปะการังอ่อนสีสด</li>
<li><strong>เกาะพีพี</strong> — Bida Nok & Bida Nai เต่าทะเล ฉลามหูดำ</li>
</ul>

<h3>จุดดำน้ำ (Dive Sites)</h3>
<ul>
<li>Phi Phi — Bida Nok, Bida Nai, Palong Wall</li>
<li>Shark Point (Shark Fin Reef)</li>
<li>King Cruiser Wreck (ซากเรือ 32m)</li>
<li>Anemone Reef</li>
<li>Koh Haa — Lagoon, Canyon, Pinnacle, Cathedral Cave</li>
<li>Hin Daeng & Hin Muang</li>
</ul>

<h3>รวมในราคา (Included)</h3>
<ul>
<li>ห้องพักปรับอากาศ พร้อมห้องน้ำในตัว 4 คืน</li>
<li>อาหาร 3 มื้อ + ขนม ผลไม้ เครื่องดื่มไม่จำกัด (ไม่รวมแอลกอฮอล์)</li>
<li>อุปกรณ์ดำน้ำครบชุด (BCD, Regulator, Computer, Wetsuit, ไฟฉาย, หน้ากาก, ฟิน)</li>
<li>ประกันดำน้ำ</li>
<li>Dive Guide กลุ่มเล็ก (1 DM : 4-5 คน)</li>
<li>รถรับ-ส่ง สนามบินภูเก็ต ⇄ ท่าเรือ (ฟรี)</li>
</ul>

<h3>ไม่รวมในราคา (Excluded)</h3>
<ul>
<li>ค่าอุทยานแห่งชาติหมู่เกาะลันตา (ประมาณ 600-900 ฿/คน)</li>
<li>เครื่องดื่มแอลกอฮอล์</li>
<li>Nitrox (มีให้เช่าบนเรือ)</li>
<li>ทิป (แนะนำ 1,000-2,000 ฿/คน)</li>
<li>ค่าที่พักก่อน/หลังทริป</li>
<li>ของใช้ส่วนตัว</li>
</ul>

<h3>ข้อมูลท่าเรือ</h3>
<ul>
<li><strong>ท่าเรือ:</strong> ท่าเรืออ่าวฉลอง (Chalong Pier) ภูเก็ต</li>
<li><strong>เช็คอิน:</strong> 12:00-16:00 ที่ท่าเรือ</li>
<li><strong>เช็คเอาท์:</strong> 13:00-14:00 กลับถึงท่าเรือ วันสุดท้าย</li>
</ul>`,
    itinerary: `<h3>วันที่ 1 — ลงเรือ & เกาะพีพี (3 ไดฟ์)</h3>
<p>12:00-16:00 เช็คอินที่ท่าเรืออ่าวฉลอง จัดอุปกรณ์ บรีฟ<br>
เรือออกมุ่งหน้าเกาะพีพี<br>
18:00 ไดฟ์ 1 — <strong>Bida Nok</strong> (ฉลามเสือดาว เต่า)<br>
20:00 ทานอาหารเย็น<br>
21:00 ไดฟ์ 2 — <strong>Bida Nai</strong> (Night Dive, ชีวิตกลางคืน)</p>

<h3>วันที่ 2 — Shark Point & King Cruiser (4 ไดฟ์)</h3>
<p>07:30 ไดฟ์ 3 — <strong>Anemone Reef</strong> (ปะการังอ่อน ปลาการ์ตูน)<br>
10:30 ไดฟ์ 4 — <strong>Shark Point</strong> (ฉลามเสือดาว)<br>
14:00 ไดฟ์ 5 — <strong>King Cruiser Wreck</strong> (ซากเรือ ฝูงปลา)<br>
17:00 ไดฟ์ 6 — <strong>Shark Point</strong> (Sunset Dive)<br>
เรือเดินทางไปเกาะห้าระหว่างคืน</p>

<h3>วันที่ 3 — เกาะห้า (4 ไดฟ์)</h3>
<p>07:30 ไดฟ์ 7 — <strong>Koh Haa Pinnacle</strong> (ถ้ำ เต่า กระเบน)<br>
10:30 ไดฟ์ 8 — <strong>Koh Haa Canyon</strong> (กระแสน้ำ ปะการังแข็ง)<br>
14:00 ไดฟ์ 9 — <strong>Koh Haa Lagoon Wall</strong> (Macro, Nudibranch)<br>
17:00 ไดฟ์ 10 — <strong>Koh Haa Cathedral Cave</strong> (Night Dive)<br>
เรือเดินทางไปหินแดง-หินม่วงระหว่างคืน</p>

<h3>วันที่ 4 — หินแดง & หินม่วง (4 ไดฟ์)</h3>
<p>07:30 ไดฟ์ 11 — <strong>Hin Daeng</strong> (ผนังดิ่ง ลุ้น Manta Ray)<br>
10:30 ไดฟ์ 12 — <strong>Hin Daeng</strong> (ฝูงปลา Barracuda)<br>
14:00 ไดฟ์ 13 — <strong>Hin Muang</strong> (ปะการังอ่อนสีม่วง ฉลาม)<br>
17:00 ไดฟ์ 14 — <strong>Hin Muang</strong> (Sunset Dive)<br>
เรือเดินทางกลับภูเก็ตระหว่างคืน</p>

<h3>วันที่ 5 — กลับ (1 ไดฟ์)</h3>
<p>07:30 ไดฟ์ 15 — <strong>Anemone Reef</strong> หรือ <strong>Shark Point</strong> (Farewell Dive)<br>
10:00 อาหารเช้า พักผ่อน<br>
13:00-14:00 ถึงท่าเรืออ่าวฉลอง เช็คเอาท์</p>`,
  },

  // ── 3. Hin Muang-Hin Daeng 3D4N ───────────────────────────────────────────
  {
    scheduleId: "cmnrmfiut002otckzxu34rnkm",
    title: "หินม่วง-หินแดง 3 วัน 4 คืน",
    route: "เกาะห้า — หินแดง — หินม่วง — เกาะพีพี",
    excerpt: "ดำน้ำ 10-12 ไดฟ์ เจาะลึกจุดดำน้ำระดับโลกหินแดง-หินม่วง ลุ้นพบกระเบนราหูและฉลามวาฬ พร้อมแวะเกาะห้าและเกาะพีพี",
    keywords: ["หินแดง", "หินม่วง", "Hin Daeng", "Hin Muang", "เกาะห้า", "กระเบนราหู", "liveaboard"],
    content: `<h3>ไฮไลท์</h3>
<ul>
<li><strong>หินแดง (Hin Daeng)</strong> — เสาหินใต้น้ำผนังดิ่ง ปะการังอ่อนสีแดง ลุ้นกระเบนราหูและฉลามวาฬ</li>
<li><strong>หินม่วง (Hin Muang)</strong> — ผนังดิ่งลึกกว่า 60 เมตร ปะการังอ่อนสีม่วง ฉลามครีบเทา</li>
<li><strong>เกาะห้า</strong> — Cathedral Cave ถ้ำใต้น้ำสวยงาม Lagoon น้ำใส</li>
<li><strong>เจาะลึก 4-8 ไดฟ์</strong> ที่หินแดง-หินม่วง ดำซ้ำได้หลายรอบ</li>
</ul>

<h3>จุดดำน้ำ (Dive Sites)</h3>
<ul>
<li>Koh Haa — Lagoon, Canyon, Yamashita's Hole</li>
<li>Hin Daeng — East Wall, Summit, Drift</li>
<li>Hin Muang — Vertical Wall, Anemone Carpet</li>
<li>Hin Musung (ถ้ามีเวลา)</li>
<li>King Cruiser Wreck หรือ Bida Nok/Nai (ระหว่างทางกลับ)</li>
</ul>

<h3>รวมในราคา (Included)</h3>
<ul>
<li>ห้องพักปรับอากาศ พร้อมห้องน้ำในตัว 3 คืน</li>
<li>อาหาร 3 มื้อ + ขนม ผลไม้ เครื่องดื่มไม่จำกัด (ไม่รวมแอลกอฮอล์)</li>
<li>อุปกรณ์ดำน้ำครบชุด</li>
<li>ประกันดำน้ำ</li>
<li>Dive Guide กลุ่มเล็ก</li>
<li>รถรับ-ส่ง สนามบินภูเก็ต ⇄ ท่าเรือ (ฟรี)</li>
</ul>

<h3>ไม่รวมในราคา (Excluded)</h3>
<ul>
<li>ค่าอุทยานแห่งชาติหมู่เกาะลันตา (ประมาณ 600-900 ฿/คน)</li>
<li>เครื่องดื่มแอลกอฮอล์</li>
<li>Nitrox</li>
<li>ทิป (แนะนำ 1,000-2,000 ฿/คน)</li>
<li>ค่าที่พักก่อน/หลังทริป</li>
</ul>

<h3>ข้อมูลท่าเรือ</h3>
<ul>
<li><strong>ท่าเรือ:</strong> ท่าเรืออ่าวฉลอง (Chalong Pier) ภูเก็ต</li>
<li><strong>เช็คอิน:</strong> 08:00-09:00 ที่ท่าเรือ</li>
<li><strong>เช็คเอาท์:</strong> เย็นวันสุดท้าย กลับถึงท่าเรือ</li>
</ul>

<h3>หมายเหตุ</h3>
<p>หินแดง-หินม่วง มีกระแสน้ำแรง แนะนำสำหรับนักดำน้ำระดับ Advanced Open Water ขึ้นไป</p>`,
    itinerary: `<h3>วันที่ 1 — ลงเรือ & เกาะห้า (2 ไดฟ์)</h3>
<p>08:00-09:00 เช็คอินที่ท่าเรืออ่าวฉลอง<br>
เรือออกมุ่งหน้าเกาะห้า<br>
14:00 ไดฟ์ 1 — <strong>Koh Haa Lagoon</strong> (Check Dive, ถ้ำ ลากูน)<br>
16:30 ไดฟ์ 2 — <strong>Koh Haa Canyon</strong> หรือ <strong>Yamashita's Hole</strong><br>
เรือเดินทางไปหินแดงระหว่างคืน</p>

<h3>วันที่ 2 — หินแดง (4 ไดฟ์)</h3>
<p>07:30 ไดฟ์ 3 — <strong>Hin Daeng</strong> (Drift Dive ผนังดิ่ง ลุ้น Manta)<br>
10:30 ไดฟ์ 4 — <strong>Hin Daeng Summit</strong> (ฝูงปลา Barracuda)<br>
14:00 ไดฟ์ 5 — <strong>Hin Daeng East Wall</strong><br>
17:00 ไดฟ์ 6 — <strong>Hin Daeng</strong> (Night Dive, ฉลามนอน)</p>

<h3>วันที่ 3 — หินม่วง & กลับ (4 ไดฟ์)</h3>
<p>07:30 ไดฟ์ 7 — <strong>Hin Muang</strong> (Vertical Wall ปะการังอ่อนสีม่วง)<br>
10:30 ไดฟ์ 8 — <strong>Hin Muang</strong> (Anemone Carpet ฉลามครีบเทา)<br>
14:00 ไดฟ์ 9 — <strong>Hin Musung</strong> หรือ <strong>Koh Dok Mai</strong><br>
เรือเดินทางกลับภูเก็ตระหว่างคืน</p>

<h3>วันที่ 4 — เกาะพีพี & กลับ (2 ไดฟ์)</h3>
<p>07:30 ไดฟ์ 10 — <strong>King Cruiser Wreck</strong> หรือ <strong>Bida Nok</strong><br>
10:00 ไดฟ์ 11 — <strong>Shark Point</strong> (Farewell Dive)<br>
12:00 อาหารกลางวัน พักผ่อน<br>
15:00-16:00 ถึงท่าเรืออ่าวฉลอง เช็คเอาท์</p>`,
  },

  // ── 4. Racha-Phi Phi 3D4N ──────────────────────────────────────────────────
  {
    scheduleId: "cmnrmfiw00040tckzgtwwi0nk",
    title: "ราชา-พีพี 3 วัน 4 คืน",
    route: "เกาะราชาน้อย — เกาะราชาใหญ่ — เกาะพีพี",
    excerpt: "ดำน้ำ 12 ไดฟ์ สำรวจเกาะราชาน้ำใสสวย ซากเรือจม ไปจนถึงเกาะพีพี Bida Nok-Bida Nai ลุ้นพบฉลามเสือดาวและเต่าทะเล",
    keywords: ["ราชา", "เกาะพีพี", "Racha Yai", "Racha Noi", "Bida Nok", "Bida Nai", "liveaboard"],
    content: `<h3>ไฮไลท์</h3>
<ul>
<li><strong>เกาะราชาน้อย (Racha Noi)</strong> — น้ำใสมาก South Tip กระแสน้ำแรงลุ้นปลาใหญ่ Manta Ray</li>
<li><strong>เกาะราชาใหญ่ (Racha Yai)</strong> — ซากเรือจม ปะการังแข็ง เหมาะทุกระดับ</li>
<li><strong>เกาะพีพี Bida Nok & Bida Nai</strong> — ผนังดิ่ง ฉลามเสือดาว เต่าทะเล Swim-through</li>
<li><strong>เหมาะสำหรับทุกระดับ</strong> ตั้งแต่ Open Water ขึ้นไป</li>
</ul>

<h3>จุดดำน้ำ (Dive Sites)</h3>
<ul>
<li>Racha Noi — Banana Bay, South Tip</li>
<li>Racha Yai — Bay 1, Bay 2, Bungalow Bay, Wreck</li>
<li>Phi Phi — Bida Nok, Bida Nai, Palong Wall, Maya Bay</li>
</ul>

<h3>รวมในราคา (Included)</h3>
<ul>
<li>ห้องพักปรับอากาศ พร้อมห้องน้ำในตัว 3 คืน</li>
<li>อาหาร 3 มื้อ + ขนม ผลไม้ เครื่องดื่มไม่จำกัด (ไม่รวมแอลกอฮอล์)</li>
<li>อุปกรณ์ดำน้ำครบชุด</li>
<li>ประกันดำน้ำ</li>
<li>Dive Guide กลุ่มเล็ก</li>
<li>รถรับ-ส่ง สนามบินภูเก็ต ⇄ ท่าเรือ (ฟรี)</li>
</ul>

<h3>ไม่รวมในราคา (Excluded)</h3>
<ul>
<li>ค่าอุทยานแห่งชาติ (ประมาณ 600 ฿/คน)</li>
<li>เครื่องดื่มแอลกอฮอล์</li>
<li>Nitrox</li>
<li>ทิป (แนะนำ 1,000-2,000 ฿/คน)</li>
<li>ค่าที่พักก่อน/หลังทริป</li>
</ul>

<h3>ข้อมูลท่าเรือ</h3>
<ul>
<li><strong>ท่าเรือ:</strong> ท่าเรืออ่าวฉลอง (Chalong Pier) ภูเก็ต</li>
<li><strong>เช็คอิน:</strong> 19:00-20:00 ที่ท่าเรือ</li>
<li><strong>เช็คเอาท์:</strong> 10:00-14:00 วันสุดท้าย</li>
</ul>`,
    itinerary: `<h3>วันที่ 1 — ลงเรือ & Night Dive (1 ไดฟ์)</h3>
<p>19:00-20:00 เช็คอินที่ท่าเรืออ่าวฉลอง จัดอุปกรณ์ บรีฟ<br>
เรือออกมุ่งหน้าเกาะราชาน้อย<br>
21:00 ไดฟ์ 1 — <strong>Racha Noi - Banana Bay</strong> (Night Dive)</p>

<h3>วันที่ 2 — เกาะราชา (4 ไดฟ์)</h3>
<p>07:30 ไดฟ์ 2 — <strong>Racha Noi - South Tip</strong> (ผนัง กระแสน้ำ ปลาใหญ่)<br>
10:30 ไดฟ์ 3 — <strong>Racha Noi - Banana Bay</strong> (เต่า กระเบน)<br>
14:00 ไดฟ์ 4 — <strong>Racha Yai - Bay 1</strong> (ปะการังแข็ง น้ำตื้นสวย)<br>
17:00 ไดฟ์ 5 — <strong>Racha Yai - Bungalow Bay</strong> (Sunset Dive)<br>
เรือเดินทางไปเกาะพีพีระหว่างคืน</p>

<h3>วันที่ 3 — เกาะราชาใหญ่ & เกาะพีพี (4 ไดฟ์)</h3>
<p>07:30 ไดฟ์ 6 — <strong>Racha Yai - Wreck</strong> (ซากเรือจม สัตว์ทะเล)<br>
10:30 ไดฟ์ 7 — <strong>Racha Yai - Bay 2</strong> (แนวปะการัง รูปปั้นใต้น้ำ)<br>
เรือเดินทางไปเกาะพีพี<br>
14:00 ไดฟ์ 8 — <strong>Phi Phi - Bida Nok</strong> (ฉลามเสือดาว ผนัง)<br>
17:00 ไดฟ์ 9 — <strong>Phi Phi - Bida Nai</strong> (ถ้ำ Swim-through)</p>

<h3>วันที่ 4 — เกาะพีพี & กลับ (3 ไดฟ์)</h3>
<p>07:30 ไดฟ์ 10 — <strong>Phi Phi - Palong Wall</strong> (ปะการังอ่อน พัดทะเล)<br>
10:00 ไดฟ์ 11 — <strong>Phi Phi - Maya Bay</strong> (สวนปะการัง)<br>
12:00 ไดฟ์ 12 — <strong>Shark Point</strong> (Farewell Dive)<br>
เรือเดินทางกลับภูเก็ต<br>
15:00-16:00 ถึงท่าเรืออ่าวฉลอง เช็คเอาท์</p>`,
  },

  // ── 5. Koh Lipe 3D4N ───────────────────────────────────────────────────────
  {
    scheduleId: "cmnrmfiwr005ctckzl6mndyww",
    title: "เกาะหลีเป๊ะ 3 วัน 4 คืน",
    route: "เกาะห้า — หินแดง — หินม่วง — 8 Mile Rock — Stonehenge — เกาะหลีเป๊ะ",
    excerpt: "ดำน้ำ 10-12 ไดฟ์ เส้นทางอันดามันใต้สุด จากหินแดง-หินม่วงลงไปถึงเกาะหลีเป๊ะ สำรวจ 8 Mile Rock และ Stonehenge จุดดำน้ำสุดพิเศษ",
    keywords: ["เกาะหลีเป๊ะ", "Koh Lipe", "8 Mile Rock", "Stonehenge", "Tarutao", "อันดามันใต้", "liveaboard"],
    content: `<h3>ไฮไลท์</h3>
<ul>
<li><strong>8 Mile Rock</strong> — หินใต้น้ำกลางทะเลลึก ลุ้นพบฉลามวาฬและปลาใหญ่</li>
<li><strong>Stonehenge</strong> — ซุ้มหินปะการังใต้น้ำใกล้เกาะอาดัง สวยงามแปลกตา</li>
<li><strong>เกาะหลีเป๊ะ</strong> — น้ำทะเลใส ปะการังสมบูรณ์ สัตว์ทะเลหลากหลาย</li>
<li><strong>หินแดง-หินม่วง</strong> — แวะระหว่างทาง ลุ้นกระเบนราหู</li>
<li><strong>อุทยานแห่งชาติตะรุเตา</strong> — ธรรมชาติบริสุทธิ์ ไม่พลุกพล่าน</li>
</ul>

<h3>จุดดำน้ำ (Dive Sites)</h3>
<ul>
<li>Koh Haa — Lagoon, Canyon</li>
<li>Hin Daeng & Hin Muang (ระหว่างทาง)</li>
<li>8 Mile Rock</li>
<li>Stonehenge (เกาะอาดัง)</li>
<li>Shark Fin Reef</li>
<li>Hin Musung</li>
<li>Koh Lipe House Reef</li>
</ul>

<h3>รวมในราคา (Included)</h3>
<ul>
<li>ห้องพักปรับอากาศ พร้อมห้องน้ำในตัว 3 คืน</li>
<li>อาหาร 3 มื้อ + ขนม ผลไม้ เครื่องดื่มไม่จำกัด (ไม่รวมแอลกอฮอล์)</li>
<li>อุปกรณ์ดำน้ำครบชุด</li>
<li>ประกันดำน้ำ</li>
<li>Dive Guide กลุ่มเล็ก</li>
<li>รถรับ-ส่ง สนามบินภูเก็ต ⇄ ท่าเรือ (ฟรี)</li>
</ul>

<h3>ไม่รวมในราคา (Excluded)</h3>
<ul>
<li>ค่าอุทยานแห่งชาติตะรุเตา (ประมาณ 600 ฿/คน)</li>
<li>เครื่องดื่มแอลกอฮอล์</li>
<li>Nitrox</li>
<li>ทิป (แนะนำ 1,000-2,000 ฿/คน)</li>
<li>ค่าที่พักก่อน/หลังทริป</li>
</ul>

<h3>ข้อมูลท่าเรือ</h3>
<ul>
<li><strong>ท่าเรือ:</strong> ท่าเรืออ่าวฉลอง (Chalong Pier) ภูเก็ต</li>
<li><strong>เช็คอิน:</strong> เช้าวันแรก</li>
<li><strong>เช็คเอาท์:</strong> เย็นวันสุดท้าย</li>
</ul>

<h3>หมายเหตุ</h3>
<p>เส้นทางนี้เดินทางไกล ใช้เวลาเดินเรือมาก สภาพอากาศและกระแสน้ำอาจมีผลต่อจุดดำน้ำที่ไปได้ เหมาะสำหรับ Advanced Open Water ขึ้นไป</p>`,
    itinerary: `<h3>วันที่ 1 — ลงเรือ & เกาะห้า (2 ไดฟ์)</h3>
<p>เช้า เช็คอินที่ท่าเรืออ่าวฉลอง จัดอุปกรณ์ บรีฟ<br>
เรือออกมุ่งหน้าเกาะห้า<br>
14:00 ไดฟ์ 1 — <strong>Koh Haa Lagoon</strong> (Check Dive)<br>
16:30 ไดฟ์ 2 — <strong>Koh Haa Canyon</strong><br>
เรือเดินทางลงใต้ระหว่างคืน</p>

<h3>วันที่ 2 — หินแดง-หินม่วง & มุ่งหน้าลิเป๊ะ (4 ไดฟ์)</h3>
<p>07:30 ไดฟ์ 3 — <strong>Hin Daeng</strong> (ผนังดิ่ง ลุ้น Manta)<br>
10:30 ไดฟ์ 4 — <strong>Hin Muang</strong> (ปะการังอ่อนสีม่วง)<br>
14:00 ไดฟ์ 5 — <strong>8 Mile Rock</strong> (หินกลางทะเลลึก ลุ้นฉลามวาฬ)<br>
17:00 ไดฟ์ 6 — <strong>Hin Musung</strong><br>
เรือเดินทางต่อไปเกาะหลีเป๊ะ</p>

<h3>วันที่ 3 — เกาะหลีเป๊ะ & เกาะอาดัง (4 ไดฟ์)</h3>
<p>07:30 ไดฟ์ 7 — <strong>Stonehenge</strong> (ซุ้มหินปะการัง เกาะอาดัง)<br>
10:30 ไดฟ์ 8 — <strong>Shark Fin Reef</strong> (ฉลาม กระเบน)<br>
14:00 ไดฟ์ 9 — <strong>Koh Lipe House Reef</strong> (ปะการังสมบูรณ์)<br>
17:00 ไดฟ์ 10 — <strong>8 Mile Rock</strong> (Sunset Dive)<br>
เรือเดินทางกลับภูเก็ตระหว่างคืน</p>

<h3>วันที่ 4 — กลับ (2 ไดฟ์)</h3>
<p>07:30 ไดฟ์ 11 — <strong>Shark Point</strong> หรือ <strong>Bida Nok</strong> (ระหว่างทางกลับ)<br>
10:00 ไดฟ์ 12 — <strong>Anemone Reef</strong> (Farewell Dive)<br>
อาหารกลางวัน พักผ่อน<br>
15:00-16:00 ถึงท่าเรืออ่าวฉลอง เช็คเอาท์</p>`,
  },

  // ── 6. N+S Andaman 5D6N ────────────────────────────────────────────────────
  {
    scheduleId: "cmnrmfj0i00cotckzdn5yrmrp",
    title: "อันดามันเหนือ+ใต้ 5 วัน 6 คืน",
    route: "หมู่เกาะสิมิลัน — Richelieu Rock — เกาะบอน — เกาะตาชัย — เกาะห้า — หินแดง — หินม่วง",
    excerpt: "ดำน้ำ 18 ไดฟ์ เส้นทางพิเศษรวมอันดามันเหนือ+ใต้ ครอบคลุม Richelieu Rock, สิมิลัน, เกาะบอน, เกาะห้า, หินแดง-หินม่วง ครบทุกไฮไลท์ในทริปเดียว",
    keywords: ["อันดามันเหนือ", "อันดามันใต้", "สิมิลัน", "Richelieu Rock", "เกาะห้า", "หินแดง", "หินม่วง", "liveaboard"],
    content: `<h3>ไฮไลท์</h3>
<ul>
<li><strong>ครบทุกจุดดำน้ำชั้นนำ</strong> — ทั้งอันดามันเหนือและใต้ในทริปเดียว</li>
<li><strong>Richelieu Rock</strong> — จุดดำน้ำอันดับ 1 ของไทย</li>
<li><strong>หมู่เกาะสิมิลัน</strong> — น้ำใส ปะการังสมบูรณ์</li>
<li><strong>เกาะบอน</strong> — Manta Ray Cleaning Station</li>
<li><strong>หินแดง-หินม่วง</strong> — ผนังดิ่ง ลุ้นฉลามวาฬ กระเบนราหู</li>
<li><strong>เกาะห้า</strong> — Cathedral Cave ถ้ำใต้น้ำ</li>
<li><strong>18 ไดฟ์</strong> ใน 5 วันเต็ม สุดคุ้ม</li>
</ul>

<h3>จุดดำน้ำ (Dive Sites)</h3>
<ul>
<li>Similan Islands — West of Eden, Anita's Reef, Christmas Point</li>
<li>Koh Bon — West Ridge, Manta Cleaning Station</li>
<li>Koh Tachai — Pinnacle</li>
<li>Richelieu Rock</li>
<li>Surin Islands</li>
<li>Koh Haa — Lagoon, Canyon, Cathedral Cave</li>
<li>Hin Daeng & Hin Muang</li>
</ul>

<h3>รวมในราคา (Included)</h3>
<ul>
<li>ห้องพักปรับอากาศ พร้อมห้องน้ำในตัว 5 คืน</li>
<li>อาหาร 3 มื้อ + ขนม ผลไม้ เครื่องดื่มไม่จำกัด (ไม่รวมแอลกอฮอล์)</li>
<li>อุปกรณ์ดำน้ำครบชุด</li>
<li>ประกันดำน้ำ</li>
<li>Dive Guide กลุ่มเล็ก (1 DM : 4-5 คน)</li>
<li>รถรับ-ส่ง สนามบินภูเก็ต ⇄ ท่าเรือ (ฟรี)</li>
</ul>

<h3>ไม่รวมในราคา (Excluded)</h3>
<ul>
<li>ค่าอุทยานแห่งชาติสิมิลัน + หมู่เกาะลันตา (ประมาณ 1,200-1,500 ฿/คน)</li>
<li>เครื่องดื่มแอลกอฮอล์</li>
<li>Nitrox</li>
<li>ทิป (แนะนำ 1,500-2,500 ฿/คน)</li>
<li>ค่าที่พักก่อน/หลังทริป</li>
</ul>

<h3>ข้อมูลท่าเรือ</h3>
<ul>
<li><strong>ท่าเรือ:</strong> ท่าเรืออ่าวฉลอง (Chalong Pier) ภูเก็ต</li>
<li><strong>เช็คอิน:</strong> รถรับจากสนามบินภูเก็ต 18:00-20:00</li>
<li><strong>เช็คเอาท์:</strong> ส่งกลับสนามบิน 09:00</li>
</ul>`,
    itinerary: `<h3>วันที่ 1 — ลงเรือ</h3>
<p>18:00-20:00 รถรับจากสนามบินภูเก็ต → ท่าเรืออ่าวฉลอง<br>
เช็คอิน จัดอุปกรณ์ รับฟังบรีฟ ทานอาหารเย็นบนเรือ<br>
เรือออกเดินทางมุ่งหน้าหมู่เกาะสิมิลัน (ไม่มีไดฟ์)</p>

<h3>วันที่ 2 — หมู่เกาะสิมิลัน (4 ไดฟ์)</h3>
<p>07:30 ไดฟ์ 1 — <strong>Anita's Reef</strong> (สวนปะการัง)<br>
10:30 ไดฟ์ 2 — <strong>West of Eden</strong> (โขดหิน ถ้ำ)<br>
14:00 ไดฟ์ 3 — <strong>Christmas Point</strong> (Swim-through ฉลาม)<br>
17:00 ไดฟ์ 4 — <strong>Similan Night Dive</strong></p>

<h3>วันที่ 3 — เกาะบอน & Richelieu Rock (4 ไดฟ์)</h3>
<p>07:30 ไดฟ์ 5 — <strong>Koh Bon West Ridge</strong> (ลุ้น Manta Ray)<br>
10:30 ไดฟ์ 6 — <strong>Koh Tachai Pinnacle</strong><br>
14:00 ไดฟ์ 7 — <strong>Richelieu Rock</strong> (ม้าน้ำ ฉลามวาฬ)<br>
17:00 ไดฟ์ 8 — <strong>Richelieu Rock</strong> (Sunset Dive)</p>

<h3>วันที่ 4 — สุรินทร์ & เดินทางลงใต้ (3 ไดฟ์)</h3>
<p>07:30 ไดฟ์ 9 — <strong>Surin Islands</strong><br>
10:30 ไดฟ์ 10 — <strong>Koh Bon</strong> (ดำซ้ำ ลุ้น Manta)<br>
14:00 ไดฟ์ 11 — <strong>Koh Tachai</strong><br>
เรือเดินทางลงใต้ไปเกาะห้าระหว่างคืน</p>

<h3>วันที่ 5 — เกาะห้า & หินแดง-หินม่วง (4 ไดฟ์)</h3>
<p>07:30 ไดฟ์ 12 — <strong>Koh Haa Lagoon</strong> (Cathedral Cave)<br>
10:30 ไดฟ์ 13 — <strong>Koh Haa Pinnacle</strong><br>
14:00 ไดฟ์ 14 — <strong>Hin Daeng</strong> (ผนังดิ่ง ลุ้น Manta)<br>
17:00 ไดฟ์ 15 — <strong>Hin Muang</strong> (ปะการังอ่อนสีม่วง)</p>

<h3>วันที่ 6 — กลับ (3 ไดฟ์)</h3>
<p>07:30 ไดฟ์ 16 — <strong>Hin Daeng</strong> (Morning Dive)<br>
10:00 ไดฟ์ 17 — <strong>Shark Point</strong><br>
12:30 ไดฟ์ 18 — <strong>Anemone Reef</strong> (Farewell Dive)<br>
เรือเดินทางกลับภูเก็ต<br>
17:00 ถึงท่าเรืออ่าวฉลอง ส่งกลับสนามบิน</p>`,
  },

  // ── 7. Racha 2D2N ──────────────────────────────────────────────────────────
  {
    scheduleId: "cmnrmfj1j00f0tckz9var2ybi",
    title: "ราชา 2 วัน 2 คืน",
    route: "เกาะราชาน้อย — เกาะราชาใหญ่",
    excerpt: "ทริปสั้น 2 วัน ดำน้ำ 6-7 ไดฟ์ ที่เกาะราชาน้อยและราชาใหญ่ น้ำใส เหมาะสำหรับทุกระดับ เดินทางใกล้จากภูเก็ต",
    keywords: ["ราชา", "Racha Yai", "Racha Noi", "ทริปสั้น", "ภูเก็ต", "liveaboard"],
    content: `<h3>ไฮไลท์</h3>
<ul>
<li><strong>เกาะราชาน้อย (Racha Noi)</strong> — น้ำใสสุดในภูเก็ต South Tip ลุ้นปลาใหญ่ Manta Ray</li>
<li><strong>เกาะราชาใหญ่ (Racha Yai)</strong> — ซากเรือจม ปะการังแข็งสมบูรณ์ รูปปั้นใต้น้ำ</li>
<li><strong>เหมาะสำหรับทุกระดับ</strong> — ตั้งแต่ Open Water ขึ้นไป</li>
<li><strong>ทริปสั้น</strong> — เหมาะสำหรับผู้มีเวลาจำกัดหรือเป็นทริปเสริม</li>
</ul>

<h3>จุดดำน้ำ (Dive Sites)</h3>
<ul>
<li>Racha Noi — Banana Bay, South Tip</li>
<li>Racha Yai — Bay 1, Bay 2, Bungalow Bay, Wreck</li>
</ul>

<h3>รวมในราคา (Included)</h3>
<ul>
<li>ห้องพักปรับอากาศ พร้อมห้องน้ำในตัว 1 คืน</li>
<li>อาหาร 3 มื้อ + ขนม ผลไม้ เครื่องดื่มไม่จำกัด (ไม่รวมแอลกอฮอล์)</li>
<li>อุปกรณ์ดำน้ำครบชุด</li>
<li>ประกันดำน้ำ</li>
<li>Dive Guide กลุ่มเล็ก</li>
<li>รถรับ-ส่ง สนามบินภูเก็ต ⇄ ท่าเรือ (ฟรี)</li>
</ul>

<h3>ไม่รวมในราคา (Excluded)</h3>
<ul>
<li>ค่าอุทยานแห่งชาติ (ประมาณ 400 ฿/คน)</li>
<li>เครื่องดื่มแอลกอฮอล์</li>
<li>Nitrox</li>
<li>ทิป (แนะนำ 500-1,000 ฿/คน)</li>
<li>ค่าที่พักก่อน/หลังทริป</li>
</ul>

<h3>ข้อมูลท่าเรือ</h3>
<ul>
<li><strong>ท่าเรือ:</strong> ท่าเรืออ่าวฉลอง (Chalong Pier) ภูเก็ต</li>
<li><strong>เช็คอิน:</strong> 19:00-20:00 ที่ท่าเรือ</li>
<li><strong>เช็คเอาท์:</strong> 12:00 วันสุดท้าย</li>
</ul>`,
    itinerary: `<h3>วันที่ 1 — ลงเรือ & Night Dive (1 ไดฟ์)</h3>
<p>19:00-20:00 เช็คอินที่ท่าเรืออ่าวฉลอง จัดอุปกรณ์ บรีฟ<br>
เรือออกมุ่งหน้าเกาะราชาน้อย<br>
21:00 ไดฟ์ 1 — <strong>Racha Noi - Banana Bay</strong> (Night Dive)</p>

<h3>วันที่ 2 — เกาะราชา (4 ไดฟ์)</h3>
<p>07:30 ไดฟ์ 2 — <strong>Racha Noi - South Tip</strong> (ผนัง กระแสน้ำ ลุ้นปลาใหญ่)<br>
10:30 ไดฟ์ 3 — <strong>Racha Noi - Banana Bay</strong> (เต่า กระเบน)<br>
14:00 ไดฟ์ 4 — <strong>Racha Yai - Bay 1</strong> (ปะการังแข็ง น้ำตื้นสวย)<br>
17:00 ไดฟ์ 5 — <strong>Racha Yai - Bungalow Bay</strong> (Sunset Dive)</p>

<h3>วันที่ 3 — เกาะราชาใหญ่ & กลับ (2 ไดฟ์)</h3>
<p>07:30 ไดฟ์ 6 — <strong>Racha Yai - Wreck</strong> (ซากเรือจม สัตว์ทะเล)<br>
09:30 ไดฟ์ 7 — <strong>Racha Yai - Bay 2</strong> (รูปปั้นใต้น้ำ Farewell Dive)<br>
อาหารเช้า พักผ่อน<br>
12:00 ถึงท่าเรืออ่าวฉลอง เช็คเอาท์</p>`,
  },
];

async function main() {
  console.log(`Updating ${samples.length} sample schedules with Thai content...`);

  for (const s of samples) {
    // Update Thai translation
    const updated = await prisma.scheduleTranslation.updateMany({
      where: { scheduleId: s.scheduleId, lang: "th" },
      data: {
        title: s.title,
        excerpt: s.excerpt,
        content: s.content,
        itinerary: s.itinerary,
        route: s.route,
        keywords: s.keywords,
      },
    });

    // Also update English translation with route and excerpt
    await prisma.scheduleTranslation.updateMany({
      where: { scheduleId: s.scheduleId, lang: "en" },
      data: {
        route: s.route,
      },
    });

    console.log(`  [OK] ${s.title} — updated ${updated.count} th translation`);
  }

  console.log("\nDone!");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
