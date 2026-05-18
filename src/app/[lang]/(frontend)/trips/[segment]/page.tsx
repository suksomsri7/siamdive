import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import TripListClient, { type TripListItem } from "@/components/TripListClient";
import TripDetailPage from "@/components/TripDetailPage";

const VALID_LANGS = ["en", "th", "cn", "ja", "ko", "de", "fr", "ru"] as const;
type Lang = (typeof VALID_LANGS)[number];

const SEGMENT_TO_TYPE: Record<string, string> = {
  "daytrip":    "DAYTRIP",
  "snorkeling": "SNORKELING",
  "land-tour":  "LAND_TOUR",
  "liveaboard": "LIVEABOARD",
  "dive-resort":"DIVE_RESORT",
  "freedive":   "FREEDIVE",
};

const TYPE_LABEL: Record<string, string> = {
  "daytrip":    "Scuba Day Trips",
  "snorkeling": "Snorkeling",
  "land-tour":  "Land Tour",
  "liveaboard": "Liveaboard",
  "dive-resort":"Dive Resort",
  "freedive":   "Freedive Trips",
};

// Country-specific liveaboard listings. The segment maps to a region keyword
// matched case-insensitively against ServiceAreaTranslation.name (any lang).
// Empty listings are fine — these URLs exist as menu entries, content is
// added by tagging boats with a matching service area.
const LIVEABOARD_COUNTRY_SEGMENT: Record<string, { region: string; label: string }> = {
  "liveaboard-thailand":    { region: "thailand",    label: "Thailand Liveaboards"    },
  "liveaboard-maldives":    { region: "maldives",    label: "Maldives Liveaboards"    },
  "liveaboard-red-sea":     { region: "red sea",     label: "Red Sea Liveaboards"     },
  "liveaboard-indonesia":   { region: "indonesia",   label: "Indonesia Liveaboards"   },
  "liveaboard-palau":       { region: "palau",       label: "Palau Liveaboards"       },
  "liveaboard-philippines": { region: "philippines", label: "Philippines Liveaboards" },
};

// Area-filtered listings for daytrip / land-tour / etc. The boatType pins the
// type, the region keyword filters by ServiceAreaTranslation.name. Used by
// the homepage rows (Phuket Scuba Day Trips, Samui Day Tours, etc.) so each
// row's "View all" link lands on a Phuket/Samui-specific page with its own
// SEO metadata rather than the generic all-types listing.
const AREA_TYPE_SEGMENT: Record<string, { boatType: string; region: string; label: string }> = {
  "daytrip-phuket":     { boatType: "DAYTRIP",   region: "phuket", label: "Phuket Scuba Day Trips"  },
  "daytrip-samui":      { boatType: "DAYTRIP",   region: "samui",  label: "Koh Samui Scuba Day Trips" },
  "land-tour-phuket":   { boatType: "LAND_TOUR", region: "phuket", label: "Phuket Day Tours"          },
  "land-tour-samui":    { boatType: "LAND_TOUR", region: "samui",  label: "Koh Samui Day Tours"       },
  "snorkeling-phuket":  { boatType: "SNORKELING", region: "phuket", label: "Phuket Snorkeling Trips"  },
  "snorkeling-samui":   { boatType: "SNORKELING", region: "samui",  label: "Koh Samui Snorkeling Trips" },
};

function boatToListItem(b: {
  id: string; name: string; type: string; covers: string[];
  translations: { lang: string; title: string; slug: string; excerpt: string }[];
  priceTiers: { regularPrice: number; salePrice: number | null }[];
  serviceAreas: { serviceArea: { translations: { lang: string; name: string }[] } }[];
  schedules: { departureDate: Date | null; returnDate: Date | null; status: string }[];
}): TripListItem {
  const trans = b.translations.find(t => t.lang === "en") || b.translations[0];
  const prices = b.priceTiers.map(t => t.salePrice ?? t.regularPrice).filter(p => p > 0);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const area = b.serviceAreas[0]?.serviceArea.translations.find(t => t.lang === "en")
    || b.serviceAreas[0]?.serviceArea.translations[0];
  const next = b.schedules[0];

  // Prisma 7 + adapter-pg returns dates as ISO strings, not Date objects.
  // Normalize defensively so this works regardless of which form Prisma yields.
  const depDate = next?.departureDate ? new Date(next.departureDate) : null;
  const retDate = next?.returnDate ? new Date(next.returnDate) : null;

  let duration = "";
  if (depDate && retDate) {
    const days = Math.round((retDate.getTime() - depDate.getTime()) / 86400000);
    duration = `${days + 1}D${days}N`;
  } else if (["DAYTRIP", "SNORKELING", "LAND_TOUR"].includes(b.type)) {
    duration = "1 Day";
  }

  return {
    id: b.id,
    slug: trans?.slug || b.id,
    title: trans?.title || b.name,
    price: minPrice,
    duration,
    type: ["LIVEABOARD", "DIVE_RESORT"].includes(b.type) ? "LIVEABOARD" : "DAYTRIP",
    destinationName: area?.name || "",
    imageUrl: b.covers[0] || undefined,
    description: trans?.excerpt || undefined,
    nextDeparture: depDate?.toISOString() ?? null,
    nextStatus: next?.status ?? null,
  };
}

