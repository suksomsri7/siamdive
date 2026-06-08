"use client";

// Client-side currency context. The server (frontend layout) resolves the
// viewer's display currency + a native→display factor map (one per supported
// currency) and feeds them here. Any price-rendering client component calls
// `useCurrency().display(amount, nativeCurrency)` to show a converted, clearly
// approximate price ("~฿24,200"). Components outside the provider (backoffice)
// fall back to native display with no conversion.

import { createContext, useContext, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatMoney, CURRENCY_COOKIE, DEFAULT_CURRENCY, type DisplayCurrency } from "@/lib/currency";

type CurrencyCtx = {
  currency: DisplayCurrency;
  date: string | null;
  /** native→display amount, or null if no rate available */
  convert: (amount: number, nativeCurrency: string) => number | null;
  /** formatted string, e.g. "~฿24,200" (approx when a real conversion happened) */
  display: (amount: number | null | undefined, nativeCurrency: string, opts?: { approx?: boolean }) => string | null;
  setCurrency: (c: DisplayCurrency) => void;
};

const DEFAULT_CTX: CurrencyCtx = {
  currency: DEFAULT_CURRENCY,
  date: null,
  convert: () => null,
  display: (amount, nativeCurrency) =>
    amount == null ? null : formatMoney(amount, (nativeCurrency || DEFAULT_CURRENCY).toUpperCase(), { approx: false }),
  setCurrency: () => {},
};

const Ctx = createContext<CurrencyCtx>(DEFAULT_CTX);

export function CurrencyProvider({
  currency,
  factor,
  date,
  children,
}: {
  currency: DisplayCurrency;
  factor: Record<string, number>;
  date: string | null;
  children: React.ReactNode;
}) {
  const router = useRouter();

  const convert = useCallback(
    (amount: number, nativeCurrency: string): number | null => {
      const f = factor[(nativeCurrency || "").toUpperCase()];
      return f == null ? null : amount * f;
    },
    [factor],
  );

  const display = useCallback(
    (amount: number | null | undefined, nativeCurrency: string, opts: { approx?: boolean } = {}): string | null => {
      if (amount == null) return null;
      const native = (nativeCurrency || "").toUpperCase();
      const converted = convert(amount, native);
      if (converted == null) return formatMoney(amount, native, { approx: false }); // no rate → honest native
      const isConversion = native !== currency;
      return formatMoney(converted, currency, { approx: opts.approx ?? isConversion });
    },
    [convert, currency],
  );

  const setCurrency = useCallback(
    (c: DisplayCurrency) => {
      document.cookie = `${CURRENCY_COOKIE}=${c}; path=/; max-age=31536000; samesite=lax`;
      router.refresh();
    },
    [router],
  );

  return <Ctx.Provider value={{ currency, date, convert, display, setCurrency }}>{children}</Ctx.Provider>;
}

export function useCurrency(): CurrencyCtx {
  return useContext(Ctx);
}
