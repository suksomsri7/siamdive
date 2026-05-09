// Plan routing — scoring/ranking of existing plans when the user adds a trip.
// Decides which plan is the strongest match (⭐ recommended) so the bottom
// sheet can highlight the obvious choice and the toast path can pre-route
// silently when ambiguity is low.
//
// Pure functions, no side effects, no React. The chat panel passes in
// already-loaded plans + the staged pendingPick(s) and gets back ranked
// scores. Conflicts are returned alongside score so the UI can surface
// "⚠ ทับวัน X" without re-walking the trip list.

import type { UserPlan } from "@/lib/plan-store";
import type { PendingPick } from "@/lib/pending-picks";

const WEIGHT_DATE_OVERLAP = 5;
const WEIGHT_DATE_NEAR    = 3; // departures within ±7 days
const WEIGHT_REGION_MATCH = 3;
const WEIGHT_PLANNING     = 2;
const WEIGHT_RECENT       = 1;

export type DateConflictHint = {
  existingTitle: string;
  existingFrom: string;
  existingTo: string;
};

export type PlanScore = {
  plan: UserPlan;
  score: number;
  reasons: string[];
  conflicts: DateConflictHint[];
};

const ANDAMAN_RE = /(phuket|krabi|phi.?phi|similan|surin|lipe|trang|ranong|khao.?lak|ภูเก็ต|กระบี่|พีพี|สิมิลัน|สุรินทร์|หลีเป๊ะ|ตรัง|ระนอง|เขาหลัก)/i;
const GULF_RE    = /(samui|tao|pha.?ngan|chumphon|surat|สมุย|เกาะเต่า|พะงัน|ชุมพร|สุราษฎร์)/i;

function regionOf(area: string | undefined): "andaman" | "gulf" | null {
  if (!area) return null;
  if (ANDAMAN_RE.test(area)) return "andaman";
  if (GULF_RE.test(area))    return "gulf";
  return null;
}

function dateRangesOverlap(aFrom: string, aTo: string, bFrom: string, bTo: string): boolean {
  return aFrom <= bTo && bFrom <= aTo;
}

function daysBetween(a: string, b: string): number {
  const ms = Math.abs(Date.parse(a + "T00:00:00Z") - Date.parse(b + "T00:00:00Z"));
  return Math.round(ms / 86400000);
}

// Most plans don't have an explicit `status` field on the local store yet —
// fall through to "PLANNING" so the weight applies for everyone in the
// localStorage-only flow. Server-synced plans surface status via the API.
function planStatusOf(plan: UserPlan): string {
  return (plan as unknown as { status?: string }).status || "PLANNING";
}

export function scorePlanForTrip(plan: UserPlan, pick: PendingPick): PlanScore {
  const reasons: string[] = [];
  const conflicts: DateConflictHint[] = [];
  let score = 0;

  const newDep = pick.schedule?.departureDate?.slice(0, 10);
  const newRet = pick.schedule?.returnDate?.slice(0, 10) || newDep;
  const newRegion = regionOf(pick.area);

  if (newDep && newRet) {
    let hasOverlap = false;
    let hasNear    = false;
    for (const t of plan.trips) {
      const eDep = t.schedule?.departureDate?.slice(0, 10);
      const eRet = t.schedule?.returnDate?.slice(0, 10) || eDep;
      if (!eDep || !eRet) continue;
      if (dateRangesOverlap(newDep, newRet, eDep, eRet)) {
        hasOverlap = true;
        conflicts.push({ existingTitle: t.title, existingFrom: eDep, existingTo: eRet });
      } else if (daysBetween(newDep, eDep) <= 7) {
        hasNear = true;
      }
    }
    if (hasOverlap) {
      score += WEIGHT_DATE_OVERLAP;
      reasons.push("วันชนกัน");
    } else if (hasNear) {
      score += WEIGHT_DATE_NEAR;
      reasons.push("วันใกล้กัน");
    }
  }

  if (newRegion) {
    const planRegions = new Set(plan.trips.map(t => regionOf(t.area)).filter(Boolean));
    if (planRegions.has(newRegion)) {
      score += WEIGHT_REGION_MATCH;
      reasons.push(newRegion === "andaman" ? "Andaman" : "อ่าวไทย");
    }
  }

  const status = planStatusOf(plan);
  if (status === "PLANNING") score += WEIGHT_PLANNING;

  // Recency: linear 0..WEIGHT_RECENT over the last 30 days, then 0.
  const updatedAt = Date.parse(plan.updatedAt);
  if (Number.isFinite(updatedAt)) {
    const ageDays = (Date.now() - updatedAt) / 86400000;
    if (ageDays < 30) score += WEIGHT_RECENT * (1 - ageDays / 30);
  }

  return { plan, score, reasons, conflicts };
}

// Rank multiple plans by aggregating scores across every staged pick. When
// the user has staged 3 picks, a plan that matches all 3 dates beats one
// that only matches the first.
export function rankPlans(plans: UserPlan[], picks: PendingPick[]): PlanScore[] {
  const aggregated = plans.map(p => {
    const perPick = picks.map(pick => scorePlanForTrip(p, pick));
    const score = perPick.reduce((s, r) => s + r.score, 0);
    const reasons = Array.from(new Set(perPick.flatMap(r => r.reasons)));
    const conflicts = perPick.flatMap(r => r.conflicts);
    return { plan: p, score, reasons, conflicts };
  });
  return aggregated.sort((a, b) => b.score - a.score);
}
