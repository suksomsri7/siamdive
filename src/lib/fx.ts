// Server-only FX rate access. Rates are stored as EUR-based pairs (base="EUR",
// quote=X) by the fx-rates cron and pivoted here. Display-only — never mutates
// stored trip prices.
import { prisma } from "@/lib/prisma";
import { DISPLAY_CURRENCIES, type DisplayCurrency } from "@/lib/currency";

// EUR→quote rates for the latest available day, memoised briefly (rates change
// once a day; this avoids a DB hit per price rendered on a page).
type EurRates = { rates: Record<string, number>; date: Date | null };
let cache: { at: number; data: EurRates } | null = null;
const TTL_MS = 10 * 60 * 1000;

async function loadEurRates(): Promise<EurRates> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.data;
  // Most recent day we have rates for, then all EUR pairs on that day.
  const latest = await prisma.fxRate.findFirst({
    where: { base: "EUR" },
    orderBy: { date: "desc" },
    select: { date: true },
  });
  const rates: Record<string, number> = { EUR: 1 };
  let date: Date | null = null;
  if (latest) {
    date = latest.date;
    const rows = await prisma.fxRate.findMany({
      where: { base: "EUR", date: latest.date },
      select: { quote: true, rate: true },
    });
    for (const r of rows) rates[r.quote] = r.rate;
  }
  const data = { rates, date };
  cache = { at: Date.now(), data };
  return data;
}

/**
 * Build a native→display multiplier map for every supported currency, so a
 * page can convert all its prices with one DB read. `factor[X]` converts an
 * amount in X into `display`. Returns null if rates are unavailable (callers
 * then fall back to showing native prices).
 */
export async function getConversionTable(
  display: DisplayCurrency,
): Promise<{ factor: Record<string, number>; date: Date | null } | null> {
  const { rates, date } = await loadEurRates();
  const eurToDisplay = rates[display];
  if (!eurToDisplay) return null; // no rate for the target → can't convert
  const factor: Record<string, number> = {};
  for (const ccy of [...DISPLAY_CURRENCIES, display]) {
    const eurToNative = rates[ccy];
    if (eurToNative) factor[ccy] = eurToDisplay / eurToNative;
  }
  factor[display] = 1;
  return { factor, date };
}

/** Convert one amount native→display using a prebuilt factor map. */
export function applyConversion(
  amount: number,
  nativeCurrency: string,
  table: { factor: Record<string, number> },
): number | null {
  const f = table.factor[nativeCurrency.toUpperCase()];
  return f == null ? null : amount * f;
}

export function clearFxCache() {
  cache = null;
}
