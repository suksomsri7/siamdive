import type { HotelSearchInput, SearchOffer } from "./types";
import { buildBookingUrl } from "../affiliate-urls";

const KEY = (process.env.LITEAPI_SANDBOX_KEY || process.env.LITEAPI_KEY || "").trim();

type LiteApiHotel = {
  id: string;
  name: string;
  hotelDescription?: string;
  address?: string;
  city?: string;
  country?: string;
  starRating?: number;
  main_photo?: string;
  thumbnail?: string;
};

type LiteApiHotelsResponse = {
  data?: LiteApiHotel[];
};

type LiteApiRate = {
  hotelId: string;
  roomTypes?: Array<{
    rates?: Array<{
      retailRate?: { total?: Array<{ amount?: number; currency?: string }> };
    }>;
  }>;
};

type LiteApiRatesResponse = {
  data?: LiteApiRate[];
};

export async function searchHotelsLiteApi(input: HotelSearchInput): Promise<SearchOffer[]> {
  if (!KEY) return [];

  // Step 1: list hotels in city
  const listParams = new URLSearchParams({
    countryCode: input.countryCode || "TH",
    limit: "8",
  });
  if (input.cityName) listParams.set("cityName", input.cityName);

  let hotels: LiteApiHotel[] = [];
  try {
    const res = await fetch(`https://api.liteapi.travel/v3.0/data/hotels?${listParams.toString()}`, {
      headers: { "X-API-Key": KEY, Accept: "application/json" },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as LiteApiHotelsResponse;
    hotels = json.data || [];
  } catch {
    return [];
  }
  if (hotels.length === 0) return [];

  // Step 2: rates for those hotel IDs
  const hotelIds = hotels.slice(0, 5).map((h) => h.id);
  let rates: LiteApiRate[] = [];
  try {
    const ratesRes = await fetch("https://api.liteapi.travel/v3.0/hotels/rates", {
      method: "POST",
      headers: { "X-API-Key": KEY, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        hotelIds,
        checkin: new Date(input.checkin).toISOString().slice(0, 10),
        checkout: new Date(input.checkout).toISOString().slice(0, 10),
        currency: "THB",
        guestNationality: "TH",
        occupancies: [{ adults: input.adults ?? 2 }],
      }),
    });
    if (ratesRes.ok) {
      const ratesJson = (await ratesRes.json()) as LiteApiRatesResponse;
      rates = ratesJson.data || [];
    }
  } catch {}

  const byId = new Map<string, LiteApiRate>();
  for (const r of rates) byId.set(r.hotelId, r);

  const city = input.cityName || hotels[0]?.city || "Phuket";

  const offers: SearchOffer[] = [];
  for (const hotel of hotels.slice(0, 5)) {
    const rate = byId.get(hotel.id);
    let price = 0;
    let currency = "THB";
    const totalEntry = rate?.roomTypes?.[0]?.rates?.[0]?.retailRate?.total?.[0];
    if (totalEntry?.amount) {
      price = totalEntry.amount;
      currency = totalEntry.currency || "THB";
    }
    offers.push({
      provider: "liteapi",
      title: hotel.name,
      subtitle: hotel.address || hotel.city || undefined,
      price,
      currency,
      startAt: input.checkin,
      endAt: input.checkout,
      imageUrl: hotel.main_photo || hotel.thumbnail,
      location: hotel.city || city,
      externalUrl: buildBookingUrl({
        city,
        checkin: input.checkin,
        checkout: input.checkout,
        adults: input.adults ?? 2,
      }),
    });
  }
  return offers
    .filter((o) => o.price > 0)
    .sort((a, b) => a.price - b.price)
    .concat(offers.filter((o) => o.price === 0))
    .slice(0, 5);
}
