// Server-only: resolve the viewer's display currency.
// Priority: explicit cookie (user picked) → geo-IP default (Vercel header) → USD.
import { cookies, headers } from "next/headers";
import {
  isSupportedCurrency,
  currencyForCountry,
  CURRENCY_COOKIE,
  type DisplayCurrency,
} from "@/lib/currency";

export async function getUserCurrency(): Promise<DisplayCurrency> {
  const cookied = (await cookies()).get(CURRENCY_COOKIE)?.value;
  if (isSupportedCurrency(cookied)) return cookied.toUpperCase() as DisplayCurrency;
  const country = (await headers()).get("x-vercel-ip-country");
  return currencyForCountry(country);
}
