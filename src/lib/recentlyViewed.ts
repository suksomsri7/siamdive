// Client-side "recently viewed schedules" tracking. Stored in localStorage,
// capped at MAX entries, most-recent-first, dedup'd by scheduleId. Anonymous
// (device-scoped). Pushed explicitly from card click handlers that know a
// specific schedule was opened — NOT from trackTripView, since TRIP_VIEW
// records the boat and the row is about specific departures.

const KEY = "siamdive:recentSchedules";
const MAX = 20;

type Entry = { id: string; at: number };

export function pushRecentSchedule(scheduleId: string) {
  if (typeof window === "undefined" || !scheduleId) return;
  try {
    const raw = localStorage.getItem(KEY);
    const list: Entry[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((e) => e.id !== scheduleId);
    filtered.unshift({ id: scheduleId, at: Date.now() });
    localStorage.setItem(KEY, JSON.stringify(filtered.slice(0, MAX)));
  } catch {
    // localStorage can throw (quota, disabled). Swallow — recently-viewed
    // is nice-to-have and must not break the page.
  }
}

export function readRecentSchedules(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const list: Entry[] = raw ? JSON.parse(raw) : [];
    return list.map((e) => e.id);
  } catch {
    return [];
  }
}
