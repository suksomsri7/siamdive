// Lightweight date detector for the first conversation turn — when slots
// haven't been persisted yet, the AI's slot-extraction tool fires DURING the
// response stream, which is too late to influence the RAG/system prompt that
// was already assembled. This regex pass gives the chat route a best-effort
// "from"/"to" hint so trip recommendations on turn 1 already respect the
// user's date intent.
//
// We deliberately keep this conservative: it only returns a date when the
// user wrote something unambiguous. The model still runs full extraction
// afterwards via update_slots, which can override / refine.

const TH_MONTHS: Record<string, number> = {
  // full names
  "มกราคม": 1, "กุมภาพันธ์": 2, "มีนาคม": 3, "เมษายน": 4,
  "พฤษภาคม": 5, "มิถุนายน": 6, "กรกฎาคม": 7, "สิงหาคม": 8,
  "กันยายน": 9, "ตุลาคม": 10, "พฤศจิกายน": 11, "ธันวาคม": 12,
  // abbreviations (with dot)
  "ม.ค.": 1, "ก.พ.": 2, "มี.ค.": 3, "เม.ย.": 4, "พ.ค.": 5, "มิ.ย.": 6,
  "ก.ค.": 7, "ส.ค.": 8, "ก.ย.": 9, "ต.ค.": 10, "พ.ย.": 11, "ธ.ค.": 12,
};

const EN_MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
  apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7,
  aug: 8, august: 8, sep: 9, sept: 9, september: 9,
  oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
};

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function isoFrom(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${year}-${pad(month)}-${pad(day)}`;
}

function pickYear(now: Date, month: number, day: number): number {
  // Pick the closest future occurrence — if the date already passed this
  // year, roll forward to next year.
  const thisYear = now.getUTCFullYear();
  const candidate = new Date(Date.UTC(thisYear, month - 1, day));
  if (candidate.getTime() < now.getTime() - 86_400_000) return thisYear + 1;
  return thisYear;
}

export type DateHint = { from: string; to?: string; label?: string };

export function extractDateHint(text: string, now: Date = new Date()): DateHint | null {
  if (!text) return null;
  const lower = text.toLowerCase();

  // 1. ISO YYYY-MM-DD
  const iso = lower.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
  if (iso) {
    const d = isoFrom(+iso[1], +iso[2], +iso[3]);
    if (d) return { from: d };
  }

  // 2. Slash dates D/M/YYYY or D/M (defaults to current/next year)
  const slash = lower.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?\b/);
  if (slash) {
    const day = +slash[1], month = +slash[2];
    const year = slash[3] ? +slash[3] : pickYear(now, month, day);
    const d = isoFrom(year, month, day);
    if (d) return { from: d };
  }

  // 3. Thai abbreviation: "23 พ.ค." / "23 พ.ค. 2026"
  const thAbbr = text.match(/(\d{1,2})\s*(ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.)\s*(\d{4})?/);
  if (thAbbr) {
    const day = +thAbbr[1];
    const month = TH_MONTHS[thAbbr[2]];
    let year = thAbbr[3] ? +thAbbr[3] : pickYear(now, month, day);
    // Normalize Buddhist-Era years (e.g. 2569) to Gregorian.
    if (year > 2400) year -= 543;
    const d = isoFrom(year, month, day);
    if (d) return { from: d, label: `${day} ${thAbbr[2]} ${year}` };
  }

  // 4. Thai full month name
  const thFull = text.match(/(\d{1,2})\s*(มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม)\s*(\d{4})?/);
  if (thFull) {
    const day = +thFull[1];
    const month = TH_MONTHS[thFull[2]];
    let year = thFull[3] ? +thFull[3] : pickYear(now, month, day);
    if (year > 2400) year -= 543;
    const d = isoFrom(year, month, day);
    if (d) return { from: d, label: `${day} ${thFull[2]} ${year}` };
  }

  // 5. "วันที่ 23 เดือนนี้" / "23 เดือนนี้" → day-this-month
  const thThisMonth = text.match(/(?:วันที่\s*)?(\d{1,2})\s*เดือนนี้/);
  if (thThisMonth) {
    const day = +thThisMonth[1];
    const month = now.getUTCMonth() + 1;
    let year = now.getUTCFullYear();
    // If the day is in the past relative to today, assume next month.
    if (day < now.getUTCDate()) {
      const nextMonth = month === 12 ? 1 : month + 1;
      year = month === 12 ? year + 1 : year;
      const d = isoFrom(year, nextMonth, day);
      if (d) return { from: d };
    }
    const d = isoFrom(year, month, day);
    if (d) return { from: d };
  }

  // 6. English: "May 23" or "23 May" with optional year
  const enMd = lower.match(/\b(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\s+(\d{1,2})(?:[, ]\s*(\d{4}))?\b/);
  if (enMd) {
    const month = EN_MONTHS[enMd[1]];
    const day = +enMd[2];
    const year = enMd[3] ? +enMd[3] : pickYear(now, month, day);
    const d = isoFrom(year, month, day);
    if (d) return { from: d };
  }
  const enDm = lower.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)(?:[, ]\s*(\d{4}))?\b/);
  if (enDm) {
    const day = +enDm[1];
    const month = EN_MONTHS[enDm[2]];
    const year = enDm[3] ? +enDm[3] : pickYear(now, month, day);
    const d = isoFrom(year, month, day);
    if (d) return { from: d };
  }

  return null;
}
