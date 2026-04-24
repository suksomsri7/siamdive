const KEY = "siamdive:myplan";

export type PlanTrip = {
  boatId: string;
  title: string;
  slug: string;
  type: string;
  area: string;
  cover: string | null;
  addedAt: number;
};

export type MyPlan = {
  startDate: string | null;
  trips: PlanTrip[];
};

function read(): MyPlan {
  if (typeof window === "undefined") return { startDate: null, trips: [] };
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : { startDate: null, trips: [] };
  } catch {
    return { startDate: null, trips: [] };
  }
}

function write(plan: MyPlan) {
  try { localStorage.setItem(KEY, JSON.stringify(plan)); } catch {}
  window.dispatchEvent(new CustomEvent("myplan-change", { detail: plan }));
}

export function getPlan(): MyPlan {
  return read();
}

export function setStartDate(date: string | null) {
  const plan = read();
  plan.startDate = date;
  write(plan);
}

export function addTrip(trip: Omit<PlanTrip, "addedAt">): boolean {
  const plan = read();
  if (plan.trips.some(t => t.boatId === trip.boatId)) return false;
  plan.trips.push({ ...trip, addedAt: Date.now() });
  write(plan);
  return true;
}

export function removeTrip(boatId: string) {
  const plan = read();
  plan.trips = plan.trips.filter(t => t.boatId !== boatId);
  write(plan);
}

export function clearPlan() {
  write({ startDate: null, trips: [] });
}

export function hasTripInPlan(boatId: string): boolean {
  return read().trips.some(t => t.boatId === boatId);
}

export function tripCount(): number {
  return read().trips.length;
}
