import { trackPlanCreate, trackPlanTripAdd, trackPlanTripRemove } from "@/lib/analytics/client";

const DEVICE_KEY = "siamdive:deviceId";
const PLANS_KEY = "siamdive:plans";
const ACTIVE_KEY = "siamdive:activePlanId";
const EMAIL_KEY = "siamdive:planEmail";
const OLD_KEY = "siamdive:myplan";

export type PlanTripSchedule = {
  scheduleId: string;
  departureDate: string;
  returnDate: string | null;
  title: string;
  route: string;
  itinerary: string;
  excerpt?: string;
  content?: string;
  /** Cheapest tier across every package on this schedule, in THB/person.
   *  0 means the schedule had no priced packages (rare). Drives the
   *  "เริ่ม X — Y บาท/คน" range surfaced in the trip card + book bar. */
  priceMin?: number;
  /** Most expensive tier across every package on this schedule, in
   *  THB/person. Equal to priceMin when there's only one tier. */
  priceMax?: number;
};

export type PlanTrip = {
  boatId: string;
  title: string;
  slug: string;
  type: string;
  area: string;
  cover: string | null;
  addedAt: number;
  schedule?: PlanTripSchedule;
  note?: string;
};

// Sprint 1: lightweight logistics held client-side. The /api/plans sync
// payload doesn't carry these fields yet (server schema unchanged), so
// edits persist in localStorage only — that's fine for placeholder UX.
export type PlanLogistics = {
  /** "yes" = boat picks up at hotel; "no" = self-transport to pier; undefined = unanswered */
  pickup?: "yes" | "no";
  /** Hotel name + district, free text. Only meaningful when pickup === "yes" */
  hotelName?: string;
  /** "yes" = SiamDive arranges airport ↔ hotel/pier transfer; relevant for liveaboard/resort guests flying in */
  airportTransfer?: "yes" | "no";
  /** Renting from boat — comma-joined display string, e.g. "mask, fins, wetsuit" */
  equipmentRental?: string;
  /** Diet, kids equipment, photographer rig, allergies — free text */
  specialNeeds?: string;
};

export type UserPlan = {
  id: string;
  name: string;
  coverUrl?: string | null;
  startDate: string | null;
  trips: PlanTrip[];
  logistics?: PlanLogistics;
  createdAt: string;
  updatedAt: string;
  // Social counters surfaced on PlanList / PlanDetail. Populated by
  // pullPlansFromServer and the /api/plans GET response. Optional so
  // legacy local-only plans (never synced) don't blow up.
  memberCount?:  number;
  followerCount?: number;
  viewCount?:    number;
  shareCount?:   number;
};

// ── Device ID ────────────────────────────────────────────────────────────────

function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  // Prefer the analytics visitor ID (sd_vid) — that is what /api/ark-ai/*
  // routes use to identify the user. plan-store originally maintained its
  // own UUID under siamdive:deviceId, which split the same browser into
  // two PlanUser rows: one for chat-built plans (sd_vid) and one for
  // staged-pick plans (siamdive:deviceId). That broke every cross-path
  // dedup we tried (slot signature, trip signature, recently-deleted
  // stash, active-plan fallback) because each path was looking at a
  // different PlanUser.
  //
  // Migration: read sd_vid first; if absent but the legacy siamdive:deviceId
  // exists, copy it to sd_vid so analytics + plan-store converge. Otherwise
  // generate one and write to both keys so any code that still reads the
  // legacy key keeps working.
  const SD_VID = "sd_vid";
  let id = localStorage.getItem(SD_VID);
  if (id) {
    // Backfill the legacy key once so any older reader that survived the
    // migration also lands on the same id.
    if (!localStorage.getItem(DEVICE_KEY)) {
      try { localStorage.setItem(DEVICE_KEY, id); } catch {}
    }
    return id;
  }
  id = localStorage.getItem(DEVICE_KEY);
  if (id) {
    try { localStorage.setItem(SD_VID, id); } catch {}
    return id;
  }
  id = generateId();
  try {
    localStorage.setItem(SD_VID, id);
    localStorage.setItem(DEVICE_KEY, id);
  } catch {}
  return id;
}

