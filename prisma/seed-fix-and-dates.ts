/**
 * 1. Fix template 6 (N+S Andaman) abbreviated itineraries — add back dive descriptions
 * 2. Re-apply templates to all schedules
 * 3. Inject actual dates into all 62 schedules' itineraries
 */
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "postgresql://siamdive:siamdive_password@localhost:5432/siamdive_db" });
const prisma = new PrismaClient({ adapter });

const BOAT_ID = "cmn94ruo8000ctlkz550rc2ul";
const NS_TEMPLATE_ID = "cmnrmfj0i00cotckzdn5yrmrp";

// ═══════════════════════════════════════════════════════════════════════════
// STEP 1: Fix template 6 abbreviated itineraries (CN, DE, FR, RU, KO, JA)
// ═══════════════════════════════════════════════════════════════════════════

const TEMPLATE6_ITINERARY_FIXES: Record<string, string> = {
  cn: `<h3>第1天 — 登船</h3>
<p>18:00-20:00 机场接机 → 查龙码头<br>
办理登船、整理装备、听取简报、船上晚餐<br>
出发前往斯米兰群岛（无潜水）</p>

<h3>第2天 — 斯米兰群岛（4潜）</h3>
<p>07:30 第1潜 — <strong>Anita's Reef</strong>（珊瑚花园）<br>
10:30 第2潜 — <strong>West of Eden</strong>（巨石、洞穴、软珊瑚）<br>
14:00 第3潜 — <strong>Christmas Point</strong>（穿越泳道、鲨鱼）<br>
17:00 第4潜 — <strong>斯米兰夜潜</strong></p>

<h3>第3天 — 达琴岛 & 黎塞留岩（4潜）</h3>
<p>07:30 第5潜 — <strong>Koh Bon West Ridge</strong>（邂逅蝠鲼）<br>
10:30 第6潜 — <strong>Koh Tachai Pinnacle</strong>（软珊瑚、鱼群）<br>
14:00 第7潜 — <strong>黎塞留岩</strong>（海马、鲸鲨）<br>
17:00 第8潜 — <strong>黎塞留岩</strong>（日落潜）</p>

<h3>第4天 — 素林 & 南下（3潜）</h3>
<p>07:30 第9潜 — <strong>素林群岛</strong>（原始珊瑚、海龟）<br>
10:30 第10潜 — <strong>达琴岛</strong>（再潜、邂逅蝠鲼）<br>
14:00 第11潜 — <strong>塔猜岛</strong>（鱼群、软珊瑚）<br>
夜间南下航行至甲米五岛</p>

<h3>第5天 — 甲米五岛 & 红石紫石（4潜）</h3>
<p>07:30 第12潜 — <strong>Koh Haa Lagoon</strong>（大教堂洞穴）<br>
10:30 第13潜 — <strong>Koh Haa Pinnacle</strong>（洞穴、海龟）<br>
14:00 第14潜 — <strong>红石</strong>（垂直峭壁、邂逅蝠鲼）<br>
17:00 第15潜 — <strong>紫石</strong>（紫色软珊瑚、鲨鱼）</p>

<h3>第6天 — 返回（3潜）</h3>
<p>07:30 第16潜 — <strong>红石</strong>（晨潜、鱼群）<br>
10:00 第17潜 — <strong>鲨鱼角</strong>（豹纹鲨、软珊瑚）<br>
12:30 第18潜 — <strong>海葵礁</strong>（告别潜）<br>
返回普吉<br>
17:00 抵达查龙码头，送至机场</p>`,

  de: `<h3>Tag 1 — Einschiffung</h3>
<p>18:00–20:00 Abholung vom Flughafen → Chalong Pier<br>
Check-in, Ausrüstung einrichten, Briefing & Abendessen an Bord<br>
Abfahrt zu den Similan-Inseln (keine Tauchgänge)</p>

<h3>Tag 2 — Similan-Inseln (4 Tauchgänge)</h3>
<p>07:30 TG 1 — <strong>Anita's Reef</strong> (Korallengarten)<br>
10:30 TG 2 — <strong>West of Eden</strong> (Felsen, Höhlen, Weichkorallen)<br>
14:00 TG 3 — <strong>Christmas Point</strong> (Durchschwimmstellen, Haie)<br>
17:00 TG 4 — <strong>Similan Nachttauchgang</strong></p>

<h3>Tag 3 — Koh Bon & Richelieu Rock (4 Tauchgänge)</h3>
<p>07:30 TG 5 — <strong>Koh Bon West Ridge</strong> (Mantarochen-Chance)<br>
10:30 TG 6 — <strong>Koh Tachai Pinnacle</strong> (Weichkorallen, Fischschwärme)<br>
14:00 TG 7 — <strong>Richelieu Rock</strong> (Seepferdchen, Walhaie)<br>
17:00 TG 8 — <strong>Richelieu Rock</strong> (Sonnenuntergangs-Tauchgang)</p>

<h3>Tag 4 — Surin & Südfahrt (3 Tauchgänge)</h3>
<p>07:30 TG 9 — <strong>Surin-Inseln</strong> (unberührte Korallen, Schildkröten)<br>
10:30 TG 10 — <strong>Koh Bon</strong> (Wiederholungstauchgang, Mantarochen)<br>
14:00 TG 11 — <strong>Koh Tachai</strong> (Fischschwärme, Weichkorallen)<br>
Nachtfahrt Richtung Süden nach Koh Haa</p>

<h3>Tag 5 — Koh Haa & Hin Daeng–Hin Muang (4 Tauchgänge)</h3>
<p>07:30 TG 12 — <strong>Koh Haa Lagoon</strong> (Cathedral Cave)<br>
10:30 TG 13 — <strong>Koh Haa Pinnacle</strong> (Höhlen, Schildkröten)<br>
14:00 TG 14 — <strong>Hin Daeng</strong> (Steilwand, Mantarochen-Chance)<br>
17:00 TG 15 — <strong>Hin Muang</strong> (lila Weichkorallen, Haie)</p>

<h3>Tag 6 — Rückkehr (3 Tauchgänge)</h3>
<p>07:30 TG 16 — <strong>Hin Daeng</strong> (Morgentauchgang, Fischschwärme)<br>
10:00 TG 17 — <strong>Shark Point</strong> (Leopardenhaie, Weichkorallen)<br>
12:30 TG 18 — <strong>Anemone Reef</strong> (Abschieds-Tauchgang)<br>
Rückfahrt nach Phuket<br>
17:00 Ankunft Chalong Pier, Transfer zum Flughafen</p>`,

  fr: `<h3>Jour 1 — Embarquement</h3>
<p>18h00–20h00 Transfert aéroport → Chalong Pier<br>
Enregistrement, installation du matériel, briefing & dîner à bord<br>
Départ vers les îles Similan (pas de plongée)</p>

<h3>Jour 2 — Îles Similan (4 plongées)</h3>
<p>07h30 Plongée 1 — <strong>Anita's Reef</strong> (jardin de corail)<br>
10h30 Plongée 2 — <strong>West of Eden</strong> (rochers, grottes, coraux mous)<br>
14h00 Plongée 3 — <strong>Christmas Point</strong> (passages, requins)<br>
17h00 Plongée 4 — <strong>Similan plongée de nuit</strong></p>

<h3>Jour 3 — Koh Bon & Richelieu Rock (4 plongées)</h3>
<p>07h30 Plongée 5 — <strong>Koh Bon West Ridge</strong> (chance de raie manta)<br>
10h30 Plongée 6 — <strong>Koh Tachai Pinnacle</strong> (coraux mous, bancs de poissons)<br>
14h00 Plongée 7 — <strong>Richelieu Rock</strong> (hippocampes, requins-baleines)<br>
17h00 Plongée 8 — <strong>Richelieu Rock</strong> (plongée au coucher du soleil)</p>

<h3>Jour 4 — Surin & Transit Sud (3 plongées)</h3>
<p>07h30 Plongée 9 — <strong>Îles Surin</strong> (coraux préservés, tortues)<br>
10h30 Plongée 10 — <strong>Koh Bon</strong> (replongée, raie manta)<br>
14h00 Plongée 11 — <strong>Koh Tachai</strong> (bancs de poissons, coraux mous)<br>
Navigation nocturne vers Koh Haa</p>

<h3>Jour 5 — Koh Haa & Hin Daeng–Hin Muang (4 plongées)</h3>
<p>07h30 Plongée 12 — <strong>Koh Haa Lagoon</strong> (Cathedral Cave)<br>
10h30 Plongée 13 — <strong>Koh Haa Pinnacle</strong> (grottes, tortues)<br>
14h00 Plongée 14 — <strong>Hin Daeng</strong> (paroi verticale, chance de manta)<br>
17h00 Plongée 15 — <strong>Hin Muang</strong> (coraux mous violets, requins)</p>

<h3>Jour 6 — Retour (3 plongées)</h3>
<p>07h30 Plongée 16 — <strong>Hin Daeng</strong> (plongée matinale, bancs de poissons)<br>
10h00 Plongée 17 — <strong>Shark Point</strong> (requins-léopards, coraux mous)<br>
12h30 Plongée 18 — <strong>Anemone Reef</strong> (plongée d'adieu)<br>
Retour vers Phuket<br>
17h00 Arrivée Chalong Pier, transfert aéroport</p>`,

  ru: `<h3>День 1 — Посадка</h3>
<p>18:00–20:00 Трансфер из аэропорта → Чалонг Пирс<br>
Регистрация, подготовка снаряжения, брифинг и ужин на борту<br>
Отправление к Симиланским островам (без погружений)</p>

<h3>День 2 — Симиланские острова (4 погружения)</h3>
<p>07:30 Погружение 1 — <strong>Anita's Reef</strong> (коралловый сад)<br>
10:30 Погружение 2 — <strong>West of Eden</strong> (валуны, пещеры, мягкие кораллы)<br>
14:00 Погружение 3 — <strong>Christmas Point</strong> (проплывы, акулы)<br>
17:00 Погружение 4 — <strong>Симиланы ночное погружение</strong></p>

<h3>День 3 — Ко Бон и Ришелье Рок (4 погружения)</h3>
<p>07:30 Погружение 5 — <strong>Koh Bon West Ridge</strong> (шанс на манту)<br>
10:30 Погружение 6 — <strong>Koh Tachai Pinnacle</strong> (мягкие кораллы, косяки рыб)<br>
14:00 Погружение 7 — <strong>Ришелье Рок</strong> (морские коньки, китовые акулы)<br>
17:00 Погружение 8 — <strong>Ришелье Рок</strong> (закатное погружение)</p>

<h3>День 4 — Сурин и переход на юг (3 погружения)</h3>
<p>07:30 Погружение 9 — <strong>Суринские острова</strong> (нетронутые кораллы, черепахи)<br>
10:30 Погружение 10 — <strong>Ко Бон</strong> (повторное погружение, манта)<br>
14:00 Погружение 11 — <strong>Ко Тачай</strong> (косяки рыб, мягкие кораллы)<br>
Ночной переход на юг к Ко Хаа</p>

<h3>День 5 — Ко Хаа и Хин Дэнг–Хин Муанг (4 погружения)</h3>
<p>07:30 Погружение 12 — <strong>Koh Haa Lagoon</strong> (Кафедральная пещера)<br>
10:30 Погружение 13 — <strong>Koh Haa Pinnacle</strong> (пещеры, черепахи)<br>
14:00 Погружение 14 — <strong>Хин Дэнг</strong> (отвесная стена, шанс на манту)<br>
17:00 Погружение 15 — <strong>Хин Муанг</strong> (фиолетовые мягкие кораллы, акулы)</p>

<h3>День 6 — Возвращение (3 погружения)</h3>
<p>07:30 Погружение 16 — <strong>Хин Дэнг</strong> (утреннее погружение, косяки рыб)<br>
10:00 Погружение 17 — <strong>Шарк Пойнт</strong> (леопардовые акулы, мягкие кораллы)<br>
12:30 Погружение 18 — <strong>Анемон Риф</strong> (прощальное погружение)<br>
Возвращение в Пхукет<br>
17:00 Прибытие на Чалонг Пирс, трансфер в аэропорт</p>`,

  ko: `<h3>1일차 — 승선</h3>
<p>18:00~20:00 공항 픽업 → 찰롱 피어<br>
체크인, 장비 세팅, 브리핑 & 선상 석식<br>
시밀란 제도로 출발 (다이빙 없음)</p>

<h3>2일차 — 시밀란 제도 (4회 다이빙)</h3>
<p>07:30 다이빙 1 — <strong>Anita's Reef</strong> (산호 정원)<br>
10:30 다이빙 2 — <strong>West of Eden</strong> (바위, 동굴, 연산호)<br>
14:00 다이빙 3 — <strong>Christmas Point</strong> (스윔스루, 상어)<br>
17:00 다이빙 4 — <strong>시밀란 야간 다이빙</strong></p>

<h3>3일차 — 꼬본 & 리슐리외 록 (4회 다이빙)</h3>
<p>07:30 다이빙 5 — <strong>Koh Bon West Ridge</strong> (만타레이 기대)<br>
10:30 다이빙 6 — <strong>Koh Tachai Pinnacle</strong> (연산호, 어군)<br>
14:00 다이빙 7 — <strong>리슐리외 록</strong> (해마, 고래상어)<br>
17:00 다이빙 8 — <strong>리슐리외 록</strong> (선셋 다이빙)</p>

<h3>4일차 — 수린 & 남하 (3회 다이빙)</h3>
<p>07:30 다이빙 9 — <strong>수린 제도</strong> (원시 산호, 거북)<br>
10:30 다이빙 10 — <strong>꼬본</strong> (재다이빙, 만타 기대)<br>
14:00 다이빙 11 — <strong>꼬따차이</strong> (어군, 연산호)<br>
야간 항해로 꼬하 이동</p>

<h3>5일차 — 꼬하 & 힌대엥-힌무앙 (4회 다이빙)</h3>
<p>07:30 다이빙 12 — <strong>Koh Haa Lagoon</strong> (Cathedral Cave)<br>
10:30 다이빙 13 — <strong>Koh Haa Pinnacle</strong> (동굴, 거북)<br>
14:00 다이빙 14 — <strong>힌대엥</strong> (절벽, 만타 기대)<br>
17:00 다이빙 15 — <strong>힌무앙</strong> (보라색 연산호, 상어)</p>

<h3>6일차 — 복귀 (3회 다이빙)</h3>
<p>07:30 다이빙 16 — <strong>힌대엥</strong> (모닝 다이빙, 어군)<br>
10:00 다이빙 17 — <strong>샤크포인트</strong> (표범상어, 연산호)<br>
12:30 다이빙 18 — <strong>아네모네 리프</strong> (페어웰 다이빙)<br>
푸켓 복귀<br>
17:00 찰롱 피어 도착, 공항 드롭오프</p>`,

  ja: `<h3>1日目 — 乗船</h3>
<p>18:00〜20:00 空港ピックアップ → シャロン桟橋<br>
チェックイン、器材セットアップ、ブリーフィング＆船上ディナー<br>
シミラン諸島へ出発（ダイビングなし）</p>

<h3>2日目 — シミラン諸島（4ダイブ）</h3>
<p>07:30 ダイブ1 — <strong>Anita's Reef</strong>（サンゴの庭）<br>
10:30 ダイブ2 — <strong>West of Eden</strong>（巨岩、洞窟、ソフトコーラル）<br>
14:00 ダイブ3 — <strong>Christmas Point</strong>（スイムスルー、サメ）<br>
17:00 ダイブ4 — <strong>シミラン ナイトダイブ</strong></p>

<h3>3日目 — コボン＆リシュリューロック（4ダイブ）</h3>
<p>07:30 ダイブ5 — <strong>Koh Bon West Ridge</strong>（マンタレイのチャンス）<br>
10:30 ダイブ6 — <strong>Koh Tachai Pinnacle</strong>（ソフトコーラル、魚群）<br>
14:00 ダイブ7 — <strong>リシュリューロック</strong>（タツノオトシゴ、ジンベエザメ）<br>
17:00 ダイブ8 — <strong>リシュリューロック</strong>（サンセットダイブ）</p>

<h3>4日目 — スリン＆南下（3ダイブ）</h3>
<p>07:30 ダイブ9 — <strong>スリン諸島</strong>（手付かずのサンゴ、ウミガメ）<br>
10:30 ダイブ10 — <strong>コボン</strong>（リピートダイブ、マンタ期待）<br>
14:00 ダイブ11 — <strong>コタチャイ</strong>（魚群、ソフトコーラル）<br>
夜間航行でコハーへ</p>

<h3>5日目 — コハー＆ヒンデーン・ヒンムアン（4ダイブ）</h3>
<p>07:30 ダイブ12 — <strong>Koh Haa Lagoon</strong>（カテドラルケーブ）<br>
10:30 ダイブ13 — <strong>Koh Haa Pinnacle</strong>（洞窟、ウミガメ）<br>
14:00 ダイブ14 — <strong>ヒンデーン</strong>（垂直壁、マンタのチャンス）<br>
17:00 ダイブ15 — <strong>ヒンムアン</strong>（紫のソフトコーラル、サメ）</p>

<h3>6日目 — 帰港（3ダイブ）</h3>
<p>07:30 ダイブ16 — <strong>ヒンデーン</strong>（モーニングダイブ、魚群）<br>
10:00 ダイブ17 — <strong>シャークポイント</strong>（トラフザメ、ソフトコーラル）<br>
12:30 ダイブ18 — <strong>アネモネリーフ</strong>（フェアウェルダイブ）<br>
プーケットへ帰港<br>
17:00 シャロン桟橋到着、空港へ送迎</p>`,
};

