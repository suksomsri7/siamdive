import type { FlightSearchInput, SearchOffer } from "./types";
import { buildAviasalesUrl } from "../affiliate-urls";

const TOKEN = (process.env.TRAVELPAYOUTS_TOKEN || "").trim();
const MARKER = (process.env.TRAVELPAYOUTS_MARKER || "530298").trim();

type CheapFlight = {
  airline: string;
  flight_number?: number | string;
  departure_at: string;
  return_at?: string;
  expires_at?: string;
  price: number;
};

type CheapApiResponse = {
  success: boolean;
  data?: Record<string, Record<string, CheapFlight>>;
  error?: string;
  currency?: string;
};

type LatestPriceRow = {
  origin: string;
  destination: string;
  depart_date: string;
  return_date?: string;
  value: number;
  gate?: string;
  number_of_changes?: number;
  duration?: number;
};

type LatestApiResponse = {
  data: LatestPriceRow[];
  currency?: string;
};

export async function searchFlightsTravelpayouts(input: FlightSearchInput): Promise<SearchOffer[]> {
  if (!TOKEN) return [];

  const from = input.from.toUpperCase();
  const to = input.to.toUpperCase();
  const depart = new Date(input.date).toISOString().slice(0, 7);

  const params = new URLSearchParams({
    origin: from,
    destination: to,
    depart_date: depart,
    currency: "thb",
  });
  if (input.returnDate) {
    params.set("return_date", new Date(input.returnDate).toISOString().slice(0, 7));
  }

  try {
    const res = await fetch(`https://api.travelpayouts.com/v1/prices/cheap?${params.toString()}`, {
      headers: { "X-Access-Token": TOKEN, Accept: "application/json" },
      next: { revalidate: 1800 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as CheapApiResponse;
    const offers: SearchOffer[] = [];
    if (json.success && json.data) {
      for (const flights of Object.values(json.data)) {
        for (const f of Object.values(flights)) {
          offers.push({
            provider: "travelpayouts",
            title: `${f.airline} ${f.flight_number ?? ""}`.trim(),
            subtitle: `${from} → ${to}`,
            price: f.price,
            currency: json.currency?.toUpperCase() || "THB",
            startAt: f.departure_at,
            endAt: f.return_at || null,
            externalUrl: buildAviasalesUrl({
              from, to,
              date: f.departure_at,
              returnDate: f.return_at,
              adults: input.adults ?? 1,
            }),
          });
        }
      }
    }
    if (offers.length === 0) return await fallbackLatest(input);
    return offers
      .sort((a, b) => a.price - b.price)
      .slice(0, 5);
  } catch {
    return [];
  }
}

async function fallbackLatest(input: FlightSearchInput): Promise<SearchOffer[]> {
  const from = input.from.toUpperCase();
  const to = input.to.toUpperCase();

  const params = new URLSearchParams({
    origin: from,
    destination: to,
    currency: "thb",
    limit: "5",
    period_type: "month",
  });

  try {
    const res = await fetch(`https://api.travelpayouts.com/v2/prices/latest?${params.toString()}`, {
      headers: { "X-Access-Token": TOKEN, Accept: "application/json" },
      next: { revalidate: 1800 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as LatestApiResponse;
    return (json.data || []).slice(0, 5).map((row) => ({
      provider: "travelpayouts" as const,
      title: row.gate ? `${row.gate}` : `${from} → ${to}`,
      subtitle: `${from} → ${to}${row.number_of_changes ? ` · ${row.number_of_changes} ต่อ` : " · ตรง"}`,
      price: row.value,
      currency: json.currency?.toUpperCase() || "THB",
      startAt: row.depart_date,
      endAt: row.return_date || null,
      externalUrl: buildAviasalesUrl({
        from, to,
        date: row.depart_date,
        returnDate: row.return_date,
        adults: input.adults ?? 1,
      }),
    }));
  } catch {
    return [];
  }
}

export function travelpayoutsMarker(): string {
  return MARKER;
}
