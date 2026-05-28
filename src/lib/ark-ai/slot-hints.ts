// First-turn slot regex hints. The Anthropic/OpenAI tool call (`update_slots`)
// fires DURING the response stream, which is too late to influence the RAG
// block that was already assembled. For the most consequential slots — dates,
// headcount, region — we run a small pre-pass over the user's latest message
// so turn 1 already narrows correctly. The full LLM extractor still runs
// afterwards and can override / refine.
//
// Conservative by design: only return a value when the user wrote something
// unambiguous. False positives are worse than misses (the LLM cleans up).

import type { Companions, Headcount, Region } from "./slots";

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
// International destinations — added when Country became parent of ServiceArea.
// Keep narrow / unambiguous keywords; the LLM can disambiguate the rest.
const MALDIVES_KEYWORDS = ["maldives", "มัลดีฟส์", "male atoll", "ari atoll", "vaavu", "baa atoll", "fuvahmulah"];
const RED_SEA_KEYWORDS = ["red sea", "ทะเลแดง", "อียิปต์", "egypt", "hurghada", "dahab", "sharm el sheikh", "marsa alam"];
const INDONESIA_KEYWORDS = ["indonesia", "อินโดนีเซีย", "komodo", "คอมโด", "raja ampat", "ราจาอัมพัท", "bali", "บาหลี", "lembeh", "bunaken"];
const PALAU_KEYWORDS = ["palau", "ปาเลา", "blue corner", "german channel"];
const PHILIPPINES_KEYWORDS = ["philippines", "ฟิลิปปินส์", "tubbataha", "anilao", "coron", "malapascua", "moalboal"];
const MALAYSIA_KEYWORDS = ["malaysia", "มาเลเซีย", "sipadan", "ซิปาดัน", "mabul", "layang layang", "perhentian"];

function hasAny(msg: string, lower: string, list: string[]): boolean {
  return list.some(k => lower.includes(k.toLowerCase()) || msg.includes(k));
}

export function extractRegionHint(msg: string): Region | null {
  if (!msg) return null;
  const lower = msg.toLowerCase();
  // International first — if the user names a specific foreign destination,
  // that should win over a Thai sub-region keyword that might co-occur.
  if (hasAny(msg, lower, MALDIVES_KEYWORDS))    return "maldives";
  if (hasAny(msg, lower, RED_SEA_KEYWORDS))     return "red_sea";
  if (hasAny(msg, lower, INDONESIA_KEYWORDS))   return "indonesia";
  if (hasAny(msg, lower, PALAU_KEYWORDS))       return "palau";
  if (hasAny(msg, lower, PHILIPPINES_KEYWORDS)) return "philippines";
  if (hasAny(msg, lower, MALAYSIA_KEYWORDS))    return "malaysia";

  const isAnd = hasAny(msg, lower, ANDAMAN_KEYWORDS);
  const isGulf = hasAny(msg, lower, GULF_KEYWORDS);
  if (isAnd && isGulf) return "both";
  if (isAnd) return "andaman";
  if (isGulf) return "gulf";
  return null;
}

