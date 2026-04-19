// Shared i18n-aware date label used by Top Trips cards and the
// Recently Viewed row so the two stay visually aligned.

const DATE_LOCALE: Record<string, string> = {
  en: "en",
  th: "th",
  cn: "zh-CN",
  ja: "ja",
  ko: "ko",
  de: "de",
  fr: "fr",
  ru: "ru",
};

export function formatDateLabel(iso: string, lang: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const locale = DATE_LOCALE[lang] ?? "en";
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return "";
  }
}
