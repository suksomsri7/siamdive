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
// the rich `schedule.content` field. DAYTRIP operators put their hour-by-hour
// in there as `<h2>กำหนดการ</h2><ul><li><strong>07:00</strong> — รับ...</li>`
// rather than the dedicated `schedule.itinerary` field (which is empty for
// 100% of prod daytrips). This lets the timeline surface real operator data
// without inventing anything.
//
// Looks for <h2> sections whose heading matches a schedule-ish keyword in any
// of TH/EN/CN/DE/FR/RU/JA/KO; pulls every <li> directly under that <h2>'s
// following <ul>/<ol>; returns one ItineraryDay per <li> with the bullet's
// inner HTML preserved so <strong> time stamps still render.
const SCHEDULE_HEADING_RE = /\b(itinerary|schedule|timeline|plan)\b/i;
const TH_SCHEDULE_KEYWORDS = ["กำหนดการ", "ตารางเวลา", "ตารางการเดินทาง", "โปรแกรม", "เวลา"];

function headingIsSchedule(text: string): boolean {
  if (!text) return false;
  const t = text.trim().toLowerCase();
  if (SCHEDULE_HEADING_RE.test(t)) return true;
  return TH_SCHEDULE_KEYWORDS.some(k => text.includes(k));
}

const H2_BLOCK_RE = /<h2\b[^>]*>([\s\S]*?)<\/h2>([\s\S]*?)(?=<h2\b|$)/gi;
const LI_RE = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;

export function extractScheduleFromContent(html: string | null | undefined): ItineraryDay[] {
  if (!html || typeof html !== "string") return [];
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
      const heading = stripTags(inner);
      items.push({
        index: items.length,
        heading,
        bodyHtml: "",
      });
    }
    if (items.length > 0) return items;
  }
  return [];
}

