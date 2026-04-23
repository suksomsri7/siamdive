const KEY = "siamdive:recentBoats";
const MAX = 20;

type Entry = { id: string; at: number };

export function pushRecentBoat(boatId: string) {
  if (typeof window === "undefined" || !boatId) return;
  try {
    const raw = localStorage.getItem(KEY);
    const list: Entry[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((e) => e.id !== boatId);
    filtered.unshift({ id: boatId, at: Date.now() });
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
