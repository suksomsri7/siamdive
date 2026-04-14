import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString:
    process.env.DATABASE_URL ??
    "postgresql://siamdive:siamdive_password@localhost:5432/siamdive_db",
});
const prisma = new PrismaClient({ adapter });

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const BOAT_ID = "cmn94ruo8000ctlkz550rc2ul";
const LANGS = ["en", "cn", "de", "fr", "ru", "ko", "ja"] as const;
type Lang = (typeof LANGS)[number];

const TEMPLATE_IDS = [
  "cmnrmfir40000tckzp5kvsepr", // 1. N. Andaman 4D5N
  "cmnrmfitk001ctckz4z2xy09w", // 2. S. Andaman 4D5N
  "cmnrmfiut002otckzxu34rnkm", // 3. Hin Muang-Hin Daeng 3D4N
  "cmnrmfiw00040tckzgtwwi0nk", // 4. Racha-Phi Phi 3D4N
  "cmnrmfiwr005ctckzl6mndyww", // 5. Koh Lipe 3D4N
  "cmnrmfj0i00cotckzdn5yrmrp", // 6. N+S Andaman 5D6N
  "cmnrmfj1j00f0tckz9var2ybi", // 7. Racha 2D2N
];

// ═══════════════════════════════════════════════════════════════════════════
// THAI MONTH ABBREVIATIONS & DATE HANDLING
// ═══════════════════════════════════════════════════════════════════════════

const THAI_MONTHS: Record<string, number> = {
  "ม.ค.": 1, "ก.พ.": 2, "มี.ค.": 3, "เม.ย.": 4,
  "พ.ค.": 5, "มิ.ย.": 6, "ก.ค.": 7, "ส.ค.": 8,
  "ก.ย.": 9, "ต.ค.": 10, "พ.ย.": 11, "ธ.ค.": 12,
};

