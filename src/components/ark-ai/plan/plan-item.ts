// Shared shape for a PlanItem row (flight/hotel/activity/etc.) as returned by
// /api/plans/[id]/items and rendered in the itinerary timeline.
export type PlanItem = {
  id: string;
  type: "FLIGHT" | "HOTEL" | "BOAT" | "ACTIVITY" | "TRANSFER" | "NOTE";
  title: string;
  location: string | null;
  startAt: string;
  endAt: string | null;
  externalUrl: string | null;
  bookingRef: string | null;
  cost: number | null;
  currency: string | null;
  source: string;
  notes: string | null;
  order: number;
};