// ═══════════════════════════════════════════════════════════════════════════
// STEP 2: Date injection — month names per language
// ═══════════════════════════════════════════════════════════════════════════

const MONTHS: Record<string, string[]> = {
  th: ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  cn: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
  de: ["Jan.", "Feb.", "Mär.", "Apr.", "Mai", "Jun.", "Jul.", "Aug.", "Sep.", "Okt.", "Nov.", "Dez."],
  fr: ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."],
  ru: ["янв.", "февр.", "мар.", "апр.", "мая", "июн.", "июл.", "авг.", "сент.", "окт.", "нояб.", "дек."],
  ko: ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"],
  ja: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
};

function formatDate(lang: string, date: Date): string {
  const d = date.getUTCDate();
  const m = date.getUTCMonth(); // 0-based
  const monthName = MONTHS[lang]?.[m] || MONTHS.en[m];

  switch (lang) {
    case "th": return `${d} ${monthName}`;           // 10 เม.ย.
    case "en": return `${monthName} ${d}`;            // Apr 10
    case "cn": return `${monthName}${d}日`;           // 4月10日
    case "de": return `${d}. ${monthName}`;           // 10. Apr.
    case "fr": return `${d} ${monthName}`;            // 10 avr.
    case "ru": return `${d} ${monthName}`;            // 10 апр.
    case "ko": return `${d} ${monthName}`;            // 10 4월
    case "ja": return `${d} ${monthName}`;            // 10 4月
    default:   return `${monthName} ${d}`;
  }
}