const MONTH_NAMES: Record<string, string[]> = {
  th: ["", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."],
  en: ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  cn: ["", "1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
  de: ["", "Jan.", "Feb.", "Mär.", "Apr.", "Mai", "Jun.", "Jul.", "Aug.", "Sep.", "Okt.", "Nov.", "Dez."],
  fr: ["", "janv.", "fév.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."],
  ru: ["", "янв.", "фев.", "мар.", "апр.", "мая", "июн.", "июл.", "авг.", "сен.", "окт.", "ноя.", "дек."],
  ko: ["", "1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"],
  ja: ["", "1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
};

function parseDateFromThai(dayStr: string, monthStr: string): { day: number; month: number } | null {
  const day = parseInt(dayStr, 10);
  const month = THAI_MONTHS[monthStr];
  if (!day || !month) return null;
  return { day, month };
}

function formatDate(day: number, month: number, lang: string): string {
  const monthName = MONTH_NAMES[lang]?.[month] ?? MONTH_NAMES.en[month];
  if (lang === "cn" || lang === "ko" || lang === "ja") {
    return `${month}月${day}日`;
  }
  return `${day} ${monthName}`;
}

/** Parse the template's departure date and compute the day offset for each date in the content */
function computeDateOffset(
  templateDepartureDate: Date,
  targetDepartureDate: Date
): number {
  const tpl = new Date(templateDepartureDate.getFullYear(), templateDepartureDate.getMonth(), templateDepartureDate.getDate());
  const tgt = new Date(targetDepartureDate.getFullYear(), targetDepartureDate.getMonth(), targetDepartureDate.getDate());
  return Math.round((tgt.getTime() - tpl.getTime()) / (1000 * 60 * 60 * 24));
}

function shiftDate(day: number, month: number, offsetDays: number, year: number = 2026): { day: number; month: number } {
  // Create a date from the original
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + offsetDays);
  return { day: d.getDate(), month: d.getMonth() + 1 };
}

// Replace Thai dates in HTML with target language dates, applying offset
function replaceDatesInHtml(
  html: string,
  lang: string,
  offsetDays: number,
  templateYear: number = 2026
): string {
  // Match patterns like "10 เม.ย." or "1ต เม.ย." (typo in DB)
  const thaiMonthPattern = Object.keys(THAI_MONTHS)
    .map((m) => m.replace(".", "\\."))
    .join("|");
  const dateRegex = new RegExp(`(\\d{1,2})\\s*(${thaiMonthPattern})`, "g");

  return html.replace(dateRegex, (match, dayStr, monthStr) => {
    const day = parseInt(dayStr, 10);
    const month = THAI_MONTHS[monthStr.replace("\\.", ".")];
    if (!day || !month) return match;
    const shifted = shiftDate(day, month, offsetDays, templateYear);
    return formatDate(shifted.day, shifted.month, lang);
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// TRANSLATION DICTIONARY
// ═══════════════════════════════════════════════════════════════════════════

// Each entry: Thai text -> { en, cn, de, fr, ru, ko, ja }
// Order matters: longer/more specific phrases first to avoid partial matches

const TRANSLATIONS: Array<{ th: string; en: string; cn: string; de: string; fr: string; ru: string; ko: string; ja: string }> = [
  // === SECTION HEADERS ===
  { th: "<p>ไฮไลท์</p>", en: "<p>Highlights</p>", cn: "<p>亮点</p>", de: "<p>Highlights</p>", fr: "<p>Points forts</p>", ru: "<p>Основные моменты</p>", ko: "<p>하이라이트</p>", ja: "<p>ハイライト</p>" },
  { th: "<h3>ไฮไลท์</h3>", en: "<h3>Highlights</h3>", cn: "<h3>亮点</h3>", de: "<h3>Highlights</h3>", fr: "<h3>Points forts</h3>", ru: "<h3>Основные моменты</h3>", ko: "<h3>하이라이트</h3>", ja: "<h3>ハイライト</h3>" },
  { th: "จุดดำน้ำ (Dive Sites)", en: "Dive Sites", cn: "潜水点", de: "Tauchplätze", fr: "Sites de plongée", ru: "Дайв-сайты", ko: "다이브 사이트", ja: "ダイブサイト" },
  { th: "โปรแกรมรายวัน (Itinerary)", en: "Daily Itinerary", cn: "每日行程", de: "Tagesablauf", fr: "Itinéraire journalier", ru: "Ежедневная программа", ko: "일일 일정", ja: "日程表" },
  { th: "รวมในราคา (Included)", en: "Included in Price", cn: "价格包含", de: "Im Preis inbegriffen", fr: "Inclus dans le prix", ru: "Включено в стоимость", ko: "가격 포함 사항", ja: "料金に含まれるもの" },
  { th: "ไม่รวมในราคา (Excluded)", en: "Not Included (Excluded)", cn: "不包含在价格内", de: "Nicht im Preis enthalten", fr: "Non inclus dans le prix", ru: "Не включено в стоимость", ko: "가격 미포함 사항", ja: "料金に含まれないもの" },
  { th: "ข้อมูลท่าเรือ", en: "Port Information", cn: "码头信息", de: "Hafeninformationen", fr: "Informations sur le port", ru: "Информация о порте", ko: "항구 정보", ja: "港情報" },
  { th: "หมายเหตุ", en: "Notes", cn: "备注", de: "Hinweise", fr: "Remarques", ru: "Примечания", ko: "참고 사항", ja: "備考" },

  // === ITINERARY DAY HEADERS (common patterns) ===
  { th: "ลงเรือ", en: "Boarding", cn: "登船", de: "Einschiffung", fr: "Embarquement", ru: "Посадка на борт", ko: "승선", ja: "乗船" },
  { th: "Check Out", en: "Check Out", cn: "退房", de: "Auschecken", fr: "Check-out", ru: "Выселение", ko: "체크아웃", ja: "チェックアウト" },
  { th: "กลับ", en: "Return", cn: "返回", de: "Rückkehr", fr: "Retour", ru: "Возвращение", ko: "귀환", ja: "帰港" },

  // === HIGHLIGHTS PHRASES ===
  { th: "จุดดำน้ำอันดับ 1 ของไทย", en: "Thailand's #1 dive site", cn: "泰国排名第一的潜水点", de: "Thailands Tauchplatz Nr. 1", fr: "Le site de plongée n°1 de Thaïlande", ru: "Дайв-сайт №1 Таиланда", ko: "태국 1위 다이브 사이트", ja: "タイNo.1のダイブサイト" },
  { th: "ลุ้นพบฉลามวาฬ ม้าน้ำ และฝูงปลาแบร์ราคูด้า", en: "chance to spot whale sharks, seahorses, and barracuda schools", cn: "有机会遇到鲸鲨、海马和梭鱼群", de: "Chance auf Walhaie, Seepferdchen und Barrakudaschwärme", fr: "possibilité d'observer des requins-baleines, hippocampes et bancs de barracudas", ru: "шанс встретить китовых акул, морских коньков и стаи барракуд", ko: "고래상어, 해마, 바라쿠다 떼를 만날 기회", ja: "ジンベエザメ、タツノオトシゴ、バラクーダの群れに出会えるチャンス" },
  { th: "สถานีทำความสะอาดกระเบนราหู (Manta Ray)", en: "Manta ray cleaning station", cn: "蝠鲼清洁站", de: "Manta-Putzstation", fr: "Station de nettoyage des raies manta", ru: "Станция очистки мант", ko: "만타레이 클리닝 스테이션", ja: "マンタレイのクリーニングステーション" },
  { th: "หินใต้น้ำเต็มไปด้วยปะการังอ่อนและฝูงปลา", en: "Underwater pinnacle covered in soft corals and schooling fish", cn: "水下尖塔覆盖着软珊瑚和鱼群", de: "Unterwasser-Felsnadel bedeckt mit Weichkorallen und Fischschwärmen", fr: "Pinacle sous-marin couvert de coraux mous et de bancs de poissons", ru: "Подводная скала, покрытая мягкими кораллами и стаями рыб", ko: "연산호와 물고기 떼로 덮인 수중 피나클", ja: "ソフトコーラルと群れる魚に覆われた水中ピナクル" },
  { th: "น้ำใส ปะการังสมบูรณ์ ถ่ายรูปใต้น้ำสวย", en: "Crystal-clear water, pristine coral reefs, stunning underwater photography", cn: "水质清澈、珊瑚礁完好、水下摄影绝佳", de: "Kristallklares Wasser, unberührte Korallenriffe, atemberaubende Unterwasserfotografie", fr: "Eaux cristallines, récifs coralliens préservés, photographie sous-marine exceptionnelle", ru: "Кристально чистая вода, нетронутые коралловые рифы, потрясающая подводная фотография", ko: "맑은 물, 건강한 산호초, 아름다운 수중 사진", ja: "透き通った水、手つかずのサンゴ礁、素晴らしい水中写真" },
  { th: "น้ำใส ปะการังสมบูรณ์", en: "Crystal-clear water, pristine coral reefs", cn: "水质清澈、珊瑚礁完好", de: "Kristallklares Wasser, unberührte Korallenriffe", fr: "Eaux cristallines, récifs coralliens préservés", ru: "Кристально чистая вода, нетронутые коралловые рифы", ko: "맑은 물, 건강한 산호초", ja: "透き通った水、手つかずのサンゴ礁" },
  { th: "กลุ่มเล็ก 1 Divemaster : 4-5 นักดำน้ำ", en: "small groups of 1 Divemaster : 4-5 divers", cn: "小团制 1名潜水长 : 4-5名潜水员", de: "Kleingruppen mit 1 Divemaster : 4-5 Tauchern", fr: "petits groupes de 1 Divemaster : 4-5 plongeurs", ru: "малые группы: 1 дайвмастер на 4-5 дайверов", ko: "소그룹 1 다이브마스터 : 4-5명 다이버", ja: "少人数制 1ダイブマスター：4-5名ダイバー" },

  // === INCLUDED ===
  { th: "ห้องพักปรับอากาศ พร้อมห้องน้ำในตัว 4 วัน 5คืน", en: "Air-conditioned cabin with en-suite bathroom, 4 days 5 nights", cn: "空调客舱，配备独立卫浴，4天5夜", de: "Klimatisierte Kabine mit eigenem Bad, 4 Tage 5 Nächte", fr: "Cabine climatisée avec salle de bain privée, 4 jours 5 nuits", ru: "Каюта с кондиционером и собственной ванной комнатой, 4 дня 5 ночей", ko: "에어컨 객실 (전용 욕실 포함), 4일 5박", ja: "エアコン完備の個室キャビン（専用バスルーム付き）、4日間5泊" },
  { th: "ห้องพักปรับอากาศ พร้อมห้องน้ำในตัว 4 วัน 5 คืน", en: "Air-conditioned cabin with en-suite bathroom, 4 days 5 nights", cn: "空调客舱，配备独立卫浴，4天5夜", de: "Klimatisierte Kabine mit eigenem Bad, 4 Tage 5 Nächte", fr: "Cabine climatisée avec salle de bain privée, 4 jours 5 nuits", ru: "Каюта с кондиционером и собственной ванной комнатой, 4 дня 5 ночей", ko: "에어컨 객실 (전용 욕실 포함), 4일 5박", ja: "エアコン完備の個室キャビン（専用バスルーム付き）、4日間5泊" },
  { th: "ห้องพักปรับอากาศ พร้อมห้องน้ำในตัว ดำน้ำ4 วัน", en: "Air-conditioned cabin with en-suite bathroom, 4 diving days", cn: "空调客舱，配备独立卫浴，4天潜水", de: "Klimatisierte Kabine mit eigenem Bad, 4 Tauchtage", fr: "Cabine climatisée avec salle de bain privée, 4 jours de plongée", ru: "Каюта с кондиционером и собственной ванной, 4 дня дайвинга", ko: "에어컨 객실 (전용 욕실 포함), 4일 다이빙", ja: "エアコン完備キャビン（専用バスルーム付き）、4日間ダイビング" },
  { th: "ห้องพักปรับอากาศ พร้อมห้องน้ำในตัว 3 วัน 4 คืน", en: "Air-conditioned cabin with en-suite bathroom, 3 days 4 nights", cn: "空调客舱，配备独立卫浴，3天4夜", de: "Klimatisierte Kabine mit eigenem Bad, 3 Tage 4 Nächte", fr: "Cabine climatisée avec salle de bain privée, 3 jours 4 nuits", ru: "Каюта с кондиционером и собственной ванной комнатой, 3 дня 4 ночи", ko: "에어컨 객실 (전용 욕실 포함), 3일 4박", ja: "エアコン完備の個室キャビン（専用バスルーム付き）、3日間4泊" },
  { th: "ห้องพักปรับอากาศ พร้อมห้องน้ำในตัว 5 คืน 6 วัน", en: "Air-conditioned cabin with en-suite bathroom, 5 nights 6 days", cn: "空调客舱，配备独立卫浴，5夜6天", de: "Klimatisierte Kabine mit eigenem Bad, 5 Nächte 6 Tage", fr: "Cabine climatisée avec salle de bain privée, 5 nuits 6 jours", ru: "Каюта с кондиционером и собственной ванной комнатой, 5 ночей 6 дней", ko: "에어컨 객실 (전용 욕실 포함), 5박 6일", ja: "エアコン完備の個室キャビン（専用バスルーム付き）、5泊6日間" },
  { th: "ห้องพักปรับอากาศ พร้อมห้องน้ำในตัว 2 คืน 3วัน", en: "Air-conditioned cabin with en-suite bathroom, 2 nights 3 days", cn: "空调客舱，配备独立卫浴，2夜3天", de: "Klimatisierte Kabine mit eigenem Bad, 2 Nächte 3 Tage", fr: "Cabine climatisée avec salle de bain privée, 2 nuits 3 jours", ru: "Каюта с кондиционером и собственной ванной, 2 ночи 3 дня", ko: "에어컨 객실 (전용 욕실 포함), 2박 3일", ja: "エアコン完備の個室キャビン（専用バスルーム付き）、2泊3日間" },
  { th: "อาหาร 4 มื้อ + ขนม ผลไม้ เครื่องดื่มไม่จำกัด (ไม่รวมแอลกอฮอล์)", en: "4 meals + snacks, fruits & unlimited drinks (excluding alcohol)", cn: "4餐 + 零食、水果和无限饮品（不含酒精）", de: "4 Mahlzeiten + Snacks, Obst & unbegrenzte Getränke (ohne Alkohol)", fr: "4 repas + collations, fruits et boissons illimitées (hors alcool)", ru: "4-разовое питание + закуски, фрукты и безлимитные напитки (без алкоголя)", ko: "4끼 식사 + 간식, 과일, 무제한 음료 (주류 제외)", ja: "1日4食 + スナック、フルーツ、無制限ドリンク（アルコール除く）" },
  { th: "Dive Guide กลุ่มเล็ก (1 DM : 4-5 คน)", en: "Dive guide, small groups (1 DM : 4-5 divers)", cn: "潜水向导，小团制（1名DM : 4-5名潜水员）", de: "Tauchguide, Kleingruppen (1 DM : 4-5 Taucher)", fr: "Guide de plongée, petits groupes (1 DM : 4-5 plongeurs)", ru: "Дайв-гид, малые группы (1 DM : 4-5 дайверов)", ko: "다이브 가이드, 소그룹 (1 DM : 4-5명 다이버)", ja: "ダイブガイド、少人数制（1 DM：4-5名ダイバー）" },
  { th: "Dive Guide กลุ่มเล็ก", en: "Dive guide, small groups", cn: "潜水向导，小团制", de: "Tauchguide, Kleingruppen", fr: "Guide de plongée, petits groupes", ru: "Дайв-гид, малые группы", ko: "다이브 가이드, 소그룹", ja: "ダイブガイド、少人数制" },
  { th: "รถรับ-ส่ง สนามบินภูเก็ต ⇄ ท่าเรือ (ฟรี)", en: "Free airport transfer: Phuket Airport ⇄ pier", cn: "免费接送：普吉机场 ⇄ 码头", de: "Kostenloser Flughafentransfer: Phuket Flughafen ⇄ Hafen", fr: "Transfert gratuit : Aéroport de Phuket ⇄ port", ru: "Бесплатный трансфер: аэропорт Пхукета ⇄ пирс", ko: "무료 공항 픽업: 푸켓 공항 ⇄ 부두", ja: "無料空港送迎：プーケット空港 ⇄ 桟橋" },
  { th: "รถรับ-ส่ง สนามบินหาดใหญ่ ⇄ ท่าเรือ (ฟรี)", en: "Free airport transfer: Hat Yai Airport ⇄ pier", cn: "免费接送：合艾机场 ⇄ 码头", de: "Kostenloser Flughafentransfer: Hat Yai Flughafen ⇄ Hafen", fr: "Transfert gratuit : Aéroport de Hat Yai ⇄ port", ru: "Бесплатный трансфер: аэропорт Хатъяй ⇄ пирс", ko: "무료 공항 픽업: 핫야이 공항 ⇄ 부두", ja: "無料空港送迎：ハジャイ空港 ⇄ 桟橋" },

  // === EXCLUDED ===
  { th: "ค่าอุทยานแห่งชาติ (ประมาณ 1,100-2,500 ฿/คน)", en: "National park fees (approx. 1,100-2,500 ฿/person)", cn: "国家公园费用（约 1,100-2,500 ฿/人）", de: "Nationalparkgebühren (ca. 1.100-2.500 ฿/Person)", fr: "Frais de parc national (env. 1 100-2 500 ฿/pers.)", ru: "Сбор за национальный парк (ок. 1 100-2 500 ฿/чел.)", ko: "국립공원 입장료 (약 1,100-2,500 ฿/인)", ja: "国立公園入園料（約 1,100-2,500 ฿/人）" },
  { th: "ค่าอุทยานแห่งชาติ (ประมาณ 600 ฿/คน)", en: "National park fees (approx. 600 ฿/person)", cn: "国家公园费用（约 600 ฿/人）", de: "Nationalparkgebühren (ca. 600 ฿/Person)", fr: "Frais de parc national (env. 600 ฿/pers.)", ru: "Сбор за национальный парк (ок. 600 ฿/чел.)", ko: "국립공원 입장료 (약 600 ฿/인)", ja: "国立公園入園料（約 600 ฿/人）" },
  { th: "ค่าอุทยานแห่งชาติหมู่เกาะลันตา (ประมาณ 900-1,800 ฿/คน)", en: "Mu Koh Lanta National Park fees (approx. 900-1,800 ฿/person)", cn: "兰达群岛国家公园费用（约 900-1,800 ฿/人）", de: "Mu Koh Lanta Nationalparkgebühren (ca. 900-1.800 ฿/Person)", fr: "Frais du parc national de Mu Koh Lanta (env. 900-1 800 ฿/pers.)", ru: "Сбор за нацпарк Му Ко Ланта (ок. 900-1 800 ฿/чел.)", ko: "무 꼬 란타 국립공원 입장료 (약 900-1,800 ฿/인)", ja: "ムーコーランタ国立公園入園料（約 900-1,800 ฿/人）" },
  { th: "ค่าอุทยานแห่งชาติหมู่เกาะลันตา (ประมาณ 800-1,500 ฿/คน)", en: "Mu Koh Lanta National Park fees (approx. 800-1,500 ฿/person)", cn: "兰达群岛国家公园费用（约 800-1,500 ฿/人）", de: "Mu Koh Lanta Nationalparkgebühren (ca. 800-1.500 ฿/Person)", fr: "Frais du parc national de Mu Koh Lanta (env. 800-1 500 ฿/pers.)", ru: "Сбор за нацпарк Му Ко Ланта (ок. 800-1 500 ฿/чел.)", ko: "무 꼬 란타 국립공원 입장료 (약 800-1,500 ฿/인)", ja: "ムーコーランタ国立公園入園料（約 800-1,500 ฿/人）" },
  { th: "ค่าอุทยานแห่งชาติตะรุเตา (ประมาณ 600-900 ฿/คน)", en: "Tarutao National Park fees (approx. 600-900 ฿/person)", cn: "达鲁岛国家公园费用（约 600-900 ฿/人）", de: "Tarutao Nationalparkgebühren (ca. 600-900 ฿/Person)", fr: "Frais du parc national de Tarutao (env. 600-900 ฿/pers.)", ru: "Сбор за нацпарк Тарутао (ок. 600-900 ฿/чел.)", ko: "따루따오 국립공원 입장료 (약 600-900 ฿/인)", ja: "タルタオ国立公園入園料（約 600-900 ฿/人）" },
  { th: "ค่าอุทยานแห่งชาติสิมิลัน + หมู่เกาะลันตา (ประมาณ 1,600-2,800 ฿/คน)", en: "Similan + Mu Koh Lanta National Park fees (approx. 1,600-2,800 ฿/person)", cn: "斯米兰+兰达群岛国家公园费用（约 1,600-2,800 ฿/人）", de: "Similan + Mu Koh Lanta Nationalparkgebühren (ca. 1.600-2.800 ฿/Person)", fr: "Frais des parcs nationaux Similan + Mu Koh Lanta (env. 1 600-2 800 ฿/pers.)", ru: "Сбор за нацпарки Симилан + Му Ко Ланта (ок. 1 600-2 800 ฿/чел.)", ko: "시밀란 + 무 꼬 란타 국립공원 입장료 (약 1,600-2,800 ฿/인)", ja: "シミラン + ムーコーランタ国立公園入園料（約 1,600-2,800 ฿/人）" },
  { th: "อุปกรณ์ดำน้ำครบชุด (BCD, Regulator, Computer, Wetsuit, ไฟฉาย, หน้ากาก, ฟิน)", en: "Full dive equipment rental (BCD, regulator, computer, wetsuit, torch, mask, fins)", cn: "全套潜水装备租赁（BCD、调节器、电脑、潜水服、手电筒、面镜、脚蹼）", de: "Komplette Tauchausrüstung (BCD, Regler, Computer, Neoprenanzug, Lampe, Maske, Flossen)", fr: "Location d'équipement complet (BCD, détendeur, ordinateur, combinaison, lampe, masque, palmes)", ru: "Полный комплект снаряжения (BCD, регулятор, компьютер, гидрокостюм, фонарь, маска, ласты)", ko: "전체 다이빙 장비 대여 (BCD, 레귤레이터, 컴퓨터, 웻수트, 랜턴, 마스크, 핀)", ja: "フルダイビング器材レンタル（BCD、レギュレーター、コンピューター、ウエットスーツ、ライト、マスク、フィン）" },
  { th: "ประกันดำน้ำ", en: "Dive insurance", cn: "潜水保险", de: "Tauchversicherung", fr: "Assurance plongée", ru: "Дайв-страховка", ko: "다이빙 보험", ja: "ダイビング保険" },
  { th: "เครื่องดื่มแอลกอฮอล์", en: "Alcoholic beverages", cn: "含酒精饮品", de: "Alkoholische Getränke", fr: "Boissons alcoolisées", ru: "Алкогольные напитки", ko: "주류", ja: "アルコール飲料" },
  { th: "Nitrox (มีให้เช่าบนเรือ โปรดแจ้งล่วงหน้า)", en: "Nitrox (available on board, please inform in advance)", cn: "高氧（船上可租用，请提前告知）", de: "Nitrox (an Bord verfügbar, bitte im Voraus anmelden)", fr: "Nitrox (disponible à bord, merci de prévenir à l'avance)", ru: "Найтрокс (доступен на борту, сообщите заранее)", ko: "나이트록스 (선상 대여 가능, 사전 문의 필요)", ja: "ナイトロックス（船上レンタル可、事前にお知らせください）" },
  { th: "Nitrox", en: "Nitrox", cn: "高氧 (Nitrox)", de: "Nitrox", fr: "Nitrox", ru: "Найтрокс", ko: "나이트록스 (Nitrox)", ja: "ナイトロックス (Nitrox)" },
  { th: "ทิป (แนะนำ 1,500-2,500 ฿/คน)", en: "Tips (suggested 1,500-2,500 ฿/person)", cn: "小费（建议 1,500-2,500 ฿/人）", de: "Trinkgeld (empfohlen 1.500-2.500 ฿/Person)", fr: "Pourboire (recommandé 1 500-2 500 ฿/pers.)", ru: "Чаевые (рекомендуется 1 500-2 500 ฿/чел.)", ko: "팁 (권장 1,500-2,500 ฿/인)", ja: "チップ（推奨 1,500-2,500 ฿/人）" },
  { th: "ทิป (แนะนำ 1,000-2,000 ฿/คน)", en: "Tips (suggested 1,000-2,000 ฿/person)", cn: "小费（建议 1,000-2,000 ฿/人）", de: "Trinkgeld (empfohlen 1.000-2.000 ฿/Person)", fr: "Pourboire (recommandé 1 000-2 000 ฿/pers.)", ru: "Чаевые (рекомендуется 1 000-2 000 ฿/чел.)", ko: "팁 (권장 1,000-2,000 ฿/인)", ja: "チップ（推奨 1,000-2,000 ฿/人）" },
  { th: "ค่าที่พักก่อน/หลังทริป", en: "Pre/post-trip accommodation", cn: "行程前/后住宿费", de: "Unterkunft vor/nach der Tour", fr: "Hébergement avant/après le voyage", ru: "Проживание до/после поездки", ko: "여행 전/후 숙박비", ja: "旅行前後の宿泊費" },
  { th: "ค่าเดินทางมาจุดนัดพบ", en: "Travel cost to meeting point", cn: "前往集合点的交通费", de: "Anreisekosten zum Treffpunkt", fr: "Frais de transport jusqu'au point de rendez-vous", ru: "Транспортные расходы до места встречи", ko: "집합 장소까지의 교통비", ja: "集合場所までの交通費" },
  { th: "ค่าเดินทางมายังจุดนัดพบ", en: "Travel cost to meeting point", cn: "前往集合点的交通费", de: "Anreisekosten zum Treffpunkt", fr: "Frais de transport jusqu'au point de rendez-vous", ru: "Транспортные расходы до места встречи", ko: "집합 장소까지의 교통비", ja: "集合場所までの交通費" },
  { th: "ของใช้ส่วนตัว", en: "Personal items", cn: "个人物品", de: "Persönliche Gegenstände", fr: "Effets personnels", ru: "Личные вещи", ko: "개인 물품", ja: "個人用品" },

  // === PORT INFO ===
  { th: "ท่าเรือ:", en: "Port:", cn: "码头：", de: "Hafen:", fr: "Port :", ru: "Порт:", ko: "항구:", ja: "港：" },
  { th: "เช็คอิน:", en: "Check-in:", cn: "入住：", de: "Check-in:", fr: "Enregistrement :", ru: "Заезд:", ko: "체크인:", ja: "チェックイン：" },
  { th: "เช็คเอาท์:", en: "Check-out:", cn: "退房：", de: "Check-out:", fr: "Check-out :", ru: "Выезд:", ko: "체크아웃:", ja: "チェックアウト：" },
  { th: "ท่าเรือรัษฎา (Rassada Pier) ภูเก็ต", en: "Rassada Pier, Phuket", cn: "拉萨达码头，普吉岛", de: "Rassada Pier, Phuket", fr: "Rassada Pier, Phuket", ru: "Причал Рассада, Пхукет", ko: "랏사다 부두, 푸켓", ja: "ラッサダ桟橋、プーケット" },
  { th: "ท่าเรือปากบารา", en: "Pak Bara Pier", cn: "巴巴拉码头", de: "Pak Bara Pier", fr: "Jetée de Pak Bara", ru: "Причал Пак Бара", ko: "빡바라 부두", ja: "パクバラ桟橋" },
  { th: "รถรับจากสนามบินภูเก็ต 18:00-20:00", en: "Airport pickup from Phuket Airport 18:00-20:00", cn: "普吉机场接送 18:00-20:00", de: "Abholung vom Flughafen Phuket 18:00-20:00", fr: "Navette depuis l'aéroport de Phuket 18:00-20:00", ru: "Трансфер из аэропорта Пхукета 18:00-20:00", ko: "푸켓 공항 픽업 18:00-20:00", ja: "プーケット空港お迎え 18:00-20:00" },
  { th: "รถรับจากสนามบินหาดใหญ่ 18:00-20:00", en: "Airport pickup from Hat Yai Airport 18:00-20:00", cn: "合艾机场接送 18:00-20:00", de: "Abholung vom Flughafen Hat Yai 18:00-20:00", fr: "Navette depuis l'aéroport de Hat Yai 18:00-20:00", ru: "Трансфер из аэропорта Хатъяй 18:00-20:00", ko: "핫야이 공항 픽업 18:00-20:00", ja: "ハジャイ空港お迎え 18:00-20:00" },
  { th: "12:00-16:00 ที่ท่าเรือ", en: "12:00-16:00 at the pier", cn: "12:00-16:00 于码头", de: "12:00-16:00 am Hafen", fr: "12:00-16:00 au port", ru: "12:00-16:00 на пирсе", ko: "12:00-16:00 부두에서", ja: "12:00-16:00 桟橋にて" },
  { th: "08:00-09:00 ที่ท่าเรือ", en: "08:00-09:00 at the pier", cn: "08:00-09:00 于码头", de: "08:00-09:00 am Hafen", fr: "08:00-09:00 au port", ru: "08:00-09:00 на пирсе", ko: "08:00-09:00 부두에서", ja: "08:00-09:00 桟橋にて" },
  { th: "19:00-20:00 ที่ท่าเรือ", en: "19:00-20:00 at the pier", cn: "19:00-20:00 于码头", de: "19:00-20:00 am Hafen", fr: "19:00-20:00 au port", ru: "19:00-20:00 на пирсе", ko: "19:00-20:00 부두에서", ja: "19:00-20:00 桟橋にて" },
  { th: "ส่งกลับสนามบิน 09:00 (แนะนำเที่ยวบินหลังเที่ยง)", en: "Airport drop-off 09:00 (recommend flights after noon)", cn: "09:00 送往机场（建议预订午后航班）", de: "Flughafentransfer 09:00 (Flüge nach Mittag empfohlen)", fr: "Transfert à l'aéroport à 09:00 (vols après midi recommandés)", ru: "Трансфер в аэропорт 09:00 (рекомендуем рейсы после полудня)", ko: "공항 이동 09:00 (오후 항공편 권장)", ja: "空港送り 09:00（正午以降のフライト推奨）" },
  { th: "13:00-14:00 กลับถึงท่าเรือ วันสุดท้าย", en: "13:00-14:00 return to pier on last day", cn: "最后一天 13:00-14:00 返回码头", de: "13:00-14:00 Rückkehr zum Hafen am letzten Tag", fr: "13:00-14:00 retour au port le dernier jour", ru: "13:00-14:00 возвращение к пирсу в последний день", ko: "마지막 날 13:00-14:00 부두 도착", ja: "最終日 13:00-14:00 桟橋帰港" },
  { th: "เย็นวันสุดท้าย กลับถึงท่าเรือ", en: "Late afternoon on last day, return to pier", cn: "最后一天傍晚返回码头", de: "Nachmittag am letzten Tag, Rückkehr zum Hafen", fr: "Fin d'après-midi du dernier jour, retour au port", ru: "Вечер последнего дня, возвращение к пирсу", ko: "마지막 날 오후 부두 도착", ja: "最終日夕方、桟橋帰港" },
  { th: "10:00-14:00 วันสุดท้าย", en: "10:00-14:00 on last day", cn: "最后一天 10:00-14:00", de: "10:00-14:00 am letzten Tag", fr: "10:00-14:00 le dernier jour", ru: "10:00-14:00 в последний день", ko: "마지막 날 10:00-14:00", ja: "最終日 10:00-14:00" },

  // === ITINERARY COMMON PHRASES ===
  { th: "18:00-20:00 รถรับจากสนามบินภูเก็ต → ท่าเรือรัษฏา", en: "18:00-20:00 Pickup from Phuket Airport → Rassada Pier", cn: "18:00-20:00 从普吉机场接送 → 拉萨达码头", de: "18:00-20:00 Abholung vom Flughafen Phuket → Rassada Pier", fr: "18:00-20:00 Navette depuis l'aéroport de Phuket → Rassada Pier", ru: "18:00-20:00 Трансфер из аэропорта Пхукета → причал Рассада", ko: "18:00-20:00 푸켓 공항 픽업 → 랏사다 부두", ja: "18:00-20:00 プーケット空港お迎え → ラッサダ桟橋" },
  { th: "18:00-20:00 รถรับจากสนามบินหาดใหญ่ → ท่าเรือปากบารา", en: "18:00-20:00 Pickup from Hat Yai Airport → Pak Bara Pier", cn: "18:00-20:00 从合艾机场接送 → 巴巴拉码头", de: "18:00-20:00 Abholung vom Flughafen Hat Yai → Pak Bara Pier", fr: "18:00-20:00 Navette depuis l'aéroport de Hat Yai → Jetée de Pak Bara", ru: "18:00-20:00 Трансфер из аэропорта Хатъяй → причал Пак Бара", ko: "18:00-20:00 핫야이 공항 픽업 → 빡바라 부두", ja: "18:00-20:00 ハジャイ空港お迎え → パクバラ桟橋" },
  { th: "เช็คอิน จัดอุปกรณ์ รับฟังบรีฟ ทานอาหารเย็นบนเรือ", en: "Check in, set up equipment, attend briefing, dinner on board", cn: "办理入住、整理装备、听取简报、船上晚餐", de: "Einchecken, Ausrüstung vorbereiten, Briefing, Abendessen an Bord", fr: "Enregistrement, préparation de l'équipement, briefing, dîner à bord", ru: "Регистрация, подготовка снаряжения, брифинг, ужин на борту", ko: "체크인, 장비 정리, 브리핑, 선상 저녁 식사", ja: "チェックイン、器材準備、ブリーフィング、船上ディナー" },
  { th: "เรือออกเดินทางมุ่งหน้าหมู่เกาะสิมิลัน (ไม่มีไดฟ์)", en: "Boat departs for Similan Islands (no dives)", cn: "船出发前往斯米兰群岛（不潜水）", de: "Boot fährt zu den Similan-Inseln ab (kein Tauchgang)", fr: "Le bateau part vers les îles Similan (pas de plongée)", ru: "Лодка отправляется к Симиланским островам (без дайвов)", ko: "시밀란 제도로 출항 (다이빙 없음)", ja: "シミラン諸島へ出航（ダイビングなし）" },
  { th: "เรือออกเดินทางมุ่งหน้าหินม่วง-หินแดง (ไม่มีไดฟ์)", en: "Boat departs for Hin Muang-Hin Daeng (no dives)", cn: "船出发前往欣穆昂-欣丹（不潜水）", de: "Boot fährt nach Hin Muang-Hin Daeng ab (kein Tauchgang)", fr: "Le bateau part vers Hin Muang-Hin Daeng (pas de plongée)", ru: "Лодка отправляется к Хин Муанг-Хин Дэнг (без дайвов)", ko: "힌무앙-힌댕으로 출항 (다이빙 없음)", ja: "ヒンムアン・ヒンデーンへ出航（ダイビングなし）" },
  { th: "เรือออกเดินทางมุ่งหน้าเกาะหลีเป๊ะ", en: "Boat departs for Koh Lipe", cn: "船出发前往丽贝岛", de: "Boot fährt nach Koh Lipe ab", fr: "Le bateau part vers Koh Lipe", ru: "Лодка отправляется к острову Липе", ko: "꼬 리뻬로 출항", ja: "リペ島へ出航" },
  { th: "อาหารเช้าบนเรือ", en: "Breakfast on board", cn: "船上早餐", de: "Frühstück an Bord", fr: "Petit-déjeuner à bord", ru: "Завтрак на борту", ko: "선상 아침 식사", ja: "船上で朝食" },
  { th: "เช็คเอาท์ เก็บสัมภาระ", en: "Check out, pack belongings", cn: "退房，整理行李", de: "Auschecken, Gepäck packen", fr: "Check-out, préparation des bagages", ru: "Выселение, сбор вещей", ko: "체크아웃, 짐 정리", ja: "チェックアウト、荷物整理" },
  { th: "รถส่งกลับสนามบินภูเก็ต (แนะนำจองเที่ยวบินหลังเที่ยง)", en: "Transfer to Phuket Airport (recommend booking flights after noon)", cn: "送往普吉机场（建议预订午后航班）", de: "Transfer zum Flughafen Phuket (Flüge nach Mittag empfohlen)", fr: "Transfert à l'aéroport de Phuket (vols après midi recommandés)", ru: "Трансфер в аэропорт Пхукета (рекомендуем рейсы после полудня)", ko: "푸켓 공항까지 이동 (오후 항공편 권장)", ja: "プーケット空港へ送迎（正午以降のフライト推奨）" },
  { th: "รถส่งกลับสนามบินหาดใหญ่ (แนะนำจองเที่ยวบินหลังเที่ยง)", en: "Transfer to Hat Yai Airport (recommend booking flights after noon)", cn: "送往合艾机场（建议预订午后航班）", de: "Transfer zum Flughafen Hat Yai (Flüge nach Mittag empfohlen)", fr: "Transfert à l'aéroport de Hat Yai (vols après midi recommandés)", ru: "Трансфер в аэропорт Хатъяй (рекомендуем рейсы после полудня)", ko: "핫야이 공항까지 이동 (오후 항공편 권장)", ja: "ハジャイ空港へ送迎（正午以降のフライト推奨）" },

  // === ITINERARY RECURRING TEXT (actions/descriptions) ===
  { th: "ไดฟ์", en: "Dive", cn: "潜", de: "Tauchgang", fr: "Plongée", ru: "Дайв", ko: "다이브", ja: "ダイブ" },
  { th: "Night Dive", en: "Night Dive", cn: "夜潜", de: "Nachttauchgang", fr: "Plongée de nuit", ru: "Ночной дайв", ko: "나이트 다이브", ja: "ナイトダイブ" },
  { th: "Sunset Dive", en: "Sunset Dive", cn: "日落潜水", de: "Sonnenuntergangs-Tauchgang", fr: "Plongée au coucher du soleil", ru: "Дайв на закате", ko: "선셋 다이브", ja: "サンセットダイブ" },
  { th: "Farewell Dive", en: "Farewell Dive", cn: "告别潜水", de: "Abschiedstauchgang", fr: "Plongée d'adieu", ru: "Прощальный дайв", ko: "페어웰 다이브", ja: "フェアウェルダイブ" },
  { th: "Morning Dive", en: "Morning Dive", cn: "晨潜", de: "Morgentauchgang", fr: "Plongée matinale", ru: "Утренний дайв", ko: "모닝 다이브", ja: "モーニングダイブ" },
  { th: "Check Dive", en: "Check Dive", cn: "检查潜水", de: "Check Dive", fr: "Plongée de vérification", ru: "Проверочный дайв", ko: "체크 다이브", ja: "チェックダイブ" },
  { th: "Drift Dive", en: "Drift Dive", cn: "放流潜水", de: "Strömungstauchgang", fr: "Plongée dérivante", ru: "Дрифт-дайв", ko: "드리프트 다이브", ja: "ドリフトダイブ" },
  { th: "Sun Set", en: "Sunset", cn: "日落", de: "Sonnenuntergang", fr: "Coucher de soleil", ru: "Закат", ko: "선셋", ja: "サンセット" },

  // === LOCATION/ACTIVITY DESCRIPTIONS ===
  { th: "สวนปะการัง", en: "coral garden", cn: "珊瑚花园", de: "Korallengarten", fr: "jardin de coraux", ru: "коралловый сад", ko: "산호 정원", ja: "コーラルガーデン" },
  { th: "โขดหิน ถ้ำ ปะการังอ่อน", en: "boulders, caves, soft corals", cn: "巨石、洞穴、软珊瑚", de: "Felsen, Höhlen, Weichkorallen", fr: "rochers, grottes, coraux mous", ru: "валуны, пещеры, мягкие кораллы", ko: "바위, 동굴, 연산호", ja: "岩、洞窟、ソフトコーラル" },
  { th: "โขดหิน ถ้ำ", en: "boulders, caves", cn: "巨石、洞穴", de: "Felsen, Höhlen", fr: "rochers, grottes", ru: "валуны, пещеры", ko: "바위, 동굴", ja: "岩、洞窟" },
  { th: "swim-through ฉลาม", en: "swim-throughs, sharks", cn: "洞穴穿越、鲨鱼", de: "Swim-throughs, Haie", fr: "passages, requins", ru: "сквозные проходы, акулы", ko: "스윔스루, 상어", ja: "スイムスルー、サメ" },
  { th: "Swim-through ฉลาม", en: "swim-throughs, sharks", cn: "洞穴穿越、鲨鱼", de: "Swim-throughs, Haie", fr: "passages, requins", ru: "сквозные проходы, акулы", ko: "스윔스루, 상어", ja: "スイムスルー、サメ" },
  { th: "แวะขึ้นเกาะหินเรือใบ ถ่ายรูปพระอาทิตย์ตก", en: "Visit Sail Rock Island for sunset photos", cn: "登上帆船岩拍摄日落", de: "Besuch der Sail Rock Insel für Sonnenuntergangsfotos", fr: "Visite de Sail Rock pour photos au coucher du soleil", ru: "Посещение Сейл Рок для фото заката", ko: "세일 록 섬에서 일몰 사진 촬영", ja: "セイルロック島で夕日写真撮影" },
  { th: "แวะขึ้นเกาะหินเรือใบ ถ่ายรูป ชมพระอาทิตย์ตก", en: "Visit Sail Rock Island for photos and sunset viewing", cn: "登上帆船岩拍照、观赏日落", de: "Besuch der Sail Rock Insel, Fotos und Sonnenuntergang", fr: "Visite de Sail Rock, photos et coucher de soleil", ru: "Посещение Сейл Рок, фото и закат", ko: "세일 록 섬 방문, 사진 촬영 및 일몰 감상", ja: "セイルロック島訪問、写真撮影と夕日鑑賞" },
  { th: "เยี่ยมชมหมู่บ้านชนเผามอแกน", en: "visit Moken sea gypsy village", cn: "参观莫肯海上游牧民族村", de: "Besuch des Moken Seenomaden-Dorfs", fr: "visite du village des Moken, nomades de la mer", ru: "посещение деревни морских цыган Мокен", ko: "모켄 해양 유목민 마을 방문", ja: "モーケン族の海の遊牧民の村を訪問" },
  { th: "เรือเดินทางกลับภูเก็ตระหว่างคืน", en: "Boat returns to Phuket overnight", cn: "夜间返回普吉岛", de: "Boot fährt über Nacht zurück nach Phuket", fr: "Le bateau retourne à Phuket pendant la nuit", ru: "Лодка возвращается в Пхукет ночью", ko: "야간 푸켓 귀항", ja: "夜間プーケットへ帰港" },
  { th: "เรือเดินทางไปเกาะห้าระหว่างคืน", en: "Boat heads to Koh Haa overnight", cn: "夜间前往五岛", de: "Boot fährt über Nacht nach Koh Haa", fr: "Le bateau navigue vers Koh Haa pendant la nuit", ru: "Лодка направляется к Ко Хаа ночью", ko: "야간 꼬하 이동", ja: "夜間コハーへ移動" },
  { th: "เรือเดินทางไปหินแดงระหว่างคืน", en: "Boat heads to Hin Daeng overnight", cn: "夜间前往欣丹", de: "Boot fährt über Nacht nach Hin Daeng", fr: "Le bateau navigue vers Hin Daeng pendant la nuit", ru: "Лодка направляется к Хин Дэнг ночью", ko: "야간 힌댕 이동", ja: "夜間ヒンデーンへ移動" },
  { th: "เรือเดินทางไปหินแดง-หินม่วงระหว่างคืน", en: "Boat heads to Hin Daeng-Hin Muang overnight", cn: "夜间前往欣丹-欣穆昂", de: "Boot fährt über Nacht nach Hin Daeng-Hin Muang", fr: "Le bateau navigue vers Hin Daeng-Hin Muang pendant la nuit", ru: "Лодка направляется к Хин Дэнг-Хин Муанг ночью", ko: "야간 힌댕-힌무앙 이동", ja: "夜間ヒンデーン・ヒンムアンへ移動" },
  { th: "เรือเดินทางไปเกาะพีพีระหว่างคืน", en: "Boat heads to Phi Phi Islands overnight", cn: "夜间前往皮皮岛", de: "Boot fährt über Nacht zu den Phi Phi Inseln", fr: "Le bateau navigue vers les îles Phi Phi pendant la nuit", ru: "Лодка направляется к островам Пхи-Пхи ночью", ko: "야간 피피 섬 이동", ja: "夜間ピピ島へ移動" },
  { th: "เรือเดินทางไปเกาะหลีเป๊ะระหว่างคืน", en: "Boat heads to Koh Lipe overnight", cn: "夜间前往丽贝岛", de: "Boot fährt über Nacht nach Koh Lipe", fr: "Le bateau navigue vers Koh Lipe pendant la nuit", ru: "Лодка направляется к острову Липе ночью", ko: "야간 꼬 리뻬 이동", ja: "夜間リペ島へ移動" },
  { th: "เรือเดินทางลงใต้ไปเกาะห้าระหว่างคืน", en: "Boat heads south to Koh Haa overnight", cn: "夜间南下前往五岛", de: "Boot fährt über Nacht südlich nach Koh Haa", fr: "Le bateau navigue vers le sud en direction de Koh Haa pendant la nuit", ru: "Лодка направляется на юг к Ко Хаа ночью", ko: "야간 남쪽 꼬하로 이동", ja: "夜間南下してコハーへ移動" },
  { th: "เรือเดินทางต่อไปเกาะหลีเป๊ะ", en: "Boat continues to Koh Lipe", cn: "船继续前往丽贝岛", de: "Boot fährt weiter nach Koh Lipe", fr: "Le bateau continue vers Koh Lipe", ru: "Лодка продолжает путь к Ко Липе", ko: "꼬 리뻬로 계속 이동", ja: "リペ島へ続行" },
  { th: "เรือเดินทางลงใต้ระหว่างคืน", en: "Boat heads south overnight", cn: "夜间南下", de: "Boot fährt über Nacht nach Süden", fr: "Le bateau navigue vers le sud pendant la nuit", ru: "Лодка направляется на юг ночью", ko: "야간 남쪽 이동", ja: "夜間南下" },
  { th: "เรือเดินทางกลับภูเก็ต", en: "Boat returns to Phuket", cn: "返回普吉岛", de: "Boot kehrt nach Phuket zurück", fr: "Le bateau retourne à Phuket", ru: "Лодка возвращается в Пхукет", ko: "푸켓으로 귀항", ja: "プーケットへ帰港" },
  { th: "เดินทางกลับท่าเรือ", en: "Return to pier", cn: "返回码头", de: "Rückkehr zum Hafen", fr: "Retour au port", ru: "Возвращение к пирсу", ko: "부두로 귀항", ja: "桟橋へ帰港" },
  { th: "อาหารกลางวัน พักผ่อน", en: "Lunch, rest", cn: "午餐、休息", de: "Mittagessen, Pause", fr: "Déjeuner, repos", ru: "Обед, отдых", ko: "점심, 휴식", ja: "昼食、休憩" },
  { th: "อาหารเช้า พักผ่อน", en: "Breakfast, rest", cn: "早餐、休息", de: "Frühstück, Pause", fr: "Petit-déjeuner, repos", ru: "Завтрак, отдых", ko: "아침, 휴식", ja: "朝食、休憩" },
  { th: "ทานอาหารเย็น", en: "Dinner", cn: "晚餐", de: "Abendessen", fr: "Dîner", ru: "Ужин", ko: "저녁 식사", ja: "夕食" },
  { th: "ถ่ายรูปพระอาทิตย์ตก", en: "sunset photos", cn: "拍摄日落", de: "Sonnenuntergangsfotos", fr: "photos au coucher du soleil", ru: "фото заката", ko: "일몰 사진 촬영", ja: "夕日写真撮影" },
  { th: "ชมพระอาทิตย์ตก", en: "watch the sunset", cn: "观赏日落", de: "Sonnenuntergang beobachten", fr: "admirer le coucher de soleil", ru: "полюбоваться закатом", ko: "일몰 감상", ja: "夕日鑑賞" },

  // === DIVE SITE DESCRIPTIONS (used in parentheses) ===
  { th: "ม้าน้ำ ฉลามวาฬ", en: "seahorses, whale sharks", cn: "海马、鲸鲨", de: "Seepferdchen, Walhaie", fr: "hippocampes, requins-baleines", ru: "морские коньки, китовые акулы", ko: "해마, 고래상어", ja: "タツノオトシゴ、ジンベエザメ" },
  { th: "ลุ้น Manta Ray", en: "chance to spot Manta Ray", cn: "有机会遇到蝠鲼", de: "Chance auf Manta Ray", fr: "possibilité de voir des raies manta", ru: "шанс встретить манту", ko: "만타레이를 만날 기회", ja: "マンタレイに出会えるチャンス" },
  { th: "ลุ้น Manta", en: "chance to spot Manta", cn: "有机会遇到蝠鲼", de: "Chance auf Manta", fr: "possibilité de voir des mantas", ru: "шанс встретить манту", ko: "만타를 만날 기회", ja: "マンタに出会えるチャンス" },
  { th: "ฝูงปลา Barracuda", en: "barracuda schools", cn: "梭鱼群", de: "Barrakudaschwärme", fr: "bancs de barracudas", ru: "стаи барракуд", ko: "바라쿠다 떼", ja: "バラクーダの群れ" },
  { th: "ปะการังอ่อนสีม่วง ฉลาม", en: "purple soft corals, sharks", cn: "紫色软珊瑚、鲨鱼", de: "lila Weichkorallen, Haie", fr: "coraux mous violets, requins", ru: "фиолетовые мягкие кораллы, акулы", ko: "보라색 연산호, 상어", ja: "紫のソフトコーラル、サメ" },
  { th: "ปะการังอ่อนสีม่วง", en: "purple soft corals", cn: "紫色软珊瑚", de: "lila Weichkorallen", fr: "coraux mous violets", ru: "фиолетовые мягкие кораллы", ko: "보라색 연산호", ja: "紫のソフトコーラル" },
  { th: "ปะการังอ่อน ฝูงปลา", en: "soft corals, schooling fish", cn: "软珊瑚、鱼群", de: "Weichkorallen, Fischschwärme", fr: "coraux mous, bancs de poissons", ru: "мягкие кораллы, стаи рыб", ko: "연산호, 물고기 떼", ja: "ソフトコーラル、群れる魚" },
  { th: "ปะการังอ่อน พัดทะเล", en: "soft corals, sea fans", cn: "软珊瑚、海扇", de: "Weichkorallen, Seefächer", fr: "coraux mous, gorgones", ru: "мягкие кораллы, морские веера", ko: "연산호, 해선", ja: "ソフトコーラル、ウミウチワ" },
  { th: "ปะการังอ่อนสีแดง", en: "red soft corals", cn: "红色软珊瑚", de: "rote Weichkorallen", fr: "coraux mous rouges", ru: "красные мягкие кораллы", ko: "붉은 연산호", ja: "赤いソフトコーラル" },
  { th: "ปะการังอ่อน ปลาการ์ตูน", en: "soft corals, clownfish", cn: "软珊瑚、小丑鱼", de: "Weichkorallen, Clownfische", fr: "coraux mous, poissons-clowns", ru: "мягкие кораллы, рыбы-клоуны", ko: "연산호, 흰동가리", ja: "ソフトコーラル、カクレクマノミ" },
  { th: "ปะการังอ่อนสีสด", en: "vibrant soft corals", cn: "色彩鲜艳的软珊瑚", de: "farbenfrohe Weichkorallen", fr: "coraux mous aux couleurs vives", ru: "яркие мягкие кораллы", ko: "선명한 연산호", ja: "鮮やかなソフトコーラル" },
  { th: "ปะการังแข็ง น้ำตื้นสวย", en: "hard corals, beautiful shallow waters", cn: "硬珊瑚、浅水区优美", de: "Hartkorallen, schöne Flachwasserbereiche", fr: "coraux durs, magnifiques eaux peu profondes", ru: "твёрдые кораллы, красивое мелководье", ko: "경산호, 아름다운 얕은 바다", ja: "ハードコーラル、美しい浅瀬" },
  { th: "ปะการังแข็งสมบูรณ์", en: "pristine hard corals", cn: "完好的硬珊瑚", de: "unberührte Hartkorallen", fr: "coraux durs préservés", ru: "нетронутые твёрдые кораллы", ko: "건강한 경산호", ja: "手つかずのハードコーラル" },
  { th: "ปะการังสมบูรณ์ สัตว์ทะเลหลากหลาย", en: "pristine corals, diverse marine life", cn: "珊瑚完好、海洋生物多样", de: "unberührte Korallen, vielfältiges Meeresleben", fr: "coraux préservés, vie marine diversifiée", ru: "нетронутые кораллы, разнообразная морская жизнь", ko: "건강한 산호, 다양한 해양 생물", ja: "手つかずのサンゴ、豊かな海洋生物" },
  { th: "ผนังดิ่ง", en: "vertical wall", cn: "垂直岩壁", de: "Steilwand", fr: "paroi verticale", ru: "вертикальная стена", ko: "수직 절벽", ja: "垂直の壁" },
  { th: "ผนัง กระแสน้ำ ปลาใหญ่", en: "wall, currents, big fish", cn: "岩壁、水流、大鱼", de: "Wand, Strömungen, Großfische", fr: "paroi, courants, gros poissons", ru: "стена, течения, крупная рыба", ko: "절벽, 해류, 대형 물고기", ja: "壁、潮流、大物" },
  { th: "ผนัง กระแสน้ำ ลุ้นปลาใหญ่", en: "wall, currents, chance to spot big fish", cn: "岩壁、水流、有机会遇到大鱼", de: "Wand, Strömungen, Chance auf Großfische", fr: "paroi, courants, possibilité de gros poissons", ru: "стена, течения, шанс на крупную рыбу", ko: "절벽, 해류, 대형 물고기를 만날 기회", ja: "壁、潮流、大物に出会えるチャンス" },
  { th: "ผนัง ฉลามเสือดาว", en: "wall, leopard sharks", cn: "岩壁、豹纹鲨", de: "Wand, Leopardenhaie", fr: "paroi, requins-léopards", ru: "стена, леопардовые акулы", ko: "절벽, 레오파드 상어", ja: "壁、トラフザメ" },
  { th: "ฉลามเสือดาว เต่าทะเล", en: "leopard sharks, sea turtles", cn: "豹纹鲨、海龟", de: "Leopardenhaie, Meeresschildkröten", fr: "requins-léopards, tortues de mer", ru: "леопардовые акулы, морские черепахи", ko: "레오파드 상어, 바다거북", ja: "トラフザメ、ウミガメ" },
  { th: "ฉลามเสือดาว (Leopard Shark)", en: "leopard sharks", cn: "豹纹鲨", de: "Leopardenhaie", fr: "requins-léopards", ru: "леопардовые акулы", ko: "레오파드 상어", ja: "トラフザメ" },
  { th: "ฉลามเสือดาว ผนัง", en: "leopard sharks, wall", cn: "豹纹鲨、岩壁", de: "Leopardenhaie, Wand", fr: "requins-léopards, paroi", ru: "леопардовые акулы, стена", ko: "레오파드 상어, 절벽", ja: "トラフザメ、壁" },
  { th: "ฉลามเสือดาว", en: "leopard sharks", cn: "豹纹鲨", de: "Leopardenhaie", fr: "requins-léopards", ru: "леопардовые акулы", ko: "레오파드 상어", ja: "トラフザメ" },
  { th: "ฉลาม กระเบน", en: "sharks, rays", cn: "鲨鱼、魟鱼", de: "Haie, Rochen", fr: "requins, raies", ru: "акулы, скаты", ko: "상어, 가오리", ja: "サメ、エイ" },
  { th: "ฉลามครีบเทา", en: "grey reef sharks", cn: "灰礁鲨", de: "Grauhaie", fr: "requins gris de récif", ru: "серые рифовые акулы", ko: "회색 산호상어", ja: "オグロメジロザメ" },
  { th: "ฉลามนอน", en: "sleeping sharks", cn: "睡鲨", de: "schlafende Haie", fr: "requins endormis", ru: "спящие акулы", ko: "잠자는 상어", ja: "寝ているサメ" },
  { th: "ฉลามหูดำ", en: "blacktip reef sharks", cn: "黑鳍礁鲨", de: "Schwarzspitzen-Riffhaie", fr: "requins à pointes noires", ru: "черноперые рифовые акулы", ko: "블랙팁 리프 상어", ja: "ツマグロ" },
  { th: "ฉลามวาฬ", en: "whale sharks", cn: "鲸鲨", de: "Walhaie", fr: "requins-baleines", ru: "китовые акулы", ko: "고래상어", ja: "ジンベエザメ" },
  { th: "เต่า กระเบน", en: "turtles, rays", cn: "海龟、魟鱼", de: "Schildkröten, Rochen", fr: "tortues, raies", ru: "черепахи, скаты", ko: "거북이, 가오리", ja: "ウミガメ、エイ" },
  { th: "เต่าทะเล", en: "sea turtles", cn: "海龟", de: "Meeresschildkröten", fr: "tortues de mer", ru: "морские черепахи", ko: "바다거북", ja: "ウミガメ" },
  { th: "ถ้ำ Swim-through", en: "caves, swim-throughs", cn: "洞穴、穿越通道", de: "Höhlen, Swim-throughs", fr: "grottes, passages", ru: "пещеры, сквозные проходы", ko: "동굴, 스윔스루", ja: "洞窟、スイムスルー" },
  { th: "ถ้ำใหญ่ เต่า กระเบน", en: "large cave, turtles, rays", cn: "大洞穴、海龟、魟鱼", de: "große Höhle, Schildkröten, Rochen", fr: "grande grotte, tortues, raies", ru: "большая пещера, черепахи, скаты", ko: "큰 동굴, 거북이, 가오리", ja: "大きな洞窟、ウミガメ、エイ" },
  { th: "ถ้ำ ลากูน", en: "cave, lagoon", cn: "洞穴、泻湖", de: "Höhle, Lagune", fr: "grotte, lagon", ru: "пещера, лагуна", ko: "동굴, 라군", ja: "洞窟、ラグーン" },
  { th: "ซากเรือจม สัตว์ทะเล", en: "shipwreck, marine life", cn: "沉船、海洋生物", de: "Schiffswrack, Meeresleben", fr: "épave, vie marine", ru: "затонувший корабль, морская жизнь", ko: "난파선, 해양 생물", ja: "沈没船、海洋生物" },
  { th: "ซากเรือ ฝูงปลา", en: "wreck, schooling fish", cn: "沉船、鱼群", de: "Wrack, Fischschwärme", fr: "épave, bancs de poissons", ru: "обломки корабля, стаи рыб", ko: "난파선, 물고기 떼", ja: "沈没船、群れる魚" },
  { th: "ซากเรือ 32m", en: "32m wreck", cn: "32米沉船", de: "32m Wrack", fr: "épave de 32m", ru: "обломки на 32м", ko: "32m 난파선", ja: "32m沈没船" },
  { th: "ฝูงปลา ปะการังอ่อน ปลาการ์ตูน", en: "schooling fish, soft corals, clownfish", cn: "鱼群、软珊瑚、小丑鱼", de: "Fischschwärme, Weichkorallen, Clownfische", fr: "bancs de poissons, coraux mous, poissons-clowns", ru: "стаи рыб, мягкие кораллы, рыбы-клоуны", ko: "물고기 떼, 연산호, 흰동가리", ja: "群れる魚、ソフトコーラル、カクレクマノミ" },
  { th: "ฝูงปลา Marco", en: "schooling fish, macro", cn: "鱼群、微距", de: "Fischschwärme, Makro", fr: "bancs de poissons, macro", ru: "стаи рыб, макро", ko: "물고기 떼, 마크로", ja: "群れる魚、マクロ" },
  { th: "แนวปะการัง รูปปั้นใต้น้ำ", en: "coral reefs, underwater statues", cn: "珊瑚礁、水下雕像", de: "Korallenriff, Unterwasserstatuen", fr: "récifs coralliens, statues sous-marines", ru: "коралловые рифы, подводные статуи", ko: "산호초, 수중 조각상", ja: "サンゴ礁、水中彫像" },
  { th: "รูปปั้นใต้น้ำ", en: "underwater statues", cn: "水下雕像", de: "Unterwasserstatuen", fr: "statues sous-marines", ru: "подводные статуи", ko: "수중 조각상", ja: "水中彫像" },
  { th: "กระแสน้ำ ปะการังแข็ง", en: "currents, hard corals", cn: "水流、硬珊瑚", de: "Strömungen, Hartkorallen", fr: "courants, coraux durs", ru: "течения, твёрдые кораллы", ko: "해류, 경산호", ja: "潮流、ハードコーラル" },
  { th: "Macro, Nudibranch", en: "macro, nudibranchs", cn: "微距、海蛞蝓", de: "Makro, Nacktschnecken", fr: "macro, nudibranches", ru: "макро, голожаберники", ko: "마크로, 갯민숭달팽이", ja: "マクロ、ウミウシ" },
  { th: "Nudi ปลากบ", en: "nudibranchs, frogfish", cn: "海蛞蝓、石头鱼", de: "Nacktschnecken, Anglerfische", fr: "nudibranches, poissons grenouilles", ru: "голожаберники, рыба-лягушка", ko: "갯민숭달팽이, 프로그피시", ja: "ウミウシ、カエルアンコウ" },
  { th: "ซุ้มหินปะการัง เกาะอาดัง", en: "coral stone arches, Koh Adang", cn: "珊瑚石拱门、阿当岛", de: "Korallensteintore, Koh Adang", fr: "arches de corail, Koh Adang", ru: "коралловые арки, остров Аданг", ko: "산호 석문, 꼬 아당", ja: "サンゴの石門、コアダン島" },
  { th: "ปะการังสมบูรณ์", en: "pristine corals", cn: "珊瑚完好", de: "unberührte Korallen", fr: "coraux préservés", ru: "нетронутые кораллы", ko: "건강한 산호", ja: "手つかずのサンゴ" },
  { th: "ปะการังอ่อน หลากสี", en: "colorful soft corals", cn: "色彩斑斓的软珊瑚", de: "bunte Weichkorallen", fr: "coraux mous multicolores", ru: "разноцветные мягкие кораллы", ko: "다채로운 연산호", ja: "色とりどりのソフトコーラル" },
  { th: "ปะการังสีขาว", en: "white coral", cn: "白色珊瑚", de: "weiße Korallen", fr: "corail blanc", ru: "белые кораллы", ko: "흰 산호", ja: "白いサンゴ" },
  { th: "ชีวิตกลางคืน", en: "nocturnal marine life", cn: "夜间海洋生物", de: "nachtaktives Meeresleben", fr: "vie marine nocturne", ru: "ночная морская жизнь", ko: "야행성 해양 생물", ja: "夜行性の海洋生物" },
  { th: "ปะการังอ่อน", en: "soft corals", cn: "软珊瑚", de: "Weichkorallen", fr: "coraux mous", ru: "мягкие кораллы", ko: "연산호", ja: "ソフトコーラル" },
  { th: "ฝูงปลา", en: "schooling fish", cn: "鱼群", de: "Fischschwärme", fr: "bancs de poissons", ru: "стаи рыб", ko: "물고기 떼", ja: "群れる魚" },

  // === SPECIFIC LOCATION DESCRIPTIONS ===
  { th: "หินใต้น้ำกลางทะเลลึก ลุ้นพบฉลามวาฬและปลาใหญ่", en: "deep-sea underwater pinnacle with chances to spot whale sharks and big fish", cn: "深海水下尖塔，有机会遇到鲸鲨和大鱼", de: "Unterwasser-Felsnadel im offenen Meer mit Chance auf Walhaie und Großfische", fr: "pinacle sous-marin en haute mer, possibilité d'observer des requins-baleines et gros poissons", ru: "подводная скала в глубоком море с шансом на китовых акул и крупную рыбу", ko: "심해 수중 피나클, 고래상어와 대형 물고기를 만날 기회", ja: "大海原の水中ピナクル、ジンベエザメや大物に出会えるチャンス" },
  { th: "ซุ้มหินปะการังใต้น้ำใกล้เกาะอาดัง สวยงามแปลกตา", en: "unique underwater coral stone arches near Koh Adang, strikingly beautiful", cn: "阿当岛附近独特的水下珊瑚石拱门，景色壮观", de: "einzigartige Korallensteintore unter Wasser nahe Koh Adang, atemberaubend schön", fr: "arches de corail sous-marines uniques près de Koh Adang, d'une beauté saisissante", ru: "уникальные подводные коралловые арки возле острова Аданг, поразительная красота", ko: "꼬 아당 근처의 독특한 수중 산호 석문, 놀라운 아름다움", ja: "コアダン島近くの独特な水中サンゴの石門、息をのむ美しさ" },
  { th: "น้ำทะเลใส ปะการังสมบูรณ์ สัตว์ทะเลหลากหลาย", en: "crystal-clear sea, pristine corals, diverse marine life", cn: "清澈海水、完好珊瑚、多样海洋生物", de: "kristallklares Meer, unberührte Korallen, vielfältiges Meeresleben", fr: "mer cristalline, coraux préservés, vie marine diversifiée", ru: "кристально чистое море, нетронутые кораллы, разнообразная морская жизнь", ko: "맑은 바다, 건강한 산호, 다양한 해양 생물", ja: "透き通った海、手つかずのサンゴ、豊かな海洋生物" },
  { th: "แวะระหว่างทาง ลุ้นกระเบนราหู", en: "stop along the way, chance to spot manta rays", cn: "途中停靠，有机会遇到蝠鲼", de: "Zwischenstopp, Chance auf Mantarochen", fr: "arrêt en chemin, possibilité de voir des raies manta", ru: "остановка по пути, шанс встретить мант", ko: "중간 기착, 만타레이를 만날 기회", ja: "途中立ち寄り、マンタレイに出会えるチャンス" },
  { th: "ธรรมชาติบริสุทธิ์ ไม่พลุกพล่าน", en: "pristine nature, uncrowded", cn: "原始自然、人少清静", de: "unberührte Natur, nicht überlaufen", fr: "nature préservée, peu fréquenté", ru: "нетронутая природа, немноголюдно", ko: "청정 자연, 한적한 환경", ja: "手つかずの自然、混雑なし" },
  { th: "Manta Ray Cleaning Station", en: "Manta Ray Cleaning Station", cn: "蝠鲼清洁站", de: "Manta-Putzstation", fr: "Station de nettoyage des Manta Ray", ru: "Станция очистки мант", ko: "만타레이 클리닝 스테이션", ja: "マンタレイのクリーニングステーション" },
  { th: "Cathedral Cave ถ้ำใต้น้ำสวยงาม Lagoon น้ำใส", en: "Cathedral Cave, stunning underwater cave, crystal-clear lagoon", cn: "大教堂洞穴，壮观水下洞穴，清澈泻湖", de: "Cathedral Cave, atemberaubende Unterwasserhöhle, kristallklare Lagune", fr: "Cathedral Cave, grotte sous-marine magnifique, lagon cristallin", ru: "Кафедральная пещера, великолепная подводная пещера, кристально чистая лагуна", ko: "대성당 동굴, 아름다운 수중 동굴, 맑은 라군", ja: "カテドラルケーブ、美しい水中洞窟、透き通ったラグーン" },
  { th: "Cathedral Cave ถ้ำใต้น้ำ", en: "Cathedral Cave, underwater cave", cn: "大教堂洞穴、水下洞穴", de: "Cathedral Cave, Unterwasserhöhle", fr: "Cathedral Cave, grotte sous-marine", ru: "Кафедральная пещера, подводная пещера", ko: "대성당 동굴, 수중 동굴", ja: "カテドラルケーブ、水中洞窟" },
  { th: "Cathedral Cave, Lagoon Wall", en: "Cathedral Cave, Lagoon Wall", cn: "大教堂洞穴、泻湖墙", de: "Cathedral Cave, Lagoon Wall", fr: "Cathedral Cave, Lagoon Wall", ru: "Cathedral Cave, Lagoon Wall", ko: "대성당 동굴, 라군 월", ja: "カテドラルケーブ、ラグーンウォール" },
  { th: "Bida Nok &amp; Bida Nai เต่าทะเล ฉลามหูดำ", en: "Bida Nok & Bida Nai, sea turtles, blacktip reef sharks", cn: "毕达诺和毕达奈、海龟、黑鳍礁鲨", de: "Bida Nok & Bida Nai, Meeresschildkröten, Schwarzspitzen-Riffhaie", fr: "Bida Nok & Bida Nai, tortues de mer, requins à pointes noires", ru: "Бида Нок и Бида Най, морские черепахи, черноперые рифовые акулы", ko: "비다 녹 & 비다 나이, 바다거북, 블랙팁 리프 상어", ja: "ビダノック＆ビダナイ、ウミガメ、ツマグロ" },
  { th: "ผนังดิ่ง ฉลามเสือดาว เต่าทะเล Swim-through", en: "vertical wall, leopard sharks, sea turtles, swim-throughs", cn: "垂直岩壁、豹纹鲨、海龟、穿越通道", de: "Steilwand, Leopardenhaie, Meeresschildkröten, Swim-throughs", fr: "paroi verticale, requins-léopards, tortues de mer, passages", ru: "вертикальная стена, леопардовые акулы, морские черепахи, сквозные проходы", ko: "수직 절벽, 레오파드 상어, 바다거북, 스윔스루", ja: "垂直の壁、トラフザメ、ウミガメ、スイムスルー" },
  { th: "เหมาะสำหรับทุกระดับ", en: "suitable for all levels", cn: "适合所有级别", de: "für alle Erfahrungsstufen geeignet", fr: "convient à tous les niveaux", ru: "подходит для всех уровней", ko: "모든 레벨에 적합", ja: "全レベル対応" },
  { th: "ตั้งแต่ Open Water ขึ้นไป", en: "from Open Water and above", cn: "从OW级别以上", de: "ab Open Water und höher", fr: "à partir du niveau Open Water", ru: "от Open Water и выше", ko: "오픈 워터 이상", ja: "オープンウォーター以上" },
  { th: "เหมาะสำหรับผู้มีเวลาจำกัดหรือเป็นทริปเสริม", en: "ideal for those with limited time or as an add-on trip", cn: "适合时间有限的人或作为附加行程", de: "ideal für Gäste mit begrenzter Zeit oder als Zusatztour", fr: "idéal pour ceux qui ont peu de temps ou en complément", ru: "идеально для тех, у кого мало времени, или как дополнительная поездка", ko: "시간이 제한된 분이나 추가 여행으로 적합", ja: "時間が限られた方や追加トリップに最適" },
  { th: "ดำซ้ำ ลุ้น Manta", en: "repeat dive, chance to spot Manta", cn: "重复潜水、有机会遇到蝠鲼", de: "Wiederholungstauchgang, Chance auf Manta", fr: "plongée répétée, possibilité de voir des mantas", ru: "повторный дайв, шанс встретить манту", ko: "반복 다이빙, 만타를 만날 기회", ja: "リピートダイブ、マンタに出会えるチャンス" },
  { th: "หินกลางทะเลลึก ลุ้นฉลามวาฬ", en: "deep-sea pinnacle, chance to spot whale sharks", cn: "深海石礁、有机会遇到鲸鲨", de: "Felsnadel im offenen Meer, Chance auf Walhaie", fr: "pinacle en haute mer, possibilité de requins-baleines", ru: "скала в глубоком море, шанс на китовых акул", ko: "심해 피나클, 고래상어를 만날 기회", ja: "大海原のピナクル、ジンベエザメに出会えるチャンス" },

  // === CHECK-IN / CHECK-OUT PHRASES ===
  { th: "19:00-20:00 เช็คอินที่ท่าเรืออรัษฏา จัดอุปกรณ์ บรีฟ", en: "19:00-20:00 Check in at Rassada Pier, set up equipment, briefing", cn: "19:00-20:00 在拉萨达码头办理入住、整理装备、简报", de: "19:00-20:00 Einchecken am Rassada Pier, Ausrüstung vorbereiten, Briefing", fr: "19:00-20:00 Enregistrement à Rassada Pier, préparation de l'équipement, briefing", ru: "19:00-20:00 Регистрация на причале Рассада, подготовка снаряжения, брифинг", ko: "19:00-20:00 랏사다 부두 체크인, 장비 정리, 브리핑", ja: "19:00-20:00 ラッサダ桟橋チェックイン、器材準備、ブリーフィング" },
  { th: "19:00-20:00 เช็คอินที่ท่าเรือรัษฏา จัดอุปกรณ์ บรีฟ", en: "19:00-20:00 Check in at Rassada Pier, set up equipment, briefing", cn: "19:00-20:00 在拉萨达码头办理入住、整理装备、简报", de: "19:00-20:00 Einchecken am Rassada Pier, Ausrüstung vorbereiten, Briefing", fr: "19:00-20:00 Enregistrement à Rassada Pier, préparation de l'équipement, briefing", ru: "19:00-20:00 Регистрация на причале Рассада, подготовка снаряжения, брифинг", ko: "19:00-20:00 랏사다 부두 체크인, 장비 정리, 브리핑", ja: "19:00-20:00 ラッサダ桟橋チェックイン、器材準備、ブリーフィング" },
  { th: "เรือออกมุ่งหน้าเกาะราชาน้อย", en: "Boat departs for Racha Noi Island", cn: "船出发前往拉差诺伊岛", de: "Boot fährt nach Racha Noi", fr: "Le bateau part vers Racha Noi", ru: "Лодка отправляется к Рача Ной", ko: "라차노이 섬으로 출항", ja: "ラチャノイ島へ出航" },
  { th: "12:00-16:00 เช็คอินที่ท่าเรืออ่าวฉลอง จัดอุปกรณ์ บรีฟ", en: "12:00-16:00 Check in at Chalong Pier, set up equipment, briefing", cn: "12:00-16:00 在查龙码头办理入住、整理装备、简报", de: "12:00-16:00 Einchecken am Chalong Pier, Ausrüstung vorbereiten, Briefing", fr: "12:00-16:00 Enregistrement à Chalong Pier, préparation de l'équipement, briefing", ru: "12:00-16:00 Регистрация на причале Чалонг, подготовка снаряжения, брифинг", ko: "12:00-16:00 차롱 부두 체크인, 장비 정리, 브리핑", ja: "12:00-16:00 チャロン桟橋チェックイン、器材準備、ブリーフィング" },
  { th: "เรือออกมุ่งหน้าเกาะพีพี", en: "Boat departs for Phi Phi Islands", cn: "船出发前往皮皮岛", de: "Boot fährt zu den Phi Phi Inseln", fr: "Le bateau part vers les îles Phi Phi", ru: "Лодка отправляется к островам Пхи-Пхи", ko: "피피 섬으로 출항", ja: "ピピ島へ出航" },
  { th: "08:00-09:00 เช็คอินที่ท่าเรืออ่าวฉลอง", en: "08:00-09:00 Check in at Chalong Pier", cn: "08:00-09:00 在查龙码头办理入住", de: "08:00-09:00 Einchecken am Chalong Pier", fr: "08:00-09:00 Enregistrement à Chalong Pier", ru: "08:00-09:00 Регистрация на причале Чалонг", ko: "08:00-09:00 차롱 부두 체크인", ja: "08:00-09:00 チャロン桟橋チェックイン" },
  { th: "เรือออกมุ่งหน้าเกาะห้า", en: "Boat departs for Koh Haa", cn: "船出发前往五岛", de: "Boot fährt nach Koh Haa", fr: "Le bateau part vers Koh Haa", ru: "Лодка отправляется к Ко Хаа", ko: "꼬하로 출항", ja: "コハーへ出航" },
  { th: "เช้า เช็คอินที่ท่าเรืออ่าวฉลอง จัดอุปกรณ์ บรีฟ", en: "Morning check in at Chalong Pier, set up equipment, briefing", cn: "上午在查龙码头办理入住、整理装备、简报", de: "Morgens Einchecken am Chalong Pier, Ausrüstung vorbereiten, Briefing", fr: "Enregistrement le matin à Chalong Pier, préparation de l'équipement, briefing", ru: "Утренняя регистрация на причале Чалонг, подготовка снаряжения, брифинг", ko: "오전 차롱 부두 체크인, 장비 정리, 브리핑", ja: "午前中チャロン桟橋チェックイン、器材準備、ブリーフィング" },
  { th: "ส่งกลับสนามบินภูเก็ต", en: "transfer to Phuket Airport", cn: "送往普吉机场", de: "Transfer zum Flughafen Phuket", fr: "transfert à l'aéroport de Phuket", ru: "трансфер в аэропорт Пхукета", ko: "푸켓 공항으로 이동", ja: "プーケット空港へ送迎" },
  { th: "ส่งกลับสนามบิน", en: "transfer to airport", cn: "送往机场", de: "Transfer zum Flughafen", fr: "transfert à l'aéroport", ru: "трансфер в аэропорт", ko: "공항으로 이동", ja: "空港へ送迎" },
  { th: "ถึงท่าเรือรัษฏา", en: "arrive at Rassada Pier", cn: "到达拉萨达码头", de: "Ankunft am Rassada Pier", fr: "arrivée à Rassada Pier", ru: "прибытие к причалу Рассада", ko: "랏사다 부두 도착", ja: "ラッサダ桟橋到着" },
  { th: "ถึงท่าเรืออ่าวฉลอง เช็คเอาท์", en: "arrive at Chalong Pier, check out", cn: "到达查龙码头，退房", de: "Ankunft am Chalong Pier, Auschecken", fr: "arrivée à Chalong Pier, check-out", ru: "прибытие к причалу Чалонг, выселение", ko: "차롱 부두 도착, 체크아웃", ja: "チャロン桟橋到着、チェックアウト" },
  { th: "ถึงท่าเรือปากบารา", en: "arrive at Pak Bara Pier", cn: "到达巴巴拉码头", de: "Ankunft am Pak Bara Pier", fr: "arrivée à la jetée de Pak Bara", ru: "прибытие к причалу Пак Бара", ko: "빡바라 부두 도착", ja: "パクバラ桟橋到着" },
  { th: "เดินทางกลับท่าเรือ เช็คเอาท์", en: "return to pier, check out", cn: "返回码头，退房", de: "Rückkehr zum Hafen, Auschecken", fr: "retour au port, check-out", ru: "возвращение к пирсу, выселение", ko: "부두로 귀항, 체크아웃", ja: "桟橋帰港、チェックアウト" },
  { th: "แนะนำจองเที่ยวบินหลังเที่ยง", en: "recommend flights after noon", cn: "建议预订午后航班", de: "Flüge nach Mittag empfohlen", fr: "vols après midi recommandés", ru: "рекомендуем рейсы после полудня", ko: "오후 항공편 권장", ja: "正午以降のフライト推奨" },
  { th: "สำหรับท่านที่ไม่ลงไดฟ์8 สามารถแวะเที่ยวเกาะหลีเป๊ะ ชมพระอาทิตย์ตก", en: "Those who skip dive 8 can visit Koh Lipe island and watch the sunset", cn: "不参加第8潜的客人可以游览丽贝岛、观赏日落", de: "Wer nicht am 8. Tauchgang teilnimmt, kann Koh Lipe besuchen und den Sonnenuntergang genießen", fr: "Ceux qui ne font pas la plongée 8 peuvent visiter Koh Lipe et admirer le coucher du soleil", ru: "Те, кто пропустит дайв 8, могут посетить остров Липе и полюбоваться закатом", ko: "8번째 다이빙을 하지 않는 분은 꼬 리뻬를 방문하며 일몰을 감상할 수 있습니다", ja: "8本目のダイブをスキップする方はリペ島を訪問し、夕日を楽しめます" },
  { th: "เรือเดินทางระหว่างคืนไปหินม่วง หินแดง", en: "Boat heads to Hin Muang and Hin Daeng overnight", cn: "夜间前往欣穆昂和欣丹", de: "Boot fährt über Nacht nach Hin Muang und Hin Daeng", fr: "Le bateau navigue vers Hin Muang et Hin Daeng pendant la nuit", ru: "Лодка направляется к Хин Муанг и Хин Дэнг ночью", ko: "야간 힌무앙, 힌댕 이동", ja: "夜間ヒンムアン・ヒンデーンへ移動" },

  // === DISCLAIMER ===
  { th: "จุดดำน้ำอาจจะเปลี่ยนแปลงได้ขึ้นอยู่กับ สภาพอากาศ ความปลอดภัย และการตัดสินใจของกัปตัน", en: "Dive sites may change depending on weather conditions, safety, and the captain's decision", cn: "潜水点可能会因天气状况、安全因素和船长决定而有所变更", de: "Tauchplätze können sich je nach Wetterbedingungen, Sicherheit und Entscheidung des Kapitäns ändern", fr: "Les sites de plongée peuvent changer selon les conditions météorologiques, la sécurité et la décision du capitaine", ru: "Дайв-сайты могут измениться в зависимости от погодных условий, безопасности и решения капитана", ko: "다이브 사이트는 날씨, 안전 상황 및 선장의 판단에 따라 변경될 수 있습니다", ja: "ダイブサイトは天候、安全状況、船長の判断により変更される場合があります" },
  { th: "เส้นทางนี้เดินทางไกล ใช้เวลาเดินเรือมาก สภาพอากาศและกระแสน้ำจุดดำน้ำอาจเปลี่ยนแปลงตามสถานะการณ์", en: "This route involves long-distance travel with considerable sailing time. Weather and current conditions may affect dive site selection", cn: "此航线路程遥远，航行时间较长。天气和水流状况可能会影响潜水点的选择", de: "Diese Route beinhaltet eine lange Reise mit beträchtlicher Fahrtzeit. Wetter- und Strömungsbedingungen können die Tauchplatzauswahl beeinflussen", fr: "Cet itinéraire implique un long trajet avec un temps de navigation considérable. Les conditions météorologiques et les courants peuvent influencer le choix des sites", ru: "Этот маршрут предполагает дальнее путешествие со значительным временем в пути. Погода и течения могут повлиять на выбор дайв-сайтов", ko: "이 경로는 장거리 여행으로 항해 시간이 상당합니다. 날씨와 해류 상황에 따라 다이브 사이트가 변경될 수 있습니다", ja: "このルートは長距離航行を伴います。天候や潮流の状況によりダイブサイトが変更される場合があります" },
  { th: "หินแดง-หินม่วง มีกระแสน้ำแรง แนะนำสำหรับนักดำน้ำระดับ Advanced Open Water ขึ้นไป", en: "Hin Daeng-Hin Muang has strong currents. Recommended for Advanced Open Water certified divers and above", cn: "欣丹-欣穆昂水流较强，建议AOW级别以上潜水员参加", de: "Hin Daeng-Hin Muang hat starke Strömungen. Empfohlen für Taucher ab Advanced Open Water", fr: "Hin Daeng-Hin Muang a de forts courants. Recommandé pour les plongeurs certifiés Advanced Open Water et plus", ru: "Хин Дэнг-Хин Муанг — сильные течения. Рекомендуется для дайверов с сертификатом Advanced Open Water и выше", ko: "힌댕-힌무앙은 해류가 강합니다. 어드밴스드 오픈 워터 이상의 다이버에게 권장됩니다", ja: "ヒンデーン・ヒンムアンは潮流が強いです。アドバンスドオープンウォーター以上のダイバーに推奨" },

  // === TEMPLATE-SPECIFIC HIGHLIGHT PHRASES ===
  { th: "จุดดำน้ำชั้นนำ ลุ้นพบกระเบนราหูและฉลามวาฬ", en: "top-class dive sites with chances to spot manta rays and whale sharks", cn: "顶级潜水点，有机会遇到蝠鲼和鲸鲨", de: "erstklassige Tauchplätze mit Chance auf Mantarochen und Walhaie", fr: "sites de plongée de premier plan, possibilité de voir des raies manta et requins-baleines", ru: "первоклассные дайв-сайты с шансом встретить мант и китовых акул", ko: "최고급 다이브 사이트, 만타레이와 고래상어를 만날 기회", ja: "一流のダイブサイト、マンタレイやジンベエザメに出会えるチャンス" },
  { th: "จุดดำน้ำที่สวยที่สุด ปะการังอ่อนหลากสี", en: "the most beautiful dive sites with colorful soft corals", cn: "最美潜水点，色彩斑斓的软珊瑚", de: "die schönsten Tauchplätze mit farbenfrohen Weichkorallen", fr: "les plus beaux sites de plongée aux coraux mous multicolores", ru: "самые красивые дайв-сайты с разноцветными мягкими кораллами", ko: "가장 아름다운 다이브 사이트, 다채로운 연산호", ja: "最も美しいダイブサイト、色とりどりのソフトコーラル" },
  { th: "ครบทุกจุดดำน้ำชั้นนำ", en: "All top dive sites covered", cn: "涵盖所有顶级潜水点", de: "Alle Top-Tauchplätze enthalten", fr: "Tous les meilleurs sites de plongée inclus", ru: "Все лучшие дайв-сайты", ko: "모든 최고급 다이브 사이트 포함", ja: "主要ダイブサイト完全網羅" },
  { th: "ทั้งอันดามันเหนือและใต้ในทริปเดียว", en: "both North and South Andaman in one trip", cn: "一次行程涵盖北安达曼和南安达曼", de: "Nord- und Süd-Andaman in einer Tour", fr: "Nord et Sud Andaman en un seul voyage", ru: "Северный и Южный Андаман в одной поездке", ko: "한 번의 여행으로 북 안다만과 남 안다만 모두", ja: "北アンダマンと南アンダマンを1トリップで" },
  { th: "สุดคุ้ม", en: "great value", cn: "超值", de: "hervorragendes Preis-Leistungs-Verhältnis", fr: "excellent rapport qualité-prix", ru: "отличное соотношение цены и качества", ko: "최고의 가성비", ja: "お得" },

  // === LOCATION NAMES ===
  { th: "หมู่เกาะสิมิลัน", en: "Similan Islands", cn: "斯米兰群岛", de: "Similan-Inseln", fr: "Îles Similan", ru: "Симиланские острова", ko: "시밀란 제도", ja: "シミラン諸島" },
  { th: "เกาะบอน", en: "Koh Bon", cn: "邦岛", de: "Koh Bon", fr: "Koh Bon", ru: "Ко Бон", ko: "꼬본", ja: "コボン" },
  { th: "เกาะตาชัย Pinnacle", en: "Koh Tachai Pinnacle", cn: "达柴岛尖塔", de: "Koh Tachai Pinnacle", fr: "Koh Tachai Pinnacle", ru: "Пиннакл Ко Тачай", ko: "꼬따차이 피나클", ja: "コタチャイピナクル" },
  { th: "เกาะตาชัย", en: "Koh Tachai", cn: "达柴岛", de: "Koh Tachai", fr: "Koh Tachai", ru: "Ко Тачай", ko: "꼬따차이", ja: "コタチャイ" },
  { th: "เกาะห้า", en: "Koh Haa", cn: "五岛", de: "Koh Haa", fr: "Koh Haa", ru: "Ко Хаа", ko: "꼬하", ja: "コハー" },
  { th: "เกาะพีพี", en: "Phi Phi Islands", cn: "皮皮岛", de: "Phi Phi Inseln", fr: "Îles Phi Phi", ru: "Острова Пхи-Пхи", ko: "피피 섬", ja: "ピピ島" },
  { th: "เกาะราชาน้อย (Racha Noi)", en: "Racha Noi Island", cn: "拉差诺伊岛", de: "Racha Noi", fr: "Racha Noi", ru: "Рача Ной", ko: "라차노이", ja: "ラチャノイ" },
  { th: "เกาะราชาใหญ่ (Racha Yai)", en: "Racha Yai Island", cn: "拉差亚伊岛", de: "Racha Yai", fr: "Racha Yai", ru: "Рача Яй", ko: "라차야이", ja: "ラチャヤイ" },
  { th: "เกาะราชาน้อย", en: "Racha Noi", cn: "拉差诺伊岛", de: "Racha Noi", fr: "Racha Noi", ru: "Рача Ной", ko: "라차노이", ja: "ラチャノイ" },
  { th: "เกาะราชาใหญ่", en: "Racha Yai", cn: "拉差亚伊岛", de: "Racha Yai", fr: "Racha Yai", ru: "Рача Яй", ko: "라차야이", ja: "ラチャヤイ" },
  { th: "เกาะหลีเป๊ะ", en: "Koh Lipe", cn: "丽贝岛", de: "Koh Lipe", fr: "Koh Lipe", ru: "Ко Липе", ko: "꼬 리뻬", ja: "リペ島" },
  { th: "เกาะอาดัง", en: "Koh Adang", cn: "阿当岛", de: "Koh Adang", fr: "Koh Adang", ru: "Ко Аданг", ko: "꼬 아당", ja: "コアダン島" },
  { th: "สุรินทร์", en: "Surin Islands", cn: "素林群岛", de: "Surin-Inseln", fr: "Îles Surin", ru: "Суринские острова", ko: "수린 제도", ja: "スリン諸島" },
  { th: "หินแดง &amp; หินม่วง", en: "Hin Daeng & Hin Muang", cn: "欣丹和欣穆昂", de: "Hin Daeng & Hin Muang", fr: "Hin Daeng & Hin Muang", ru: "Хин Дэнг и Хин Муанг", ko: "힌댕 & 힌무앙", ja: "ヒンデーン＆ヒンムアン" },
  { th: "หินแดง (Hin Daeng)", en: "Hin Daeng", cn: "欣丹（红石）", de: "Hin Daeng", fr: "Hin Daeng", ru: "Хин Дэнг", ko: "힌댕", ja: "ヒンデーン" },
  { th: "หินม่วง (Hin Muang)", en: "Hin Muang", cn: "欣穆昂（紫石）", de: "Hin Muang", fr: "Hin Muang", ru: "Хин Муанг", ko: "힌무앙", ja: "ヒンムアン" },
  { th: "หินแดง", en: "Hin Daeng", cn: "欣丹", de: "Hin Daeng", fr: "Hin Daeng", ru: "Хин Дэнг", ko: "힌댕", ja: "ヒンデーン" },
  { th: "หินม่วง", en: "Hin Muang", cn: "欣穆昂", de: "Hin Muang", fr: "Hin Muang", ru: "Хин Муанг", ko: "힌무앙", ja: "ヒンムアン" },
  { th: "เกาะพีพี Bida Nok &amp; Bida Nai", en: "Phi Phi Islands Bida Nok & Bida Nai", cn: "皮皮岛 Bida Nok & Bida Nai", de: "Phi Phi Inseln Bida Nok & Bida Nai", fr: "Phi Phi Bida Nok & Bida Nai", ru: "Пхи-Пхи Бида Нок и Бида Най", ko: "피피 섬 Bida Nok & Bida Nai", ja: "ピピ島 Bida Nok & Bida Nai" },
  { th: "เสาหินใต้น้ำผนังดิ่ง", en: "underwater pinnacle with vertical walls", cn: "水下石柱垂直岩壁", de: "Unterwasser-Felsnadel mit Steilwänden", fr: "pinacle sous-marin avec parois verticales", ru: "подводная скала с вертикальными стенами", ko: "수직 벽을 가진 수중 피나클", ja: "垂直の壁を持つ水中ピナクル" },
  { th: "ผนังดิ่งลึกกว่า 60 เมตร", en: "vertical wall over 60 meters deep", cn: "超过60米的垂直岩壁", de: "Steilwand über 60 Meter tief", fr: "paroi verticale de plus de 60 mètres", ru: "вертикальная стена глубиной более 60 метров", ko: "60미터 이상의 수직 절벽", ja: "60メートル以上の垂直の壁" },
  { th: "ลุ้นกระเบนราหูและฉลามวาฬ", en: "chance to spot manta rays and whale sharks", cn: "有机会遇到蝠鲼和鲸鲨", de: "Chance auf Mantarochen und Walhaie", fr: "possibilité de voir des raies manta et des requins-baleines", ru: "шанс встретить мант и китовых акул", ko: "만타레이와 고래상어를 만날 기회", ja: "マンタレイとジンベエザメに出会えるチャンス" },
  { th: "ลุ้นพบกระเบนราหูที่เกาะบอน", en: "chance to spot manta rays at Koh Bon", cn: "在邦岛有机会遇到蝠鲼", de: "Chance auf Mantarochen an Koh Bon", fr: "possibilité de voir des raies manta à Koh Bon", ru: "шанс встретить мант у Ко Бон", ko: "꼬본에서 만타레이를 만날 기회", ja: "コボンでマンタレイに出会えるチャンス" },
  { th: "กระเบนราหู", en: "manta rays", cn: "蝠鲼", de: "Mantarochen", fr: "raies manta", ru: "манты", ko: "만타레이", ja: "マンタレイ" },
  { th: "ลุ้นฉลามวาฬ กระเบนราหู", en: "chance to spot whale sharks and manta rays", cn: "有机会遇到鲸鲨和蝠鲼", de: "Chance auf Walhaie und Mantarochen", fr: "possibilité de voir des requins-baleines et des raies manta", ru: "шанс встретить китовых акул и мант", ko: "고래상어와 만타레이를 만날 기회", ja: "ジンベエザメとマンタレイに出会えるチャンス" },
  { th: "ลุ้นฉลามวาฬ", en: "chance to spot whale sharks", cn: "有机会遇到鲸鲨", de: "Chance auf Walhaie", fr: "possibilité de requins-baleines", ru: "шанс на китовых акул", ko: "고래상어를 만날 기회", ja: "ジンベエザメに出会えるチャンス" },
  { th: "ลุ้นปลาใหญ่ Manta Ray", en: "chance to spot big fish and manta rays", cn: "有机会遇到大鱼和蝠鲼", de: "Chance auf Großfische und Mantarochen", fr: "possibilité de gros poissons et raies manta", ru: "шанс на крупную рыбу и мант", ko: "대형 물고기와 만타레이를 만날 기회", ja: "大物やマンタレイに出会えるチャンス" },
  { th: "ดำน้ำซ้ำได้หลายรอบ", en: "multiple repeat dives possible", cn: "可多次重复潜水", de: "mehrere Wiederholungstauchgänge möglich", fr: "possibilité de plongées répétées", ru: "возможны многократные повторные погружения", ko: "여러 번 반복 다이빙 가능", ja: "何度でもリピートダイブ可能" },
  { th: "ดำซ้ำได้หลายรอบ", en: "multiple repeat dives possible", cn: "可多次重复潜水", de: "mehrere Wiederholungstauchgänge möglich", fr: "possibilité de plongées répétées", ru: "возможны многократные повторные погружения", ko: "여러 번 반복 다이빙 가능", ja: "何度でもリピートダイブ可能" },
  { th: "น้ำใสมาก South Tip กระแสน้ำแรงลุ้นปลาใหญ่ Manta Ray", en: "extremely clear water, South Tip with strong currents, chance to spot big fish and manta rays", cn: "水质极其清澈，South Tip水流较强，有机会遇到大鱼和蝠鲼", de: "extrem klares Wasser, South Tip mit starken Strömungen, Chance auf Großfische und Mantarochen", fr: "eaux extrêmement claires, South Tip avec courants forts, possibilité de gros poissons et raies manta", ru: "исключительно чистая вода, South Tip с сильными течениями, шанс на крупную рыбу и мант", ko: "매우 맑은 물, South Tip 강한 해류, 대형 물고기와 만타레이를 만날 기회", ja: "非常に透き通った水、South Tipは強い潮流、大物やマンタレイに出会えるチャンス" },
  { th: "ซากเรือจม ปะการังแข็ง เหมาะทุกระดับ", en: "shipwrecks, hard corals, suitable for all levels", cn: "沉船、硬珊瑚、适合所有级别", de: "Schiffswracks, Hartkorallen, für alle Erfahrungsstufen", fr: "épaves, coraux durs, convient à tous les niveaux", ru: "затонувшие корабли, твёрдые кораллы, подходит для всех уровней", ko: "난파선, 경산호, 모든 레벨 적합", ja: "沈没船、ハードコーラル、全レベル対応" },
  { th: "ซากเรือจม ปะการังแข็งสมบูรณ์ รูปปั้นใต้น้ำ", en: "shipwrecks, pristine hard corals, underwater statues", cn: "沉船、完好硬珊瑚、水下雕像", de: "Schiffswracks, unberührte Hartkorallen, Unterwasserstatuen", fr: "épaves, coraux durs préservés, statues sous-marines", ru: "затонувшие корабли, нетронутые твёрдые кораллы, подводные статуи", ko: "난파선, 건강한 경산호, 수중 조각상", ja: "沈没船、手つかずのハードコーラル、水中彫像" },
  { th: "น้ำใสสุดในภูเก็ต South Tip ลุ้นปลาใหญ่ Manta Ray", en: "the clearest water in Phuket, South Tip with chances to spot big fish and manta rays", cn: "普吉最清澈的海水、South Tip有机会遇到大鱼和蝠鲼", de: "das klarste Wasser in Phuket, South Tip mit Chance auf Großfische und Mantarochen", fr: "les eaux les plus claires de Phuket, South Tip avec possibilité de gros poissons et raies manta", ru: "самая чистая вода на Пхукете, South Tip с шансом на крупную рыбу и мант", ko: "푸켓에서 가장 맑은 물, South Tip 대형 물고기와 만타레이를 만날 기회", ja: "プーケットで最も透き通った水、South Tipで大物やマンタレイに出会えるチャンス" },
  { th: "ถ้ามีเวลา", en: "if time permits", cn: "如时间允许", de: "bei ausreichend Zeit", fr: "si le temps le permet", ru: "при наличии времени", ko: "시간이 허락하면", ja: "時間があれば" },
  { th: "ระหว่างทางกลับ", en: "on the way back", cn: "返程途中", de: "auf dem Rückweg", fr: "sur le chemin du retour", ru: "по пути назад", ko: "돌아오는 길에", ja: "帰路途中" },
  { th: "หรือ", en: "or", cn: "或", de: "oder", fr: "ou", ru: "или", ko: "또는", ja: "または" },
  { th: "กองหินแปดไมล์", en: "Eight Mile Reef", cn: "八英里礁", de: "Eight Mile Reef", fr: "Récif Eight Mile", ru: "Рифт Эйт Майл", ko: "에이트 마일 리프", ja: "エイトマイルリーフ" },
  { th: "กองหินตาลัง", en: "Ta Lang Reef", cn: "塔朗礁", de: "Ta Lang Reef", fr: "Récif Ta Lang", ru: "Рифт Та Ланг", ko: "따랑 리프", ja: "タランリーフ" },
  { th: "สาวัง", en: "Sawang", cn: "萨旺", de: "Sawang", fr: "Sawang", ru: "Саванг", ko: "사왕", ja: "サワン" },
  { th: "หินซ้อน", en: "Hin Son (stacked rocks)", cn: "叠石礁", de: "Hin Son (gestapelte Felsen)", fr: "Hin Son (rochers empilés)", ru: "Хин Сон (нагромождение камней)", ko: "힌손 (겹돌)", ja: "ヒンソン（積み石）" },
  { th: "เกาะบุโหน - กองหินขาว", en: "Koh Bulon - White Rock", cn: "布隆岛-白石礁", de: "Koh Bulon - White Rock", fr: "Koh Bulon - White Rock", ru: "Ко Булон - Уайт Рок", ko: "꼬 불론 - 화이트 록", ja: "コブロン - ホワイトロック" },
  { th: "เกาะไข่", en: "Koh Khai", cn: "蛋岛", de: "Koh Khai", fr: "Koh Khai", ru: "Ко Кхай", ko: "꼬카이", ja: "コカイ" },
  { th: "ช่วง ก.พ.-เม.ย.", en: "(Feb-Apr peak season)", cn: "（2月-4月旺季）", de: "(Feb-Apr Hauptsaison)", fr: "(saison haute fév-avr)", ru: "(сезон фев-апр)", ko: "(2~4월 성수기)", ja: "（2~4月ピークシーズン）" },

  // === TITLE-RELATED ===
  { th: "อันดามันเหนือ", en: "North Andaman", cn: "北安达曼", de: "Nord-Andamanen", fr: "Andaman Nord", ru: "Северный Андаман", ko: "북 안다만", ja: "北アンダマン" },
  { th: "อันดามันใต้", en: "South Andaman", cn: "南安达曼", de: "Süd-Andamanen", fr: "Andaman Sud", ru: "Южный Андаман", ko: "남 안다만", ja: "南アンダマン" },
  { th: "อันดามันเหนือ+ใต้", en: "North+South Andaman", cn: "北+南安达曼", de: "Nord+Süd-Andamanen", fr: "Andaman Nord+Sud", ru: "Северный+Южный Андаман", ko: "북+남 안다만", ja: "北+南アンダマン" },
  { th: "อันดามัน", en: "Andaman", cn: "安达曼", de: "Andamanen", fr: "Andaman", ru: "Андаман", ko: "안다만", ja: "アンダマン" },
  { th: "หินม่วง-หินแดง", en: "Hin Muang-Hin Daeng", cn: "欣穆昂-欣丹", de: "Hin Muang-Hin Daeng", fr: "Hin Muang-Hin Daeng", ru: "Хин Муанг-Хин Дэнг", ko: "힌무앙-힌댕", ja: "ヒンムアン・ヒンデーン" },
  { th: "ราชา-พีพี", en: "Racha-Phi Phi", cn: "拉差-皮皮", de: "Racha-Phi Phi", fr: "Racha-Phi Phi", ru: "Рача-Пхи-Пхи", ko: "라차-피피", ja: "ラチャ・ピピ" },
  { th: "ราชา", en: "Racha", cn: "拉差", de: "Racha", fr: "Racha", ru: "Рача", ko: "라차", ja: "ラチャ" },
  { th: "วัน", en: "Days", cn: "天", de: "Tage", fr: "Jours", ru: "дня", ko: "일", ja: "日間" },
  { th: "คืน", en: "Nights", cn: "夜", de: "Nächte", fr: "Nuits", ru: "ночей", ko: "박", ja: "泊" },

  // === ITINERARY DAY TITLES (generic) ===
  { th: "เดินทางลงใต้", en: "Head south", cn: "南下", de: "Weiterfahrt nach Süden", fr: "Cap vers le sud", ru: "Путь на юг", ko: "남쪽 이동", ja: "南下" },
  { th: "มุ่งหน้าลิเป๊ะ", en: "heading to Lipe", cn: "前往丽贝", de: "Kurs auf Lipe", fr: "cap sur Lipe", ru: "курс на Липе", ko: "리뻬로 향함", ja: "リペへ向かう" },
  { th: "เกาะราชา", en: "Racha Islands", cn: "拉差岛", de: "Racha-Inseln", fr: "Îles Racha", ru: "Острова Рача", ko: "라차 제도", ja: "ラチャ諸島" },
  { th: "เกาะราชาใหญ่ &amp; เกาะพีพี", en: "Racha Yai & Phi Phi Islands", cn: "拉差亚伊岛和皮皮岛", de: "Racha Yai & Phi Phi Inseln", fr: "Racha Yai & Îles Phi Phi", ru: "Рача Яй и Острова Пхи-Пхи", ko: "라차야이 & 피피 섬", ja: "ラチャヤイ＆ピピ島" },
  { th: "เกาะพีพี &amp; กลับ", en: "Phi Phi & Return", cn: "皮皮岛和返回", de: "Phi Phi & Rückkehr", fr: "Phi Phi & Retour", ru: "Пхи-Пхи и возвращение", ko: "피피 & 귀항", ja: "ピピ＆帰港" },
  { th: "เกาะราชาใหญ่ &amp; กลับ", en: "Racha Yai & Return", cn: "拉差亚伊岛和返回", de: "Racha Yai & Rückkehr", fr: "Racha Yai & Retour", ru: "Рача Яй и возвращение", ko: "라차야이 & 귀항", ja: "ラチャヤイ＆帰港" },
  { th: "เกาะบอน &amp; เกาะตาชัย", en: "Koh Bon & Koh Tachai", cn: "邦岛和达柴岛", de: "Koh Bon & Koh Tachai", fr: "Koh Bon & Koh Tachai", ru: "Ко Бон и Ко Тачай", ko: "꼬본 & 꼬따차이", ja: "コボン＆コタチャイ" },
  { th: "เกาะบอน &amp; Richelieu Rock", en: "Koh Bon & Richelieu Rock", cn: "邦岛和黎塞留岩", de: "Koh Bon & Richelieu Rock", fr: "Koh Bon & Richelieu Rock", ru: "Ко Бон и Ришелье Рок", ko: "꼬본 & 리슐리외 록", ja: "コボン＆リシュリューロック" },
  { th: "Richelieu Rock &amp; สุรินทร์", en: "Richelieu Rock & Surin", cn: "黎塞留岩和素林", de: "Richelieu Rock & Surin", fr: "Richelieu Rock & Surin", ru: "Ришелье Рок и Сурин", ko: "리슐리외 록 & 수린", ja: "リシュリューロック＆スリン" },
  { th: "สิมิลัน &amp; กลับ", en: "Similan & Return", cn: "斯米兰和返回", de: "Similan & Rückkehr", fr: "Similan & Retour", ru: "Симилан и возвращение", ko: "시밀란 & 귀항", ja: "シミラン＆帰港" },
  { th: "หินแดง &amp; หินม่วง", en: "Hin Daeng & Hin Muang", cn: "欣丹和欣穆昂", de: "Hin Daeng & Hin Muang", fr: "Hin Daeng & Hin Muang", ru: "Хин Дэнг и Хин Муанг", ko: "힌댕 & 힌무앙", ja: "ヒンデーン＆ヒンムアン" },
  { th: "หินม่วง &amp; กลับ", en: "Hin Muang & Return", cn: "欣穆昂和返回", de: "Hin Muang & Rückkehr", fr: "Hin Muang & Retour", ru: "Хин Муанг и возвращение", ko: "힌무앙 & 귀항", ja: "ヒンムアン＆帰港" },
  { th: "เกาะพีพี &amp; กลับ", en: "Phi Phi & Return", cn: "皮皮岛和返回", de: "Phi Phi & Rückkehr", fr: "Phi Phi & Retour", ru: "Пхи-Пхи и возвращение", ko: "피피 & 귀항", ja: "ピピ＆帰港" },
  { th: "หินแดง-หินม่วง &amp; มุ่งหน้าลิเป๊ะ", en: "Hin Daeng-Hin Muang & heading to Lipe", cn: "欣丹-欣穆昂和前往丽贝", de: "Hin Daeng-Hin Muang & Kurs auf Lipe", fr: "Hin Daeng-Hin Muang & cap sur Lipe", ru: "Хин Дэнг-Хин Муанг и курс на Липе", ko: "힌댕-힌무앙 & 리뻬로 향함", ja: "ヒンデーン・ヒンムアン＆リペへ" },
  { th: "เกาะหลีเป๊ะ &amp; เกาะอาดัง", en: "Koh Lipe & Koh Adang", cn: "丽贝岛和阿当岛", de: "Koh Lipe & Koh Adang", fr: "Koh Lipe & Koh Adang", ru: "Ко Липе и Ко Аданг", ko: "꼬 리뻬 & 꼬 아당", ja: "リペ島＆コアダン島" },
  { th: "Shark Point &amp; King Cruiser", en: "Shark Point & King Cruiser", cn: "鲨鱼点和国王巡洋舰号", de: "Shark Point & King Cruiser", fr: "Shark Point & King Cruiser", ru: "Шарк Поинт и Кинг Крузер", ko: "샤크 포인트 & 킹 크루저", ja: "シャークポイント＆キングクルーザー" },
  { th: "เกาะห้า &amp; หินแดง-หินม่วง", en: "Koh Haa & Hin Daeng-Hin Muang", cn: "五岛和欣丹-欣穆昂", de: "Koh Haa & Hin Daeng-Hin Muang", fr: "Koh Haa & Hin Daeng-Hin Muang", ru: "Ко Хаа и Хин Дэнг-Хин Муанг", ko: "꼬하 & 힌댕-힌무앙", ja: "コハー＆ヒンデーン・ヒンムアン" },
  { th: "สุรินทร์ &amp; เดินทางลงใต้", en: "Surin & Head South", cn: "素林和南下", de: "Surin & Weiterfahrt nach Süden", fr: "Surin & Cap vers le sud", ru: "Сурин и путь на юг", ko: "수린 & 남쪽 이동", ja: "スリン＆南下" },

  // === MISC ===
  { th: "ช่วง", en: "season", cn: "期间", de: "Saison", fr: "saison", ru: "сезон", ko: "시즌", ja: "シーズン" },
  { th: "ใน", en: "in", cn: "在", de: "in", fr: "en", ru: "за", ko: "동안", ja: "で" },
  { th: "ที่", en: "at", cn: "在", de: "an", fr: "à", ru: "на", ko: "에서", ja: "で" },
];

// ═══════════════════════════════════════════════════════════════════════════
// TITLE & ROUTE TRANSLATIONS
// ═══════════════════════════════════════════════════════════════════════════

type TitleInfo = {
  th: string;
  en: string; cn: string; de: string; fr: string; ru: string; ko: string; ja: string;
  slug: string;
  routeEn: string;
  excerpt: Record<string, string>;
  keywords: Record<string, string[]>;
};

const TEMPLATE_TITLES: Record<string, TitleInfo> = {
  "cmnrmfir40000tckzp5kvsepr": {
    th: "อันดามันเหนือ 4 วัน 5 คืน", en: "North Andaman 4 Days 5 Nights", cn: "北安达曼 4天5夜", de: "Nord-Andamanen 4 Tage 5 Nächte", fr: "Andaman Nord 4 Jours 5 Nuits", ru: "Северный Андаман 4 дня 5 ночей", ko: "북 안다만 4일 5박", ja: "北アンダマン 4日間5泊",
    slug: "issara-n-andaman", routeEn: "Similan Islands - Koh Bon - Koh Tachai - Richelieu Rock - Surin Islands",
    excerpt: { en: "Experience world-class dive site Richelieu Rock with a chance to spot manta rays at Koh Bon. 15 dives in 4 full days among the Similan and Surin Islands.", cn: "体验世界级潜水点黎塞留岩，在邦岛有机会遇到蝠鲼。在斯米兰群岛和素林群岛进行4天15潜。", de: "Erleben Sie den Weltklasse-Tauchplatz Richelieu Rock mit Chance auf Mantarochen an Koh Bon. 15 Tauchgänge in 4 Tagen an den Similan- und Surin-Inseln.", fr: "Découvrez le site de plongée de classe mondiale Richelieu Rock avec possibilité de voir des raies manta à Koh Bon. 15 plongées en 4 jours aux îles Similan et Surin.", ru: "Испытайте дайв-сайт мирового класса Ришелье Рок с шансом увидеть мант у Ко Бон. 15 погружений за 4 дня у Симиланских и Суринских островов.", ko: "세계적인 다이브 사이트 리슐리외 록에서 꼬본의 만타레이를 만나보세요. 시밀란, 수린 제도에서 4일간 15회 다이빙.", ja: "世界クラスのダイブサイト、リシュリューロックでマンタレイに出会えるチャンス。シミラン・スリン諸島で4日間15ダイブ。" },
    keywords: { en: ["Similan", "Richelieu Rock", "Koh Bon", "manta ray", "liveaboard"], cn: ["斯米兰", "黎塞留岩", "邦岛", "蝠鲼", "船宿"], de: ["Similan", "Richelieu Rock", "Koh Bon", "Manta", "Tauchsafari"], fr: ["Similan", "Richelieu Rock", "Koh Bon", "manta", "croisière plongée"], ru: ["Симилан", "Ришелье Рок", "Ко Бон", "манта", "дайв-сафари"], ko: ["시밀란", "리슐리외 록", "꼬본", "만타레이", "리브어보드"], ja: ["シミラン", "リシュリューロック", "コボン", "マンタ", "ダイブクルーズ"] },
  },
  "cmnrmfitk001ctckz4z2xy09w": {
    th: "อันดามันใต้ 4 วัน 5 คืน", en: "South Andaman 4 Days 5 Nights", cn: "南安达曼 4天5夜", de: "Süd-Andamanen 4 Tage 5 Nächte", fr: "Andaman Sud 4 Jours 5 Nuits", ru: "Южный Андаман 4 дня 5 ночей", ko: "남 안다만 4일 5박", ja: "南アンダマン 4日間5泊",
    slug: "issara-s-andaman", routeEn: "Phi Phi - Shark Point - King Cruiser - Koh Haa - Hin Daeng - Hin Muang",
    excerpt: { en: "15 dives exploring the best of South Andaman: wrecks, Koh Haa, Koh Lipe, Shark Point, Cathedral Cave, and the famous Hin Daeng-Hin Muang for manta rays.", cn: "15潜探索南安达曼精华：沉船、五岛、丽贝岛、鲨鱼点、大教堂洞穴、以及著名的欣丹-欣穆昂蝠鲼点。", de: "15 Tauchgänge im besten Süd-Andaman: Wracks, Koh Haa, Koh Lipe, Shark Point, Cathedral Cave und Hin Daeng-Hin Muang für Mantarochen.", fr: "15 plongées explorant le meilleur de l'Andaman Sud : épaves, Koh Haa, Koh Lipe, Shark Point, Cathedral Cave et Hin Daeng-Hin Muang.", ru: "15 погружений по лучшим местам Южного Андамана: затонувшие корабли, Ко Хаа, Ко Липе, Шарк Поинт, Кафедральная пещера и Хин Дэнг-Хин Муанг.", ko: "남 안다만 최고의 다이빙: 난파선, 꼬하, 꼬 리뻬, 샤크 포인트, 대성당 동굴, 힌댕-힌무앙에서 15회 다이빙.", ja: "南アンダマンの精華を探索：沈没船、コハー、リペ島、シャークポイント、カテドラルケーブ、ヒンデーン・ヒンムアンで15ダイブ。" },
    keywords: { en: ["South Andaman", "Shark Point", "King Cruiser", "Koh Haa", "Hin Daeng", "liveaboard"], cn: ["南安达曼", "鲨鱼点", "国王巡洋舰号", "五岛", "欣丹", "船宿"], de: ["Süd-Andaman", "Shark Point", "King Cruiser", "Koh Haa", "Hin Daeng", "Tauchsafari"], fr: ["Andaman Sud", "Shark Point", "King Cruiser", "Koh Haa", "Hin Daeng", "croisière plongée"], ru: ["Южный Андаман", "Шарк Поинт", "Кинг Крузер", "Ко Хаа", "Хин Дэнг", "дайв-сафари"], ko: ["남 안다만", "샤크 포인트", "킹 크루저", "꼬하", "힌댕", "리브어보드"], ja: ["南アンダマン", "シャークポイント", "キングクルーザー", "コハー", "ヒンデーン", "ダイブクルーズ"] },
  },
  "cmnrmfiut002otckzxu34rnkm": {
    th: "หินม่วง-หินแดง 3 วัน 4 คืน", en: "Hin Muang-Hin Daeng 3 Days 4 Nights", cn: "欣穆昂-欣丹 3天4夜", de: "Hin Muang-Hin Daeng 3 Tage 4 Nächte", fr: "Hin Muang-Hin Daeng 3 Jours 4 Nuits", ru: "Хин Муанг-Хин Дэнг 3 дня 4 ночи", ko: "힌무앙-힌댕 3일 4박", ja: "ヒンムアン・ヒンデーン 3日間4泊",
    slug: "issara-hin-muang-hin-daeng", routeEn: "Koh Haa - Hin Daeng - Hin Muang - Phi Phi",
    excerpt: { en: "10-12 dives deep-diving at world-class Hin Daeng-Hin Muang, chance to spot manta rays and whale sharks, plus Koh Haa and Phi Phi.", cn: "10-12潜深入世界级欣丹-欣穆昂，有机会遇到蝠鲼和鲸鲨，还有五岛和皮皮岛。", de: "10-12 Tauchgänge an den Weltklasse-Spots Hin Daeng-Hin Muang, Chance auf Mantarochen und Walhaie, plus Koh Haa und Phi Phi.", fr: "10-12 plongées en profondeur à Hin Daeng-Hin Muang, possibilité de voir raies manta et requins-baleines, plus Koh Haa et Phi Phi.", ru: "10-12 погружений у Хин Дэнг-Хин Муанг мирового класса, шанс увидеть мант и китовых акул, а также Ко Хаа и Пхи-Пхи.", ko: "세계적인 힌댕-힌무앙에서 10-12회 심해 다이빙, 만타레이와 고래상어를 만날 기회, 꼬하와 피피 포함.", ja: "世界クラスのヒンデーン・ヒンムアンで10-12ダイブ、マンタレイやジンベエザメに出会えるチャンス、コハーとピピ島も。" },
    keywords: { en: ["Hin Daeng", "Hin Muang", "Koh Haa", "manta ray", "liveaboard"], cn: ["欣丹", "欣穆昂", "五岛", "蝠鲼", "船宿"], de: ["Hin Daeng", "Hin Muang", "Koh Haa", "Manta", "Tauchsafari"], fr: ["Hin Daeng", "Hin Muang", "Koh Haa", "manta", "croisière plongée"], ru: ["Хин Дэнг", "Хин Муанг", "Ко Хаа", "манта", "дайв-сафари"], ko: ["힌댕", "힌무앙", "꼬하", "만타레이", "리브어보드"], ja: ["ヒンデーン", "ヒンムアン", "コハー", "マンタ", "ダイブクルーズ"] },
  },
  "cmnrmfiw00040tckzgtwwi0nk": {
    th: "ราชา-พีพี 3 วัน 4 คืน", en: "Racha-Phi Phi 3 Days 4 Nights", cn: "拉差-皮皮 3天4夜", de: "Racha-Phi Phi 3 Tage 4 Nächte", fr: "Racha-Phi Phi 3 Jours 4 Nuits", ru: "Рача-Пхи-Пхи 3 дня 4 ночи", ko: "라차-피피 3일 4박", ja: "ラチャ・ピピ 3日間4泊",
    slug: "issara-racha-phiphi", routeEn: "Racha Noi - Racha Yai - Phi Phi Islands",
    excerpt: { en: "12 dives exploring Racha Islands' clear waters, shipwrecks, and Phi Phi's Bida Nok-Bida Nai with leopard sharks and sea turtles. Suitable for all levels.", cn: "12潜探索拉差群岛清澈海水、沉船和皮皮岛Bida Nok-Bida Nai的豹纹鲨和海龟。适合所有级别。", de: "12 Tauchgänge an den Racha-Inseln mit klarem Wasser, Wracks und Phi Phis Bida Nok-Bida Nai mit Leopardenhaien und Meeresschildkröten. Für alle Stufen geeignet.", fr: "12 plongées aux îles Racha avec eaux cristallines, épaves et Bida Nok-Bida Nai de Phi Phi avec requins-léopards et tortues. Tous niveaux.", ru: "12 погружений у островов Рача с чистой водой, затонувшими кораблями и Бида Нок-Бида Най с леопардовыми акулами и черепахами. Подходит для всех уровней.", ko: "라차 제도의 맑은 바다, 난파선, 피피 섬의 Bida Nok-Bida Nai에서 레오파드 상어와 바다거북을 만나는 12회 다이빙. 모든 레벨 적합.", ja: "ラチャ諸島の透き通った海、沈没船、ピピ島のBida Nok-Bida Naiでトラフザメやウミガメに出会う12ダイブ。全レベル対応。" },
    keywords: { en: ["Racha", "Phi Phi", "Bida Nok", "leopard shark", "liveaboard"], cn: ["拉差", "皮皮岛", "Bida Nok", "豹纹鲨", "船宿"], de: ["Racha", "Phi Phi", "Bida Nok", "Leopardenhai", "Tauchsafari"], fr: ["Racha", "Phi Phi", "Bida Nok", "requin-léopard", "croisière plongée"], ru: ["Рача", "Пхи-Пхи", "Бида Нок", "леопардовая акула", "дайв-сафари"], ko: ["라차", "피피", "Bida Nok", "레오파드 상어", "리브어보드"], ja: ["ラチャ", "ピピ", "ビダノック", "トラフザメ", "ダイブクルーズ"] },
  },
  "cmnrmfiwr005ctckzl6mndyww": {
    th: "เกาะหลีเป๊ะ 3 วัน 4 คืน", en: "Koh Lipe 3 Days 4 Nights", cn: "丽贝岛 3天4夜", de: "Koh Lipe 3 Tage 4 Nächte", fr: "Koh Lipe 3 Jours 4 Nuits", ru: "Ко Липе 3 дня 4 ночи", ko: "꼬 리뻬 3일 4박", ja: "リペ島 3日間4泊",
    slug: "issara-koh-lipe", routeEn: "Hin Daeng - Hin Muang - 8 Mile Rock - Stonehenge - Koh Lipe",
    excerpt: { en: "10-12 dives on the southernmost Andaman route: from Hin Daeng-Hin Muang to Koh Lipe, explore 8 Mile Rock and Stonehenge, exclusive dive sites.", cn: "10-12潜安达曼最南端航线：从欣丹-欣穆昂到丽贝岛，探索8 Mile Rock和Stonehenge等独特潜点。", de: "10-12 Tauchgänge auf der südlichsten Andaman-Route: von Hin Daeng-Hin Muang bis Koh Lipe, 8 Mile Rock und Stonehenge erkunden.", fr: "10-12 plongées sur la route la plus au sud de l'Andaman : de Hin Daeng-Hin Muang à Koh Lipe, 8 Mile Rock et Stonehenge.", ru: "10-12 погружений по самому южному маршруту Андамана: от Хин Дэнг-Хин Муанг до Ко Липе, 8 Mile Rock и Стоунхендж.", ko: "안다만 최남단 루트 10-12회 다이빙: 힌댕-힌무앙에서 꼬 리뻬까지, 8 Mile Rock과 Stonehenge 탐험.", ja: "アンダマン最南端ルートで10-12ダイブ：ヒンデーン・ヒンムアンからリペ島まで、8 Mile RockとStonehenge探索。" },
    keywords: { en: ["Koh Lipe", "8 Mile Rock", "Stonehenge", "Tarutao", "liveaboard"], cn: ["丽贝岛", "8 Mile Rock", "Stonehenge", "达鲁岛", "船宿"], de: ["Koh Lipe", "8 Mile Rock", "Stonehenge", "Tarutao", "Tauchsafari"], fr: ["Koh Lipe", "8 Mile Rock", "Stonehenge", "Tarutao", "croisière plongée"], ru: ["Ко Липе", "8 Mile Rock", "Стоунхендж", "Тарутао", "дайв-сафари"], ko: ["꼬 리뻬", "8 Mile Rock", "Stonehenge", "따루따오", "리브어보드"], ja: ["リペ島", "8 Mile Rock", "ストーンヘンジ", "タルタオ", "ダイブクルーズ"] },
  },
  "cmnrmfj0i00cotckzdn5yrmrp": {
    th: "อันดามันเหนือ+ใต้ 5 วัน 6 คืน", en: "North+South Andaman 5 Days 6 Nights", cn: "北+南安达曼 5天6夜", de: "Nord+Süd-Andamanen 5 Tage 6 Nächte", fr: "Andaman Nord+Sud 5 Jours 6 Nuits", ru: "Северный+Южный Андаман 5 дней 6 ночей", ko: "북+남 안다만 5일 6박", ja: "北+南アンダマン 5日間6泊",
    slug: "issara-n-s-andaman", routeEn: "Similan - Koh Bon - Koh Tachai - Richelieu Rock - Surin - Koh Haa - Hin Daeng - Hin Muang",
    excerpt: { en: "18 dives covering all top dive sites: Richelieu Rock, Similan, Koh Bon, Koh Haa, Hin Daeng-Hin Muang. The ultimate Andaman liveaboard experience.", cn: "18潜涵盖所有顶级潜点：黎塞留岩、斯米兰、邦岛、五岛、欣丹-欣穆昂。终极安达曼船宿体验。", de: "18 Tauchgänge an allen Top-Spots: Richelieu Rock, Similan, Koh Bon, Koh Haa, Hin Daeng-Hin Muang. Das ultimative Andaman-Taucherlebnis.", fr: "18 plongées couvrant tous les meilleurs sites : Richelieu Rock, Similan, Koh Bon, Koh Haa, Hin Daeng-Hin Muang. L'expérience ultime de l'Andaman.", ru: "18 погружений по всем лучшим дайв-сайтам: Ришелье Рок, Симилан, Ко Бон, Ко Хаа, Хин Дэнг-Хин Муанг. Незабываемый дайв-сафари.", ko: "모든 최고 다이브 사이트 18회 다이빙: 리슐리외 록, 시밀란, 꼬본, 꼬하, 힌댕-힌무앙. 궁극의 안다만 리브어보드.", ja: "全ての主要ダイブサイトを網羅する18ダイブ：リシュリューロック、シミラン、コボン、コハー、ヒンデーン・ヒンムアン。究極のアンダマンダイブクルーズ。" },
    keywords: { en: ["North Andaman", "South Andaman", "Richelieu Rock", "Similan", "Hin Daeng", "liveaboard"], cn: ["北安达曼", "南安达曼", "黎塞留岩", "斯米兰", "欣丹", "船宿"], de: ["Nord-Andaman", "Süd-Andaman", "Richelieu Rock", "Similan", "Hin Daeng", "Tauchsafari"], fr: ["Andaman Nord", "Andaman Sud", "Richelieu Rock", "Similan", "Hin Daeng", "croisière plongée"], ru: ["Северный Андаман", "Южный Андаман", "Ришелье Рок", "Симилан", "Хин Дэнг", "дайв-сафари"], ko: ["북 안다만", "남 안다만", "리슐리외 록", "시밀란", "힌댕", "리브어보드"], ja: ["北アンダマン", "南アンダマン", "リシュリューロック", "シミラン", "ヒンデーン", "ダイブクルーズ"] },
  },
  "cmnrmfj1j00f0tckz9var2ybi": {
    th: "ราชา 2 วัน 2 คืน", en: "Racha 2 Days 2 Nights", cn: "拉差 2天2夜", de: "Racha 2 Tage 2 Nächte", fr: "Racha 2 Jours 2 Nuits", ru: "Рача 2 дня 2 ночи", ko: "라차 2일 2박", ja: "ラチャ 2日間2泊",
    slug: "issara-racha", routeEn: "Racha Noi - Racha Yai",
    excerpt: { en: "Short 2-day trip with 6-7 dives at Racha Noi and Racha Yai. Crystal-clear water, suitable for all levels, easy access from Phuket.", cn: "2天短途行程，在拉差诺伊和拉差亚伊进行6-7潜。水质清澈，适合所有级别，从普吉岛出发便捷。", de: "Kurzer 2-Tages-Trip mit 6-7 Tauchgängen an Racha Noi und Racha Yai. Kristallklares Wasser, für alle Stufen, leicht von Phuket erreichbar.", fr: "Court voyage de 2 jours avec 6-7 plongées à Racha Noi et Racha Yai. Eaux cristallines, tous niveaux, facilement accessible depuis Phuket.", ru: "Короткая 2-дневная поездка с 6-7 погружениями у Рача Ной и Рача Яй. Кристально чистая вода, для всех уровней, удобный доступ из Пхукета.", ko: "라차노이, 라차야이에서 6-7회 다이빙하는 2일 단기 여행. 맑은 물, 모든 레벨 적합, 푸켓에서 가까운 접근.", ja: "ラチャノイ・ラチャヤイで6-7ダイブの2日間ショートトリップ。透き通った水、全レベル対応、プーケットからアクセス便利。" },
    keywords: { en: ["Racha", "Racha Yai", "Racha Noi", "short trip", "Phuket", "liveaboard"], cn: ["拉差", "拉差亚伊", "拉差诺伊", "短途", "普吉岛", "船宿"], de: ["Racha", "Racha Yai", "Racha Noi", "Kurztrip", "Phuket", "Tauchsafari"], fr: ["Racha", "Racha Yai", "Racha Noi", "court séjour", "Phuket", "croisière plongée"], ru: ["Рача", "Рача Яй", "Рача Ной", "короткая поездка", "Пхукет", "дайв-сафари"], ko: ["라차", "라차야이", "라차노이", "단기 여행", "푸켓", "리브어보드"], ja: ["ラチャ", "ラチャヤイ", "ラチャノイ", "ショートトリップ", "プーケット", "ダイブクルーズ"] },
  },
};

// Generic Andaman titles
const GENERIC_ANDAMAN_TITLES: Record<string, string> = {
  th: "อันดามัน 4 วัน 5 คืน", en: "Andaman 4 Days 5 Nights", cn: "安达曼 4天5夜",
  de: "Andamanen 4 Tage 5 Nächte", fr: "Andaman 4 Jours 5 Nuits", ru: "Андаман 4 дня 5 ночей",
  ko: "안다만 4일 5박", ja: "アンダマン 4日間5泊",
};

// ═══════════════════════════════════════════════════════════════════════════
// ROUTE MAPPING
// ═══════════════════════════════════════════════════════════════════════════

function getTemplateIdForSchedule(thTitle: string, thRoute: string): string {
  const t = thTitle + " " + thRoute;
  if (t.includes("เหนือ+ใต้") || t.includes("N+S")) return TEMPLATE_IDS[5]; // N+S Andaman
  if (t.includes("อันดามันเหนือ") || t.includes("N. Andaman")) return TEMPLATE_IDS[0]; // N. Andaman
  if (t.includes("อันดามันใต้") || t.includes("S. Andaman")) return TEMPLATE_IDS[1]; // S. Andaman
  if (t.includes("หินม่วง") || t.includes("Hin Muang")) return TEMPLATE_IDS[2]; // Hin Muang
  if (t.includes("ราชา-พีพี") || t.includes("Racha-PhiPhi")) return TEMPLATE_IDS[3]; // Racha-PhiPhi
  if (t.includes("หลีเป๊ะ") || t.includes("Koh Lipe")) return TEMPLATE_IDS[4]; // Koh Lipe
  if (/ราชา(?!-)/.test(t) && !t.includes("พีพี") || t.includes("Racha 2")) return TEMPLATE_IDS[6]; // Racha only
  // Generic "อันดามัน" → use N. Andaman template
  return TEMPLATE_IDS[0];
}

function isGenericAndaman(thTitle: string): boolean {
  return thTitle.startsWith("อันดามัน ") && !thTitle.includes("เหนือ") && !thTitle.includes("ใต้");
}

// ═══════════════════════════════════════════════════════════════════════════
// TRANSLATION FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

function translateHtml(thaiHtml: string, lang: Lang): string {
  let result = thaiHtml;

  // Sort translations by Thai string length (longest first) to avoid partial matches
  const sorted = [...TRANSLATIONS].sort((a, b) => b.th.length - a.th.length);

  for (const entry of sorted) {
    const target = entry[lang];
    if (target && result.includes(entry.th)) {
      // Use split/join for exact replacement (no regex special char issues)
      result = result.split(entry.th).join(target);
    }
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  console.log("Starting comprehensive schedule translation...\n");

  // 1. Read all Thai templates from DB
  const thaiTemplates: Map<string, { content: string; itinerary: string; departureDate: Date }> = new Map();

  for (const tplId of TEMPLATE_IDS) {
    const schedule = await prisma.schedule.findUnique({
      where: { id: tplId },
      include: { translations: { where: { lang: "th" } } },
    });
    if (!schedule || !schedule.translations[0]) {
      console.error(`Template ${tplId} not found!`);
      continue;
    }
    thaiTemplates.set(tplId, {
      content: schedule.translations[0].content,
      itinerary: schedule.translations[0].itinerary,
      departureDate: schedule.departureDate!,
    });
    console.log(`  Read Thai template: ${schedule.translations[0].title} (${schedule.translations[0].content.length} chars content)`);
  }

  // 2. Get all schedules
  const allSchedules = await prisma.schedule.findMany({
    where: { boatId: BOAT_ID },
    include: { translations: { where: { lang: "th" } } },
    orderBy: { departureDate: "asc" },
  });

  console.log(`\nFound ${allSchedules.length} schedules total\n`);

  let updated = 0;
  let errors = 0;

  for (const schedule of allSchedules) {
    const thTrans = schedule.translations[0];
    if (!thTrans) {
      console.warn(`  No Thai translation for ${schedule.id}, skipping`);
      continue;
    }

    const templateId = getTemplateIdForSchedule(thTrans.title, thTrans.route);
    const template = thaiTemplates.get(templateId);
    if (!template) {
      console.warn(`  No template found for schedule ${schedule.id} (${thTrans.title})`);
      continue;
    }

    const isTemplate = TEMPLATE_IDS.includes(schedule.id);
    const isGeneric = isGenericAndaman(thTrans.title);
    const templateInfo = TEMPLATE_TITLES[templateId];

    // Compute date offset from template departure to this schedule's departure
    const offsetDays = computeDateOffset(template.departureDate, schedule.departureDate!);

    // Determine which year to use
    const templateYear = template.departureDate.getFullYear();

    for (const lang of LANGS) {
      try {
        // Translate the template Thai content + itinerary
        let translatedContent = translateHtml(template.content, lang);
        let translatedItinerary = translateHtml(template.itinerary, lang);

        // Replace dates with target language format and apply offset
        translatedContent = replaceDatesInHtml(translatedContent, lang, offsetDays, templateYear);
        translatedItinerary = replaceDatesInHtml(translatedItinerary, lang, offsetDays, templateYear);

        // Determine title, slug, excerpt, keywords
        let title: string;
        let slug: string;
        let excerpt: string;
        let route: string;
        let keywords: string[];

        if (isGeneric) {
          title = GENERIC_ANDAMAN_TITLES[lang] ?? GENERIC_ANDAMAN_TITLES.en;
          // For generic Andaman, use N. Andaman template info but with "Andaman" title
          const nAndamanInfo = TEMPLATE_TITLES[TEMPLATE_IDS[0]];
          slug = `issara-andaman-${schedule.departureDate!.toISOString().slice(0, 10)}`;
          excerpt = nAndamanInfo.excerpt[lang] ?? nAndamanInfo.excerpt.en;
          route = nAndamanInfo.routeEn;
          keywords = nAndamanInfo.keywords[lang] ?? nAndamanInfo.keywords.en;
        } else {
          title = templateInfo[lang as keyof TitleInfo] as string;
          const dateStr = schedule.departureDate!.toISOString().slice(0, 10);
          slug = `${templateInfo.slug}-${dateStr}`;
          excerpt = templateInfo.excerpt[lang] ?? templateInfo.excerpt.en;
          route = templateInfo.routeEn;
          keywords = templateInfo.keywords[lang] ?? templateInfo.keywords.en;
        }

        await prisma.scheduleTranslation.upsert({
          where: { scheduleId_lang: { scheduleId: schedule.id, lang } },
          create: {
            scheduleId: schedule.id,
            lang,
            title,
            slug,
            excerpt,
            content: translatedContent,
            itinerary: translatedItinerary,
            route,
            keywords,
          },
          update: {
            title,
            slug,
            excerpt,
            content: translatedContent,
            itinerary: translatedItinerary,
            route,
            keywords,
          },
        });

        updated++;
      } catch (err) {
        console.error(`  Error translating ${schedule.id} to ${lang}:`, err);
        errors++;
      }
    }

    const scheduleDate = schedule.departureDate!.toISOString().slice(0, 10);
    const tplLabel = isTemplate ? " [TEMPLATE]" : "";
    const genericLabel = isGeneric ? " [GENERIC]" : "";
    console.log(`  ${scheduleDate} ${thTrans.title}${tplLabel}${genericLabel} => offset ${offsetDays}d => 7 languages`);
  }

  console.log(`\nDone! Updated ${updated} translations, ${errors} errors.`);
  console.log(`Total: ${allSchedules.length} schedules x 7 languages = ${allSchedules.length * 7} translations`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
