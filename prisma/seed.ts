import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "postgresql://siamdive:siamdive_password@localhost:5432/siamdive_db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // ── Service Areas ──────────────────────────────────────────────────────────
  const areaData = [
    { en: "Similan Islands", th: "หมู่เกาะสิมิลัน", cn: "斯米兰群岛", ja: "シミラン諸島", ko: "시밀란 제도", de: "Similan-Inseln", fr: "Îles Similan", ru: "Острова Симилан" },
    { en: "Koh Losin", th: "เกาะโลซิน", cn: "洛信岛", ja: "コー・ロシン", ko: "코 로신", de: "Koh Losin", fr: "Koh Losin", ru: "Ко Лосин" },
    { en: "Phuket", th: "ภูเก็ต", cn: "普吉岛", ja: "プーケット", ko: "푸켓", de: "Phuket", fr: "Phuket", ru: "Пхукет" },
    { en: "Phi Phi Island", th: "เกาะพีพี", cn: "皮皮岛", ja: "ピピ島", ko: "피피 섬", de: "Phi Phi Island", fr: "Île Phi Phi", ru: "Остров Пи-Пи" },
    { en: "Racha Islands", th: "หมู่เกาะราชา", cn: "拉差岛", ja: "ラチャ島", ko: "라차 섬", de: "Racha Islands", fr: "Îles Racha", ru: "Острова Рача" },
    { en: "Richelieu Rock", th: "Richelieu Rock", cn: "黎塞留岩", ja: "リシュリュー・ロック", ko: "리슐리외 록", de: "Richelieu Rock", fr: "Richelieu Rock", ru: "Ришелье Рок" },
    { en: "North Andaman", th: "อันดามันเหนือ", cn: "北安达曼", ja: "北アンダマン", ko: "북 안다만", de: "Nord-Andaman", fr: "Andaman Nord", ru: "Северный Андаман" },
  ];

  const areaLangs = ["en","th","cn","ja","ko","de","fr","ru"] as const;
  const areas: { id: string; name: string }[] = [];
  for (const a of areaData) {
    const area = await prisma.serviceArea.create({
      data: {
        translations: {
          create: areaLangs.map(l => ({ lang: l, name: (a as Record<string, string>)[l] ?? a.en })),
        },
      },
    });
    areas.push({ id: area.id, name: a.en });
  }
  console.log(`✓ ${areas.length} service areas`);

  // ── Company ────────────────────────────────────────────────────────────────
  const company = await prisma.company.create({
    data: {
      phone: "+66 98 376 8135",
      email: "info@siamdive.com",
      lineId: "@siamdive",
      status: "ACTIVE",
      translations: {
        create: [
          { lang: "en", name: "Siam Dive", description: "Premier scuba diving operator in Thailand" },
          { lang: "th", name: "สยามไดฟ์", description: "ผู้ให้บริการดำน้ำชั้นนำของประเทศไทย" },
        ],
      },
    },
  });
  console.log("✓ company");

  // ── Liveaboards ────────────────────────────────────────────────────────────
  const liveaboards = [
    {
      name: "MV Pawara",
      covers: ["https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&q=80"],
      area: "Similan Islands",
      en: { title: "Similan Islands Liveaboard 4D3N", slug: "similan-liveaboard-4d3n", excerpt: "Explore the world-class dive sites of Similan Islands with crystal-clear waters and abundant marine life.", keywords: ["similan", "liveaboard", "scuba diving"] },
      th: { title: "ลัยเอบอร์ด หมู่เกาะสิมิลัน 4 วัน 3 คืน", slug: "similan-liveaboard-4d3n-th", excerpt: "ดำน้ำจุดระดับโลก หมู่เกาะสิมิลัน น้ำใสสีฟ้าคราม ปะการังและปลาอุดมสมบูรณ์", keywords: ["สิมิลัน", "ลัยเอบอร์ด"] },
      price: 18900, capacity: 16,
      departs: [
        new Date("2026-04-10"), new Date("2026-05-08"), new Date("2026-10-15"),
      ],
      nights: 3,
    },
    {
      name: "MV Manta Queen",
      covers: ["https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80"],
      area: "Koh Losin",
      en: { title: "Koh Losin Liveaboard 5D4N", slug: "losin-liveaboard-5d4n", excerpt: "Koh Losin — the southernmost tip of the Gulf of Thailand with whale sharks and manta rays.", keywords: ["koh losin", "liveaboard", "whale shark"] },
      th: { title: "ลัยเอบอร์ด เกาะโลซิน 5 วัน 4 คืน", slug: "losin-liveaboard-5d4n-th", excerpt: "เกาะโลซินปลายสุดอ่าวไทย น้ำทะเลใสสีคราม ฉลามหูขาว และกระเบนราหู", keywords: ["เกาะโลซิน", "ลัยเอบอร์ด"] },
      price: 24000, capacity: 14,
      departs: [
        new Date("2026-04-20"), new Date("2026-06-05"),
      ],
      nights: 4,
    },
    {
      name: "MV Deep Andaman Queen",
      covers: ["https://images.unsplash.com/photo-1504870712357-65ea720d6078?w=1200&q=80"],
      area: "Richelieu Rock",
      en: { title: "Richelieu Rock Liveaboard 3D2N", slug: "richelieu-rock-liveaboard", excerpt: "One of the world's best dive sites — chance to see whale sharks and seahorses.", keywords: ["richelieu rock", "liveaboard", "whale shark"] },
      th: { title: "ลัยเอบอร์ด Richelieu Rock 3 วัน 2 คืน", slug: "richelieu-rock-liveaboard-th", excerpt: "หนึ่งในจุดดำน้ำดีที่สุดในโลก โอกาสพบวาฬฉลามและ seahorse", keywords: ["richelieu rock", "ลัยเอบอร์ด"] },
      price: 14500, capacity: 18,
      departs: [
        new Date("2026-05-01"), new Date("2026-07-10"),
      ],
      nights: 2,
    },
    {
      name: "MV North Andaman Explorer",
      covers: ["https://images.unsplash.com/photo-1463944601897-24d81a7dc287?w=1200&q=80"],
      area: "North Andaman",
      en: { title: "North Andaman Grand Tour 6D5N", slug: "north-andaman-liveaboard", excerpt: "Full North Andaman circuit hitting Surin Islands, Richelieu Rock and beyond.", keywords: ["north andaman", "liveaboard", "surin"] },
      th: { title: "แกรนด์ทัวร์ อันดามันเหนือ 6 วัน 5 คืน", slug: "north-andaman-liveaboard-th", excerpt: "ครบทุกจุดดำน้ำอันดามันเหนือ หมู่เกาะสุรินทร์ Richelieu Rock และอื่นๆ", keywords: ["อันดามันเหนือ", "ลัยเอบอร์ด"] },
      price: 22000, capacity: 16,
      departs: [
        new Date("2026-05-20"), new Date("2026-12-01"),
      ],
      nights: 5,
    },
  ];

  const liveaboardBoats: { id: string }[] = [];
  const liveaboardSchedules: { id: string }[] = [];

  for (const lb of liveaboards) {
    const areaId = areas.find(a => a.name === lb.area)?.id;
    const boat = await prisma.boat.create({
      data: {
        companyId: company.id,
        name: lb.name,
        type: "LIVEABOARD",
        capacity: lb.capacity,
        covers: lb.covers,
        status: "PUBLISHED",
        featured: true,
        translations: {
          create: [
            { lang: "en", title: lb.en.title, slug: lb.en.slug, excerpt: lb.en.excerpt, keywords: lb.en.keywords },
            { lang: "th", title: lb.th.title, slug: lb.th.slug, excerpt: lb.th.excerpt, keywords: lb.th.keywords },
          ],
        },
        priceTiers: {
          create: [
            { tier: "DIVER",     regularPrice: lb.price,           salePrice: null },
            { tier: "NON_DIVER", regularPrice: Math.round(lb.price * 0.8), salePrice: null },
          ],
        },
        serviceAreas: areaId ? { create: [{ serviceAreaId: areaId }] } : undefined,
      },
    });
    liveaboardBoats.push({ id: boat.id });

    for (const dep of lb.departs) {
      const ret = new Date(dep);
      ret.setDate(ret.getDate() + lb.nights);
      const sch = await prisma.schedule.create({
        data: {
          boatId: boat.id,
          dateType: "single",
          departureDate: dep,
          returnDate: ret,
          totalSeats: lb.capacity,
          availableSeats: Math.floor(lb.capacity * 0.7),
          status: "OPEN",
        },
      });
      liveaboardSchedules.push({ id: sch.id });
    }
  }
  console.log(`✓ ${liveaboards.length} liveaboards with ${liveaboardSchedules.length} schedules`);

  // ── Day Trips ──────────────────────────────────────────────────────────────
  const daytrips = [
    {
      name: "Racha Yai Day Trip",
      covers: ["https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=1200&q=80"],
      area: "Racha Islands",
      en: { title: "Racha Yai — 3 Dives", slug: "racha-yai-daytrip", excerpt: "The most popular dive site near Phuket. Crystal clear water, great for beginner and advanced divers.", keywords: ["racha yai", "day trip", "scuba diving phuket"] },
      th: { title: "ราชาใหญ่ — 3 ไดฟ์", slug: "racha-yai-daytrip-th", excerpt: "จุดดำน้ำยอดนิยมใกล้ภูเก็ต เหมาะทั้ง beginner และ advanced น้ำใส ปะการังสวย", keywords: ["ราชาใหญ่", "daytrip"] },
      price: 1990,
    },
    {
      name: "Phi Phi Day Trip",
      covers: ["https://images.unsplash.com/photo-1540202404-a2f29016b523?w=1200&q=80"],
      area: "Phi Phi Island",
      en: { title: "Phi Phi Island Scuba — 3 Dives", slug: "phi-phi-daytrip", excerpt: "Dive around the stunning Phi Phi archipelago with vibrant reefs and diverse marine life.", keywords: ["phi phi", "day trip", "koh lanta"] },
      th: { title: "ดำน้ำ เกาะพีพี — 3 ไดฟ์", slug: "phi-phi-daytrip-th", excerpt: "ดำน้ำรอบหมู่เกาะพีพีอันสวยงาม ปะการังสีสดและสิ่งมีชีวิตในทะเลมากมาย", keywords: ["เกาะพีพี", "daytrip"] },
      price: 2490,
    },
    {
      name: "Shark Point & King Cruiser",
      covers: ["https://images.unsplash.com/photo-1682687220923-c58b9a4592ea?w=1200&q=80"],
      area: "Phuket",
      en: { title: "Shark Point & King Cruiser Wreck", slug: "shark-point-daytrip", excerpt: "Combine two iconic Phuket dive sites — Shark Point and the King Cruiser shipwreck.", keywords: ["shark point", "king cruiser", "wreck diving"] },
      th: { title: "Shark Point & เรืออับปาง King Cruiser", slug: "shark-point-daytrip-th", excerpt: "ผสมสองจุดดำน้ำสุดไอคอนิก Shark Point และซากเรือ King Cruiser", keywords: ["shark point", "เรืออับปาง"] },
      price: 2200,
    },
    {
      name: "Racha Noi Whale Shark",
      covers: ["https://images.unsplash.com/photo-1585409677983-0f6c41ca9c3b?w=1200&q=80"],
      area: "Racha Islands",
      en: { title: "Racha Noi — Whale Shark Point", slug: "racha-noi-daytrip", excerpt: "Premium day trip to Racha Noi — one of Thailand's best spots to encounter whale sharks.", keywords: ["racha noi", "whale shark", "premium dive"] },
      th: { title: "ราชาน้อย — จุดวาฬฉลาม", slug: "racha-noi-daytrip-th", excerpt: "ทริปวันเดียวระดับพรีเมียม ราชาน้อย — จุดดีที่สุดพบวาฬฉลามในไทย", keywords: ["ราชาน้อย", "วาฬฉลาม"] },
      price: 3500,
    },
  ];

  const daytripSchedules: { id: string }[] = [];
  for (const dt of daytrips) {
    const areaId = areas.find(a => a.name === dt.area)?.id;
    const boat = await prisma.boat.create({
      data: {
        companyId: company.id,
        name: dt.name,
        type: "DAYTRIP",
        covers: dt.covers,
        status: "PUBLISHED",
        featured: false,
        translations: {
          create: [
            { lang: "en", title: dt.en.title, slug: dt.en.slug, excerpt: dt.en.excerpt, keywords: dt.en.keywords },
            { lang: "th", title: dt.th.title, slug: dt.th.slug, excerpt: dt.th.excerpt, keywords: dt.th.keywords },
          ],
        },
        priceTiers: {
          create: [
            { tier: "DIVER", regularPrice: dt.price, salePrice: null },
          ],
        },
        serviceAreas: areaId ? { create: [{ serviceAreaId: areaId }] } : undefined,
      },
    });

    // Recurring weekly schedules (next 8 weeks)
    const start = new Date("2026-04-04");
    for (let w = 0; w < 8; w++) {
      const dep = new Date(start);
      dep.setDate(start.getDate() + w * 7);
      const ret = new Date(dep);
      ret.setHours(ret.getHours() + 8);
      const sch = await prisma.schedule.create({
        data: {
          boatId: boat.id,
          dateType: "single",
          departureDate: dep,
          returnDate: ret,
          totalSeats: 12,
          availableSeats: Math.floor(Math.random() * 8) + 2,
          status: "OPEN",
        },
      });
      if (w < 2) daytripSchedules.push({ id: sch.id }); // keep first 2 for display
    }
  }
  console.log(`✓ ${daytrips.length} day trips`);

  // ── Blogs ──────────────────────────────────────────────────────────────────
  const blogs = [
    {
      covers: ["https://images.unsplash.com/photo-1559825481-12a05cc00344?w=800&q=80"],
      en: { title: "Whale Shark Guide: Where to Dive in Thailand", slug: "whale-shark-guide", excerpt: "Whale sharks can be found at Koh Losin, Racha Noi, and Richelieu Rock from March to May.", content: "<p>Thailand is one of the best places in the world to encounter whale sharks. The best spots are Koh Losin (Gulf of Thailand), Racha Noi (near Phuket), and Richelieu Rock (North Andaman).</p><p>Season: March – May for Koh Losin; year-round possible at Richelieu Rock.</p>", keywords: ["whale shark", "thailand diving"] },
      th: { title: "คู่มือดำน้ำกับวาฬฉลามในประเทศไทย", slug: "whale-shark-guide-th", excerpt: "วาฬฉลามพบได้ที่เกาะโลซิน เกาะราชาน้อย และ Richelieu Rock ช่วงมีนาคม–พฤษภาคม", content: "<p>ประเทศไทยเป็นหนึ่งในสถานที่ที่ดีที่สุดในโลกสำหรับการพบวาฬฉลาม จุดที่ดีที่สุดคือ เกาะโลซิน (อ่าวไทย) ราชาน้อย (ใกล้ภูเก็ต) และ Richelieu Rock (อันดามันเหนือ)</p>", keywords: ["วาฬฉลาม", "ดำน้ำไทย"] },
    },
    {
      covers: ["https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80"],
      en: { title: "5 Things to Know Before Your First Liveaboard", slug: "liveaboard-tips", excerpt: "Prepare well with the right medication, equipment, and skills before your first liveaboard trip.", content: "<p>Going on a liveaboard for the first time? Here are 5 things you need to prepare:</p><ol><li>Seasickness medication</li><li>Dive certification (min. Open Water)</li><li>Appropriate dive gear</li><li>Dry bags for electronics</li><li>At least 10 logged dives recommended</li></ol>", keywords: ["liveaboard tips", "beginner diving"] },
      th: { title: "5 สิ่งที่ต้องรู้ก่อนขึ้น Liveaboard ครั้งแรก", slug: "liveaboard-tips-th", excerpt: "เตรียมตัวให้ดีทั้งเรื่องยา อุปกรณ์ และทักษะก่อนขึ้น Liveaboard ครั้งแรก", content: "<p>ก่อนขึ้น Liveaboard ครั้งแรก ต้องเตรียม: ยาแก้เมาเรือ ใบ Open Water อุปกรณ์ดำน้ำ ถุงกันน้ำ และมีประสบการณ์ดำน้ำอย่างน้อย 10 ไดฟ์</p>", keywords: ["ลัยเอบอร์ด", "มือใหม่"] },
    },
    {
      covers: ["https://images.unsplash.com/photo-1511316695145-4992006ffddb?w=800&q=80"],
      en: { title: "Top 10 Dive Sites Around Phuket 2025", slug: "best-dive-phuket", excerpt: "Shark Point, King Cruiser Wreck, Racha Islands and more around Phuket island.", content: "<p>Phuket is the gateway to some of Thailand's best diving. Top sites include: Shark Point (leopard sharks), King Cruiser Wreck (marine life), Racha Yai (beginners), Racha Noi (whale sharks), Koh Doc Mai (soft corals), and more.</p>", keywords: ["phuket diving", "best dive sites"] },
      th: { title: "10 จุดดำน้ำที่ดีที่สุดรอบภูเก็ต 2568", slug: "best-dive-phuket-th", excerpt: "Shark Point, เรือ King Cruiser, หมู่เกาะราชา และอีกมากมายรอบเกาะภูเก็ต", content: "<p>ภูเก็ตเป็นประตูสู่จุดดำน้ำที่ดีที่สุดของไทย จุดเด่น: Shark Point (ฉลามเสือดาว), ซากเรือ King Cruiser, ราชาใหญ่ (มือใหม่), ราชาน้อย (วาฬฉลาม), เกาะดอกไม้ (ปะการังอ่อน)</p>", keywords: ["ดำน้ำภูเก็ต", "จุดดำน้ำ"] },
    },
    {
      covers: ["https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80"],
      en: { title: "Similan Islands Season: When Does it Open?", slug: "similan-season", excerpt: "Similan Islands National Park is only open October – May. Plan your liveaboard accordingly.", content: "<p>The Similan Islands National Park opens to visitors from October 15 to May 15 each year. During the monsoon (May–October), the park is closed for environmental protection. The best diving conditions are from December to April.</p>", keywords: ["similan islands", "diving season"] },
      th: { title: "ฤดูกาลดำน้ำที่หมู่เกาะสิมิลัน เปิด-ปิดเมื่อไหร่?", slug: "similan-season-th", excerpt: "อุทยานแห่งชาติหมู่เกาะสิมิลันเปิดให้เข้าเยี่ยมชมได้เฉพาะช่วง ต.ค. – พ.ค. เท่านั้น", content: "<p>อุทยานแห่งชาติหมู่เกาะสิมิลันเปิด 15 ต.ค. – 15 พ.ค. ของทุกปี ช่วงมรสุม (พ.ค.–ต.ค.) ปิดเพื่อฟื้นฟูสิ่งแวดล้อม ช่วงดำน้ำดีที่สุดคือ ธ.ค.–เม.ย.</p>", keywords: ["สิมิลัน", "ฤดูกาล"] },
    },
  ];

  const blogIds: string[] = [];
  for (const b of blogs) {
    const blog = await prisma.blog.create({
      data: {
        status: "PUBLISHED",
        covers: b.covers,
        translations: {
          create: [
            { lang: "en", title: b.en.title, slug: b.en.slug, excerpt: b.en.excerpt, content: b.en.content, keywords: b.en.keywords },
            { lang: "th", title: b.th.title, slug: b.th.slug, excerpt: b.th.excerpt, content: b.th.content, keywords: b.th.keywords },
          ],
        },
      },
    });
    blogIds.push(blog.id);
  }
  console.log(`✓ ${blogs.length} blogs`);

  // ── Update Display Rows ────────────────────────────────────────────────────
  const displayRows = await prisma.displayRow.findMany({ orderBy: { order: "asc" } });

  if (displayRows[0]) {
    // Row 0: Liveaboards (Vertical)
    await prisma.displayRow.update({
      where: { id: displayRows[0].id },
      data: {
        topic: "Liveaboard แนะนำ",
        layout: "VERTICAL",
        itemType: "LIVEABOARD",
        maxItems: 4,
        translations: {
          deleteMany: {},
          create: [
            { lang: "en", title: "Featured Liveaboards", subtitle: "Hand-picked multi-day diving expeditions" },
            { lang: "th", title: "Liveaboard แนะนำ", subtitle: "ทริปดำน้ำหลายวันที่คัดสรรมาเป็นพิเศษ" },
            { lang: "cn", title: "精选住船游", subtitle: "精心挑选的多日潜水探险" },
            { lang: "ja", title: "おすすめリブアボード", subtitle: "厳選されたマルチデイダイビング" },
            { lang: "ko", title: "추천 리브어보드", subtitle: "엄선된 다일 다이빙 투어" },
          ],
        },
        items: {
          deleteMany: {},
          create: liveaboardSchedules.slice(0, 4).map((s, i) => ({ refId: s.id, refType: "SCHEDULE", order: i })),
        },
      },
    });
  }

  if (displayRows[1]) {
    // Row 1: Day Trips (Vertical)
    await prisma.displayRow.update({
      where: { id: displayRows[1].id },
      data: {
        topic: "Daytrip ยอดนิยม",
        layout: "VERTICAL",
        itemType: "DAYTRIP",
        maxItems: 4,
        translations: {
          deleteMany: {},
          create: [
            { lang: "en", title: "Popular Day Trips", subtitle: "Scuba diving day trips from Phuket" },
            { lang: "th", title: "Daytrip ยอดนิยม", subtitle: "ทริปดำน้ำวันเดียวออกจากภูเก็ต" },
            { lang: "cn", title: "热门一日游", subtitle: "普吉出发的潜水一日游" },
            { lang: "ja", title: "人気のデイトリップ", subtitle: "プーケット発スキューバダイビング" },
            { lang: "ko", title: "인기 당일치기", subtitle: "푸켓에서 출발하는 스쿠버 다이빙" },
          ],
        },
        items: {
          deleteMany: {},
          create: daytripSchedules.slice(0, 4).map((s, i) => ({ refId: s.id, refType: "SCHEDULE", order: i })),
        },
      },
    });
  }

  if (displayRows[2]) {
    // Row 2: Blogs (Horizontal)
    await prisma.displayRow.update({
      where: { id: displayRows[2].id },
      data: {
        topic: "บทความล่าสุด",
        layout: "HORIZONTAL",
        itemType: "BLOG",
        maxItems: 4,
        translations: {
          deleteMany: {},
          create: [
            { lang: "en", title: "Latest Articles", subtitle: "Tips, guides and dive site reviews" },
            { lang: "th", title: "บทความล่าสุด", subtitle: "เคล็ดลับ คู่มือ และรีวิวจุดดำน้ำ" },
            { lang: "cn", title: "最新文章", subtitle: "技巧、指南和潜水地点评测" },
            { lang: "ja", title: "最新記事", subtitle: "ヒント、ガイド、ダイブサイトレビュー" },
            { lang: "ko", title: "최신 기사", subtitle: "팁, 가이드 및 다이브 사이트 리뷰" },
          ],
        },
        items: {
          deleteMany: {},
          create: blogIds.slice(0, 4).map((id, i) => ({ refId: id, refType: "BLOG", order: i })),
        },
      },
    });
  }

  console.log("✓ display rows updated");
  console.log("🎉 Seed complete!");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
