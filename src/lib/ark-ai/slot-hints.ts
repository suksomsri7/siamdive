// First-turn slot regex hints. The Anthropic/OpenAI tool call (`update_slots`)
// fires DURING the response stream, which is too late to influence the RAG
// block that was already assembled. For the most consequential slots — dates,
// headcount, region — we run a small pre-pass over the user's latest message
// so turn 1 already narrows correctly. The full LLM extractor still runs
// afterwards and can override / refine.
//
// Conservative by design: only return a value when the user wrote something
// unambiguous. False positives are worse than misses (the LLM cleans up).

import type { Headcount, Region } from "./slots";

// ── Headcount ────────────────────────────────────────────────────────────────
// Captures the most common phrasings the AI has historically missed when
// extracting silently. Each pattern returns adults (and optionally kids).
//
// Covered:
//   "2 คน" / "ไป 2 คน" / "เรา 2 คน" / "เราสอง" / "เราสองคน" / "พวกเรา 4 คน"
//   "two of us" / "the two of us" / "we are two" / "we're two" / "two people"
//   "2 ppl" / "2 ppls" / "2 people" / "2 person" / "2 persons" / "2 pax"
//   "couple" / "as a couple" / "ไปเป็นคู่" / "คู่รัก"  (= 2)
//   "solo" / "alone" / "ไปคนเดียว"  (= 1)
//   "พ่อแม่ลูก" (= 3) / "ครอบครัว 4 คน" (= 4)
//   "แฟน 2 คน" / "เรากับแฟน" (= 2)
//
// Returns Headcount | null. Does NOT touch the persisted slot — the chat
// route merges this with persisted state.

const TH_NUM_WORDS: Record<string, number> = {
  "หนึ่ง": 1, "สอง": 2, "สาม": 3, "สี่": 4, "ห้า": 5,
  "หก": 6, "เจ็ด": 7, "แปด": 8, "เก้า": 9, "สิบ": 10,
};
const EN_NUM_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
};

function parseNumeric(token: string): number | null {
  const direct = parseInt(token, 10);
  if (Number.isFinite(direct) && direct > 0 && direct < 100) return direct;
  const th = TH_NUM_WORDS[token];
  if (th) return th;
  const en = EN_NUM_WORDS[token.toLowerCase()];
  if (en) return en;
  return null;
}

export function extractHeadcountHint(msg: string): Headcount | null {
  if (!msg) return null;
  const m = msg;
  const lower = m.toLowerCase();

  // "ไปคนเดียว" / "solo" / "alone" / "by myself"
  if (/\b(solo|alone|by\s*myself|on\s*my\s*own)\b/i.test(lower)) return { adults: 1 };
  if (/(ไปคนเดียว|คนเดียว|เดี่ยว)/.test(m)) return { adults: 1 };

  // "couple" / "as a couple" / "ไปเป็นคู่" / "เราสองคน" / "two of us" / "the two of us"
  if (/\b(couple|as\s*a\s*couple|two\s*of\s*us|the\s*two\s*of\s*us|we\s*are\s*two|we['’]?re\s*two|just\s*two)\b/i.test(lower)) return { adults: 2 };
  if (/(เรา\s*สอง\s*คน|ไป\s*สอง\s*คน|เป็น\s*คู่|ไป\s*เป็น\s*คู่|คู่รัก|คู่ผม|คู่ฉัน|กับแฟน|กับ\s*แฟน|ไปกับแฟน)/.test(m)) return { adults: 2 };

  // "พ่อแม่ลูก" → 3 (parents + 1 child); user can override later
  if (/พ่อแม่ลูก/.test(m)) return { adults: 2, kids: 1 };

  // Numeric "N คน" / "N people" / "N pax" / "N ppl" / "N persons"
  // Capture optional kids modifier "+ N เด็ก" / "with N kids"
  const numericTh = m.match(/(?:^|\s|ไป|เรา|พวกเรา|กลุ่ม|ทีม)\s*([0-9๐-๙]{1,2}|หนึ่ง|สอง|สาม|สี่|ห้า|หก|เจ็ด|แปด|เก้า|สิบ)\s*คน/);
  if (numericTh) {
    const tokenRaw = numericTh[1];
    // Convert Thai digits if needed
    const token = tokenRaw.replace(/[๐-๙]/g, d => String("๐๑๒๓๔๕๖๗๘๙".indexOf(d)));
    const n = parseNumeric(token);
    if (n) {
      const kidsMatch = m.match(/(?:เด็ก|ลูก)\s*([0-9๐-๙]{1,2})\s*คน/);
      const kids = kidsMatch ? parseNumeric(kidsMatch[1].replace(/[๐-๙]/g, d => String("๐๑๒๓๔๕๖๗๘๙".indexOf(d)))) : null;
      const adults = kids != null && kids < n ? n - kids : n;
      return kids != null && kids > 0 ? { adults, kids } : { adults };
    }
  }

  const numericEn = lower.match(/(?:^|\s|we['’]?re|we\s*are|with|just|of\s*us)\s*([0-9]{1,2}|one|two|three|four|five|six|seven|eight|nine|ten)\s*(?:adults?|ppl|ppls|people|persons?|pax)\b/);
  if (numericEn) {
    const n = parseNumeric(numericEn[1]);
    if (n) {
      const kidsMatch = lower.match(/(?:with|and|plus|\+)\s*([0-9]{1,2}|one|two|three|four|five)\s*(?:kids?|child(?:ren)?)/);
      const kids = kidsMatch ? parseNumeric(kidsMatch[1]) : null;
      return kids ? { adults: n, kids } : { adults: n };
    }
  }

  // Bare "N คน" without a leading verb — last because it's noisy.
  // Skip unless the count is reasonable (1-15) so we don't catch
  // "ดำได้สูงสุด 30 คน" or similar capacity descriptions.
  const bareTh = m.match(/(^|[\s,.!?])([1-9]|1[0-5])\s*คน(?![ดำผ])/);
  if (bareTh) return { adults: parseInt(bareTh[2], 10) };

  return null;
}

// ── Region (cheap pre-pass) ──────────────────────────────────────────────────
// The LLM handles region well most of the time, but on first turn the
// extractor can't run before RAG is built. Pre-detect by city / area names.

const ANDAMAN_KEYWORDS = [
  "phuket", "ภูเก็ต", "krabi", "กระบี่", "phi phi", "พีพี", "phi-phi",
  "similan", "สิมิลัน", "surin", "สุรินทร์", "richelieu", "ริชเชอลิว",
  "lipe", "ลีเป๊ะ", "andaman", "อันดามัน", "ราไวย์", "rawai", "patong", "ป่าตอง",
  "kata", "กะตะ", "khao lak", "เขาหลัก",
];
const GULF_KEYWORDS = [
  "koh tao", "เกาะเต่า", "koh-tao", "ko tao",
  "pha ngan", "พะงัน", "phangan",
  "samui", "สมุย", "ko samui", "koh samui",
  "chumphon", "ชุมพร", "gulf", "อ่าวไทย",
  "sail rock", "เซลร็อค",
];

export function extractRegionHint(msg: string): Region | null {
  if (!msg) return null;
  const lower = msg.toLowerCase();
  const isAnd = ANDAMAN_KEYWORDS.some(k => lower.includes(k.toLowerCase()) || msg.includes(k));
  const isGulf = GULF_KEYWORDS.some(k => lower.includes(k.toLowerCase()) || msg.includes(k));
  if (isAnd && isGulf) return "both";
  if (isAnd) return "andaman";
  if (isGulf) return "gulf";
  return null;
}
