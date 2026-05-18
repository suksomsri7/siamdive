import { searchFlightsTravelpayouts } from "./travelpayouts";
import { searchHotelsLiteApi } from "./liteapi";
import type { FlightSearchInput, HotelSearchInput, SearchOffer } from "./types";

export type { SearchOffer, FlightSearchInput, HotelSearchInput };

export async function searchFlights(input: FlightSearchInput): Promise<SearchOffer[]> {
  return searchFlightsTravelpayouts(input);
}

export async function searchHotels(input: HotelSearchInput): Promise<SearchOffer[]> {
  return searchHotelsLiteApi(input);
}