// ── Local storage helpers ────────────────────────────────────────────────────

function readPlans(): UserPlan[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PLANS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writePlans(plans: UserPlan[]) {
  try { localStorage.setItem(PLANS_KEY, JSON.stringify(plans)); } catch {}
  window.dispatchEvent(new CustomEvent("myplan-change", { detail: plans }));
}

function getActivePlanId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_KEY);
}

function setActivePlanId(id: string) {
  try { localStorage.setItem(ACTIVE_KEY, id); } catch {}
}

// ── Migration from old single-plan format ────────────────────────────────────

function migrateOldPlan(): UserPlan | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(OLD_KEY);
    if (!raw) return null;
    const old = JSON.parse(raw) as { startDate: string | null; trips: PlanTrip[] };
    if (!old.trips?.length) {
      localStorage.removeItem(OLD_KEY);
      return null;
    }
    const now = new Date().toISOString();
    const plan: UserPlan = {
      id: generateId(),
      name: "My Plan",
      startDate: old.startDate,
      trips: old.trips,
      createdAt: now,
      updatedAt: now,
    };
    localStorage.removeItem(OLD_KEY);
    return plan;
  } catch {
    localStorage.removeItem(OLD_KEY);
    return null;
  }
}

// ── DB Sync (fire-and-forget) ────────────────────────────────────────────────

let syncTimeout: ReturnType<typeof setTimeout> | null = null;

function scheduleSync() {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => syncToDb(), 1500);
}

async function syncToDb() {
  const deviceId = getDeviceId();
  if (!deviceId) return;
  const plans = readPlans();

  try {
    const res = await fetch(`/api/plans?deviceId=${encodeURIComponent(deviceId)}`);
    if (!res.ok) return;
    const remote = await res.json() as { plans: UserPlan[] };
    const remoteIds = new Set(remote.plans.map((p: UserPlan) => p.id));

    for (const plan of plans) {
      if (remoteIds.has(plan.id)) {
        await fetch(`/api/plans/${plan.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deviceId,
            name: plan.name,
            startDate: plan.startDate,
            trips: plan.trips,
          }),
        });
      } else {
        const res2 = await fetch("/api/plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deviceId,
            name: plan.name,
            startDate: plan.startDate,
            trips: plan.trips,
          }),
        });
        const created = await res2.json();
        if (created.id && created.id !== plan.id) {
          plan.id = created.id;
        }
      }
    }

    writePlans(plans);
  } catch {}
}

// Local ids come from generateId() — crypto.randomUUID() (contains hyphens)
// or a `${Date.now()}-${rand}` fallback (also hyphenated). Server ids are
// cuids, which never contain a hyphen. So "has a hyphen" reliably means
// "not yet persisted to the server".
function isLocalPlanId(id: string): boolean {
  return id.includes("-");
}

// Push a single plan (and its trips) to the server NOW and return its
// canonical server id. New plans are created via POST and adopt the returned
// cuid in place; already-synced plans are PATCHed so freshly-added trips land
// in the DB immediately.
//
// Why this exists: createPlan() mints a local crypto.randomUUID() id and the
// Ark-AI "create trip" flow opens the plan page on that id right away. But a
// raw UUID (a) fails the /items/search route's id-format guard → 400, and
// (b) 404s the /suggestions lookup — so flight/hotel search and recommended
// trips both break until the 1.5s debounced syncToDb() swaps the id, by which
// point the open page is still holding the stale UUID. Awaiting this before
// opening the page guarantees a real DB id from the first paint.
export async function pushPlanToServer(planId: string): Promise<string> {
  if (typeof window === "undefined") return planId;
  const deviceId = getDeviceId();
  if (!deviceId) return planId;
  // We're doing the sync inline — cancel any pending debounced run so the
  // same brand-new plan isn't POSTed twice (which would duplicate it).
  if (syncTimeout) {
    clearTimeout(syncTimeout);
    syncTimeout = null;
  }
  const plan = readPlans().find((p) => p.id === planId);
  if (!plan) return planId;

  try {
    if (isLocalPlanId(plan.id)) {
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId,
          name: plan.name,
          startDate: plan.startDate,
          trips: plan.trips,
        }),
      });
      if (!res.ok) return planId;
      const created = await res.json();
      if (created?.id && created.id !== plan.id) {
        // Re-read in case other writes happened while the request was in
        // flight, then swap the local id for the canonical one.
        const fresh = readPlans();
        const target = fresh.find((p) => p.id === planId);
        if (target) {
          target.id = created.id;
          writePlans(fresh);
          if (getActivePlanId() === planId) setActivePlanId(created.id);
          window.dispatchEvent(new Event("myplan-change"));
        }
        return created.id;
      }
      return plan.id;
    }

    // Already a server id — PATCH so the just-added trips are in the DB before
    // the plan page fetches suggestions/items.
    await fetch(`/api/plans/${plan.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceId,
        name: plan.name,
        startDate: plan.startDate,
        trips: plan.trips,
      }),
    });
    return plan.id;
  } catch {
    return planId;
  }
}

