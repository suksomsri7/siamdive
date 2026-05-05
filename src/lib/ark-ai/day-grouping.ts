// Convert a flat list of plan trips into day-anchored buckets so the
// Timeline view can render "Day 0 / Day 1 / ... Day N" instead of a
// chronological list. The user's mental model is "what am I doing on
// day 1, day 2 of my vacation" — not "trip 1, trip 2".
//
// Anchor rule (from Sprint 1 spec):
//  - Sort trips by departureDate ASC.
//  - Find the LONGEST liveaboard / dive-resort trip → its departureDate
//    is "Day 1".
//  - If no liveaboard exists, the FIRST scheduled trip is Day 1.
//  - Trips before the anchor become Day 0, Day -1, ... (closer = higher).
//  - Trips after the anchor's returnDate become Day N+1, N+2 ...
//  - The anchor liveaboard itself spans Day 1 → Day N (N = days in trip).
//
// Returns rows in render order: smallest day number first.

import type { PlanTrip } from "@/lib/plan-store";

export type DayBucket = {
  /** Display label, e.g. "Day 0", "Day 1", "Day 2" */
  label: string;
  /** Numeric day index (anchor = 1, pre-trips ≤ 0, post-trips > anchor span) */
  day: number;
  /** ISO date for this day */
  date: string;
  /** Trips that depart on this day (or, for liveaboard, are CURRENTLY underway) */
  trips: { trip: PlanTrip; originalIdx: number }[];
  /** True if the anchor liveaboard is mid-voyage on this day (no separate departure) */
  isLiveaboardContinuation?: boolean;
  /** When set, a slice of the anchor's parsed itinerary HTML for THIS day */
  itineraryHeading?: string;
  itineraryHtml?: string;
};

type Indexed = { trip: PlanTrip; originalIdx: number };

function daysBetween(a: string, b: string): number {
  const ms = Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z");
  return Math.round(ms / 86_400_000);
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function tripSpan(trip: PlanTrip): number {
  const dep = trip.schedule?.departureDate;
  if (!dep) return 1;
  const ret = trip.schedule?.returnDate || dep;
  return Math.max(1, daysBetween(dep, ret) + 1);
}

function isAnchorEligible(trip: PlanTrip): boolean {
  return trip.type === "LIVEABOARD" || trip.type === "DIVE_RESORT";
}

export function groupTripsByDay(trips: PlanTrip[]): DayBucket[] {
  const scheduled: Indexed[] = trips
    .map((trip, originalIdx) => ({ trip, originalIdx }))
    .filter(({ trip }) => !!trip.schedule?.departureDate);

  if (scheduled.length === 0) return [];

  scheduled.sort((a, b) =>
    a.trip.schedule!.departureDate.localeCompare(b.trip.schedule!.departureDate),
  );

  // Pick the anchor: longest liveaboard, otherwise the first trip.
  let anchor = scheduled[0];
  let anchorSpan = tripSpan(anchor.trip);
  for (const s of scheduled) {
    if (!isAnchorEligible(s.trip)) continue;
    const span = tripSpan(s.trip);
    if (!isAnchorEligible(anchor.trip) || span > anchorSpan) {
      anchor = s;
      anchorSpan = span;
    }
  }

  const anchorDep = anchor.trip.schedule!.departureDate;

  // Build a Map<dayNumber, Indexed[]> keyed by computed day index.
  const map = new Map<number, Indexed[]>();
  const anchorIsLiveaboard = isAnchorEligible(anchor.trip);

  for (const s of scheduled) {
    const dep = s.trip.schedule!.departureDate;
    const offset = daysBetween(anchorDep, dep);
    const day = offset + 1; // anchorDep == Day 1
    const list = map.get(day) || [];
    list.push(s);
    map.set(day, list);
  }

  // For an anchor liveaboard spanning N days, fill in continuation days
  // (Day 2 .. Day N) so the timeline always reads continuously, even if
  // no other trip departs on that day.
  if (anchorIsLiveaboard && anchorSpan > 1) {
    for (let d = 2; d <= anchorSpan; d++) {
      if (!map.has(d)) map.set(d, []);
    }
  }

  const days = Array.from(map.keys()).sort((a, b) => a - b);
  return days.map(day => {
    const list = map.get(day) || [];
    const date = addDays(anchorDep, day - 1);
    const isContinuation = anchorIsLiveaboard
      && day >= 2
      && day <= anchorSpan
      && !list.some(s => s.trip.schedule!.departureDate === date);
    return {
      label: `Day ${day}`,
      day,
      date,
      trips: list,
      isLiveaboardContinuation: isContinuation,
    };
  });
}
