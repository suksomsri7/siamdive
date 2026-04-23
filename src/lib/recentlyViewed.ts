const KEY = "siamdive:recentBoats";
const MAX = 20;

// `dep` is the ISO departure date of the schedule the user opened, when
// known. Boats viewed outside a specific schedule (e.g. tapping the boat
// card itself) leave it undefined.
type Entry = { id: string; at: number; dep?: string };

export function pushRecentBoat(boatId: string, departureDate?: string) {
  if (typeof window === "undefined" || !boatId) return;
  try {
    const raw = localStorage.getItem(KEY);
    const list: Entry[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((e) => e.id !== boatId);
    filtered.unshift({ id: boatId, at: Date.now(), dep: departureDate });
    localStorage.setItem(KEY, JSON.stringify(filtered.slice(0, MAX)));
  } catch {}
}

export function readRecentBoats(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const list: Entry[] = raw ? JSON.parse(raw) : [];
    return list.map((e) => e.id);
  } catch {
    return [];
  }
}

export function readRecentBoatEntries(): { id: string; dep?: string }[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const list: Entry[] = raw ? JSON.parse(raw) : [];
    return list.map((e) => ({ id: e.id, dep: e.dep }));
  } catch {
    return [];
  }
}