// ── Init (call once on app mount) ────────────────────────────────────────────

let initialized = false;

// pullPlansFromServer — sync server plans (owned + joined via share link)
// into localStorage. Two-way merge:
//   - server plans missing locally → added
//   - server plans already local → only social counters
//     (memberCount/viewCount/shareCount) get refreshed; we leave the rest
//     of the local row alone so unsynced edits aren't clobbered
export async function pullPlansFromServer(): Promise<void> {
  if (typeof window === "undefined") return;
  const deviceId = getDeviceId();
  if (!deviceId) return;
  try {
    const res = await fetch(`/api/plans?deviceId=${encodeURIComponent(deviceId)}`);
    if (!res.ok) return;
    const data = await res.json() as {
      plans?: Array<UserPlan & {
        shortId?: string;
        memberCount?: number;
        viewCount?: number;
        shareCount?: number;
      }>;
      email?: string | null;
    };
    if (!data.plans?.length) return;

    const local = readPlans();
    const byId = new Map(data.plans.map(p => [p.id, p]));
    let dirty = false;

    // Refresh social counters on plans we already track.
    const merged = local.map(lp => {
      const sp = byId.get(lp.id);
      if (!sp) return lp;
      const next: UserPlan = {
        ...lp,
        memberCount: sp.memberCount ?? lp.memberCount ?? 0,
        viewCount:   sp.viewCount   ?? lp.viewCount   ?? 0,
        shareCount:  sp.shareCount  ?? lp.shareCount  ?? 0,
      };
      if (
        next.memberCount !== lp.memberCount ||
        next.viewCount   !== lp.viewCount   ||
        next.shareCount  !== lp.shareCount
      ) dirty = true;
      return next;
    });

    // Append any plans that are server-only (just joined via share link).
    const localIds = new Set(local.map(p => p.id));
    const additions = data.plans.filter(p => !localIds.has(p.id)).map(p => ({
      id:           p.id,
      name:         p.name,
      coverUrl:     p.coverUrl,
      startDate:    p.startDate ?? null,
      trips:        p.trips || [],
      createdAt:    p.createdAt,
      updatedAt:    p.updatedAt,
      memberCount:  p.memberCount  ?? 0,
      viewCount:    p.viewCount    ?? 0,
      shareCount:   p.shareCount   ?? 0,
    } as UserPlan));

    if (additions.length > 0 || dirty) {
      writePlans([...merged, ...additions]);
    }
    if (data.email) {
      try { localStorage.setItem(EMAIL_KEY, data.email); } catch {}
    }
  } catch {}
}

