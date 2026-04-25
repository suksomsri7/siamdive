const DEVICE_KEY = "siamdive:deviceId";
const PLANS_KEY = "siamdive:plans";
const ACTIVE_KEY = "siamdive:activePlanId";
const EMAIL_KEY = "siamdive:planEmail";
const OLD_KEY = "siamdive:myplan";

export type PlanTrip = {
  boatId: string;
  title: string;
  slug: string;
  type: string;
  area: string;
  cover: string | null;
  addedAt: number;
};

export type UserPlan = {
  id: string;
  name: string;
  startDate: string | null;
  trips: PlanTrip[];
  createdAt: string;
  updatedAt: string;
};

// ── Device ID ────────────────────────────────────────────────────────────────

function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = generateId();
    localStorage.setItem(DEVICE_KEY, id);
  }
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

// ── Init (call once on app mount) ────────────────────────────────────────────

let initialized = false;

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

export function addTrip(trip: Omit<PlanTrip, "addedAt">): boolean {
  const plans = readPlans();
  let plan = plans.find((p) => p.id === getActivePlanId()) || plans[0];

  // Auto-create first plan if none exist
  if (!plan) {
    plan = {
      id: generateId(),
      name: "My Plan",
      startDate: null,
      trips: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    plans.push(plan);
    setActivePlanId(plan.id);
  }

  if (plan.trips.some((t) => t.boatId === trip.boatId)) return false;
  plan.trips.push({ ...trip, addedAt: Date.now() });
  plan.updatedAt = new Date().toISOString();
  writePlans(plans);
  scheduleSync();
  return true;
}

export function removeTrip(boatId: string) {
  const plans = readPlans();
  const plan = plans.find((p) => p.id === getActivePlanId()) || plans[0];
  if (!plan) return;
  plan.trips = plan.trips.filter((t) => t.boatId !== boatId);
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

export function hasTripInPlan(boatId: string): boolean {
  const plan = getActivePlan();
  return plan ? plan.trips.some((t) => t.boatId === boatId) : false;
}

export function tripCount(): number {
  const plan = getActivePlan();
  return plan ? plan.trips.length : 0;
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

export async function attachEmail(email: string): Promise<boolean> {
  const deviceId = getDeviceId();
  if (!deviceId) return false;
  try {
    const res = await fetch("/api/plans/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId, email }),
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
