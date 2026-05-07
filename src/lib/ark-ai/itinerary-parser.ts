// Parse the operator-written `Schedule.translations.itinerary` HTML field
// into an ordered list of day blocks. The DB convention is:
//
//   <h3>10 เม.ย. — ลงเรือ</h3>
//   <p>18:00-20:00 ... <br> ...</p>
//   <h3>11 เม.ย. — เกาะ Bon</h3>
//   <p>...</p>
//
// We split on every <h3> and pair the heading text with the HTML chunk
// that follows it. The result drives the day-grouped Timeline view in
// the plan: each entry becomes one "Day N" card with the operator's
// activity body intact.
//
// Rules:
//  - Empty / non-h3 input → returns [] (caller falls back to a single
//    block render)
//  - Heading text is plain text — strip nested tags
//  - Body keeps all inline HTML (operators rely on <strong>, <br>, <a>)

export type ItineraryDay = {
  /** 0-based index in the order they appear */
  index: number;
  /** Heading text, plain. e.g. "10 เม.ย. — ลงเรือ" */
  heading: string;
  /** Inner HTML between this <h3> and the next */
  bodyHtml: string;
};

const H3_PATTERN = /<h3\b[^>]*>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h3\b|$)/gi;

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

export function parseItinerary(html: string | null | undefined): ItineraryDay[] {
  if (!html || typeof html !== "string") return [];
  const out: ItineraryDay[] = [];
  let m: RegExpExecArray | null;
  H3_PATTERN.lastIndex = 0;
  while ((m = H3_PATTERN.exec(html)) !== null) {
    const heading = stripTags(m[1]);
    const bodyHtml = m[2].trim();
    if (!heading && !bodyHtml) continue;
    out.push({ index: out.length, heading, bodyHtml });
  }
  return out;
}

// Extract the operator's "กำหนดการ" / "Schedule" / "Itinerary" section from
// the rich `schedule.content` field. There are two structural conventions in
// prod data:
//
//  1. DAYTRIP — `<h2>กำหนดการ</h2><ul><li><strong>07:00</strong> — รับ...</li>`
//  2. LIVEABOARD (h3-only) — `<h3>โปรแกรมรายวัน (Itinerary)</h3>` followed
//     by sibling `<h3>15 เม.ย. — ลงเรือ</h3><p>...</p>` day cards, ended
//     by section h3s like `รวมในราคา`, `ไม่รวมในราคา`, `ข้อมูลท่าเรือ`,
//     `หมายเหตุ`. Several prod liveaboards (Orca Oktavia, Tapana) leave the
//     dedicated `schedule.itinerary` field empty and live entirely in this
//     content shape.
//
// We try the h2/list path first (matches all daytrips). If nothing comes back,
// we fall back to the h3-section path. Returns ItineraryDay[] — one per
// bullet (daytrip) or one per day h3 (liveaboard). Without this fallback the
// timeline rendered empty for ~150 liveaboard schedules even though the same
// content drove the schedule detail page just fine.
const SCHEDULE_HEADING_RE = /\b(itinerary|schedule|timeline|plan|tagesablauf|programme|programm)\b/i;
// Schedule-section heading keywords across all 8 supported languages. The
// operator-written content uses these as the H2 above the day-by-day or
// hour-by-hour list. Without each language present here, parseItinerary()
// returns an empty array for that language and PlanTimeline shows nothing.
const SCHEDULE_KEYWORDS_MULTILANG = [
  // th
  "กำหนดการ", "ตารางเวลา", "ตารางการเดินทาง", "โปรแกรม", "เวลา",
  // cn (Simplified)
  "行程", "日程", "时间表",
  // ja
  "スケジュール", "日程", "行程",
  // ko
  "일정", "스케줄", "프로그램",
  // de (also matched by regex above)
  "Tagesablauf", "Programm", "Zeitplan",
  // fr (also matched by regex above)
  "Programme", "Itinéraire",
  // ru
  "Программа", "Расписание", "Маршрут",
];

// Keywords that close out a day-h3 streak. The day h3s in prod look like
// "15 เม.ย. — ลงเรือ" / "16 ส.ค. — Check Out" / "Day 1 — Sail Rock". When we
// encounter an h3 whose heading matches these, we know the itinerary section
// ended and the operator moved on to ancillary info.
const NON_DAY_HEADING_RE = /\b(included|excluded|inclus|policy|cancel|note|info|highlight|dive\s*sites?|getting\s*there|transport|pickup|preparation|pricing|price|booking|contact|nicht\s*inklusive|inklusive|optionen|points\s*forts|включено)\b/i;
const NON_DAY_KEYWORDS_MULTILANG = [
  // th
  "รวมในราคา", "ไม่รวมในราคา", "รวมในแพ็กเกจ", "ไม่รวมในแพ็กเกจ", "รวม", "ไม่รวม",
  "บริการเสริม", "การรับ–ส่ง", "การรับส่ง", "ข้อมูลท่าเรือ", "ข้อควรทราบ", "หมายเหตุ",
  "นโยบาย", "การชำระเงิน", "เงื่อนไข", "ติดต่อ", "ไฮไลท์", "จุดดำน้ำ",
  // cn
  "亮点", "费用包含", "费用不含", "包含", "不包含", "额外服务", "额外", "注意",
  "联系", "政策", "取消", "支付", "交通", "接送",
  // ja
  "ハイライト", "料金に含まれるもの", "料金に含まれないもの", "含まれるもの", "含まれないもの",
  "オプション", "注意事項", "ご注意", "お問い合わせ", "キャンセル", "送迎",
  // ko
  "하이라이트", "포함 사항", "불포함 사항", "포함", "불포함", "추가 옵션",
  "추가", "유의사항", "주의", "취소", "연락", "픽업",
  // de
  "Highlights", "Inklusive", "Nicht inklusive", "Im Preis enthalten",
  "Zusätzliche Optionen", "Hinweise", "Stornierung", "Kontakt", "Transfer",
  // fr
  "Points forts", "Inclus", "Non inclus", "Options supplémentaires",
  "Notes", "Annulation", "Contact", "Transfert",
  // ru
  "Особенности", "Особенности тура", "Включено", "Не включено",
  "Дополнительные опции", "Примечания", "Отмена", "Контакты", "Трансфер",
];

