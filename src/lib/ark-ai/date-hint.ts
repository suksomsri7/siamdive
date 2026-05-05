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

function lastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function monthRange(year: number, month: number, label: string): DateHint {
  const last = lastDayOfMonth(year, month);
  return {
    from: `${year}-${pad(month)}-01`,
    to: `${year}-${pad(month)}-${pad(last)}`,
    label,
  };
}

const TH_MONTH_NAMES_FULL = "มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม";
const TH_MONTH_NAMES_ABBR = "ม\\.ค\\.|ก\\.พ\\.|มี\\.ค\\.|เม\\.ย\\.|พ\\.ค\\.|มิ\\.ย\\.|ก\\.ค\\.|ส\\.ค\\.|ก\\.ย\\.|ต\\.ค\\.|พ\\.ย\\.|ธ\\.ค\\.";

export function extractDateHint(text: string, now: Date = new Date()): DateHint | null {
  if (!text) return null;
  const lower = text.toLowerCase();

  // ──────────────────────────────────────────────────────────────────
  // Relative phrases first — these are what users actually say in chat
  // ("เดือนหน้า", "next month", "พรุ่งนี้") and our earlier date regex
  // missed all of them, sending the AI the full unfiltered catalog.
  // ──────────────────────────────────────────────────────────────────

  const todayY = now.getUTCFullYear();
  const todayM = now.getUTCMonth() + 1;
  const todayD = now.getUTCDate();
  const isoToday = `${todayY}-${pad(todayM)}-${pad(todayD)}`;

  // "วันนี้" / "today"
  if (/วันนี้|\btoday\b/.test(lower)) {
    return { from: isoToday, label: "วันนี้" };
  }

  // "พรุ่งนี้" / "tomorrow"
  if (/พรุ่งนี้|\btomorrow\b/.test(lower)) {
    const t = new Date(now.getTime() + 86_400_000);
    return { from: t.toISOString().slice(0, 10), label: "พรุ่งนี้" };
  }

  // "มะรืน(นี้)" / "day after tomorrow"
  if (/มะรืน|day\s+after\s+tomorrow/.test(lower)) {
    const t = new Date(now.getTime() + 2 * 86_400_000);
    return { from: t.toISOString().slice(0, 10), label: "มะรืนนี้" };
  }

  // "อาทิตย์หน้า" / "สัปดาห์หน้า" / "next week" → 7-day window starting +7d
  if (/อาทิตย์หน้า|สัปดาห์หน้า|next\s+week/.test(lower)) {
    const start = new Date(now.getTime() + 7 * 86_400_000);
    const end = new Date(now.getTime() + 13 * 86_400_000);
    return {
      from: start.toISOString().slice(0, 10),
      to: end.toISOString().slice(0, 10),
      label: "อาทิตย์หน้า",
    };
  }

  // "ต้นเดือนหน้า" — first 10 days of next month (must come BEFORE the
  // bare "เดือนหน้า" check, otherwise the broader pattern wins)
  if (/ต้นเดือนหน้า/.test(lower)) {
    const nextM = todayM === 12 ? 1 : todayM + 1;
    const nextY = todayM === 12 ? todayY + 1 : todayY;
    return {
      from: `${nextY}-${pad(nextM)}-01`,
      to: `${nextY}-${pad(nextM)}-10`,
      label: "ต้นเดือนหน้า",
    };
  }

  // "เดือนหน้า" / "เดือนถัดไป" / "next month" → full next month
  if (/เดือนหน้า|เดือนถัดไป|next\s+month/.test(lower)) {
    const nextM = todayM === 12 ? 1 : todayM + 1;
    const nextY = todayM === 12 ? todayY + 1 : todayY;
    return monthRange(nextY, nextM, "เดือนหน้า");
  }

  // "ปลายเดือน(นี้)" — last 10 days of current month
  if (/ปลายเดือน(?!หน้า)/.test(lower)) {
    const last = lastDayOfMonth(todayY, todayM);
    return {
      from: `${todayY}-${pad(todayM)}-${pad(Math.max(1, last - 9))}`,
      to: `${todayY}-${pad(todayM)}-${pad(last)}`,
      label: "ปลายเดือนนี้",
    };
  }

  // "เดือนนี้" alone (no day number) — remainder of this month
  if (/เดือนนี้/.test(lower) && !/\d{1,2}\s*เดือนนี้/.test(text)) {
    const last = lastDayOfMonth(todayY, todayM);
    return {
      from: isoToday,
      to: `${todayY}-${pad(todayM)}-${pad(last)}`,
      label: "เดือนนี้",
    };
  }

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

  // 3. Thai abbreviation: "23 พ.ค." / "23 พ.ค. 2026" / "23 พค" / "23พค."
  // Real users skip the dots constantly. Accept optional dot after each
  // consonant, optional spaces. We canonicalize by stripping non-letters
  // before lookup. Word boundary matters less in Thai — anchor on the
  // digit + optional space + 1-3 Thai consonants from the month set.
  const thAbbrLetters = "มคกพมีคเมยพคมิยกคสคกยตคพยธค"; // letters that appear in TH abbr months
  const thAbbrRe = new RegExp(
    `(?:วันที่\\s*)?(\\d{1,2})\\s*(ม\\.?\\s*ค\\.?|ก\\.?\\s*พ\\.?|มี\\.?\\s*ค\\.?|เม\\.?\\s*ย\\.?|พ\\.?\\s*ค\\.?|มิ\\.?\\s*ย\\.?|ก\\.?\\s*ค\\.?|ส\\.?\\s*ค\\.?|ก\\.?\\s*ย\\.?|ต\\.?\\s*ค\\.?|พ\\.?\\s*ย\\.?|ธ\\.?\\s*ค\\.?)\\s*(\\d{4})?`
  );
  void thAbbrLetters;
  const thAbbr = text.match(thAbbrRe);
  if (thAbbr) {
    const day = +thAbbr[1];
    // Canonicalize the month token by stripping dots + whitespace, then
    // re-inserting dots so it matches our TH_MONTHS keys ("พ.ค.").
    const stripped = thAbbr[2].replace(/[\s.]/g, "");
    const canonical = stripped.length === 2
      ? `${stripped[0]}.${stripped[1]}.`
      : stripped.length === 3
        ? `${stripped[0]}${stripped[1]}.${stripped[2]}.` // มีค → มี.ค., เมย → เม.ย.
        : stripped;
    const month = TH_MONTHS[canonical];
    if (month) {
      let year = thAbbr[3] ? +thAbbr[3] : pickYear(now, month, day);
      // Normalize Buddhist-Era years (e.g. 2569) to Gregorian.
      if (year > 2400) year -= 543;
      const d = isoFrom(year, month, day);
      if (d) return { from: d, label: `${day} ${canonical} ${year}` };
    }
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

  // 5b. Bare "วันที่ X" (no month, no "เดือนนี้") → infer current month if
  // day still in the future, else next month. Real users frequently type
  // "ภูเก็ตวันที่ 23" assuming the AI knows what month they mean. Without
  // this branch, the regex returns null and the chat route hands the AI
  // the full catalog including boats with no schedule that day.
  const thBareDay = text.match(/วันที่\s*(\d{1,2})\b(?!\s*[\/\-\.])/);
  if (thBareDay) {
    const day = +thBareDay[1];
    if (day >= 1 && day <= 31) {
      let month = todayM;
      let year = todayY;
      if (day < todayD) {
        month = todayM === 12 ? 1 : todayM + 1;
        year = todayM === 12 ? todayY + 1 : todayY;
      }
      const d = isoFrom(year, month, day);
      if (d) return { from: d, label: `วันที่ ${day}` };
    }
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

  // ──────────────────────────────────────────────────────────────────
  // Bare month names — "ดำน้ำเดือนมิถุนายน", "ในมิ.ย.", "in June"
  // Returns the FULL month range so the AI can recommend any boat
  // running that month. Always rolls forward to the next occurrence
  // when the month has already passed this year.
  // ──────────────────────────────────────────────────────────────────
  const thBareFull = text.match(new RegExp(`(?:เดือน\\s*)?(${TH_MONTH_NAMES_FULL})\\s*(\\d{4})?`));
  if (thBareFull) {
    const month = TH_MONTHS[thBareFull[1]];
    let year = thBareFull[2] ? +thBareFull[2] : todayY;
    if (year > 2400) year -= 543;
    if (!thBareFull[2] && month < todayM) year = todayY + 1;
    return monthRange(year, month, `เดือน${thBareFull[1]} ${year}`);
  }

  const thBareAbbr = text.match(new RegExp(`(?:เดือน\\s*)?(${TH_MONTH_NAMES_ABBR})\\s*(\\d{4})?`));
  if (thBareAbbr) {
    const month = TH_MONTHS[thBareAbbr[1]];
    let year = thBareAbbr[2] ? +thBareAbbr[2] : todayY;
    if (year > 2400) year -= 543;
    if (!thBareAbbr[2] && month < todayM) year = todayY + 1;
    return monthRange(year, month, `เดือน${thBareAbbr[1]} ${year}`);
  }

  const enBare = lower.match(/\b(?:in\s+)?(january|february|march|april|may|june|july|august|september|october|november|december)\s*(\d{4})?\b/);
  if (enBare) {
    const month = EN_MONTHS[enBare[1]];
    let year = enBare[2] ? +enBare[2] : todayY;
    if (!enBare[2] && month < todayM) year = todayY + 1;
    return monthRange(year, month, `${enBare[1]} ${year}`);
  }

  return null;
}