const getBoatsByType = unstable_cache(
  async (boatType: string) => prisma.boat.findMany({
    where: {
      type: boatType as never,
      status: "PUBLISHED",
      schedules: { some: { status: { in: ["OPEN", "FULL"] }, departureDate: { gte: new Date() } } },
    },
    include: {
      translations: { select: { lang: true, title: true, slug: true, excerpt: true } },
      priceTiers:   { select: { regularPrice: true, salePrice: true } },
      serviceAreas: { include: { serviceArea: { include: { translations: { select: { lang: true, name: true } } } } } },
      schedules: {
        where: { status: { in: ["OPEN", "FULL"] }, departureDate: { gte: new Date() } },
        orderBy: { departureDate: "asc" },
        take: 1,
        select: { departureDate: true, returnDate: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  }),
  ["boats-by-type"],
  { revalidate: 60 },
);

// Same shape as getBoatsByType but with a region filter — any boat whose
// ServiceArea has a translation.name containing the region keyword (case
// insensitive) is included. Cached per region so lookups are cheap.
const getLiveaboardsByRegion = unstable_cache(
  async (region: string) => prisma.boat.findMany({
    where: {
      type: "LIVEABOARD",
      status: "PUBLISHED",
      schedules: { some: { status: { in: ["OPEN", "FULL"] }, departureDate: { gte: new Date() } } },
      serviceAreas: {
        some: {
          serviceArea: {
            translations: {
              some: { name: { contains: region, mode: "insensitive" } },
            },
          },
        },
      },
    },
    include: {
      translations: { select: { lang: true, title: true, slug: true, excerpt: true } },
      priceTiers:   { select: { regularPrice: true, salePrice: true } },
      serviceAreas: { include: { serviceArea: { include: { translations: { select: { lang: true, name: true } } } } } },
      schedules: {
        where: { status: { in: ["OPEN", "FULL"] }, departureDate: { gte: new Date() } },
        orderBy: { departureDate: "asc" },
        take: 1,
        select: { departureDate: true, returnDate: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  }),
  ["liveaboards-by-region"],
  { revalidate: 60 },
);

// Generic type+region filter used by area-pinned segments such as
// daytrip-phuket / land-tour-samui. Same shape as getBoatsByType so the
// downstream mapper (boatToListItem) doesn't change.
const getBoatsByTypeAndRegion = unstable_cache(
  async (boatType: string, region: string) => prisma.boat.findMany({
    where: {
      type: boatType as never,
      status: "PUBLISHED",
      schedules: { some: { status: { in: ["OPEN", "FULL"] }, departureDate: { gte: new Date() } } },
      serviceAreas: {
        some: {
          serviceArea: {
            translations: {
              some: { name: { contains: region, mode: "insensitive" } },
            },
          },
        },
      },
    },
    include: {
      translations: { select: { lang: true, title: true, slug: true, excerpt: true } },
      priceTiers:   { select: { regularPrice: true, salePrice: true } },
      serviceAreas: { include: { serviceArea: { include: { translations: { select: { lang: true, name: true } } } } } },
      schedules: {
        where: { status: { in: ["OPEN", "FULL"] }, departureDate: { gte: new Date() } },
        orderBy: { departureDate: "asc" },
        take: 1,
        select: { departureDate: true, returnDate: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  }),
  ["boats-by-type-region"],
  { revalidate: 60 },
);

// ── SEO dictionary ──────────────────────────────────────────────────────────
// Per-segment, per-language title / description / keywords. Title pattern is
// "<Topic> | SIAMDIVE" — Next merges this with the layout-level template.
// Keywords cover the segment topic plus locale-specific search variants the
// row's audience would actually type. Falls back to the generic "trips" entry
// when a segment isn't mapped (e.g. unknown future segment).
type SeoEntry = { title: string; description: string; keywords: string[] };

const SEO: Record<string, Partial<Record<Lang, SeoEntry>>> = {
  "daytrip": {
    en: { title: "Scuba Day Trips in Thailand", description: "Top-rated single-day scuba diving trips around Phuket, Koh Samui, Krabi, and the Similan Islands. Pickups, gear, and PADI dives included.", keywords: ["scuba day trip thailand", "phuket day diving", "samui day diving", "thailand diving", "padi day dive", "racha noi", "shark point"] },
    th: { title: "ทริปดำน้ำสกูบาแบบวันเดียว (Day Trip) ในไทย", description: "รวมทริปดำน้ำสกูบาวันเดย์คุณภาพรอบภูเก็ต เกาะสมุย กระบี่ และหมู่เกาะสิมิลัน รับ-ส่ง อุปกรณ์ และไดฟ์ครบจบในวันเดียว", keywords: ["ทริปดำน้ำวันเดย์", "ดำน้ำภูเก็ต", "ดำน้ำสมุย", "scuba day trip", "ทริปดำน้ำไทย", "racha noi", "shark point"] },
    cn: { title: "泰国一日潜水之旅", description: "精选普吉、苏梅、甲米及斯米兰群岛的优质一日潜水行程，含接送、装备与PADI潜导。", keywords: ["泰国一日潜水", "普吉潜水", "苏梅潜水", "PADI 潜水", "斯米兰一日游"] },
    ja: { title: "タイのスキューバ デイトリップ", description: "プーケット・サムイ・クラビ・シミラン諸島周辺の人気ワンデイダイビング。送迎・器材・PADIダイブ付き。", keywords: ["タイ ダイビング", "プーケット 体験ダイビング", "サムイ ダイビング", "PADI ファンダイブ", "シミラン デイトリップ"] },
    ko: { title: "태국 스쿠버 당일치기 다이빙", description: "푸켓, 코사무이, 끄라비, 시밀란 제도의 인기 당일치기 다이빙. 픽업·장비·PADI 다이브 포함.", keywords: ["태국 다이빙", "푸켓 다이빙", "사무이 다이빙", "PADI 다이빙", "시밀란 데이 트립"] },
    de: { title: "Tauch-Tagestouren in Thailand", description: "Beste Scuba-Tagestouren rund um Phuket, Koh Samui, Krabi und die Similan-Inseln. Mit Transfer, Ausrüstung und PADI-Tauchgängen.", keywords: ["thailand tauchen", "phuket tagestour", "tauchen samui", "padi tagestauchen", "similan tagestour"] },
    fr: { title: "Plongée à la journée en Thaïlande", description: "Sorties plongée à la journée à Phuket, Koh Samui, Krabi et îles Similan. Transferts, équipement et plongées PADI inclus.", keywords: ["plongée thaïlande", "plongée phuket", "plongée samui", "padi journée", "similan day trip"] },
    ru: { title: "Дайвинг туры на один день в Таиланде", description: "Лучшие однодневные дайв-туры вокруг Пхукета, Самуи, Краби и Симиланских островов. Трансфер, снаряжение и PADI-дайвы включены.", keywords: ["дайвинг таиланд", "дайвинг пхукет", "дайвинг самуи", "PADI дайвинг", "Симиланы тур"] },
  },
  "daytrip-phuket": {
    en: { title: "Phuket Scuba Day Trips", description: "Phuket's best single-day scuba diving — Racha Noi, Racha Yai, Shark Point, Phi Phi, and Anemone Reef. Hotel pickup, full gear, PADI guides.", keywords: ["phuket scuba day trip", "phuket diving", "racha noi diving", "phi phi diving", "shark point", "anemone reef phuket", "padi day dive phuket"] },
    th: { title: "ทริปดำน้ำสกูบาวันเดย์ ภูเก็ต", description: "รวมทริปดำน้ำสกูบาวันเดย์ภูเก็ตที่ดีที่สุด — ราชาน้อย ราชาใหญ่ ชาร์คพอยท์ พีพี และอนีโมนรีฟ พร้อมรับ-ส่งโรงแรม อุปกรณ์ครบ ไดเวอร์มาสเตอร์ PADI", keywords: ["ดำน้ำภูเก็ต", "ทริปดำน้ำวันเดย์ภูเก็ต", "ราชาน้อย", "ราชาใหญ่", "ชาร์คพอยท์", "พีพี ดำน้ำ", "PADI ภูเก็ต"] },
    cn: { title: "普吉一日潜水行程", description: "普吉最佳一日潜水：拉差岛、鲨鱼角、皮皮岛、海葵礁。含酒店接送、全套装备及PADI潜导。", keywords: ["普吉潜水", "普吉一日潜水", "拉差岛", "皮皮岛潜水", "鲨鱼角", "PADI 普吉"] },
    ja: { title: "プーケット スキューバ デイトリップ", description: "プーケット人気のワンデイダイブ：ラチャ・ノイ、シャークポイント、ピピ、アネモネリーフ。ホテル送迎・器材・PADIガイド付き。", keywords: ["プーケット ダイビング", "ラチャ島", "ピピ島 ダイビング", "シャークポイント", "PADI プーケット"] },
    ko: { title: "푸켓 스쿠버 당일치기 다이빙", description: "라차 노이, 샤크 포인트, 피피, 아네모네 리프 등 푸켓 인기 당일 다이빙. 호텔 픽업·장비·PADI 가이드 포함.", keywords: ["푸켓 다이빙", "라차 노이", "피피 다이빙", "샤크 포인트", "PADI 푸켓"] },
    de: { title: "Phuket Tauch-Tagestouren", description: "Beste Tagestauchgänge in Phuket: Racha Noi, Shark Point, Phi Phi und Anemone Reef. Hoteltransfer, Ausrüstung und PADI-Guides.", keywords: ["phuket tauchen", "racha noi", "phi phi tauchen", "shark point", "padi phuket"] },
    fr: { title: "Plongée à la journée à Phuket", description: "Les meilleurs sites d'une journée depuis Phuket : Racha Noi, Shark Point, Phi Phi et Anemone Reef. Transfert hôtel, équipement et guides PADI.", keywords: ["plongée phuket", "racha noi", "phi phi plongée", "shark point", "padi phuket"] },
    ru: { title: "Дайвинг туры на один день из Пхукета", description: "Лучшие однодневные дайвы Пхукета — Рача Ной, Шарк Поинт, Пхи Пхи, Анемон Риф. Трансфер из отеля, снаряжение и PADI-гиды.", keywords: ["дайвинг пхукет", "Рача Ной", "Пхи Пхи", "Шарк Поинт", "PADI Пхукет"] },
  },
  "daytrip-samui": {
    en: { title: "Koh Samui Scuba Day Trips", description: "Single-day diving from Koh Samui to Sail Rock, Koh Tao, and Chumphon Pinnacle. Whale shark season, beginner & advanced dives.", keywords: ["koh samui diving", "samui day trip", "sail rock", "koh tao day dive", "chumphon pinnacle", "whale shark thailand"] },
    th: { title: "ทริปดำน้ำสกูบาวันเดย์ เกาะสมุย", description: "ดำน้ำสกูบาวันเดย์จากเกาะสมุยไปหินใบ เกาะเต่า และชุมพรพินนาเคิล มีฤดูฉลามวาฬ พร้อมไดฟ์สำหรับมือใหม่และมืออาชีพ", keywords: ["ดำน้ำสมุย", "ทริปดำน้ำเกาะเต่า", "หินใบ", "ชุมพรพินนาเคิล", "ฉลามวาฬ"] },
    cn: { title: "苏梅岛一日潜水", description: "从苏梅岛出发的一日潜水：帆船岛、龟岛、春蓬尖峰，鲸鲨季节，适合初学者及进阶潜水员。", keywords: ["苏梅潜水", "龟岛潜水", "帆船岛", "鲸鲨", "春蓬尖峰"] },
    ja: { title: "サムイ島 スキューバ デイトリップ", description: "サムイ島発のワンデイダイブ：セイルロック、タオ島、チュンポンピナクル。ジンベエザメシーズン、初心者〜上級者対応。", keywords: ["サムイ ダイビング", "セイルロック", "タオ島 ダイビング", "ジンベエザメ", "チュンポンピナクル"] },
    ko: { title: "코사무이 스쿠버 당일치기 다이빙", description: "코사무이 출발 당일 다이빙 — 세일록, 코타오, 춤폰 피나클. 고래상어 시즌, 초급/고급 다이버 모두 가능.", keywords: ["사무이 다이빙", "세일록", "코타오 다이빙", "고래상어", "춤폰 피나클"] },
    de: { title: "Koh Samui Tauch-Tagestouren", description: "Tagesausflüge von Koh Samui zu Sail Rock, Koh Tao und Chumphon Pinnacle. Walhai-Saison, Tauchgänge für Anfänger & Fortgeschrittene.", keywords: ["samui tauchen", "sail rock", "koh tao tauchen", "walhai", "chumphon pinnacle"] },
    fr: { title: "Plongée à la journée à Koh Samui", description: "Sorties plongée d'une journée depuis Koh Samui : Sail Rock, Koh Tao, Chumphon Pinnacle. Requin-baleine en saison, plongées débutants/confirmés.", keywords: ["plongée samui", "sail rock", "plongée koh tao", "requin baleine", "chumphon pinnacle"] },
    ru: { title: "Дайвинг туры на один день с Самуи", description: "Однодневные дайвы с Самуи — Сейл-Рок, Ко Тао, Чумпхон Пиннакл. Сезон китовых акул, дайвы для новичков и опытных.", keywords: ["дайвинг Самуи", "Сейл Рок", "дайвинг Ко Тао", "китовая акула", "Чумпхон"] },
  },
  "land-tour": {
    en: { title: "Land Tours in Thailand", description: "Day tours by land — Phang Nga Bay, James Bond Island, Koh Yao, Khao Sok, and Phi Phi viewpoint. Air-con vans and English-speaking guides.", keywords: ["thailand day tour", "phang nga bay", "james bond island", "phi phi viewpoint", "khao sok"] },
    th: { title: "ทัวร์วันเดย์ทางบกในไทย", description: "ทัวร์วันเดย์ทางบก — อ่าวพังงา เกาะเจมส์บอนด์ เกาะยาว เขาสก จุดชมวิวพีพี รถตู้แอร์ พร้อมไกด์", keywords: ["ทัวร์วันเดย์", "อ่าวพังงา", "เกาะเจมส์บอนด์", "เขาสก", "พีพีวิวพอยท์"] },
    cn: { title: "泰国陆地一日游", description: "陆路一日游：攀牙湾、007岛、瑶岛、考索、皮皮观景台。空调车与英文导游。", keywords: ["泰国一日游", "攀牙湾", "詹姆斯邦德岛", "考索", "皮皮岛观景"] },
    ja: { title: "タイの陸上ワンデイツアー", description: "陸路日帰りツアー：パンガー湾、007島、ヤオ島、カオソック、ピピ展望台。エアコン付きバン＆英語ガイド。", keywords: ["タイ ツアー", "パンガー湾", "007島", "カオソック", "ピピ展望台"] },
    ko: { title: "태국 당일치기 랜드 투어", description: "팡아만, 제임스 본드 섬, 코야오, 카오속, 피피 전망대 등 육로 당일 투어. 에어컨 밴 + 영어 가이드.", keywords: ["태국 투어", "팡아만", "제임스 본드 섬", "카오속", "피피 전망대"] },
    de: { title: "Land-Tagestouren in Thailand", description: "Tagestouren an Land — Phang Nga Bucht, James-Bond-Insel, Koh Yao, Khao Sok und Phi-Phi-Aussichtspunkt. Klimatisierte Vans und englischsprachige Guides.", keywords: ["thailand tagestour", "phang nga bucht", "james bond insel", "khao sok", "phi phi aussicht"] },
    fr: { title: "Excursions terrestres en Thaïlande", description: "Excursions à la journée — baie de Phang Nga, île de James Bond, Koh Yao, Khao Sok, point de vue Phi Phi. Vans climatisés et guides anglophones.", keywords: ["excursion thaïlande", "phang nga", "james bond", "khao sok", "phi phi viewpoint"] },
    ru: { title: "Наземные туры в Таиланде", description: "Однодневные туры по земле — залив Пханг Нга, остров Джеймса Бонда, Ко Яо, Кхао Сок, смотровая Пхи-Пхи. Кондиционированные вэны и англоговорящие гиды.", keywords: ["туры Таиланд", "залив Пханг Нга", "остров Джеймса Бонда", "Кхао Сок", "Пхи Пхи смотровая"] },
  },
  "land-tour-phuket": {
    en: { title: "Phuket Day Tours", description: "Phuket day tours — Phang Nga Bay, James Bond Island, Phi Phi viewpoint, Khao Sok, and city highlights. Hotel pickup and English guides.", keywords: ["phuket day tour", "phang nga bay tour", "james bond island", "phi phi viewpoint", "khao sok day trip"] },
    th: { title: "ทัวร์วันเดย์ ภูเก็ต", description: "ทัวร์วันเดย์ภูเก็ต — อ่าวพังงา เกาะเจมส์บอนด์ จุดชมวิวพีพี เขาสก และไฮไลท์ในเมือง รับ-ส่งโรงแรม", keywords: ["ทัวร์ภูเก็ต", "อ่าวพังงา", "เกาะเจมส์บอนด์", "พีพีวิวพอยท์", "เขาสก"] },
    cn: { title: "普吉一日陆地游", description: "普吉一日游：攀牙湾、007岛、皮皮观景台、考索、市区亮点。酒店接送，英文导游。", keywords: ["普吉一日游", "攀牙湾", "007岛", "考索", "皮皮岛观景"] },
    ja: { title: "プーケット日帰りツアー", description: "プーケット発の日帰りツアー：パンガー湾、007島、ピピ展望台、カオソック、市内ハイライト。ホテル送迎・英語ガイド。", keywords: ["プーケット ツアー", "パンガー湾", "007島", "カオソック", "ピピ展望台"] },
    ko: { title: "푸켓 당일 투어", description: "푸켓 당일 투어 — 팡아만, 제임스 본드 섬, 피피 전망대, 카오속, 시내 명소. 호텔 픽업, 영어 가이드.", keywords: ["푸켓 투어", "팡아만", "제임스 본드 섬", "피피 전망대", "카오속"] },
    de: { title: "Phuket Tagestouren", description: "Phuket-Tagestouren — Phang Nga, James-Bond-Insel, Phi-Phi-Viewpoint, Khao Sok und Stadthighlights. Hoteltransfer und Englisch sprechende Guides.", keywords: ["phuket tagestour", "phang nga", "james bond insel", "khao sok", "phi phi"] },
    fr: { title: "Excursions à la journée à Phuket", description: "Tours à la journée depuis Phuket — baie de Phang Nga, James Bond, point de vue Phi Phi, Khao Sok et incontournables de la ville. Transfert hôtel.", keywords: ["excursion phuket", "phang nga", "james bond", "phi phi viewpoint", "khao sok"] },
    ru: { title: "Однодневные туры из Пхукета", description: "Однодневные туры — залив Пханг Нга, остров Джеймса Бонда, смотровая Пхи-Пхи, Кхао Сок и хайлайты города. Трансфер из отеля.", keywords: ["туры Пхукет", "Пханг Нга", "остров Джеймса Бонда", "Пхи Пхи", "Кхао Сок"] },
  },
  "land-tour-samui": {
    en: { title: "Koh Samui Day Tours", description: "Koh Samui day tours — Ang Thong Marine Park, Koh Tao snorkel cruise, Big Buddha, and waterfalls. Hotel pickup, lunch, and English guides.", keywords: ["koh samui day tour", "ang thong marine park", "koh tao snorkel", "big buddha samui", "samui waterfalls"] },
    th: { title: "ทัวร์วันเดย์ เกาะสมุย", description: "ทัวร์วันเดย์เกาะสมุย — อุทยานฯ อ่างทอง ดำน้ำตื้นเกาะเต่า พระใหญ่ และน้ำตก รับ-ส่งโรงแรม อาหารกลางวัน", keywords: ["ทัวร์สมุย", "อ่างทอง", "ดำน้ำเกาะเต่า", "พระใหญ่สมุย", "น้ำตกสมุย"] },
    cn: { title: "苏梅岛一日游", description: "苏梅岛一日游：昂通海洋公园、龟岛浮潜、大佛寺、瀑布。含接送、午餐与英文导游。", keywords: ["苏梅一日游", "昂通", "龟岛浮潜", "大佛寺", "苏梅瀑布"] },
    ja: { title: "サムイ島 日帰りツアー", description: "サムイ島の日帰りツアー：アントン国立海洋公園、タオ島シュノーケル、ビッグブッダ、滝めぐり。送迎・昼食・英語ガイド。", keywords: ["サムイ ツアー", "アントン", "タオ島 シュノーケル", "ビッグブッダ", "サムイ 滝"] },
    ko: { title: "코사무이 당일 투어", description: "코사무이 당일 투어 — 앙통 해상국립공원, 코타오 스노클, 빅 부다, 폭포. 호텔 픽업·점심·영어 가이드.", keywords: ["사무이 투어", "앙통", "코타오 스노클", "빅 부다", "사무이 폭포"] },
    de: { title: "Koh Samui Tagestouren", description: "Samui-Tagestouren — Ang Thong Marinepark, Schnorcheln Koh Tao, Big Buddha und Wasserfälle. Hoteltransfer, Mittagessen und Englisch-Guides.", keywords: ["samui tagestour", "ang thong", "koh tao schnorcheln", "big buddha", "samui wasserfälle"] },
    fr: { title: "Excursions à la journée à Koh Samui", description: "Tours à Koh Samui : parc marin d'Ang Thong, snorkeling Koh Tao, Big Buddha, cascades. Transfert hôtel, déjeuner et guides anglophones.", keywords: ["excursion samui", "ang thong", "snorkeling koh tao", "big buddha", "samui cascades"] },
    ru: { title: "Однодневные туры с Самуи", description: "Туры с Самуи — морской парк Анг Тонг, снорклинг на Ко Тао, Большой Будда, водопады. Трансфер, обед и англоговорящие гиды.", keywords: ["туры Самуи", "Анг Тонг", "Ко Тао снорклинг", "Большой Будда", "водопады Самуи"] },
  },
  "snorkeling": {
    en: { title: "Snorkeling Trips in Thailand", description: "Family-friendly snorkeling tours — Phi Phi, Similan, Koh Tao, Surin Islands. Reef-safe gear, fish ID briefings, and turtle hotspots.", keywords: ["thailand snorkeling", "phi phi snorkel", "similan snorkel", "koh tao snorkeling", "surin islands"] },
    th: { title: "ทริปดำน้ำตื้นในไทย", description: "ทริปสน็อร์เกิลสำหรับครอบครัว — พีพี สิมิลัน เกาะเต่า หมู่เกาะสุรินทร์ อุปกรณ์เป็นมิตรกับปะการัง และจุดเต่ายอดนิยม", keywords: ["ดำน้ำตื้นไทย", "พีพี สน็อร์เกิล", "สิมิลัน", "เกาะเต่า", "หมู่เกาะสุรินทร์"] },
    cn: { title: "泰国浮潜行程", description: "适合家庭的浮潜：皮皮、斯米兰、龟岛、素林群岛。环保装备与导览，热门海龟点。", keywords: ["泰国浮潜", "皮皮浮潜", "斯米兰浮潜", "龟岛浮潜", "素林群岛"] },
    ja: { title: "タイのシュノーケリングツアー", description: "家族向けシュノーケル：ピピ、シミラン、タオ島、スリン諸島。リーフセーフ装備＆ウミガメスポット案内。", keywords: ["タイ シュノーケリング", "ピピ シュノーケル", "シミラン", "タオ島 シュノーケル", "スリン諸島"] },
    ko: { title: "태국 스노클링 투어", description: "가족 친화적 스노클링 — 피피, 시밀란, 코타오, 수린 제도. 친환경 장비와 거북이 핫스팟 안내.", keywords: ["태국 스노클링", "피피 스노클", "시밀란", "코타오 스노클", "수린"] },
    de: { title: "Schnorcheltouren in Thailand", description: "Familienfreundliches Schnorcheln — Phi Phi, Similan, Koh Tao, Surin-Inseln. Riff-schonende Ausrüstung und Schildkröten-Hotspots.", keywords: ["thailand schnorcheln", "phi phi schnorcheln", "similan schnorcheln", "koh tao", "surin"] },
    fr: { title: "Snorkeling en Thaïlande", description: "Sorties snorkeling familiales — Phi Phi, Similan, Koh Tao, îles Surin. Équipement reef-safe et spots à tortues.", keywords: ["snorkeling thaïlande", "phi phi snorkeling", "similan", "koh tao", "îles surin"] },
    ru: { title: "Снорклинг туры в Таиланде", description: "Семейный снорклинг — Пхи-Пхи, Симиланы, Ко Тао, Сурин. Reef-safe снаряжение и места с черепахами.", keywords: ["снорклинг Таиланд", "Пхи Пхи", "Симиланы", "Ко Тао", "Сурин"] },
  },
  "liveaboard": {
    en: { title: "Liveaboard Diving in Thailand", description: "Multi-day liveaboard cruises to Similan, Surin, Richelieu Rock and Burma Banks. Manta and whale shark season, all dives, full board.", keywords: ["thailand liveaboard", "similan liveaboard", "richelieu rock", "burma banks", "whale shark thailand", "manta liveaboard"] },
    th: { title: "ทริปดำน้ำเรือนอน (Liveaboard) ในไทย", description: "ทริปเรือนอนหลายวัน — สิมิลัน สุรินทร์ ริชลิว และพม่าแบงค์ ฤดูแมนต้าและฉลามวาฬ ครบทุกไดฟ์ พร้อมที่พัก-อาหาร", keywords: ["ทริปเรือนอน", "Liveaboard", "สิมิลัน", "ริชลิว", "ฉลามวาฬ", "แมนต้า"] },
    cn: { title: "泰国住船游 (Liveaboard)", description: "多日住船游：斯米兰、素林、利凯利尤岩、缅甸群礁。蝠鲼与鲸鲨季，含全程潜水和食宿。", keywords: ["泰国住船游", "斯米兰", "利凯利尤", "缅甸群礁", "鲸鲨", "蝠鲼"] },
    ja: { title: "タイのリブアボード", description: "シミラン、スリン、リシュリュー・ロック、ビルマバンクスへの数日間クルーズ。マンタ＆ジンベエザメシーズン、全ダイブ＆食事込み。", keywords: ["タイ リブアボード", "シミラン", "リシュリュー", "ビルマバンクス", "ジンベエザメ", "マンタ"] },
    ko: { title: "태국 리브어보드 다이빙", description: "시밀란, 수린, 리슐리외 록, 버마 뱅크 다일 일정 리브어보드. 만타와 고래상어 시즌, 전 다이브·식사 포함.", keywords: ["태국 리브어보드", "시밀란", "리슐리외 록", "버마 뱅크", "고래상어", "만타"] },
    de: { title: "Tauchsafaris in Thailand (Liveaboard)", description: "Mehrtägige Liveaboard-Touren zu Similan, Surin, Richelieu Rock und Burma Banks. Manta- und Walhai-Saison, alle Tauchgänge, Vollpension.", keywords: ["thailand liveaboard", "similan tauchsafari", "richelieu rock", "burma banks", "walhai", "manta"] },
    fr: { title: "Croisières plongée (Liveaboard) en Thaïlande", description: "Croisières plongée plusieurs jours — Similan, Surin, Richelieu Rock, Burma Banks. Saison manta & requin-baleine, plongées et pension incluses.", keywords: ["liveaboard thaïlande", "similan croisière", "richelieu rock", "burma banks", "requin baleine", "manta"] },
    ru: { title: "Дайвинг сафари (ливэборд) в Таиланде", description: "Многодневные ливэборды — Симиланы, Сурин, Ришелье Рок, Бирманские банки. Сезон манты и китовой акулы, дайвы и питание включены.", keywords: ["ливэборд Таиланд", "Симиланы", "Ришелье Рок", "Бирманские банки", "китовая акула", "манта"] },
  },
  "liveaboard-thailand": {
    en: { title: "Thailand Liveaboards", description: "Curated Thailand liveaboard cruises — Similan, Surin, Richelieu Rock, and Hin Daeng. Manta and whale shark season, full-board, all dives included.", keywords: ["thailand liveaboard", "similan liveaboard", "surin liveaboard", "richelieu rock", "hin daeng", "manta thailand", "whale shark liveaboard"] },
    th: { title: "ทริปเรือนอนในไทย (Liveaboard)", description: "ทริปเรือนอนคัดสรรในไทย — สิมิลัน สุรินทร์ ริชลิว และหินแดง ฤดูแมนต้าและฉลามวาฬ ที่พัก-อาหาร-ไดฟ์ครบ", keywords: ["เรือนอนไทย", "Liveaboard", "สิมิลัน", "สุรินทร์", "ริชลิว", "หินแดง", "ฉลามวาฬ", "แมนต้า"] },
    cn: { title: "泰国住船潜水 Liveaboard", description: "精选泰国住船游：斯米兰、素林、利凯利尤、欣登岩。蝠鲼与鲸鲨季节，含全程潜水与食宿。", keywords: ["泰国 Liveaboard", "斯米兰", "素林", "利凯利尤", "欣登岩", "鲸鲨", "蝠鲼"] },
    ja: { title: "タイのリブアボード", description: "厳選されたタイのリブアボード — シミラン、スリン、リシュリュー、ヒンデーン。マンタ＆ジンベエザメシーズン、全ダイブ＆食事付き。", keywords: ["タイ リブアボード", "シミラン", "スリン", "リシュリュー", "ヒンデーン", "ジンベエザメ"] },
    ko: { title: "태국 리브어보드", description: "엄선된 태국 리브어보드 — 시밀란, 수린, 리슐리외 록, 힌댕. 만타·고래상어 시즌, 전 다이브 및 식사 포함.", keywords: ["태국 리브어보드", "시밀란", "수린", "리슐리외 록", "힌댕"] },
    de: { title: "Thailand Tauchsafaris (Liveaboards)", description: "Kuratierte Liveaboard-Touren in Thailand — Similan, Surin, Richelieu Rock und Hin Daeng. Manta- und Walhai-Saison, Vollpension, alle Tauchgänge.", keywords: ["thailand liveaboard", "similan", "surin", "richelieu rock", "hin daeng", "walhai", "manta"] },
    fr: { title: "Croisières plongée en Thaïlande", description: "Sélection de croisières plongée en Thaïlande — Similan, Surin, Richelieu Rock, Hin Daeng. Saison manta & requin-baleine, pension complète.", keywords: ["liveaboard thaïlande", "similan", "surin", "richelieu rock", "hin daeng", "manta"] },
    ru: { title: "Ливэборды Таиланда", description: "Подборка дайв-сафари в Таиланде — Симиланы, Сурин, Ришелье Рок, Хин Даенг. Сезон манты и китовой акулы, полный пансион, все дайвы.", keywords: ["ливэборд Таиланд", "Симиланы", "Сурин", "Ришелье Рок", "Хин Даенг", "манта"] },
  },
  "dive-resort": {
    en: { title: "Dive Resorts in Thailand", description: "All-inclusive dive resorts on Koh Tao, Koh Lanta, and the Similan archipelago. Stay-and-dive packages with PADI courses.", keywords: ["thailand dive resort", "koh tao dive resort", "koh lanta diving", "padi resort thailand", "stay and dive"] },
    th: { title: "ดำน้ำพร้อมที่พัก (Dive Resort) ในไทย", description: "Dive Resort ออลอินคลูซีฟบนเกาะเต่า เกาะลันตา และหมู่เกาะสิมิลัน แพ็คเกจพักดำน้ำพร้อมคอร์ส PADI", keywords: ["dive resort ไทย", "เกาะเต่า ดำน้ำ", "เกาะลันตา", "PADI ไทย", "พักดำน้ำ"] },
    cn: { title: "泰国潜水度假村", description: "龟岛、兰塔岛、斯米兰群岛的全包潜水度假村。住宿+潜水套餐，含 PADI 课程。", keywords: ["泰国潜水度假村", "龟岛潜水", "兰塔潜水", "PADI 度假村"] },
    ja: { title: "タイのダイブリゾート", description: "タオ島・ランタ島・シミラン諸島のオールインクルーシブ ダイブリゾート。PADIコース付きステイ＆ダイブ。", keywords: ["タイ ダイブリゾート", "タオ島", "ランタ島", "PADI リゾート"] },
    ko: { title: "태국 다이브 리조트", description: "코타오, 코란타, 시밀란 군도의 올인클루시브 다이브 리조트. 숙박+다이빙 패키지, PADI 코스 포함.", keywords: ["태국 다이브 리조트", "코타오", "코란타", "PADI 리조트"] },
    de: { title: "Tauchresorts in Thailand", description: "All-inclusive Tauchresorts auf Koh Tao, Koh Lanta und Similan. Stay-and-Dive-Pakete mit PADI-Kursen.", keywords: ["tauchresort thailand", "koh tao tauchresort", "koh lanta", "padi resort"] },
    fr: { title: "Resorts de plongée en Thaïlande", description: "Resorts de plongée tout compris à Koh Tao, Koh Lanta et archipel des Similan. Forfaits séjour & plongée avec cours PADI.", keywords: ["resort plongée thaïlande", "koh tao plongée", "koh lanta", "padi resort"] },
    ru: { title: "Дайв-курорты Таиланда", description: "All-inclusive дайв-курорты на Ко Тао, Ко Ланта и Симиланах. Пакеты «проживание + дайвинг» с курсами PADI.", keywords: ["дайв курорт Таиланд", "Ко Тао", "Ко Ланта", "PADI курорт"] },
  },
  "freedive": {
    en: { title: "Freediving Trips in Thailand", description: "Freediving sessions and trips at Koh Tao, Koh Lanta, and Phuket. AIDA & SSI freediver courses with English-speaking instructors.", keywords: ["thailand freediving", "freedive koh tao", "aida freediver", "ssi freediver", "freedive phuket"] },
    th: { title: "ทริปฟรีไดฟ์ในไทย", description: "ทริปและคลาสฟรีไดฟ์ที่เกาะเต่า เกาะลันตา และภูเก็ต คอร์ส AIDA และ SSI พร้อมครูฝึกพูดภาษาอังกฤษ", keywords: ["ฟรีไดฟ์ไทย", "freedive เกาะเต่า", "AIDA", "SSI freediver", "ฟรีไดฟ์ภูเก็ต"] },
    cn: { title: "泰国自由潜水", description: "龟岛、兰塔、普吉的自由潜水训练与行程。AIDA 与 SSI 课程，英语教练。", keywords: ["泰国自由潜", "龟岛自由潜", "AIDA 课程", "SSI 自由潜", "普吉自由潜"] },
    ja: { title: "タイのフリーダイビング", description: "タオ島、ランタ島、プーケットのフリーダイビング体験＆コース。AIDA / SSI、英語インストラクター。", keywords: ["タイ フリーダイビング", "タオ島 フリーダイブ", "AIDA", "SSI フリーダイバー", "プーケット フリーダイブ"] },
    ko: { title: "태국 프리다이빙", description: "코타오, 코란타, 푸켓에서의 프리다이빙 세션과 코스. AIDA / SSI 자격, 영어 강사.", keywords: ["태국 프리다이빙", "코타오 프리다이빙", "AIDA", "SSI 프리다이버", "푸켓 프리다이빙"] },
    de: { title: "Apnoetauchen in Thailand", description: "Freediving-Sessions und Trips auf Koh Tao, Koh Lanta und Phuket. AIDA & SSI Kurse mit englischsprachigen Instructors.", keywords: ["thailand freediving", "koh tao freedive", "aida", "ssi freediver", "phuket freedive"] },
    fr: { title: "Apnée en Thaïlande", description: "Sessions et stages d'apnée à Koh Tao, Koh Lanta et Phuket. Cours AIDA & SSI avec instructeurs anglophones.", keywords: ["apnée thaïlande", "freedive koh tao", "AIDA", "SSI", "apnée phuket"] },
    ru: { title: "Фридайвинг в Таиланде", description: "Фридайвинг-сессии и курсы на Ко Тао, Ко Ланта и Пхукете. Программы AIDA и SSI, англоговорящие инструкторы.", keywords: ["фридайвинг Таиланд", "Ко Тао фридайв", "AIDA", "SSI фридайвер", "Пхукет фридайв"] },
  },
  "snorkeling-phuket": {
    en: { title: "Phuket Snorkeling Trips", description: "Best Phuket snorkeling — Phi Phi, Maya Bay, Coral & Racha Islands. Speedboat trips with reef-safe gear and turtle hotspots.", keywords: ["phuket snorkeling", "phi phi snorkel", "maya bay snorkel", "coral island", "racha snorkel"] },
    th: { title: "ทริปดำน้ำตื้น ภูเก็ต", description: "สน็อร์เกิลภูเก็ตยอดนิยม — พีพี อ่าวมาหยา เกาะเฮ และราชา เรือสปีดโบ้ทพร้อมอุปกรณ์ที่เป็นมิตรกับปะการัง", keywords: ["ดำน้ำตื้นภูเก็ต", "พีพี", "อ่าวมาหยา", "เกาะเฮ", "เกาะราชา"] },
    cn: { title: "普吉浮潜行程", description: "普吉热门浮潜：皮皮、玛雅湾、珊瑚岛、拉差岛。快艇行程，环保浮潜装备及海龟点。", keywords: ["普吉浮潜", "皮皮浮潜", "玛雅湾", "珊瑚岛", "拉差岛"] },
    ja: { title: "プーケット シュノーケリング", description: "プーケット人気シュノーケル：ピピ、マヤベイ、コーラル・ラチャ島。スピードボートとリーフセーフ装備、ウミガメスポット。", keywords: ["プーケット シュノーケル", "ピピ", "マヤベイ", "コーラル島", "ラチャ島"] },
    ko: { title: "푸켓 스노클링 투어", description: "푸켓 인기 스노클링 — 피피, 마야 베이, 코랄·라차 섬. 스피드보트와 친환경 장비, 거북이 포인트.", keywords: ["푸켓 스노클링", "피피", "마야 베이", "코랄 섬", "라차"] },
    de: { title: "Phuket Schnorcheltouren", description: "Top-Schnorchel in Phuket — Phi Phi, Maya Bay, Coral- und Racha-Insel. Speedboot-Trips mit Reef-Safe-Ausrüstung.", keywords: ["phuket schnorcheln", "phi phi", "maya bay", "coral island", "racha"] },
    fr: { title: "Snorkeling à Phuket", description: "Snorkeling à Phuket — Phi Phi, Maya Bay, îles Coral & Racha. Speedboats, équipement reef-safe, spots à tortues.", keywords: ["snorkeling phuket", "phi phi", "maya bay", "coral island", "racha"] },
    ru: { title: "Снорклинг туры из Пхукета", description: "Лучший снорклинг с Пхукета — Пхи-Пхи, Майя Бэй, Корал и Рача. Спидботы, reef-safe снаряжение, места с черепахами.", keywords: ["снорклинг Пхукет", "Пхи Пхи", "Майя Бэй", "Корал", "Рача"] },
  },
  "snorkeling-samui": {
    en: { title: "Koh Samui Snorkeling Trips", description: "Snorkel trips from Koh Samui — Ang Thong Marine Park, Koh Tao reefs, Sail Rock. Whale shark season, family-friendly speedboats.", keywords: ["koh samui snorkeling", "ang thong snorkel", "koh tao snorkel", "sail rock", "whale shark samui"] },
    th: { title: "ทริปดำน้ำตื้น เกาะสมุย", description: "สน็อร์เกิลจากเกาะสมุย — อุทยานฯ อ่างทอง แนวปะการังเกาะเต่า หินใบ ฤดูฉลามวาฬ เรือสปีดโบ้ทเหมาะสำหรับครอบครัว", keywords: ["ดำน้ำตื้นสมุย", "อ่างทอง", "เกาะเต่า", "หินใบ", "ฉลามวาฬ"] },
    cn: { title: "苏梅岛浮潜行程", description: "苏梅出发浮潜 — 昂通海洋公园、龟岛珊瑚礁、帆船岩。鲸鲨季节，适合家庭。", keywords: ["苏梅浮潜", "昂通", "龟岛浮潜", "帆船岩", "鲸鲨"] },
    ja: { title: "サムイ島 シュノーケリング", description: "サムイ島発のシュノーケル — アントン海洋公園、タオ島リーフ、セイルロック。ジンベエザメシーズン、家族連れに最適。", keywords: ["サムイ シュノーケル", "アントン", "タオ島", "セイルロック", "ジンベエザメ"] },
    ko: { title: "코사무이 스노클링", description: "코사무이 출발 스노클링 — 앙통 해상공원, 코타오 산호초, 세일록. 고래상어 시즌, 가족 친화적 스피드보트.", keywords: ["사무이 스노클링", "앙통", "코타오 스노클", "세일록", "고래상어"] },
    de: { title: "Koh Samui Schnorcheltouren", description: "Schnorcheln ab Samui — Ang Thong Marinepark, Koh Tao Riffe, Sail Rock. Walhai-Saison, familienfreundliche Speedboote.", keywords: ["samui schnorcheln", "ang thong", "koh tao", "sail rock", "walhai"] },
    fr: { title: "Snorkeling à Koh Samui", description: "Snorkeling depuis Koh Samui — parc marin d'Ang Thong, récifs de Koh Tao, Sail Rock. Saison requin-baleine, speedboats familiaux.", keywords: ["snorkeling samui", "ang thong", "koh tao", "sail rock", "requin baleine"] },
    ru: { title: "Снорклинг туры с Самуи", description: "Снорклинг с Самуи — морской парк Анг Тонг, рифы Ко Тао, Сейл Рок. Сезон китовой акулы, семейные спидботы.", keywords: ["снорклинг Самуи", "Анг Тонг", "Ко Тао", "Сейл Рок", "китовая акула"] },
  },
};

// Same shape as the unstable_cache return; resolves SEO entry for one segment
// + lang. Falls back through: requested lang → en → segment-default → null.
function resolveSeo(segment: string, lang: string): SeoEntry | null {
  const entry = SEO[segment];
  if (!entry) return null;
  const l = (VALID_LANGS as readonly string[]).includes(lang) ? (lang as Lang) : "en";
  return entry[l] || entry.en || null;
}

export async function generateMetadata(
  { params }: { params: Promise<{ lang: string; segment: string }> },
): Promise<Metadata> {
  const { lang, segment } = await params;
  const seo = resolveSeo(segment, lang);
  if (!seo) return {}; // detail page (slug) — let layout supply default metadata.

  const fullTitle = `${seo.title} | SIAMDIVE`;
  return {
    title:       fullTitle,
    description: seo.description,
    keywords:    seo.keywords,
    alternates: {
      canonical: `/${lang}/trips/${segment}`,
      languages: Object.fromEntries(
        VALID_LANGS.map(code => [code, `/${code}/trips/${segment}`]),
      ),
    },
    openGraph: {
      title:       fullTitle,
      description: seo.description,
      type:        "website",
      locale:      lang,
    },
    twitter: {
      card:        "summary_large_image",
      title:       fullTitle,
      description: seo.description,
    },
  };
}

export const dynamic = "force-dynamic";

export default async function TripSegmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string; segment: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { lang, segment } = await params;
  const { date } = await searchParams;
  const boatType = SEGMENT_TO_TYPE[segment];

  // Localized page heading: prefer the SEO title (already translated per lang)
  // and fall back to the English label baked into the segment maps.
  const localizedLabel = resolveSeo(segment, lang)?.title;

  // ── Listing page ────────────────────────────────────────────────────────────
  if (boatType) {
    const boats = await getBoatsByType(boatType);
    const trips = boats.map(boatToListItem);

    return (
      <main style={{ background: "#0d0d0d", minHeight: "100vh" }}>
        <TripListClient label={localizedLabel || TYPE_LABEL[segment]} trips={trips} />
      </main>
    );
  }

  // ── Country-filtered liveaboard listing ─────────────────────────────────────
  const countrySeg = LIVEABOARD_COUNTRY_SEGMENT[segment];
  if (countrySeg) {
    // "thailand" is the catalog default — every published liveaboard belongs
    // to a Thai service area (Phuket, Krabi, Trang, …) but no service area
    // translation contains the literal "thailand", so a region match would
    // return zero. Bypass the region filter for that case.
    const boats = countrySeg.region === "thailand"
      ? await getBoatsByType("LIVEABOARD")
      : await getLiveaboardsByRegion(countrySeg.region);
    const trips = boats.map(boatToListItem);

    return (
      <main style={{ background: "#0d0d0d", minHeight: "100vh" }}>
        <TripListClient label={localizedLabel || countrySeg.label} trips={trips} />
      </main>
    );
  }

  // ── Type + area listing (daytrip-phuket, land-tour-samui, etc.) ─────────────
  const areaSeg = AREA_TYPE_SEGMENT[segment];
  if (areaSeg) {
    const boats = await getBoatsByTypeAndRegion(areaSeg.boatType, areaSeg.region);
    const trips = boats.map(boatToListItem);

    return (
      <main style={{ background: "#0d0d0d", minHeight: "100vh" }}>
        <TripListClient label={localizedLabel || areaSeg.label} trips={trips} />
      </main>
    );
  }

  // ── Individual trip detail by slug ──────────────────────────────────────────
  const trans = await prisma.boatTranslation.findFirst({
    where: { slug: segment },
    include: {
      boat: {
        include: {
          translations: true,
          priceTiers:   { select: { regularPrice: true, salePrice: true } },
          serviceAreas: { include: { serviceArea: { include: { translations: true } } } },
        },
      },
    },
  });

  if (!trans || trans.boat.status !== "PUBLISHED") return notFound();

  const b = trans.boat;
  const langTrans = b.translations.find(t => t.lang === lang)
    || b.translations.find(t => t.lang === "en")
    || trans;
  const prices = b.priceTiers.map(t => t.salePrice ?? t.regularPrice).filter(p => p > 0);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const area = b.serviceAreas[0]?.serviceArea.translations.find(t => t.lang === lang)
    || b.serviceAreas[0]?.serviceArea.translations.find(t => t.lang === "en")
    || b.serviceAreas[0]?.serviceArea.translations[0];

  const trip = {
    slug:            langTrans.slug,
    title:           langTrans.title,
    description:     langTrans.excerpt || undefined,
    price:           minPrice,
    duration:        "",
    type:            (["LIVEABOARD", "DIVE_RESORT"].includes(b.type) ? "LIVEABOARD" : "DAYTRIP") as "LIVEABOARD" | "DAYTRIP",
    destinationName: area?.name || "",
    imageUrl:        b.covers[0] || undefined,
    boatId:          b.id,
  };

  const initialDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined;

  return (
    <main style={{ background: "#0d0d0d", minHeight: "100vh" }}>
      <TripDetailPage trip={trip} lang={lang} initialDate={initialDate} />
    </main>
  );
}
