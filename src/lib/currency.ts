// Multi-currency display layer (pure, no DB).
//
// Trip prices are STORED in their native currency (boat.currency, or a per-item
// `currency` override). This module knows the supported display currencies, how
// to format them, and how to resolve an item's native currency. Actual FX rates
// live in the DB and are read via `src/lib/fx.ts` (server-only). Conversion is
// always display-only and clearly marked approximate ("~฿24,200").

export const DISPLAY_CURRENCIES = [
  "THB", "USD", "EUR", "MYR", "SGD", "GBP", "AUD", "JPY", "CNY", "KRW", "RUB",
] as const;
export type DisplayCurrency = (typeof DISPLAY_CURRENCIES)[number];

export const DEFAULT_CURRENCY: DisplayCurrency = "THB";

export function isSupportedCurrency(c: string | null | undefined): c is DisplayCurrency {
  return !!c && (DISPLAY_CURRENCIES as readonly string[]).includes(c.toUpperCase());
}

// Display metadata per currency. `dp` = decimal places shown (all 0 — prices are
// approximate, whole-number display reads cleaner). `prefix` symbol distinguishes
// the two ¥ users (JPY vs CNY).
const META: Record<DisplayCurrency, { symbol: string; name: string }> = {
  THB: { symbol: "฿",   name: "Thai Baht" },
  USD: { symbol: "$",   name: "US Dollar" },
  EUR: { symbol: "€",   name: "Euro" },
  MYR: { symbol: "RM",  name: "Malaysian Ringgit" },
  SGD: { symbol: "S$",  name: "Singapore Dollar" },
  GBP: { symbol: "£",   name: "British Pound" },
  AUD: { symbol: "A$",  name: "Australian Dollar" },
  JPY: { symbol: "¥",   name: "Japanese Yen" },
  CNY: { symbol: "CN¥", name: "Chinese Yuan" },
  KRW: { symbol: "₩",   name: "Korean Won" },
  RUB: { symbol: "₽",   name: "Russian Ruble" },
};

export function currencyMeta(c: string) {
  const key = (c?.toUpperCase() as DisplayCurrency);
  return META[key] ?? { symbol: key || "", name: key || "" };
}

export function currencyOptions() {
  return DISPLAY_CURRENCIES.map(c => ({ code: c, symbol: META[c].symbol, name: META[c].name }));
}

/**
 * Format a money amount for display. Always whole-number (prices are estimates).
 * `approx` prefixes "~" to signal a converted, indicative value.
 *   formatMoney(24200, "THB", { approx: true }) -> "~฿24,200"
 *   formatMoney(1290, "USD")                    -> "$1,290"
 */
export function formatMoney(
  amount: number,
  currency: string,
  opts: { approx?: boolean } = {},
): string {
  const { symbol } = currencyMeta(currency);
  const n = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(amount));
  return `${opts.approx ? "~" : ""}${symbol}${n}`;
}

/**
 * Native currency of a price-bearing item: its own `currency` override if set,
 * otherwise the parent boat's currency, otherwise THB.
 */
export function resolveItemCurrency(
  item: { currency?: string | null } | null | undefined,
  boatCurrency: string | null | undefined,
): string {
  return (item?.currency || boatCurrency || DEFAULT_CURRENCY).toUpperCase();
}

// Map an ISO country code (from x-vercel-ip-country) to a default display
// currency. Eurozone members collapse to EUR; everything unknown falls back to
// USD (international default) — NOT THB, since the geo signal means "not Thai".
const EUROZONE = new Set([
  "AT","BE","CY","EE","FI","FR","DE","GR","IE","IT","LV","LT","LU","MT","NL","PT","SK","SI","ES","HR",
]);
const COUNTRY_CCY: Record<string, DisplayCurrency> = {
  TH: "THB", MY: "MYR", SG: "SGD", GB: "GBP", AU: "AUD", NZ: "AUD",
  JP: "JPY", CN: "CNY", HK: "CNY", KR: "KRW", RU: "RUB", US: "USD", CA: "USD",
};
export function currencyForCountry(country: string | null | undefined): DisplayCurrency {
  if (!country) return "USD";
  const cc = country.toUpperCase();
  if (COUNTRY_CCY[cc]) return COUNTRY_CCY[cc];
  if (EUROZONE.has(cc)) return "EUR";
  return "USD";
}

export const CURRENCY_COOKIE = "pref_currency";