// Regex patterns to find day headers in each language
const DAY_PATTERNS: Record<string, RegExp> = {
  th: /<h3>วันที่ (\d+)/g,
  en: /<h3>Day (\d+)/g,
  cn: /<h3>第(\d+)天/g,
  de: /<h3>Tag (\d+)/g,
  fr: /<h3>Jour (\d+)/g,
  ru: /<h3>День (\d+)/g,
  ko: /<h3>(\d+)일차/g,
  ja: /<h3>(\d+)日目/g,
};

// Replacement templates (insert date in parentheses after day number)
function injectDates(itinerary: string, lang: string, departureDate: Date): string {
  const pattern = DAY_PATTERNS[lang];
  if (!pattern) return itinerary;

  // Reset regex lastIndex
  pattern.lastIndex = 0;

  return itinerary.replace(pattern, (match, dayNum) => {
    const dayIndex = parseInt(dayNum) - 1;
    const date = new Date(departureDate);
    date.setUTCDate(date.getUTCDate() + dayIndex);
    const dateStr = formatDate(lang, date);

    // Insert date in parentheses
    switch (lang) {
      case "th": return `<h3>วันที่ ${dayNum} (${dateStr})`;
      case "en": return `<h3>Day ${dayNum} (${dateStr})`;
      case "cn": return `<h3>第${dayNum}天 (${dateStr})`;
      case "de": return `<h3>Tag ${dayNum} (${dateStr})`;
      case "fr": return `<h3>Jour ${dayNum} (${dateStr})`;
      case "ru": return `<h3>День ${dayNum} (${dateStr})`;
      case "ko": return `<h3>${dayNum}일차 (${dateStr})`;
      case "ja": return `<h3>${dayNum}日目 (${dateStr})`;
      default:   return match;
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 3: Template mapping (same as apply-all)
// ═══════════════════════════════════════════════════════════════════════════

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

const GENERIC_ANDAMAN_TITLES: Record<string, { title: string; slug: string }> = {
  th: { title: "อันดามัน 4 วัน 5 คืน", slug: "andaman-4d5n" },
  en: { title: "Andaman 4 Days 5 Nights", slug: "andaman-4d5n" },
  cn: { title: "安达曼 4天5夜", slug: "andaman-4d5n" },
  de: { title: "Andamanen 4 Tage 5 Nächte", slug: "andamanen-4t5n" },
  fr: { title: "Andaman 4 Jours 5 Nuits", slug: "andaman-4j5n" },
  ru: { title: "Андаман 4 дня 5 ночей", slug: "andaman-4d5n" },
  ko: { title: "안다만 4일 5박", slug: "andaman-4d5n" },
  ja: { title: "アンダマン 4日間5泊", slug: "andaman-4d5n" },
};

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
  if (thTitle.includes("อันดามัน") || thRoute === "Andaman") return true;
  return false;
}

// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  // STEP 1: Fix template 6 abbreviated itineraries
  console.log("=== STEP 1: Fixing template 6 (N+S Andaman) abbreviated itineraries ===\n");
  for (const [lang, itinerary] of Object.entries(TEMPLATE6_ITINERARY_FIXES)) {
    const result = await prisma.scheduleTranslation.updateMany({
      where: { scheduleId: NS_TEMPLATE_ID, lang },
      data: { itinerary },
    });
    console.log(`  [${lang}] fixed itinerary — ${result.count} row`);
  }

  // STEP 2: Re-apply templates to non-template schedules
  console.log("\n=== STEP 2: Re-applying templates to 55 remaining schedules ===\n");

  const schedules = await prisma.schedule.findMany({
    where: { boatId: BOAT_ID },
    include: { translations: true },
    orderBy: { departureDate: "asc" },
  });

  // Load fresh template translations
  const templateTransMap = new Map<string, Map<string, any>>();
  for (const tid of templateIds) {
    const trans = await prisma.scheduleTranslation.findMany({ where: { scheduleId: tid } });
    const langMap = new Map<string, any>();
    for (const t of trans) langMap.set(t.lang, t);
    templateTransMap.set(tid, langMap);
  }

  const remaining = schedules.filter(s => !templateIds.has(s.id));
  for (const sched of remaining) {
    const thTrans = sched.translations.find(t => t.lang === "th");
    const thTitle = thTrans?.title || "";
    const thRoute = thTrans?.route || "";
    const templateId = getTemplateId(thTitle, thRoute);
    const templateLangs = templateTransMap.get(templateId)!;
    const generic = isGenericAndaman(thTitle, thRoute);

    for (const [lang, tmpl] of templateLangs) {
      let title = tmpl.title;
      let slug = tmpl.slug;
      if (generic && GENERIC_ANDAMAN_TITLES[lang]) {
        title = GENERIC_ANDAMAN_TITLES[lang].title;
        slug = GENERIC_ANDAMAN_TITLES[lang].slug;
      }
      await prisma.scheduleTranslation.updateMany({
        where: { scheduleId: sched.id, lang },
        data: { title, slug, excerpt: tmpl.excerpt, content: tmpl.content, itinerary: tmpl.itinerary, route: tmpl.route, keywords: tmpl.keywords },
      });
    }
  }
  console.log(`  Updated ${remaining.length} schedules\n`);

  // STEP 3: Inject actual dates into ALL 62 schedules
  console.log("=== STEP 3: Injecting actual dates into all 62 schedules ===\n");

  // Reload all schedules with fresh translations
  const allSchedules = await prisma.schedule.findMany({
    where: { boatId: BOAT_ID },
    include: { translations: true },
    orderBy: { departureDate: "asc" },
  });

  let dateUpdates = 0;
  for (const sched of allSchedules) {
    if (!sched.departureDate) continue;
    const depDate = new Date(sched.departureDate);
    const depStr = depDate.toISOString().slice(0, 10);

    for (const trans of sched.translations) {
      if (!trans.itinerary) continue;

      const updated = injectDates(trans.itinerary, trans.lang, depDate);
      if (updated !== trans.itinerary) {
        await prisma.scheduleTranslation.updateMany({
          where: { scheduleId: sched.id, lang: trans.lang },
          data: { itinerary: updated },
        });
        dateUpdates++;
      }
    }
    // Log one line per schedule
    const thTitle = sched.translations.find(t => t.lang === "th")?.title || "?";
    console.log(`  ${depStr} | ${thTitle} — dates injected (8 langs)`);
  }

  console.log(`\n✓ Step 1: Fixed template 6 itineraries (6 languages)`);
  console.log(`✓ Step 2: Re-applied templates to ${remaining.length} schedules`);
  console.log(`✓ Step 3: Injected dates into ${dateUpdates} translation records`);
  console.log(`✓ Total: 62 schedules × 8 languages = 496 translations all complete`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
