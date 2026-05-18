export type SearchOffer = {
  provider: "travelpayouts" | "duffel" | "liteapi";
  title: string;
  subtitle?: string;
  price: number;
  currency: string;
  startAt: string;
  endAt?: string | null;
  imageUrl?: string;
  externalUrl: string;
  location?: string;
};

export type FlightSearchInput = {
  from: string;
  to: string;
  date: string;
  returnDate?: string;
  adults?: number;
};

export type HotelSearchInput = {
  cityCode?: string;
  cityName?: string;
  countryCode?: string;
  checkin: string;
  checkout: string;
  adults?: number;
};
