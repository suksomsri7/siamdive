// Client-side "recently viewed" tracking. Stored in localStorage, capped
// at MAX entries, most-recent-first, dedup'd by id. Anonymous (device-
// scoped). Updated via trackTripView so every TRIP_VIEW analytics call
// also seeds this list.

const KEY = "siamdive:recentlyViewed";
const MAX = 20;

type Entry = { id: string; at: number };

export function pushRecentlyViewed(boatId: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(KEY);
    const list: Entry[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((e) => e.id !== boatId);
    filtered.unshift({ id: boatId, at: Date.now() });
    localStorage.setItem(KEY, JSON.stringify(filtered.slice(0, MAX)));
  } catch {
    // localStorage can throw (quota, disabled). Swallow — recently-viewed
    // is nice-to-have and must not break the page.
  }
}

export function readRecentlyViewed(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const list: Entry[] = raw ? JSON.parse(raw) : [];
    return list.map((e) => e.id);
  } catch {
    return [];
  }
}
