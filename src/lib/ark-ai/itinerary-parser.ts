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
