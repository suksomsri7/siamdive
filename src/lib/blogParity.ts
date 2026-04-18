// Translation parity validator. EN is the baseline; every non-EN translation
// must preserve the structural skeleton (same tag counts) AND hit a char-length
// floor so CJK translations can't be ~20% of EN length.
//
// Why this exists: the AI blog generator repeatedly ignored "don't shorten"
// instructions and silently dropped sections when translating to CJK/RU.
// We validate on the server so the failure is unskippable.

export type Translation = {
  lang: string;
  content?: string;
};

type TagCounts = {
  h2: number;
  ul: number;
  table: number;
  li: number;
  a: number;
  chars: number;
};

const CJK_LANGS = new Set(["cn", "ja", "ko"]);

// Thresholds per language family. CJK scripts are denser (~1 char carries
// several EN chars of meaning) so the floor is lower. Latin/Cyrillic scripts
// sit near 1:1 or longer.
const CHAR_FLOOR: Record<string, number> = {
  cn: 0.30,
  ja: 0.30,
  ko: 0.30,
  th: 0.55,
  en: 1.0,          // self
  de: 0.75,
  fr: 0.75,
  ru: 0.70,
};

// How much drift in <li> count we tolerate. Lists sometimes legitimately
// merge/split across languages (e.g. "OW, AOW, Rescue" = 3 items EN but might
// be written as a single Thai phrase). Allow ±2, not more.
const LI_TOLERANCE = 2;

// Minimum EN char length before we bother validating. Below this the blog is
// effectively a stub/draft and parity is meaningless.
const MIN_EN_CHARS_TO_VALIDATE = 500;

function countTags(html: string): TagCounts {
  return {
    h2:    (html.match(/<h2[\s>]/gi)    ?? []).length,
    ul:    (html.match(/<ul[\s>]/gi)    ?? []).length,
    table: (html.match(/<table[\s>]/gi) ?? []).length,
    li:    (html.match(/<li[\s>]/gi)    ?? []).length,
    a:     (html.match(/<a\s[^>]*href/gi) ?? []).length,
    chars: html.length,
  };
}

export type ParityFailure = {
  lang: string;
  issues: string[];
  counts: TagCounts;
};

export type ParityResult =
  | { ok: true; baseline: TagCounts; reason?: string }
  | { ok: false; baseline: TagCounts; failures: ParityFailure[] };

export function validateTranslationParity(translations: Translation[]): ParityResult {
  const en = translations.find((t) => t.lang === "en");
  const enContent = en?.content ?? "";
  const baseline = countTags(enContent);

  // Skip validation for shell/stub drafts — not enough EN content to compare.
  if (baseline.chars < MIN_EN_CHARS_TO_VALIDATE) {
    return { ok: true, baseline, reason: "EN content below MIN_EN_CHARS_TO_VALIDATE — validation skipped" };
  }

  const failures: ParityFailure[] = [];

  for (const t of translations) {
    if (t.lang === "en") continue;
    if (!t.content || t.content.length === 0) {
      // Empty translation is treated as "not provided" — do not fail.
      // The API will store it as empty and UI surfaces the gap separately.
      continue;
    }

    const c = countTags(t.content);
    const reasons: string[] = [];

    if (c.h2 !== baseline.h2)           reasons.push(`h2 mismatch: ${c.h2}/${baseline.h2}`);
    if (c.ul !== baseline.ul)           reasons.push(`ul mismatch: ${c.ul}/${baseline.ul}`);
    if (c.table !== baseline.table)     reasons.push(`table mismatch: ${c.table}/${baseline.table}`);
    if (c.a !== baseline.a)             reasons.push(`link count mismatch: ${c.a}/${baseline.a}`);
    if (Math.abs(c.li - baseline.li) > LI_TOLERANCE)
                                        reasons.push(`li mismatch: ${c.li}/${baseline.li} (>${LI_TOLERANCE} drift)`);

    const floor = CHAR_FLOOR[t.lang] ?? 0.65;
    const ratio = c.chars / Math.max(baseline.chars, 1);
    if (ratio < floor) {
      reasons.push(`chars ${c.chars}/${baseline.chars} = ${(ratio * 100).toFixed(0)}% (floor ${(floor * 100).toFixed(0)}%)`);
    }

    if (reasons.length > 0) {
      failures.push({ lang: t.lang, issues: reasons, counts: c });
    }
  }

  if (failures.length === 0) {
    return { ok: true, baseline };
  }
  return { ok: false, baseline, failures };
}