export async function initPlanStore(): Promise<UserPlan[]> {
  if (typeof window === "undefined") return [];
  if (initialized) return readPlans();
  initialized = true;

  const deviceId = getDeviceId();

  // Migrate old single-plan if exists
  const migrated = migrateOldPlan();

  let plans = readPlans();
  if (migrated) {
    plans = [migrated, ...plans];
    writePlans(plans);
  }

  // If we have local plans, sync them up
  if (plans.length > 0) {
    scheduleSync();
    return plans;
  }

  // No local plans — try to fetch from DB
  try {
    const res = await fetch(`/api/plans?deviceId=${encodeURIComponent(deviceId)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.plans?.length) {
        writePlans(data.plans);
        if (data.email) {
          localStorage.setItem(EMAIL_KEY, data.email);
        }
        return data.plans;
      }
    }
  } catch {}

  return plans;
}

// ── Public API ───────────────────────────────────────────────────────────────

export function getPlans(): UserPlan[] {
  return readPlans();
}

export function getActivePlan(): UserPlan | null {
  const plans = readPlans();
  if (plans.length === 0) return null;
  const activeId = getActivePlanId();
  return plans.find((p) => p.id === activeId) || plans[0];
}

export function switchPlan(planId: string) {
  setActivePlanId(planId);
  window.dispatchEvent(new CustomEvent("myplan-change"));
}

export function createPlan(name: string): UserPlan {
  const now = new Date().toISOString();
  const plan: UserPlan = {
    id: generateId(),
    name,
    startDate: null,
    trips: [],
    createdAt: now,
    updatedAt: now,
  };
  const plans = readPlans();
  plans.push(plan);
  writePlans(plans);
  setActivePlanId(plan.id);
  scheduleSync();
  trackPlanCreate(plan.id, name);
  return plan;
}

export function renamePlan(planId: string, name: string) {
  const plans = readPlans();
  const plan = plans.find((p) => p.id === planId);
  if (!plan) return;
  plan.name = name;
  plan.updatedAt = new Date().toISOString();
  writePlans(plans);
  scheduleSync();
}

export function updatePlanCoverUrl(planId: string, coverUrl: string) {
  const plans = readPlans();
  const plan = plans.find((p) => p.id === planId);
  if (!plan) return;
  plan.coverUrl = coverUrl;
  plan.updatedAt = new Date().toISOString();
  writePlans(plans);
}

export function deletePlan(planId: string) {
  let plans = readPlans();
  plans = plans.filter((p) => p.id !== planId);
  writePlans(plans);

  if (getActivePlanId() === planId && plans.length > 0) {
    setActivePlanId(plans[0].id);
  }

  const deviceId = getDeviceId();
  fetch(`/api/plans/${planId}?deviceId=${encodeURIComponent(deviceId)}`, {
    method: "DELETE",
  }).catch(() => {});
}

export function setStartDate(date: string | null) {
  const plans = readPlans();
  const plan = plans.find((p) => p.id === getActivePlanId()) || plans[0];
  if (!plan) return;
  plan.startDate = date;
  plan.updatedAt = new Date().toISOString();
  writePlans(plans);
  scheduleSync();
}

export function suggestPlanName(trip: { area?: string; schedule?: { departureDate?: string } }): string {
  const parts: string[] = [];
  if (trip.area) parts.push(trip.area);
  if (trip.schedule?.departureDate) {
    const d = new Date(trip.schedule.departureDate);
    parts.push(d.toLocaleDateString("th-TH", { month: "short", year: "2-digit" }));
  }
  return parts.length > 0 ? parts.join(" ") : "My Plan";
}

function mergeOrAdd(plan: UserPlan, trip: Omit<PlanTrip, "addedAt">): boolean {
  const existing = plan.trips.find((t) =>
    t.boatId === trip.boatId &&
    (t.schedule?.scheduleId ?? "") === (trip.schedule?.scheduleId ?? "")
  );
  if (existing) return false;
  plan.trips.push({ ...trip, addedAt: Date.now() });
  return true;
}

export function addTrip(trip: Omit<PlanTrip, "addedAt">): boolean {
  const plans = readPlans();
  let plan = plans.find((p) => p.id === getActivePlanId()) || plans[0];

  if (!plan) {
    plan = {
      id: generateId(),
      name: suggestPlanName(trip),
      startDate: null,
      trips: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    plans.push(plan);
    setActivePlanId(plan.id);
  }

  if (!mergeOrAdd(plan, trip)) return false;
  autoSetStartDate(plan);
  plan.updatedAt = new Date().toISOString();
  writePlans(plans);
  scheduleSync();
  trackPlanTripAdd(plan.id, trip.title, trip.boatId);
  window.dispatchEvent(new CustomEvent("plan-toast", { detail: { title: trip.title } }));
  return true;
}

export function addTripToPlan(planId: string, trip: Omit<PlanTrip, "addedAt">): boolean {
  const plans = readPlans();
  const plan = plans.find((p) => p.id === planId);
  if (!plan) return false;

  if (!mergeOrAdd(plan, trip)) return false;
  autoSetStartDate(plan);
  plan.updatedAt = new Date().toISOString();
  writePlans(plans);
  scheduleSync();
  trackPlanTripAdd(planId, trip.title, trip.boatId);
  window.dispatchEvent(new CustomEvent("plan-toast", { detail: { title: trip.title } }));
  return true;
}

function autoSetStartDate(plan: UserPlan) {
  const dates = plan.trips
    .map((t) => t.schedule?.departureDate)
    .filter((d): d is string => !!d)
    .sort();
  if (dates.length > 0) plan.startDate = dates[0];
}

export type DateConflict = {
  existingTrip: PlanTrip;
  newDeparture: string;
  newReturn: string;
};

export function checkDateConflicts(
  planId: string,
  departure: string,
  returnDate: string | null,
): DateConflict[] {
  const plans = readPlans();
  const plan = plans.find((p) => p.id === planId);
  if (!plan) return [];

  const newDep = departure;
  const newRet = returnDate || departure;
  const conflicts: DateConflict[] = [];

  for (const t of plan.trips) {
    if (!t.schedule?.departureDate) continue;
    const eDep = t.schedule.departureDate;
    const eRet = t.schedule.returnDate || eDep;
    if (newDep <= eRet && newRet >= eDep) {
      conflicts.push({ existingTrip: t, newDeparture: departure, newReturn: newRet });
    }
  }
  return conflicts;
}

export function removeTrip(boatId: string, scheduleId?: string) {
  const plans = readPlans();
  const plan = plans.find((p) => p.id === getActivePlanId()) || plans[0];
  if (!plan) return;
  plan.trips = plan.trips.filter((t) => {
    if (t.boatId !== boatId) return true;
    if (scheduleId) return (t.schedule?.scheduleId ?? "") !== scheduleId;
    return false;
  });
  plan.updatedAt = new Date().toISOString();
  writePlans(plans);
  scheduleSync();
}

export function removeTripByIndex(planId: string, index: number) {
  const plans = readPlans();
  const plan = plans.find((p) => p.id === planId);
  if (!plan) return;
  const removed = plan.trips[index];
  plan.trips.splice(index, 1);
  plan.updatedAt = new Date().toISOString();
  writePlans(plans);
  scheduleSync();
  if (removed) trackPlanTripRemove(planId, removed.title);
}

export function updatePlanLogistics(planId: string, patch: Partial<PlanLogistics>) {
  const plans = readPlans();
  const plan = plans.find((p) => p.id === planId);
  if (!plan) return;
  const next: PlanLogistics = { ...(plan.logistics || {}), ...patch };
  // Drop empty strings so the block doesn't think a field is "filled".
  for (const k of Object.keys(next) as (keyof PlanLogistics)[]) {
    const v = next[k];
    if (typeof v === "string" && v.trim() === "") delete next[k];
  }
  plan.logistics = next;
  plan.updatedAt = new Date().toISOString();
  writePlans(plans);
  scheduleSync();
}

export function updateTripNote(planId: string, tripIndex: number, note: string) {
  const plans = readPlans();
  const plan = plans.find((p) => p.id === planId);
  if (!plan || !plan.trips[tripIndex]) return;
  plan.trips[tripIndex].note = note || undefined;
  plan.updatedAt = new Date().toISOString();
  writePlans(plans);
  scheduleSync();
}

export function updateTripSchedule(
  planId: string,
  tripIndex: number,
  schedule: PlanTripSchedule,
): void {
  const plans = readPlans();
  const plan = plans.find((p) => p.id === planId);
  if (!plan || !plan.trips[tripIndex]) return;
  plan.trips[tripIndex] = { ...plan.trips[tripIndex], schedule };
  plan.updatedAt = new Date().toISOString();
  writePlans(plans);
  scheduleSync();
}

export function clearPlan() {
  const plans = readPlans();
  const plan = plans.find((p) => p.id === getActivePlanId()) || plans[0];
  if (!plan) return;
  plan.startDate = null;
  plan.trips = [];
  plan.updatedAt = new Date().toISOString();
  writePlans(plans);
  scheduleSync();
}

// Insert (or replace) a plan returned by the server — used by Ark AI's
// build-plan flow which writes to the DB directly. Marks the plan active so
// the My Plan drawer drills straight into it on open.
export function upsertServerPlan(plan: UserPlan): UserPlan {
  const plans = readPlans();
  const idx = plans.findIndex((p) => p.id === plan.id);
  if (idx >= 0) {
    plans[idx] = plan;
  } else {
    plans.push(plan);
  }
  writePlans(plans);
  setActivePlanId(plan.id);
  return plan;
}

export function hasTripInPlan(boatId: string): boolean {
  const plan = getActivePlan();
  return plan ? plan.trips.some((t) => t.boatId === boatId) : false;
}

export function tripCount(): number {
  const plans = readPlans();
  return plans.reduce((sum, p) => sum + p.trips.length, 0);
}

// planCount — total number of plans in the user's MyPlan list. Drives the
// red badge on the BottomNav MyPlan icon. We surface plan count (not trip
// count) because the badge sits on the MyPlan tab, not a Trips tab.
export function planCount(): number {
  return readPlans().length;
}

// ── Backward compat ──────────────────────────────────────────────────────────

export type MyPlan = { startDate: string | null; trips: PlanTrip[] };

export function getPlan(): MyPlan {
  const plan = getActivePlan();
  return plan
    ? { startDate: plan.startDate, trips: plan.trips }
    : { startDate: null, trips: [] };
}

// ── Email ────────────────────────────────────────────────────────────────────

export function getSavedEmail(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(EMAIL_KEY);
}

export async function attachEmail(email: string, name?: string): Promise<boolean> {
  const deviceId = getDeviceId();
  if (!deviceId) return false;
  try {
    const body: Record<string, string> = { deviceId, email };
    if (name) body.name = name;
    const res = await fetch("/api/plans/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      localStorage.setItem(EMAIL_KEY, email.toLowerCase().trim());
      return true;
    }
  } catch {}
  return false;
}

export async function recoverByEmail(email: string): Promise<UserPlan[] | null> {
  try {
    const res = await fetch(`/api/plans?email=${encodeURIComponent(email)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.plans?.length) return null;

    // Adopt the recovered deviceId and plans
    localStorage.setItem(DEVICE_KEY, data.deviceId);
    localStorage.setItem(EMAIL_KEY, email.toLowerCase().trim());
    writePlans(data.plans);
    if (data.plans.length > 0) {
      setActivePlanId(data.plans[0].id);
    }
    return data.plans;
  } catch {
    return null;
  }
}
