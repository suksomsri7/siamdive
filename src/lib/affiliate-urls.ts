const MARKER = process.env.TRAVELPAYOUTS_MARKER || "530298";

function pad2(d: Date | string): string {
  const dt = typeof d === "string" ? new Date(d) : d;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(dt.getDate())}${pad(dt.getMonth() + 1)}`;
}

export function buildAviasalesUrl({ from, to, date, returnDate, adults = 1 }: {
  from: string; to: string; date: string; returnDate?: string; adults?: number;
}): string {
  const out = pad2(date);
  const ret = returnDate ? pad2(returnDate) : "";
  const segments = `${from}${out}${to}${ret}`;
  return `https://www.aviasales.com/search/${segments}${adults}?marker=${MARKER}`;
}

export function buildSkyscannerUrl({ from, to, date, returnDate, adults = 1 }: {
  from: string; to: string; date: string; returnDate?: string; adults?: number;
}): string {
  const outDate = new Date(date).toISOString().slice(0, 10).replace(/-/g, "");
  const retParam = returnDate ? `/${new Date(returnDate).toISOString().slice(0, 10).replace(/-/g, "")}` : "";
  return `https://www.skyscanner.com/transport/flights/${from.toLowerCase()}/${to.toLowerCase()}/${outDate}${retParam}/?adults=${adults}&associateid=${MARKER}`;
}

export function buildBookingUrl({ city, checkin, checkout, adults = 2 }: {
  city: string; checkin: string; checkout: string; adults?: number;
}): string {
  const params = new URLSearchParams({
    ss: city,
    checkin: new Date(checkin).toISOString().slice(0, 10),
    checkout: new Date(checkout).toISOString().slice(0, 10),
    group_adults: String(adults),
    aid: MARKER,
  });
  return `https://www.booking.com/searchresults.html?${params.toString()}`;
}

export function buildAgodaUrl({ city, checkin, checkout, adults = 2 }: {
  city: string; checkin: string; checkout: string; adults?: number;
}): string {
  const params = new URLSearchParams({
    city,
    checkIn: new Date(checkin).toISOString().slice(0, 10),
    checkOut: new Date(checkout).toISOString().slice(0, 10),
    adults: String(adults),
    cid: MARKER,
  });
  return `https://www.agoda.com/partners/partnersearch.aspx?${params.toString()}`;
}

export function buildHotellookUrl({ city, checkin, checkout, adults = 2 }: {
  city: string; checkin: string; checkout: string; adults?: number;
}): string {
  const params = new URLSearchParams({
    destination: city,
    checkIn: new Date(checkin).toISOString().slice(0, 10),
    checkOut: new Date(checkout).toISOString().slice(0, 10),
    adults: String(adults),
    marker: MARKER,
  });
  return `https://search.hotellook.com/?${params.toString()}`;
}