// ── Companions (non-divers tagging along) — Sprint 3 B2 ─────────────────────
// "ไปกับแม่ที่ไม่ดำน้ำ", "spouse doesn't dive", "พ่อแม่ไม่ดำ พาไปเที่ยวบก".
// LLM extracts these well most of the time but on first turn it's too late
// for downstream RAG / system-prompt injection. Keep conservative — only fire
// on phrases that explicitly call out non-diving members.
export function extractCompanionsHint(msg: string): Companions | null {
  if (!msg) return null;
  const m = msg;
  const lower = m.toLowerCase();

  // English: "spouse doesn't dive" / "wife doesn't scuba" / "mom isn't diving"
  // / "kids are too young to dive" / "non-diver(s) coming with us"
  const enNoDive = lower.match(
    /\b(?:my\s+)?(spouse|wife|husband|partner|mom|mum|mother|dad|father|parents?|kids?|child|children|son|daughter|friend|girlfriend|boyfriend)\b[^.!?\n]{0,40}\b(?:doesn['’]t|don['’]t|isn['’]t|won['’]t|can['’]t|cannot|not?)\s+(?:dive|diving|scuba)/,
  );
  const enNonDiverWord = lower.match(/\b(non[- ]?divers?)\b/);
  const enTooYoung = lower.match(/\b(kids?|child(?:ren)?|son|daughter)\b[^.!?\n]{0,30}\btoo\s+young\b/);
  // English ride-along: "mom is just coming for the boat ride", "wife is
  // tagging along", "they'll just come along", "just here for the boat".
  const enRideAlong = lower.match(
    /\b(spouse|wife|husband|partner|mom|mum|mother|dad|father|parents?|kids?|child|children|son|daughter|friend|girlfriend|boyfriend|they)\b[^.!?\n]{0,40}\b(just\s+(?:coming|comes|come)|coming\s+along|tag(?:ging)?\s+along|ride[- ]?along|along\s+for\s+the\s+(?:boat|ride))/,
  );
  // Thai: "แม่ไม่ดำ", "แฟนไม่ดำน้ำ", "พ่อแม่ไม่ดำ", "ลูกยังเล็ก ไม่ดำ"
  const thNoDive = m.match(
    /(แม่|พ่อ|พ่อแม่|แฟน|สามี|ภรรยา|เมีย|ลูก|พี่|น้อง|เพื่อน)[^\n.!?]{0,40}(ไม่ดำ|ไม่อยากดำ|ดำไม่ได้|ดำไม่เป็น)/,
  );
  // Numeric Thai: "2 คนไม่ดำ" / "3 คนไม่ดำน้ำ" / "1 คนดำไม่เป็น"
  const thNumNonDiver = m.match(/(\d{1,2})\s*คน\s*(ไม่ดำ|ดำไม่|ไม่อยากดำ)/);
  const thRideAlong = m.match(/(พ่อแม่|แม่|พ่อ|แฟน|ลูก|ภรรยา)[^\n.!?]{0,30}(พาไปเที่ยว|มาเที่ยวด้วย|นั่งเรือเฉยๆ|นั่งเรือ|รอบนเรือ|รอที่ฝั่ง|ขอแค่)/);

  if (!enNoDive && !enNonDiverWord && !enTooYoung && !enRideAlong && !thNoDive && !thNumNonDiver && !thRideAlong) {
    return null;
  }

  // Best-effort count. Default to 1 (most common — one parent / one spouse).
  // Phrases that imply more than one: "พ่อแม่ไม่ดำ" → 2, "parents don't dive" → 2,
  // "kids" plural → 2 (conservative). Explicit numerics override.
  let nonDivers = 1;
  if (/พ่อแม่|parents/i.test(m)) nonDivers = 2;
  if (/(kids|children|ลูกๆ|น้องๆ)/i.test(m)) nonDivers = Math.max(nonDivers, 2);
  if (thNumNonDiver) nonDivers = parseInt(thNumNonDiver[1], 10) || nonDivers;
  const explicit = m.match(/(\d{1,2})\s*(?:people|ppl|pax|persons?)\s*(?:don['’]?t\s*dive|non[- ]?divers?)/i);
  if (explicit) nonDivers = parseInt(explicit[1], 10) || nonDivers;

  // Activity heuristic — same message often hints at the parallel programme.
  let activity: Companions["activity"] | undefined;
  if (/snorkel|ดำผิวน้ำ|สนอร์เกิล|ผิวน้ำ/i.test(m)) activity = "snorkel";
  else if (/land\s*tour|ทัวร์บก|เที่ยวบก|ดูตัวเมือง|เที่ยวเกาะ|sightsee|sightseeing/i.test(m)) activity = "land_tour";
  else if (/นั่งเรือ|รอบนเรือ|รอที่ฝั่ง|พักผ่อน|just\s+(?:come|coming|here)|coming\s+along|tag(?:ging)?\s+along|ride[- ]?along|along\s+for\s+the\s+(?:boat|ride)|boat\s+ride|relax/i.test(m)) activity = "relax";

  const out: Companions = { nonDivers };
  if (activity) out.activity = activity;
  return out;
}