function headingIsSchedule(text: string): boolean {
  if (!text) return false;
  const t = text.trim().toLowerCase();
  if (SCHEDULE_HEADING_RE.test(t)) return true;
  return SCHEDULE_KEYWORDS_MULTILANG.some(k => text.includes(k));
}

function headingIsNonDay(text: string): boolean {
  if (!text) return false;
  if (NON_DAY_HEADING_RE.test(text.toLowerCase())) return true;
  return NON_DAY_KEYWORDS_MULTILANG.some(k => text.includes(k));
}

const H2_BLOCK_RE = /<h2\b[^>]*>([\s\S]*?)<\/h2>([\s\S]*?)(?=<h2\b|$)/gi;
const H3_BLOCK_RE = /<h3\b[^>]*>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h3\b|$)/gi;
const LI_RE = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;

function extractFromH2(html: string): ItineraryDay[] {
  H2_BLOCK_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = H2_BLOCK_RE.exec(html)) !== null) {
    const headingText = stripTags(m[1]);
    if (!headingIsSchedule(headingText)) continue;
    const body = m[2];
    const items: ItineraryDay[] = [];
    LI_RE.lastIndex = 0;
    let li: RegExpExecArray | null;
    while ((li = LI_RE.exec(body)) !== null) {
      const inner = li[1].trim();
      if (!inner) continue;
      items.push({ index: items.length, heading: stripTags(inner), bodyHtml: "" });
    }
    if (items.length > 0) return items;
  }
  return [];
}

// Walk h3 blocks. Skip everything until we see one whose heading matches a
// schedule keyword (e.g. "โปรแกรมรายวัน (Itinerary)"). After that, every
// subsequent h3 is treated as a day until we hit a non-day heading
// (Included / Excluded / Notes / etc.) — at which point the streak ends.
function extractFromH3(html: string): ItineraryDay[] {
  H3_BLOCK_RE.lastIndex = 0;
  const blocks: { heading: string; bodyHtml: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = H3_BLOCK_RE.exec(html)) !== null) {
    blocks.push({ heading: stripTags(m[1]), bodyHtml: m[2].trim() });
  }
  const items: ItineraryDay[] = [];
  let inItinerary = false;
  for (const b of blocks) {
    if (!inItinerary) {
      if (headingIsSchedule(b.heading)) {
        inItinerary = true;
        // The "โปรแกรมรายวัน" h3 itself isn't a day — its body (if any) is
        // typically intro prose, skip it.
      }
      continue;
    }
    if (headingIsNonDay(b.heading)) break;
    items.push({ index: items.length, heading: b.heading, bodyHtml: b.bodyHtml });
  }
  return items;
}

export function extractScheduleFromContent(html: string | null | undefined): ItineraryDay[] {
  if (!html || typeof html !== "string") return [];
  const fromH2 = extractFromH2(html);
  if (fromH2.length > 0) return fromH2;
  return extractFromH3(html);
}

// Remove the operator's "กำหนดการ" / "Schedule" section from the rich content
// so the plan-detail view doesn't render the same itinerary that's already
// surfaced in the per-trip Day timeline above. We strip the EXACT block
// extractScheduleFromContent matched — h2 + its body up to next h2, or the
// h3-streak from the schedule h3 through the last day h3 (stopping before
// the next non-day section like "รวมในราคา").
export function stripScheduleFromContent(html: string | null | undefined): string {
  if (!html || typeof html !== "string") return "";
  // h2 path — drop the whole "<h2>กำหนดการ</h2>...<ul>...</ul>..." block.
  H2_BLOCK_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = H2_BLOCK_RE.exec(html)) !== null) {
    const headingText = stripTags(m[1]);
    if (headingIsSchedule(headingText)) {
      return (html.slice(0, m.index) + html.slice(m.index + m[0].length)).trim();
    }
  }
  // h3 path — drop from the schedule h3 (inclusive) up to but excluding the
  // first non-day h3 that closes the streak.
  H3_BLOCK_RE.lastIndex = 0;
  type Block = { heading: string; index: number; end: number };
  const blocks: Block[] = [];
  while ((m = H3_BLOCK_RE.exec(html)) !== null) {
    blocks.push({ heading: stripTags(m[1]), index: m.index, end: m.index + m[0].length });
  }
  let startIdx = -1;
  let inItin = false;
  let cutEnd = html.length;
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (!inItin) {
      if (headingIsSchedule(b.heading)) {
        inItin = true;
        startIdx = b.index;
      }
      continue;
    }
    if (headingIsNonDay(b.heading)) {
      cutEnd = b.index;
      break;
    }
  }
  if (startIdx < 0) return html;
  return (html.slice(0, startIdx) + html.slice(cutEnd)).trim();
}

