import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCronSecret } from "@/lib/cronAuth";
import { DISPLAY_CURRENCIES } from "@/lib/currency";
import { clearFxCache } from "@/lib/fx";

// Daily FX refresh. Pulls EUR-based rates and upserts one FxRate row per quote
// currency for the rate's day. Conversion is display-only; stored trip prices
// stay native. Schedule: once a day, e.g. 0 16 * * * (after sources refresh).
//
// Primary: open.er-api.com (free, no key, ~160 currencies incl. RUB which the
// ECB no longer publishes). Fallback: frankfurter.dev (ECB, 9 of our 10).

// Quote currencies = all supported display currencies except the EUR pivot.
const QUOTES = DISPLAY_CURRENCIES.filter(c => c !== "EUR");

type ErApiResp = { result?: string; rates?: Record<string, number>; time_last_update_unix?: number };
type FrankResp = { date?: string; rates?: Record<string, number> };

function utcDay(unixSec?: number): string {
  const d = unixSec ? new Date(unixSec * 1000) : new Date();
  return d.toISOString().slice(0, 10);
}

async function fetchRates(): Promise<{ date: string; rates: Record<string, number>; source: string }> {
  // Primary: open.er-api.com (covers all 10 incl. RUB)
  try {
    const r = await fetch("https://open.er-api.com/v6/latest/EUR", {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    if (r.ok) {
      const j = (await r.json()) as ErApiResp;
      if (j.result === "success" && j.rates && Object.keys(j.rates).length) {
        return { date: utcDay(j.time_last_update_unix), rates: j.rates, source: "open.er-api" };
      }
    }
  } catch { /* fall through to fallback */ }

  // Fallback: ECB via frankfurter.dev (lacks RUB — that quote will be reported missing)
  const r2 = await fetch(`https://api.frankfurter.dev/v1/latest?base=EUR&symbols=${QUOTES.join(",")}`, {
    headers: { accept: "application/json" },
    cache: "no-store",
  });
  if (!r2.ok) throw new Error(`fx fallback failed: ${r2.status}`);
  const j2 = (await r2.json()) as FrankResp;
  if (!j2.rates || !Object.keys(j2.rates).length) throw new Error("fx fallback returned no rates");
  return { date: j2.date || utcDay(), rates: j2.rates, source: "frankfurter-ecb" };
}

async function run(): Promise<NextResponse> {
  const startTs = Date.now();
  const { date, rates, source } = await fetchRates();
  const day = new Date(`${date}T00:00:00.000Z`);

  let upserts = 0;
  const missing: string[] = [];
  for (const quote of QUOTES) {
    const rate = rates[quote];
    if (typeof rate !== "number" || !(rate > 0)) { missing.push(quote); continue; }
    await prisma.fxRate.upsert({
      where: { base_quote_date: { base: "EUR", quote, date: day } },
      create: { base: "EUR", quote, rate, date: day },
      update: { rate, fetchedAt: new Date() },
    });
    upserts++;
  }

  clearFxCache();

  const detail = `date=${date}, source=${source}, upserts=${upserts}${missing.length ? `, missing=${missing.join(",")}` : ""}, ms=${Date.now() - startTs}`;
  try {
    await prisma.cronAuditLog.create({ data: { event: "fx.rates", detail } });
  } catch { /* audit table optional */ }

  return NextResponse.json({ date, source, upserts, missing, ms: Date.now() - startTs });
}

export async function POST(req: NextRequest) {
  const authErr = requireCronSecret(req);
  if (authErr) return authErr;
  try {
    return await run();
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}

export async function GET(req: NextRequest) {
  const authErr = requireCronSecret(req);
  if (authErr) return authErr;
  // GET also triggers a refresh for convenience (manual/curl).
  try {
    return await run();
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
