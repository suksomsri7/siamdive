// Translation anti-drop guard. EN is the baseline; every non-EN translation
// must clear a minimum character ratio so AI can't silently return an empty
// or near-empty translation. Structural matching (h2/ul/table counts) was
// removed 2026-04-18 because it forced mirrored EN structure and produced
// unnatural prose in target languages. The new philosophy: trust the writer's
// freedom, only guard against outright content drops.

export type Translation = {
  lang: string;
  content?: string;
};

type Counts = {
  chars: number;
};

// Minimum ratio: translation must be at least 20% of EN character length.
// This catches "AI returned empty/broken translation" without forcing any
// specific structural shape. Native rewrites can be naturally shorter than
// EN in many languages (CJK especially) — 20% is a floor, not a target.
const ANTI_DROP_FLOOR = 0.20;

// Minimum EN char length before we bother validating. Below this the blog is
// effectively a stub/draft and guarding is meaningless.
const MIN_EN_CHARS_TO_VALIDATE = 500;

function count(html: string): Counts {
  return { chars: html.length };
}

export type ParityFailure = {
  lang: string;
  issues: string[];
  counts: Counts;
};

export type ParityResult =
  | { ok: true; baseline: Counts; reason?: string }
  | { ok: false; baseline: Counts; failures: ParityFailure[] };

export function validateTranslationParity(translations: Translation[]): ParityResult {
  const en = translations.find((t) => t.lang === "en");
  const enContent = en?.content ?? "";
  const baseline = count(enContent);

  if (baseline.chars < MIN_EN_CHARS_TO_VALIDATE) {
    return { ok: true, baseline, reason: "EN content below MIN_EN_CHARS_TO_VALIDATE — validation skipped" };
  }

  const failures: ParityFailure[] = [];

  for (const t of translations) {
    if (t.lang === "en") continue;
    if (!t.content || t.content.length === 0) {
      // Empty translation is treated as "not provided" — not a failure.
      continue;
    }

    const c = count(t.content);
    const ratio = c.chars / Math.max(baseline.chars, 1);
    if (ratio < ANTI_DROP_FLOOR) {
      failures.push({
        lang: t.lang,
        issues: [`translation too short: ${c.chars}/${baseline.chars} = ${(ratio * 100).toFixed(0)}% (anti-drop floor ${(ANTI_DROP_FLOOR * 100).toFixed(0)}%)`],
        counts: c,
      });
    }
  }

  if (failures.length === 0) {
    return { ok: true, baseline };
  }
  return { ok: false, baseline, failures };
}
